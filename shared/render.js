// EFC Countdown — renderizador compartilhado (navegador + servidor).
// O mesmo código desenha o preview (canvas do navegador) e os frames do GIF
// (@napi-rs/canvas no servidor), para o preview ser idêntico ao arquivo final.

export const TYPES = ['countdown', 'percentage', 'progress', 'alert'];

export const TYPE_LABELS = {
  countdown: 'Contagem regressiva',
  percentage: 'Porcentagem',
  progress: 'Barra de progresso',
  alert: 'Alerta',
};

export const FONTS = [
  { key: 'jetbrains', label: 'JetBrains Mono', family: 'JetBrains Mono' },
  { key: 'inter', label: 'Inter', family: 'Inter' },
  { key: 'montserrat', label: 'Montserrat', family: 'Montserrat' },
  { key: 'poppins', label: 'Poppins', family: 'Poppins' },
  { key: 'roboto', label: 'Roboto', family: 'Roboto' },
  { key: 'oswald', label: 'Oswald', family: 'Oswald' },
  { key: 'orbitron', label: 'Orbitron', family: 'Orbitron' },
];

export const DIMENSION_PRESETS = [
  { key: '300x100', width: 300, height: 100 },
  { key: '400x120', width: 400, height: 120 },
  { key: '500x150', width: 500, height: 150 },
  { key: '600x180', width: 600, height: 180 },
  { key: '400x400', width: 400, height: 400 },
];

export const PERCENT_STYLES = [
  { key: 'circle', label: 'Circular' },
  { key: 'circle_filled', label: 'Circular preenchido' },
  { key: 'bar_h', label: 'Barra horizontal' },
  { key: 'bar_v', label: 'Barra vertical' },
  { key: 'number', label: 'Número grande' },
  { key: 'number_bar', label: 'Número + barra' },
];

export const ALERT_ICONS = [
  { key: 'triangle', label: 'Triângulo de alerta' },
  { key: 'circle', label: 'Exclamação em círculo' },
  { key: 'siren', label: 'Sirene / giroflex' },
  { key: 'bell', label: 'Sino' },
  { key: 'bolt', label: 'Raio' },
  { key: 'none', label: 'Sem ícone' },
];

export const BLINK_STYLES = [
  { key: 'blink', label: 'Piscar (liga/desliga)' },
  { key: 'alternate', label: 'Alternar duas cores' },
  { key: 'pulse', label: 'Pulsar (fade suave)' },
  { key: 'glow', label: 'Brilho pulsante' },
  { key: 'border', label: 'Borda piscando' },
];

export const BLINK_TARGETS = [
  { key: 'icon', label: 'Ícone' },
  { key: 'title', label: 'Título' },
  { key: 'subtitle', label: 'Texto secundário' },
  { key: 'background', label: 'Fundo' },
  { key: 'border', label: 'Borda' },
];

// Limite de segurança para fotossensibilidade (WCAG 2.3.1): no máximo 3 piscadas por segundo.
export const MAX_BLINK_HZ = 3;

const BASE = {
  width: 500,
  height: 150,
  bgMode: 'color', // 'color' | 'transparent'
  bgColor: '#000000',
  borderColor: '#D4AF37',
  borderWidth: 2,
  radius: 10,
  fontFamily: 'jetbrains',
  fontWeight: 800,
  title: '',
  subtitle: '',
  titleColor: '#FFFFFF',
  subtitleColor: '#FFFFFF',
  numberColor: '#D4AF37',
  labelColor: '#A1A1A1',
  accentColor: '#D4AF37',
  trackColor: '#262626',
  align: 'center',
  letterSpacing: 2,
  padding: 12,
  matteColor: '#FFFFFF', // cor do site onde o GIF transparente será usado (suaviza bordas)
};

export const DEFAULTS = {
  countdown: {
    ...BASE,
    title: '!! ABERTURA DE VENDAS !!',
    subtitle: 'Segunda às 10:00',
    format: 'dhms', // 'dhms' | 'hms' | 'ms'
    unitStyle: 'colon', // 'colon' (DD : HH : MM : SS) | 'inline' (DD DIAS HH HORAS)
    showLabels: true,
    labels: { d: 'DIAS', h: 'HORAS', m: 'MIN', s: 'SEG' },
    afterEnd: 'zero', // 'zero' | 'message' | 'freeze'
    endMessage: 'VENDAS ABERTAS!',
    frames: 60,
  },
  percentage: {
    ...BASE,
    width: 400,
    height: 120,
    title: 'INGRESSOS VENDIDOS',
    value: 73,
    style: 'circle',
    duration: 2500,
    fps: 20,
    loop: false,
    holdMs: 2000,
  },
  progress: {
    ...BASE,
    title: 'INGRESSOS VENDIDOS',
    subtitle: '',
    current: 730,
    max: 1000,
    showValues: true,
    showPercent: true,
    duration: 2500,
    fps: 20,
    loop: false,
    holdMs: 2000,
  },
  alert: {
    ...BASE,
    title: '!! ÚLTIMOS INGRESSOS !!',
    subtitle: 'Lote 2 acabando',
    icon: 'triangle',
    iconPosition: 'left', // 'left' | 'top' | 'only'
    iconColor: '#D4AF37',
    blinkStyle: 'blink',
    blinkTargets: ['icon', 'title'],
    colorA: '#D4AF37',
    colorB: '#E11D48',
    glowColor: '#D4AF37',
    glowIntensity: 60,
    speed: 2, // piscadas por segundo (máx. 3)
    blinksPerCycle: 3,
    pauseMs: 0,
    loop: true,
  },
};

export function withDefaults(type, settings = {}) {
  const base = DEFAULTS[type] || DEFAULTS.countdown;
  const merged = { ...base, ...(settings || {}) };
  if (type === 'countdown') merged.labels = { ...base.labels, ...((settings || {}).labels || {}) };
  if (type === 'alert') merged.speed = clamp(Number(merged.speed) || 1, 0.5, MAX_BLINK_HZ);
  merged.width = clamp(Math.round(Number(merged.width) || base.width), 80, 1200);
  merged.height = clamp(Math.round(Number(merged.height) || base.height), 40, 1200);
  return merged;
}

export function familyOf(key) {
  return (FONTS.find((f) => f.key === key) || FONTS[0]).family;
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad2 = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------------------
// Fuso horário: converte data/hora local de um fuso IANA em instante UTC.
export function zonedToUtc(dateStr, timeStr, timeZone) {
  if (!dateStr) return null;
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = (timeStr || '00:00').split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const offset = tzOffsetMs(guess, timeZone);
  let ts = guess - offset;
  const offset2 = tzOffsetMs(ts, timeZone);
  if (offset2 !== offset) ts = guess - offset2;
  return new Date(ts).toISOString();
}

function tzOffsetMs(ts, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(ts));
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return asUtc - Math.floor(ts / 1000) * 1000;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Estados e frames

export function countdownParts(remainingSec, format) {
  const r = Math.max(0, Math.floor(remainingSec));
  const d = Math.floor(r / 86400);
  const h = Math.floor((r % 86400) / 3600);
  const m = Math.floor((r % 3600) / 60);
  const s = r % 60;
  if (format === 'hms') return [['h', Math.floor(r / 3600)], ['m', m], ['s', s]];
  if (format === 'ms') return [['m', Math.floor(r / 60)], ['s', s]];
  return [['d', d], ['h', h], ['m', m], ['s', s]];
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/** Estado em um instante do preview animado (ms desde o início). */
export function stateAt(type, s, elapsedMs, nowMs = Date.now()) {
  if (type === 'countdown') {
    const target = s.targetAt ? new Date(s.targetAt).getTime() : nowMs;
    return { remaining: Math.floor((target - nowMs) / 1000) };
  }
  if (type === 'percentage' || type === 'progress') {
    const total = Math.max(1, s.duration) + (s.loop ? s.holdMs : 0);
    let t = s.loop ? elapsedMs % total : elapsedMs;
    const p = clamp(t / Math.max(1, s.duration), 0, 1);
    return { t: easeOut(p) };
  }
  if (type === 'alert') {
    const frames = buildFrames('alert', s, nowMs);
    const total = frames.reduce((a, f) => a + f.delay, 0);
    let t = elapsedMs % total;
    for (const f of frames) {
      if (t < f.delay) return f.state;
      t -= f.delay;
    }
    return frames[0].state;
  }
  return {};
}

/** Lista de frames do GIF: [{ state, delay(ms) }] e repeat (0 = loop infinito, -1 = uma vez). */
export function buildFrames(type, s, nowMs = Date.now()) {
  if (type === 'countdown') {
    const target = s.targetAt ? new Date(s.targetAt).getTime() : nowMs;
    const remaining = Math.floor((target - nowMs) / 1000);
    if (remaining <= 0) return [{ state: { remaining: 0 }, delay: 1000 }];
    const n = clamp(Math.round(s.frames || 60), 1, 120);
    const out = [];
    for (let i = 0; i < n && remaining - i >= 0; i++) out.push({ state: { remaining: remaining - i }, delay: 1000 });
    return out;
  }
  if (type === 'percentage' || type === 'progress') {
    const fps = clamp(Math.round(s.fps || 20), 5, 30);
    const n = Math.max(2, Math.round((Math.max(200, s.duration) / 1000) * fps));
    const delay = Math.max(20, Math.round(1000 / fps / 10) * 10);
    const out = [];
    let last = -1;
    for (let i = 0; i < n; i++) {
      const t = easeOut(i / (n - 1));
      const key = displayKey(type, s, t);
      if (key === last && out.length) { out[out.length - 1].delay += delay; continue; }
      last = key;
      out.push({ state: { t }, delay });
    }
    out[out.length - 1].delay += s.loop ? Math.max(200, s.holdMs) : 0;
    return out;
  }
  if (type === 'alert') {
    const hz = clamp(Number(s.speed) || 1, 0.5, MAX_BLINK_HZ);
    const period = 1000 / hz;
    const step = s.blinkStyle === 'pulse' || s.blinkStyle === 'glow' ? 10 : 2;
    const delay = Math.max(20, Math.round(period / step / 10) * 10);
    const cycle = [];
    for (let i = 0; i < step; i++) cycle.push({ state: { phase: i / step }, delay });
    let out = [];
    const reps = s.pauseMs > 0 ? clamp(Math.round(s.blinksPerCycle || 3), 1, 10) : 1;
    for (let r = 0; r < reps; r++) out = out.concat(cycle.map((f) => ({ ...f, state: { ...f.state } })));
    if (s.pauseMs > 0) out.push({ state: { phase: 0 }, delay: Math.round(s.pauseMs / 10) * 10 });
    return out;
  }
  return [{ state: {}, delay: 1000 }];
}

function displayKey(type, s, t) {
  if (type === 'percentage') return Math.round(clamp(s.value, 0, 100) * t);
  const cur = Math.round(Number(s.current) * t);
  return cur * 1000 + Math.round(pct(s.current, s.max) * t);
}

export function gifRepeat(type, s) {
  if (type === 'countdown') return -1;
  if (type === 'alert') return s.loop === false ? -1 : 0;
  return s.loop ? 0 : -1;
}

export function pct(current, max) {
  const m = Number(max) || 0;
  if (m <= 0) return 0;
  return clamp((Number(current) / m) * 100, 0, 100);
}

// ---------------------------------------------------------------------------
// Desenho

/** Desenha um frame em ctx, na escala indicada (3 = supersampling 3x). */
export function drawFrame(ctx, type, settings, state, scale = 1) {
  const s = settings;
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, s.width, s.height);
  const box = drawBackground(ctx, type, s, state);
  if (type === 'countdown') drawCountdown(ctx, s, state, box);
  else if (type === 'percentage') drawPercentage(ctx, s, state, box);
  else if (type === 'progress') drawProgress(ctx, s, state, box);
  else if (type === 'alert') drawAlert(ctx, s, state, box);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawBackground(ctx, type, s, state) {
  const fx = type === 'alert' ? alertFx(s, state) : null;
  const bw = Number(s.borderWidth) || 0;
  const inset = bw / 2;
  roundRect(ctx, inset, inset, s.width - bw, s.height - bw, s.radius);
  if (fx && fx.background) {
    if (s.bgMode !== 'transparent') { ctx.fillStyle = s.bgColor; ctx.fill(); }
    ctx.globalAlpha = fx.background.alpha;
    ctx.fillStyle = fx.background.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (s.bgMode !== 'transparent') {
    ctx.fillStyle = s.bgColor;
    ctx.fill();
  }
  if (bw > 0) {
    let color = s.borderColor;
    let alpha = 1;
    if (fx && fx.border) { color = fx.border.color; alpha = fx.border.alpha; }
    if (fx && fx.glow && fx.glow.border) setGlow(ctx, s, fx.glow.amount);
    ctx.globalAlpha = alpha;
    ctx.lineWidth = bw;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.globalAlpha = 1;
    clearGlow(ctx);
  }
  const p = Number(s.padding) || 0;
  return { x: bw + p, y: bw + p, w: s.width - 2 * (bw + p), h: s.height - 2 * (bw + p) };
}

function font(ctx, s, size, weight) {
  ctx.font = `${weight || s.fontWeight} ${Math.max(1, size).toFixed(2)}px "${familyOf(s.fontFamily)}"`;
}

function spacingOf(s, size) {
  return ((Number(s.letterSpacing) || 0) * size) / 40;
}

function textWidth(ctx, text, spacing) {
  const chars = [...String(text)];
  if (!spacing) return ctx.measureText(String(text)).width;
  let w = 0;
  for (const ch of chars) w += ctx.measureText(ch).width;
  return w + spacing * Math.max(0, chars.length - 1);
}

function drawText(ctx, text, x, y, align, spacing) {
  text = String(text);
  const w = textWidth(ctx, text, spacing);
  let sx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (!spacing) { ctx.fillText(text, sx, y); return w; }
  for (const ch of text) { ctx.fillText(ch, sx, y); sx += ctx.measureText(ch).width + spacing; }
  return w;
}

function capHeight(ctx, sample = 'H') {
  const m = ctx.measureText(sample);
  return m.actualBoundingBoxAscent || parseFloat(ctx.font.match(/([\d.]+)px/)[1]) * 0.72;
}

/** Maior fonte que cabe na largura/altura. Altura = altura de maiúscula. */
function fitSize(ctx, s, text, maxW, maxCap, weight, sample = 'H') {
  let size = 100;
  font(ctx, s, size, weight);
  const cap = capHeight(ctx, sample) || 72;
  size = (maxCap / cap) * 100;
  font(ctx, s, size, weight);
  const w = textWidth(ctx, text, spacingOf(s, size));
  if (w > maxW && w > 0) size *= maxW / w;
  return Math.max(4, size);
}

function alignX(s, box) {
  return s.align === 'left' ? box.x : s.align === 'right' ? box.x + box.w : box.x + box.w / 2;
}

/** Linha de texto simples centrada verticalmente em y (meio da maiúscula). */
function textLine(ctx, s, text, color, box, yMid, capH, weight, opts = {}) {
  if (!text) return;
  let size = fitSize(ctx, s, text, opts.maxW || box.w, capH, weight);
  if (opts.maxSize) size = Math.min(size, opts.maxSize);
  font(ctx, s, size, weight);
  ctx.fillStyle = color;
  const cap = capHeight(ctx);
  drawText(ctx, text, opts.x ?? alignX(s, box), yMid + cap / 2, opts.align || s.align, spacingOf(s, size));
  return size;
}

// Distribui a altura disponível entre linhas com pesos relativos.
function layoutRows(box, rows, gapRatio = 0.08) {
  const active = rows.filter((r) => r.weight > 0);
  const gap = box.h * gapRatio;
  const totalW = active.reduce((a, r) => a + r.weight, 0);
  const avail = box.h - gap * Math.max(0, active.length - 1);
  let y = box.y;
  const out = {};
  for (const r of active) {
    const h = (avail * r.weight) / totalW;
    out[r.key] = { y, h, mid: y + h / 2 };
    y += h + gap;
  }
  return out;
}

// ---- Contagem regressiva --------------------------------------------------

function drawCountdown(ctx, s, state, box) {
  const remaining = state.remaining ?? 0;
  const ended = remaining <= 0;
  const inline = s.unitStyle === 'inline';
  const showLabels = s.showLabels && !inline && !(ended && s.afterEnd === 'message');
  const rows = layoutRows(box, [
    { key: 'title', weight: s.title ? 0.2 : 0 },
    { key: 'digits', weight: 0.5 },
    { key: 'labels', weight: showLabels ? 0.1 : 0 },
    { key: 'subtitle', weight: s.subtitle ? 0.15 : 0 },
  ], 0.07);

  const ts = s.title ? textLine(ctx, s, s.title, s.titleColor, box, rows.title.mid, rows.title.h * 0.62, s.fontWeight) : 0;
  if (s.subtitle) textLine(ctx, s, s.subtitle, s.subtitleColor, box, rows.subtitle.mid, rows.subtitle.h * 0.6, 500, { maxSize: ts ? ts * 0.85 : 0 });

  const dr = rows.digits;
  if (ended && s.afterEnd === 'message') {
    textLine(ctx, s, s.endMessage || 'EVENTO INICIADO', s.numberColor, box, dr.mid, dr.h * 0.7, s.fontWeight);
    return;
  }

  const parts = countdownParts(remaining, s.format);
  const groups = parts.map(([k, v]) => ({ k, text: k === 'd' || parts[0][0] === k ? String(v).padStart(2, '0') : pad2(v) }));

  // Mede em tamanho de referência e escala para caber.
  const ref = 100;
  font(ctx, s, ref);
  const refCap = capHeight(ctx, '0');
  const cell = Math.max(...'0123456789'.split('').map((c) => ctx.measureText(c).width));
  const sepW = ctx.measureText(':').width;
  const sepGap = cell * 0.28;
  let unitRef = 0;
  let total = 0;
  if (inline) {
    font(ctx, s, ref * 0.36, 600);
    unitRef = groups.map((g) => ctx.measureText(s.labels[g.k]).width);
    font(ctx, s, ref);
    groups.forEach((g, i) => { total += g.text.length * cell + cell * 0.18 + unitRef[i]; });
    total += cell * 0.55 * (groups.length - 1);
  } else {
    groups.forEach((g) => { total += g.text.length * cell; });
    total += (sepW + sepGap * 2) * (groups.length - 1);
  }
  let k = (dr.h * 0.92) / refCap;
  if (total * k > box.w) k = box.w / total;
  const size = ref * k;
  font(ctx, s, size);
  const cap = refCap * k;
  const cw = cell * k;
  const baseline = dr.mid + cap / 2;
  let x = s.align === 'left' ? box.x : s.align === 'right' ? box.x + box.w - total * k : box.x + (box.w - total * k) / 2;

  const centers = [];
  groups.forEach((g, i) => {
    font(ctx, s, size);
    ctx.fillStyle = s.numberColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const start = x;
    for (const ch of g.text) { ctx.fillText(ch, x + cw / 2, baseline); x += cw; }
    centers.push((start + x) / 2);
    if (inline) {
      x += cw * 0.18;
      font(ctx, s, size * 0.36, 600);
      ctx.fillStyle = s.labelColor;
      ctx.textAlign = 'left';
      ctx.fillText(s.labels[g.k], x, baseline);
      x += unitRef[i] * k;
      if (i < groups.length - 1) x += cw * 0.55;
    } else if (i < groups.length - 1) {
      x += sepGap * k;
      ctx.fillStyle = s.numberColor;
      ctx.textAlign = 'left';
      // dois pontos centralizados na altura dos números
      const colonCap = capHeight(ctx, ':');
      ctx.fillText(':', x, baseline - (cap - colonCap) / 2);
      x += sepW * k + sepGap * k;
    }
  });

  if (showLabels) {
    const lr = rows.labels;
    let lsize = fitSize(ctx, s, 'HORAS', cw * 2.1, lr.h * 0.8, 600);
    font(ctx, s, lsize, 600);
    ctx.fillStyle = s.labelColor;
    const lcap = capHeight(ctx);
    groups.forEach((g, i) => drawText(ctx, s.labels[g.k], centers[i], lr.mid + lcap / 2, 'center', spacingOf(s, lsize)));
  }
}

// ---- Porcentagem ------------------------------------------------------------

function percentText(v) {
  return `${Math.round(v)}%`;
}

/** Número de % centralizado em (cx, cy), com tamanho fixo calculado para "100%". */
function centeredPercent(ctx, s, value, cx, cy, maxW, maxCap, color) {
  const size = fitSize(ctx, s, '100%', maxW, maxCap, s.fontWeight, '0');
  font(ctx, s, size);
  ctx.fillStyle = color;
  const cap = capHeight(ctx, '0');
  drawText(ctx, percentText(value), cx, cy + cap / 2, 'center', spacingOf(s, size));
}

function drawPercentage(ctx, s, state, box) {
  const value = clamp(Number(s.value) || 0, 0, 100) * (state.t ?? 1);
  const shown = Math.round(value);
  const style = s.style || 'circle';

  if (style === 'circle' || style === 'circle_filled') {
    const side = s.title && box.w >= box.h * 1.6;
    let d, cx, cy, textBox = null;
    if (side) {
      d = Math.min(box.h, box.w * 0.4);
      cx = box.x + d / 2; cy = box.y + box.h / 2;
      textBox = { x: box.x + d + box.w * 0.05, y: box.y, w: box.w - d - box.w * 0.05, h: box.h };
    } else if (s.title) {
      const rows = layoutRows(box, [{ key: 'ring', weight: 0.78 }, { key: 'title', weight: 0.14 }], 0.06);
      d = Math.min(rows.ring.h, box.w); cx = box.x + box.w / 2; cy = rows.ring.mid;
      textLine(ctx, s, s.title, s.titleColor, box, rows.title.mid, rows.title.h * 0.75, s.fontWeight);
    } else {
      d = Math.min(box.w, box.h); cx = box.x + box.w / 2; cy = box.y + box.h / 2;
    }
    const r = d / 2;
    if (style === 'circle') {
      const lw = d * 0.12;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.strokeStyle = s.trackColor;
      ctx.beginPath(); ctx.arc(cx, cy, r - lw / 2, 0, Math.PI * 2); ctx.stroke();
      if (value > 0) {
        ctx.strokeStyle = s.accentColor;
        ctx.beginPath();
        ctx.arc(cx, cy, r - lw / 2, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * value) / 100);
        ctx.stroke();
      }
      centeredPercent(ctx, s, shown, cx, cy, (r - lw) * 1.55, d * 0.22, s.numberColor);
    } else {
      ctx.fillStyle = s.trackColor;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      if (value > 0) {
        ctx.fillStyle = s.accentColor;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * value) / 100);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = s.bgMode === 'transparent' ? '#000000' : s.bgColor;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2); ctx.fill();
      centeredPercent(ctx, s, shown, cx, cy, r * 1.15, d * 0.2, s.numberColor);
    }
    if (textBox) {
      const tb = { ...textBox, y: textBox.y + textBox.h * 0.25, h: textBox.h * 0.5 };
      const r2 = layoutRows(tb, [{ key: 't', weight: 1 }, { key: 'st', weight: s.subtitle ? 0.6 : 0 }], 0.15);
      textLine(ctx, s, s.title, s.titleColor, textBox, r2.t.mid, Math.min(r2.t.h * 0.7, textBox.h * 0.16), s.fontWeight, { align: 'left', x: textBox.x });
      if (s.subtitle) textLine(ctx, s, s.subtitle, s.subtitleColor, textBox, r2.st.mid, r2.st.h * 0.6, 500, { align: 'left', x: textBox.x });
    }
    return;
  }

  if (style === 'bar_v') {
    const bw = Math.max(8, Math.min(box.w * 0.14, box.h * 0.35));
    const bx = box.x;
    ctx.fillStyle = s.trackColor;
    roundRect(ctx, bx, box.y, bw, box.h, bw / 2); ctx.fill();
    const fh = (box.h * value) / 100;
    if (fh > 0) { ctx.fillStyle = s.accentColor; roundRect(ctx, bx, box.y + box.h - fh, bw, fh, Math.min(bw / 2, fh / 2)); ctx.fill(); }
    const tb = { x: bx + bw + box.w * 0.06, y: box.y, w: box.w - bw - box.w * 0.06, h: box.h };
    const rows = layoutRows(tb, [{ key: 'n', weight: 0.55 }, { key: 't', weight: s.title ? 0.2 : 0 }], 0.1);
    centeredPercent(ctx, s, shown, tb.x + tb.w / 2, rows.n.mid, tb.w, rows.n.h * 0.8, s.numberColor);
    if (s.title) textLine(ctx, s, s.title, s.titleColor, tb, rows.t.mid, rows.t.h * 0.7, s.fontWeight, { align: 'center', x: tb.x + tb.w / 2 });
    return;
  }

  const rowsDef = {
    bar_h: [{ key: 'title', weight: s.title ? 0.2 : 0 }, { key: 'bar', weight: 0.16 }, { key: 'num', weight: 0.22 }],
    number: [{ key: 'title', weight: s.title ? 0.2 : 0 }, { key: 'num', weight: 0.6 }],
    number_bar: [{ key: 'title', weight: s.title ? 0.18 : 0 }, { key: 'num', weight: 0.46 }, { key: 'bar', weight: 0.14 }],
  }[style] || [];
  const rows = layoutRows(box, rowsDef, 0.08);
  if (rows.title) textLine(ctx, s, s.title, s.titleColor, box, rows.title.mid, rows.title.h * 0.65, s.fontWeight);
  if (rows.bar) drawBar(ctx, s, box.x, rows.bar.y, box.w, rows.bar.h, value);
  if (rows.num) centeredPercent(ctx, s, shown, alignX(s, box), rows.num.mid, box.w, rows.num.h * 0.78, s.numberColor);
}

function drawBar(ctx, s, x, y, w, h, value) {
  ctx.fillStyle = s.trackColor;
  roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
  const fw = (w * value) / 100;
  if (fw > 0) { ctx.fillStyle = s.accentColor; roundRect(ctx, x, y, Math.max(fw, Math.min(h, w)), h, h / 2); ctx.fill(); }
}

// ---- Barra de progresso ---------------------------------------------------

function drawProgress(ctx, s, state, box) {
  const t = state.t ?? 1;
  const max = Number(s.max) || 0;
  const current = Math.round((Number(s.current) || 0) * t);
  const value = pct(current, max);
  const showRow = s.showValues || s.showPercent;
  const rows = layoutRows(box, [
    { key: 'title', weight: s.title ? 0.18 : 0 },
    { key: 'vals', weight: showRow ? 0.26 : 0 },
    { key: 'bar', weight: 0.15 },
    { key: 'subtitle', weight: s.subtitle ? 0.13 : 0 },
  ], 0.08);
  if (s.title) textLine(ctx, s, s.title, s.titleColor, box, rows.title.mid, rows.title.h * 0.65, s.fontWeight);
  if (showRow) {
    const r = rows.vals;
    const left = s.showValues ? `${current} / ${max}` : '';
    const right = s.showPercent ? percentText(value) : '';
    const sample = `${max} / ${max}    100%`;
    const size = fitSize(ctx, s, sample, box.w * 0.96, r.h * 0.78, s.fontWeight, '0');
    font(ctx, s, size);
    ctx.fillStyle = s.numberColor;
    const cap = capHeight(ctx, '0');
    const sp = spacingOf(s, size);
    const by = r.mid + cap / 2;
    if (left && right) {
      drawText(ctx, left, box.x, by, 'left', sp);
      drawText(ctx, right, box.x + box.w, by, 'right', sp);
    } else drawText(ctx, left || right, alignX(s, box), by, s.align, sp);
  }
  drawBar(ctx, s, box.x, rows.bar.y, box.w, rows.bar.h, value);
  if (s.subtitle) textLine(ctx, s, s.subtitle, s.subtitleColor, box, rows.subtitle.mid, rows.subtitle.h * 0.6, 500);
}

// ---- Alerta ------------------------------------------------------------------

/** Efeito do alerta por elemento, para a fase atual (0..1) do ciclo. */
function alertFx(s, state) {
  const phase = state.phase ?? 0;
  const style = s.blinkStyle || 'blink';
  const targets = new Set(style === 'border' ? ['border'] : s.blinkTargets || []);
  const on = phase < 0.5;
  const wave = 0.5 + 0.5 * Math.cos(phase * Math.PI * 2); // 1 → 0 → 1
  const fx = { glow: null };
  const set = (k, v) => { if (targets.has(k)) fx[k] = v; };
  for (const k of ['icon', 'title', 'subtitle', 'border']) {
    if (style === 'blink' || style === 'border') set(k, { color: s.colorA, alpha: on ? 1 : 0.12 });
    else if (style === 'alternate') set(k, { color: on ? s.colorA : s.colorB, alpha: 1 });
    else if (style === 'pulse') set(k, { color: s.colorA, alpha: 0.25 + 0.75 * wave });
    else if (style === 'glow') set(k, { color: s.colorA, alpha: 1 });
  }
  if (targets.has('background')) {
    if (style === 'blink') fx.background = { color: s.colorA, alpha: on ? 1 : 0 };
    else if (style === 'alternate') fx.background = { color: on ? s.colorA : s.colorB, alpha: 1 };
    else if (style === 'pulse') fx.background = { color: s.colorA, alpha: wave };
  }
  if (style === 'glow') {
    fx.glow = { amount: (0.25 + 0.75 * wave) * (clamp(Number(s.glowIntensity) || 0, 0, 100) / 100), border: targets.has('border') };
    fx.glowTargets = targets;
  }
  return fx;
}

function setGlow(ctx, s, amount) {
  ctx.shadowColor = s.glowColor || s.colorA;
  ctx.shadowBlur = Math.max(0, amount) * Math.min(s.width, s.height) * 0.18;
}

function clearGlow(ctx) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0,0,0,0)';
}

function elementStyle(ctx, s, fx, key, baseColor) {
  const e = fx[key];
  ctx.globalAlpha = e ? e.alpha : 1;
  const color = e ? e.color : baseColor;
  if (fx.glow && fx.glowTargets && fx.glowTargets.has(key)) setGlow(ctx, s, fx.glow.amount);
  return color;
}

function resetStyle(ctx) {
  ctx.globalAlpha = 1;
  clearGlow(ctx);
}

function drawAlert(ctx, s, state, box) {
  const fx = alertFx(s, state);
  const hasIcon = s.icon && s.icon !== 'none';
  const only = s.iconPosition === 'only' || (!s.title && !s.subtitle);
  let iconBox = null, textBox = box;

  if (hasIcon && only) {
    const d = Math.min(box.w, box.h);
    iconBox = { cx: box.x + box.w / 2, cy: box.y + box.h / 2, size: d };
    textBox = null;
  } else if (hasIcon && s.iconPosition === 'top') {
    const rows = layoutRows(box, [{ key: 'i', weight: 0.45 }, { key: 't', weight: 0.55 }], 0.06);
    iconBox = { cx: box.x + box.w / 2, cy: rows.i.mid, size: Math.min(rows.i.h, box.w) };
    textBox = { x: box.x, y: rows.t.y, w: box.w, h: rows.t.h };
  } else if (hasIcon) {
    const d = Math.min(box.h, box.w * 0.3);
    iconBox = { cx: box.x + d / 2, cy: box.y + box.h / 2, size: d };
    const gap = box.w * 0.04;
    textBox = { x: box.x + d + gap, y: box.y, w: box.w - d - gap, h: box.h };
  }

  if (iconBox) {
    const color = elementStyle(ctx, s, fx, 'icon', s.iconColor);
    drawIcon(ctx, s.icon, iconBox.cx, iconBox.cy, iconBox.size * 0.9, color, s.bgMode === 'transparent' ? '#000000' : s.bgColor);
    resetStyle(ctx);
  }
  if (textBox) {
    const sideBySide = iconBox && s.iconPosition === 'left';
    const align = sideBySide ? (s.align === 'center' ? 'center' : s.align) : s.align;
    const cx = align === 'left' ? textBox.x : align === 'right' ? textBox.x + textBox.w : textBox.x + textBox.w / 2;
    const rows = layoutRows(textBox, [{ key: 't', weight: s.title ? 0.5 : 0 }, { key: 'st', weight: s.subtitle ? 0.4 : 0 }], 0.1);
    let titleSize = 0;
    if (s.title) {
      const color = elementStyle(ctx, s, fx, 'title', s.titleColor);
      titleSize = textLine(ctx, s, s.title, color, textBox, rows.t.mid, rows.t.h * 0.62, s.fontWeight, { align, x: cx });
      resetStyle(ctx);
    }
    if (s.subtitle) {
      const color = elementStyle(ctx, s, fx, 'subtitle', s.subtitleColor);
      textLine(ctx, s, s.subtitle, color, textBox, rows.st.mid, rows.st.h * 0.6, 600, { align, x: cx, maxSize: titleSize ? titleSize * 0.8 : 0 });
      resetStyle(ctx);
    }
  }
}

function exclamation(ctx, cx, top, h, color) {
  const w = h * 0.2;
  ctx.fillStyle = color;
  roundRect(ctx, cx - w / 2, top, w, h * 0.62, w / 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, top + h * 0.86, w * 0.62, 0, Math.PI * 2); ctx.fill();
}

function drawIcon(ctx, icon, cx, cy, size, color, inner) {
  const r = size / 2;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (icon === 'triangle') {
    const h = size * 0.88;
    const top = cy - h / 2, bot = cy + h / 2;
    ctx.beginPath();
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.08;
    ctx.moveTo(cx, top); ctx.lineTo(cx + r, bot); ctx.lineTo(cx - r, bot); ctx.closePath();
    ctx.fill(); ctx.stroke();
    exclamation(ctx, cx, top + h * 0.3, h * 0.55, inner);
  } else if (icon === 'circle') {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    exclamation(ctx, cx, cy - r * 0.55, r * 1.15, inner);
  } else if (icon === 'siren') {
    const w = size * 0.56, bodyH = size * 0.42;
    const baseY = cy + size * 0.3;
    // raios
    ctx.lineWidth = size * 0.06; ctx.lineCap = 'round';
    const rays = [[-0.42, -0.36, -0.3, -0.26], [0.42, -0.36, 0.3, -0.26], [0, -0.5, 0, -0.38], [-0.48, -0.06, -0.36, -0.06], [0.48, -0.06, 0.36, -0.06]];
    for (const [x1, y1, x2, y2] of rays) { ctx.beginPath(); ctx.moveTo(cx + x1 * size, cy + y1 * size); ctx.lineTo(cx + x2 * size, cy + y2 * size); ctx.stroke(); }
    // cúpula
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, baseY - size * 0.06);
    ctx.lineTo(cx - w / 2, baseY - bodyH + w / 2);
    ctx.arc(cx, baseY - bodyH + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(cx + w / 2, baseY - size * 0.06);
    ctx.closePath(); ctx.fill();
    roundRect(ctx, cx - w * 0.68, baseY - size * 0.05, w * 1.36, size * 0.13, size * 0.03); ctx.fill();
    ctx.fillStyle = inner;
    roundRect(ctx, cx - w * 0.1, baseY - bodyH + w * 0.3, w * 0.2, bodyH * 0.5, w * 0.1); ctx.fill();
  } else if (icon === 'bell') {
    const w = size * 0.7, top = cy - size * 0.38, bot = cy + size * 0.24;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, bot);
    ctx.quadraticCurveTo(cx - w * 0.38, bot - size * 0.1, cx - w * 0.38, cy - size * 0.02);
    ctx.bezierCurveTo(cx - w * 0.38, top, cx + w * 0.38, top, cx + w * 0.38, cy - size * 0.02);
    ctx.quadraticCurveTo(cx + w * 0.38, bot - size * 0.1, cx + w / 2, bot);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, bot + size * 0.1, size * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, top - size * 0.02, size * 0.06, 0, Math.PI * 2); ctx.fill();
  } else if (icon === 'bolt') {
    const p = [[0.12, -0.5], [-0.3, 0.06], [-0.02, 0.06], [-0.12, 0.5], [0.3, -0.08], [0.02, -0.08]];
    ctx.beginPath();
    p.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x * size, cy + y * size) : ctx.moveTo(cx + x * size, cy + y * size)));
    ctx.closePath(); ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.04; ctx.fill(); ctx.stroke();
  }
}
