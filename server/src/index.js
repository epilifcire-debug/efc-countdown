// EFC Countdown — servidor (Shard Cloud)
// - entrega o frontend (web/dist) e as fontes
// - POST /api/gif/:id/generate  (autenticado) gera o GIF, salva no Storage e registra
// - GET  /gif/:public_id.gif   (público) entrega o GIF; contagem regressiva é gerada ao vivo
import v8 from 'node:v8';
import vm from 'node:vm';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateGif } from './gif.js';
import { LruCache, RateLimiter } from './util.js';

// Habilita gc() mesmo quando a hospedagem roda `node index.js` sem --expose-gc
// (necessário para liberar a memória do canvas durante a geração dos GIFs).
if (typeof globalThis.gc !== 'function') {
  v8.setFlagsFromString('--expose_gc');
  globalThis.gc = vm.runInNewContext('gc');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const WEB_DIST = path.join(ROOT, 'web/dist');

const {
  PORT = '80',
  HOST = '0.0.0.0',
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  PUBLIC_URL = '',
  BUCKET = 'countdown-gifs',
} = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltam variáveis: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// service_role só existe aqui no servidor; nunca vai para o navegador.
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const app = Fastify({ logger: { level: 'info' }, trustProxy: true, bodyLimit: 256 * 1024 });
const gifCache = new LruCache(300);
const rowCache = new LruCache(500);
const limiter = new RateLimiter(20, 60_000);
const inflight = new Map(); // mesma chave pedida ao mesmo tempo = uma geração só

function once(key, fn) {
  if (!inflight.has(key)) inflight.set(key, fn().finally(() => inflight.delete(key)));
  return inflight.get(key);
}

const publicBase = (req) => (PUBLIC_URL || `${req.protocol}://${req.headers.host}`).replace(/\/$/, '');

function settingsFromRow(row) {
  return {
    ...(row.settings || {}),
    title: row.title ?? row.settings?.title ?? '',
    subtitle: row.subtitle ?? row.settings?.subtitle ?? '',
    targetAt: row.target_at,
    value: row.percentage != null ? Number(row.percentage) : row.settings?.value,
    current: row.current_value != null ? Number(row.current_value) : row.settings?.current,
    max: row.max_value != null ? Number(row.max_value) : row.settings?.max,
  };
}

async function findByPublicId(publicId) {
  const hit = rowCache.get(publicId);
  if (hit && Date.now() - hit.at < 15_000) return hit.row;
  const { data, error } = await admin.from('countdowns').select('*').eq('public_id', publicId).maybeSingle();
  if (error) throw error;
  rowCache.set(publicId, { row: data, at: Date.now() });
  return data;
}

// ---------------------------------------------------------------------------
app.get('/health', async () => ({ ok: true }));

// Configuração pública do frontend (somente chaves públicas).
app.get('/env.js', async (req, reply) => {
  reply.type('application/javascript').header('Cache-Control', 'no-cache');
  return `window.__ENV=${JSON.stringify({ SUPABASE_URL, SUPABASE_ANON_KEY, PUBLIC_URL: publicBase(req) })};`;
});

// GIF público: /gif/:id, /gif/:id.gif, /media/:id.gif
async function serveGif(req, reply) {
  const publicId = String(req.params.id || '').replace(/\.gif$/i, '').toLowerCase();
  if (!/^[a-z0-9]{6,32}$/.test(publicId)) return reply.code(404).send('Não encontrado');
  const row = await findByPublicId(publicId);
  if (!row || row.status === 'archived' || row.status === 'draft') return reply.code(404).send('Não encontrado');

  const settings = settingsFromRow(row);
  let buffer;
  if (row.type === 'countdown') {
    // Gerado ao vivo: sempre mostra o tempo restante real. Cache curto de 5 s.
    const bucket = Math.floor(Date.now() / 5000) * 5000;
    const key = `${publicId}:${row.updated_at}:${bucket}`;
    buffer = gifCache.get(key);
    if (!buffer) {
      buffer = await once(key, async () => (await generateGif('countdown', settings, bucket)).buffer);
      gifCache.set(key, buffer);
    }
    if (row.status === 'active' && row.target_at && new Date(row.target_at).getTime() <= Date.now()) {
      admin.from('countdowns').update({ status: 'expired' }).eq('id', row.id).then(() => rowCache.delete(publicId));
    }
    reply.header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  } else {
    const key = `${publicId}:${row.updated_at}`;
    buffer = gifCache.get(key);
    if (!buffer) {
      buffer = await once(key, async () => (await loadStoredGif(row)) || (await generateGif(row.type, settings)).buffer);
      gifCache.set(key, buffer);
    }
    reply.header('Cache-Control', 'public, max-age=300');
  }
  reply.type('image/gif').header('Access-Control-Allow-Origin', '*');
  return reply.send(buffer);
}

async function loadStoredGif(row) {
  const { data } = await admin
    .from('generated_files').select('file_path').eq('countdown_id', row.id)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!data?.file_path) return null;
  const { data: blob, error } = await admin.storage.from(BUCKET).download(data.file_path);
  if (error || !blob) return null;
  return Buffer.from(await blob.arrayBuffer());
}

app.get('/gif/:id', serveGif);
app.get('/media/:id', serveGif);

// ---------------------------------------------------------------------------
// Gerar GIF (autenticado)
app.post('/api/gif/:countdownId/generate', async (req, reply) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return reply.code(401).send({ error: 'Faça login novamente.' });
  const { data: auth, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !auth?.user) return reply.code(401).send({ error: 'Sessão inválida. Faça login novamente.' });
  const user = auth.user;

  if (!limiter.allow(user.id)) return reply.code(429).send({ error: 'Muitas gerações em pouco tempo. Aguarde um minuto.' });

  const id = String(req.params.countdownId);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: 'Contador inválido.' });
  const { data: row, error } = await admin.from('countdowns').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!row) return reply.code(404).send({ error: 'Contador não encontrado.' });

  if (row.user_id !== user.id) {
    const { data: role } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!role) return reply.code(403).send({ error: 'Sem permissão para este contador.' });
  }

  const result = await generateGif(row.type, settingsFromRow(row));
  const filePath = `${row.user_id}/${row.id}/${Date.now()}.gif`;
  const up = await admin.storage.from(BUCKET).upload(filePath, result.buffer, { contentType: 'image/gif', upsert: false });
  if (up.error) {
    req.log.error({ err: up.error.message }, 'upload falhou');
    return reply.code(500).send({ error: 'Não foi possível salvar o GIF. Tente novamente.' });
  }
  const storageUrl = admin.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
  const gifUrl = `${publicBase(req)}/gif/${row.public_id}.gif`;

  await admin.from('generated_files').insert({
    user_id: row.user_id, countdown_id: row.id, file_type: 'gif', file_url: storageUrl, file_path: filePath,
    file_size: result.buffer.length, width: result.width, height: result.height,
  });
  const nextStatus = row.status === 'draft' || row.status === 'archived' ? 'active' : row.status;
  const { data: updated } = await admin.from('countdowns')
    .update({ gif_url: gifUrl, status: nextStatus }).eq('id', row.id).select('updated_at').single();
  rowCache.delete(row.public_id);
  if (updated && row.type !== 'countdown') gifCache.set(`${row.public_id}:${updated.updated_at}`, result.buffer);

  return {
    file_url: gifUrl,
    storage_url: storageUrl,
    file_path: filePath,
    width: result.width,
    height: result.height,
    file_size: result.buffer.length,
  };
});

// ---------------------------------------------------------------------------
// Frontend (inclui /fonts, copiadas no build)
if (fs.existsSync(WEB_DIST)) {
  app.register(fastifyStatic, { root: WEB_DIST, prefix: '/', wildcard: false, maxAge: '1h' });
  app.setNotFoundHandler((req, reply) => {
    if (req.method !== 'GET' || req.url.startsWith('/api/')) return reply.code(404).send({ error: 'Não encontrado' });
    reply.header('Cache-Control', 'no-cache');
    return reply.type('text/html').send(fs.readFileSync(path.join(WEB_DIST, 'index.html')));
  });
}

app.setErrorHandler((err, req, reply) => {
  req.log.error(err);
  reply.code(500).send({ error: 'Erro interno. Tente novamente.' });
});

// Marca contagens expiradas a cada minuto.
setInterval(async () => {
  const { error } = await admin.from('countdowns').update({ status: 'expired' })
    .eq('type', 'countdown').eq('status', 'active').lt('target_at', new Date().toISOString());
  if (error) app.log.warn({ err: error.message }, 'falha ao expirar contadores');
}, 60_000).unref();

app.listen({ port: Number(PORT), host: HOST });
