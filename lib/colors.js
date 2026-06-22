// Color themes for the app. Each has the 4 brand shades used across the UI.
// `light` is a soft tint used for active nav / chips; keep it pale.
export const COLOR_THEMES = {
  green:  { name: 'Green',  DEFAULT: '#3f8f5c', dark: '#34784d', deep: '#163b2b', light: '#edf7f1' },
  blue:   { name: 'Blue',   DEFAULT: '#2f6fed', dark: '#2457c4', deep: '#16306e', light: '#eaf1fe' },
  teal:   { name: 'Teal',   DEFAULT: '#0d9488', dark: '#0b7d73', deep: '#134e4a', light: '#e6f6f4' },
  purple: { name: 'Purple', DEFAULT: '#7c3aed', dark: '#6d28d9', deep: '#3b1d72', light: '#f1ebfe' },
  orange: { name: 'Orange', DEFAULT: '#ea7317', dark: '#c75f0c', deep: '#7a3a06', light: '#fdf0e3' },
};

export const DEFAULT_COLOR = 'green';

// Derive a readable "deep" + pale "light" for a custom hex chosen from the palette.
export function customTheme(hex) {
  return {
    name: 'Custom',
    DEFAULT: hex,
    dark: shade(hex, -0.18),
    deep: shade(hex, -0.5),
    light: tint(hex, 0.9),
  };
}

function clamp(n) { return Math.max(0, Math.min(255, Math.round(n))); }
function parse(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}
function toHex([r,g,b]) { return '#' + [r,g,b].map(x => clamp(x).toString(16).padStart(2,'0')).join(''); }
// amount < 0 darkens, > 0 lightens toward white
function shade(hex, amount) {
  const [r,g,b] = parse(hex);
  const f = amount < 0 ? 1 + amount : 1 - amount;
  return amount < 0 ? toHex([r*f, g*f, b*f]) : toHex([r+(255-r)*amount, g+(255-g)*amount, b+(255-b)*amount]);
}
// pale tint toward white (amount 0..1, higher = paler)
function tint(hex, amount) {
  const [r,g,b] = parse(hex);
  return toHex([r+(255-r)*amount, g+(255-g)*amount, b+(255-b)*amount]);
}

// Resolve a saved preference {kind:'preset'|'custom', value} -> theme object.
export function resolveTheme(pref) {
  if (!pref) return COLOR_THEMES[DEFAULT_COLOR];
  if (pref.kind === 'custom' && pref.value) return customTheme(pref.value);
  return COLOR_THEMES[pref.value] || COLOR_THEMES[DEFAULT_COLOR];
}

// Apply a theme object to the document via CSS variables.
export function applyColor(theme) {
  const r = document.documentElement;
  r.style.setProperty('--brand', theme.DEFAULT);
  r.style.setProperty('--brand-dark', theme.dark);
  r.style.setProperty('--brand-deep', theme.deep);
  r.style.setProperty('--brand-light', theme.light);
}
