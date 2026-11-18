/* EFC Countdown — service worker
 * - Assets com hash (/assets/*), fontes e ícones: cache-first (são imutáveis por versão).
 * - Páginas (navegação): network-first, com a última versão em cache como fallback offline.
 * - Nunca cacheia: /api, /gif, /media, /env.js e requisições de outros domínios (Supabase).
 */
const VERSION = 'efc-countdown-v1';
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;
const NEVER = [/^\/api\//, /^\/gif\//, /^\/media\//, /^\/env\.js$/, /^\/health$/, /^\/sw\.js$/];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll(['/', '/manifest.webmanifest'])).catch(() => {}));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // remove só caches antigos deste app
    await Promise.all(keys.filter((k) => k.startsWith('efc-countdown-') && !k.startsWith(VERSION)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER.some((r) => r.test(url.pathname))) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const copy = res.clone();
        caches.open(PAGES).then((c) => c.put('/', copy)).catch(() => {});
        return res;
      } catch {
        return (await caches.match('/')) || new Response('Sem conexão. Conecte-se à internet para usar o EFC Countdown.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  if (/^\/(assets|fonts)\//.test(url.pathname) || /\.(png|webp|jpg|svg|ico)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)).catch(() => {}); }
      return res;
    })());
  }
});
