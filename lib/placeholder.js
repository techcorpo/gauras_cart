// Deterministic gradient + emoji placeholder for products (no image column in DB).
const EMOJI = {
  seeds: '🌱', seed: '🌱', fertilizer: '🧪', fertiliser: '🧪',
  pesticide: '🧴', tool: '🛠️', tools: '🛠️', feed: '🌾', fodder: '🌾',
  silage: '🌽', hay: '🌿', default: '📦',
};
const GRADS = [
  ['#e5f5eb', '#b8e6c8'], ['#e8f1fb', '#c3dcf7'], ['#fff4dc', '#ffe2a8'],
  ['#f1ebfe', '#d9c6fb'], ['#fdecec', '#f8caca'], ['#e6f6f4', '#bce8e1'],
];
export function productEmoji(category) {
  const k = (category || '').toLowerCase();
  for (const key in EMOJI) if (k.includes(key)) return EMOJI[key];
  return EMOJI.default;
}
export function productGradient(seed = '') {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}
