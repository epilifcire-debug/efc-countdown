// Gerador de GIF no servidor: registra as fontes vetoriais e usa o núcleo compartilhado.
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import gifenc from 'gifenc';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { encodeGif, renderFrameRGBA } from '../../shared/gif-core.js';
import { withDefaults } from '../../shared/render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.resolve(__dirname, '../fonts');
const FAMILIES = {
  'Inter.ttf': 'Inter', 'Montserrat.ttf': 'Montserrat', 'Roboto.ttf': 'Roboto',
  'JetBrainsMono.ttf': 'JetBrains Mono', 'Oswald.ttf': 'Oswald', 'Orbitron.ttf': 'Orbitron',
  'Poppins-Regular.ttf': 'Poppins', 'Poppins-SemiBold.ttf': 'Poppins', 'Poppins-Bold.ttf': 'Poppins', 'Poppins-ExtraBold.ttf': 'Poppins',
};
for (const [file, family] of Object.entries(FAMILIES)) {
  const p = path.join(FONT_DIR, file);
  if (fs.existsSync(p)) GlobalFonts.registerFromPath(p, family);
}

/** Gera o GIF completo. Retorna { buffer, width, height, frames }. */
export function generateGif(type, settings, nowMs = Date.now()) {
  const r = encodeGif(createCanvas, gifenc, type, settings, nowMs);
  return { buffer: Buffer.from(r.bytes), width: r.width, height: r.height, frames: r.frames };
}

/** PNG de um frame (testes e miniaturas). */
export function renderPng(type, settings, state) {
  const s = withDefaults(type, settings);
  const rgba = renderFrameRGBA(createCanvas, type, s, state);
  const c = createCanvas(s.width, s.height);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(s.width, s.height);
  img.data.set(rgba);
  ctx.putImageData(img, 0, 0);
  return c.toBuffer('image/png');
}
