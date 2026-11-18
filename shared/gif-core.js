// Núcleo do gerador de GIF (servidor e modo demonstração no navegador).
// Cada frame é renderizado em 3x (supersampling), reduzido com filtro de caixa e codificado
// com paleta global sem dithering + otimização por diferença entre frames.
import { buildFrames, drawFrame, gifRepeat, withDefaults } from './render.js';

const SS = 3; // fator de supersampling

function hexRgb(h) {
  const m = String(h || '#FFFFFF').replace('#', '');
  const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m.padEnd(6, '0').slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) || 0);
}

/** Reduz RGBA (premultiplicado) de (w*SS, h*SS) para (w, h) com média de caixa SSxSS. */
function downsample(src, w, h, matte, SS) {
  const sw = w * SS;
  const out = new Uint8ClampedArray(w * h * 4);
  const n = SS * SS;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < SS; dy++) {
        let i = ((y * SS + dy) * sw + x * SS) * 4;
        for (let dx = 0; dx < SS; dx++, i += 4) {
          const al = src[i + 3];
          r += src[i] * al; g += src[i + 1] * al; b += src[i + 2] * al; a += al;
        }
      }
      const o = (y * w + x) * 4;
      if (a === 0) { out[o + 3] = 0; continue; }
      const alpha = a / n / 255;
      r /= a; g /= a; b /= a;
      if (alpha < 1) {
        if (alpha < 0.15) { out[o + 3] = 0; continue; }
        // GIF só tem transparência de 1 bit: mistura a borda com a cor do site (matte).
        r = r * alpha + matte[0] * (1 - alpha);
        g = g * alpha + matte[1] * (1 - alpha);
        b = b * alpha + matte[2] * (1 - alpha);
      }
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
    }
  }
  return out;
}

/** Renderiza um frame já reduzido para a resolução final. */
/** Supersampling 3x; GIFs muito grandes usam 2x para limitar memória e tempo. */
export function ssFor(s) {
  return s.width * s.height > 640 * 640 ? 2 : SS;
}

export function renderFrameRGBA(createCanvas, type, s, state, big) {
  const ss = ssFor(s);
  if (!big) big = createCanvas(s.width * ss, s.height * ss);
  const ctx = big.getContext('2d');
  drawFrame(ctx, type, s, state, ss);
  const data = ctx.getImageData(0, 0, s.width * ss, s.height * ss).data;
  const matte = hexRgb(s.matteColor);
  return downsample(data, s.width, s.height, matte, ss);
}

/** Gera o GIF completo. Retorna { buffer, width, height, frames }. */
/** gifenc é injetado (o servidor e o navegador resolvem o pacote de formas diferentes). */
export async function encodeGif(createCanvas, gifenc, type, settings, nowMs = Date.now(), afterFrame) {
  const { GIFEncoder, quantize, applyPalette } = gifenc;
  const s = withDefaults(type, settings);
  const frames = buildFrames(type, s, nowMs);
  const transparent = s.bgMode === 'transparent';
  const big = createCanvas(s.width * ssFor(s), s.height * ssFor(s)); // um único canvas reaproveitado
  const render = (i) => renderFrameRGBA(createCanvas, type, s, frames[i].state, big);

  // Paleta global a partir de até 4 frames amostrados (cores estáveis entre frames).
  // Os frames são renderizados um a um depois, para a memória não crescer com o tamanho do GIF.
  const sampleIdx = [...new Set([0, Math.floor(frames.length / 3), Math.floor((2 * frames.length) / 3), frames.length - 1])];
  const first = render(0);
  const sample = new Uint8Array(sampleIdx.length * first.length);
  sampleIdx.forEach((i, k) => sample.set(i === 0 ? first : render(i), k * first.length));
  const format = transparent ? 'rgba4444' : 'rgb565';
  let palette, transparentIndex = 0;
  if (transparent) {
    palette = quantize(sample, 255, { format, oneBitAlpha: true, clearAlpha: true, clearAlphaThreshold: 128 });
    transparentIndex = palette.findIndex((c) => c.length > 3 && c[3] === 0);
    if (transparentIndex < 0) { transparentIndex = palette.length; palette.push([0, 0, 0, 0]); }
  } else {
    // 255 cores + 1 índice reservado para "pixel igual ao frame anterior" e cantos transparentes
    palette = quantize(sample, 255, { format });
    transparentIndex = palette.length;
    palette.push([255, 0, 255]);
    while (palette.length < 256) palette.push([255, 0, 255]);
  }

  const gif = GIFEncoder();
  const repeat = gifRepeat(type, s);
  let prev = null;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const px = i === 0 ? first : render(i);
    const index = applyPalette(px, transparent ? palette : palette.slice(0, transparentIndex), format);
    if (!transparent) {
      // cantos fora do cartão arredondado ficam transparentes
      for (let j = 0; j < index.length; j++) if (px[j * 4 + 3] === 0) index[j] = transparentIndex;
    }
    let out = index;
    if (!transparent && prev) {
      out = new Uint8Array(index.length);
      for (let j = 0; j < index.length; j++) out[j] = index[j] === prev[j] ? transparentIndex : index[j];
    }
    gif.writeFrame(out, s.width, s.height, {
      palette: i === 0 ? palette : undefined,
      delay: f.delay,
      repeat,
      transparent: true,
      transparentIndex,
      dispose: transparent ? 2 : 1,
    });
    prev = index;
    if (afterFrame) await afterFrame(i);
  }
  gif.finish();
  return { bytes: gif.bytes(), width: s.width, height: s.height, frames: frames.length };
}

