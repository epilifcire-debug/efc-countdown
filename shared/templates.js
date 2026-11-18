// Modelos prontos do sistema (semente da tabela templates).
const gold = '#D4AF37';
const black = '#000000';
const white = '#FFFFFF';

export const SYSTEM_TEMPLATES = [
  // Contagem regressiva
  { name: 'Premium Gold', type: 'countdown', settings: { bgColor: black, borderWidth: 0, numberColor: gold, titleColor: white, subtitleColor: white, labelColor: '#A1A1A1' } },
  { name: 'White', type: 'countdown', settings: { bgColor: white, borderWidth: 0, numberColor: black, titleColor: black, subtitleColor: '#333333', labelColor: '#555555', fontFamily: 'inter' } },
  { name: 'Black & Gold', type: 'countdown', settings: { bgColor: black, borderColor: gold, borderWidth: 3, numberColor: gold, titleColor: gold, subtitleColor: white, labelColor: '#C0C0C0' } },
  { name: 'Minimal', type: 'countdown', settings: { bgColor: '#0A0A0A', borderWidth: 0, radius: 0, numberColor: white, titleColor: white, subtitleColor: '#A1A1A1', labelColor: '#A1A1A1', fontFamily: 'inter', fontWeight: 700, letterSpacing: 0 } },
  { name: 'Event', type: 'countdown', settings: { bgColor: black, borderColor: gold, borderWidth: 2, numberColor: gold, titleColor: '#E11D48', subtitleColor: white, labelColor: '#A1A1A1', width: 600, height: 180 } },
  { name: 'Lote Roxo', type: 'countdown', settings: { bgColor: '#EDEDED', borderWidth: 0, numberColor: '#3B1F5C', titleColor: '#3B1F5C', subtitleColor: '#3B1F5C', labelColor: '#3B1F5C', subtitle: '' } },

  // Porcentagem
  { name: 'Gold Circular', type: 'percentage', settings: { style: 'circle', bgColor: black, borderColor: gold, borderWidth: 2, accentColor: gold, numberColor: gold, titleColor: white } },
  { name: 'Gold Preenchido', type: 'percentage', settings: { style: 'circle_filled', width: 400, height: 400, bgColor: black, borderWidth: 0, accentColor: gold, numberColor: gold, titleColor: white } },
  { name: 'Gold Bar', type: 'percentage', settings: { style: 'bar_h', bgColor: black, borderColor: gold, borderWidth: 2, accentColor: gold, numberColor: gold, titleColor: white } },
  { name: 'Lote Roxo', type: 'percentage', settings: { style: 'bar_h', title: 'INGRESSOS VENDIDOS DESSE LOTE', bgColor: '#EDEDED', borderWidth: 0, accentColor: '#3B1F5C', trackColor: '#CFCFCF', numberColor: '#3B1F5C', titleColor: '#3B1F5C', fontFamily: 'inter' } },
  { name: 'Número Gold', type: 'percentage', settings: { style: 'number', bgColor: black, borderWidth: 0, numberColor: gold, titleColor: white } },

  // Barra de progresso
  { name: 'Gold Progress', type: 'progress', settings: { bgColor: black, borderColor: gold, borderWidth: 2, accentColor: gold, numberColor: gold, titleColor: gold } },
  { name: 'White Progress', type: 'progress', settings: { bgColor: white, borderWidth: 0, accentColor: black, trackColor: '#E5E5E5', numberColor: black, titleColor: black, fontFamily: 'inter' } },

  // Alerta
  { name: 'Gold Alert', type: 'alert', settings: { icon: 'triangle', blinkStyle: 'blink', blinkTargets: ['icon', 'title'], bgColor: black, borderColor: gold, borderWidth: 2, iconColor: gold, colorA: gold, titleColor: gold, subtitleColor: white } },
  { name: 'Sirene', type: 'alert', settings: { icon: 'siren', blinkStyle: 'alternate', blinkTargets: ['icon', 'title', 'border'], colorA: '#E11D48', colorB: gold, bgColor: black, borderWidth: 3, titleColor: white, subtitleColor: white } },
  { name: 'Urgente', type: 'alert', settings: { icon: 'circle', blinkStyle: 'pulse', blinkTargets: ['background'], colorA: '#E11D48', bgColor: '#7F1D1D', borderWidth: 0, iconColor: white, titleColor: white, subtitleColor: white, speed: 1 } },
  { name: 'White Alert', type: 'alert', settings: { icon: 'triangle', blinkStyle: 'border', colorA: black, bgColor: white, borderColor: black, borderWidth: 4, iconColor: black, titleColor: black, subtitleColor: '#333333', fontFamily: 'inter' } },
  { name: 'Neon Glow', type: 'alert', settings: { icon: 'bolt', blinkStyle: 'glow', blinkTargets: ['icon', 'title', 'border'], colorA: gold, glowColor: gold, glowIntensity: 80, bgColor: black, borderColor: gold, borderWidth: 2, iconColor: gold, titleColor: gold, subtitleColor: white, speed: 1 } },
];
