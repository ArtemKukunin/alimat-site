// Small inline stroke icons (decorative: aria-hidden).
const P = {
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  bus: '<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16M8 17v3M16 17v3"/><circle cx="8" cy="14" r=".6"/><circle cx="16" cy="14" r=".6"/>',
  meal: '<path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  pay: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1s6 1 6 1zM12 9c2-4 6-4 6-1s-6 1-6 1z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  factory: '<path d="M3 21V10l6 4V10l6 4V5h6v16z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
  knife: '<path d="M4 20l9-9"/><path d="M13 11l7-7c1 3 0 6-3 9l-2 2z"/><path d="M6 18l-2 2"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l8-8"/>',
  truck: '<path d="M2 6h11v10H2zM13 10h4l4 4v2h-8z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
};

export function icon(name, cls = 'ic') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name]}</svg>`;
}

export const TAG_ICONS = { housing: 'home', transport: 'bus', meals: 'meal', coordinator: 'user' };
