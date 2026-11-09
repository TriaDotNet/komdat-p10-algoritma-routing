// Static illustrations and app-style icons, authored in code.
// No algorithm walkthroughs here: those will be added later as playable, narrated demos.
const svg = (body, box, cls = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" class="${cls}" aria-hidden="true" focusable="false">${body}</svg>`;
const P = (...pts) => 'M' + pts.map(p => p.join(' ')).join('L');
const edge = (a, b, cls = 'e') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="${cls}"/>`;
function node([x, y], label = '', o = {}) {
  const r = o.r || 26, cls = o.key ? 'gn gn-key' : o.dim ? 'gn gn-dim' : 'gn';
  return `<g class="${cls}"><circle cx="${x}" cy="${y}" r="${r}"/>${label ? `<text x="${x}" y="${y + 1}" style="font-size:${o.fs || Math.round(r * .78)}px">${label}</text>` : ''}</g>`;
}
function arrow(a, b, cls = 'e', pad = 30) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  const s = [a[0] + ux * pad, a[1] + uy * pad], e = [b[0] - ux * (pad + 6), b[1] - uy * (pad + 6)];
  return `<line x1="${s[0]}" y1="${s[1]}" x2="${e[0]}" y2="${e[1]}" class="${cls}"/><polygon points="${e[0] + ux * 8},${e[1] + uy * 8} ${e[0] - ux * 8 - uy * 8},${e[1] - uy * 8 + ux * 8} ${e[0] - ux * 8 + uy * 8},${e[1] - uy * 8 - ux * 8}" class="${cls}-head"/>`;
}
const tag = (x, y, t, cls = '') => { const w = 26 + t.length * 11.2; return `<g class="tag ${cls}"><rect x="${x - w / 2}" y="${y - 19}" width="${w}" height="38" rx="19"/><text x="${x}" y="${y + 1}">${t}</text></g>`; };
const pulse = ([x, y], r = 26) => `<circle cx="${x}" cy="${y}" r="${r}" class="halo"/><circle cx="${x}" cy="${y}" r="${r}" class="halo halo-2"/>`;

// ---------- app-style icons ---------------------------------------------------
const glyphs = {
  route: '<circle cx="16" cy="46" r="6"/><circle cx="48" cy="18" r="6"/><path d="M21 43c10-6 4-18 14-22l7-2"/>',
  map: '<path d="M10 16l14-6 16 6 14-6v38l-14 6-16-6-14 6z"/><path d="M24 10v38M40 16v38"/>',
  steps: '<circle cx="14" cy="16" r="4"/><circle cx="14" cy="32" r="4"/><circle cx="14" cy="48" r="4"/><path d="M26 16h26M26 32h26M26 48h18"/>',
  target: '<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="12"/><circle cx="32" cy="32" r="3" class="fill"/>',
  branch: '<circle cx="14" cy="32" r="5"/><circle cx="50" cy="14" r="5"/><circle cx="50" cy="50" r="5"/><path d="M19 32c14 0 12-18 26-18M19 32c14 0 12 18 26 18"/>',
  layers: '<path d="M32 8l24 12-24 12L8 20z"/><path d="M8 32l24 12 24-12"/><path d="M8 44l24 12 24-12"/>',
  radiate: '<circle cx="32" cy="32" r="7"/><path d="M32 18V6M32 46v12M18 32H6M46 32h12M42 22l7-7M22 42l-7 7M42 42l7 7M22 22l-7-7"/>',
  chain: '<rect x="6" y="22" width="16" height="20" rx="6"/><rect x="24" y="22" width="16" height="20" rx="6"/><rect x="42" y="22" width="16" height="20" rx="6"/>',
  shortest: '<circle cx="10" cy="48" r="5"/><circle cx="54" cy="16" r="5"/><path d="M14 44l12-12 10 6 14-18" class="thick"/><path d="M14 52h30" class="faint"/>',
  list: '<path d="M22 16h30M22 32h30M22 48h30"/><text x="10" y="21">1</text><text x="10" y="37">2</text><text x="10" y="53">3</text>',
  graph: '<circle cx="14" cy="18" r="6"/><circle cx="50" cy="18" r="6"/><circle cx="32" cy="48" r="6"/><path d="M20 18h24M17 23l11 20M47 23L36 43"/>',
  minus: '<path d="M14 40c0-14 10-24 24-24h12"/><path d="M44 8l8 8-8 8"/><path d="M22 52h18" class="thick"/>',
  matrix: '<rect x="8" y="8" width="13" height="13" rx="3"/><rect x="25.5" y="8" width="13" height="13" rx="3"/><rect x="43" y="8" width="13" height="13" rx="3"/><rect x="8" y="25.5" width="13" height="13" rx="3"/><rect x="25.5" y="25.5" width="13" height="13" rx="3" class="fill"/><rect x="43" y="25.5" width="13" height="13" rx="3"/><rect x="8" y="43" width="13" height="13" rx="3"/><rect x="25.5" y="43" width="13" height="13" rx="3"/><rect x="43" y="43" width="13" height="13" rx="3"/>',
  waves: '<circle cx="32" cy="32" r="5" class="fill"/><path d="M20 20a17 17 0 0 0 0 24M44 20a17 17 0 0 1 0 24M12 12a28 28 0 0 0 0 40M52 12a28 28 0 0 1 0 40"/>',
  dice: '<rect x="10" y="10" width="44" height="44" rx="12"/><circle cx="22" cy="22" r="3.5" class="fill"/><circle cx="32" cy="32" r="3.5" class="fill"/><circle cx="42" cy="42" r="3.5" class="fill"/>',
  sum: '<path d="M46 12H18l16 20-16 20h28"/>',
  compass: '<circle cx="32" cy="32" r="24"/><path d="M40 24l-5 12-11 4 5-12z" class="fill"/>',
  gauge: '<path d="M10 44a22 22 0 1 1 44 0"/><path d="M32 44l10-14"/><circle cx="32" cy="44" r="3.5" class="fill"/>',
  bolt: '<path d="M36 6L14 36h16l-4 22 24-32H34z"/>',
  shield: '<path d="M32 6l20 8v16c0 13-9 23-20 28C21 53 12 43 12 30V14z"/><path d="M23 31l7 7 12-14"/>',
  clock: '<circle cx="32" cy="32" r="23"/><path d="M32 18v15l10 6"/>',
  ruler: '<rect x="6" y="22" width="52" height="20" rx="5"/><path d="M16 22v8M26 22v12M36 22v8M46 22v12"/>',
  hops: '<circle cx="10" cy="32" r="5"/><circle cx="32" cy="32" r="5"/><circle cx="54" cy="32" r="5"/><path d="M15 32h12M37 32h12"/><path d="M10 20c6-8 16-8 22 0M32 20c6-8 16-8 22 0"/>',
  check: '<path d="M14 33l11 11 25-26"/>',
  dash: '<path d="M16 32h32"/>',
  lock: '<rect x="14" y="28" width="36" height="26" rx="7"/><path d="M22 28v-7a10 10 0 0 1 20 0v7"/>',
  refresh: '<path d="M50 26a19 19 0 0 0-34-6M14 38a19 19 0 0 0 34 6"/><path d="M16 8v12h12M48 56V44H36"/>',
  table: '<rect x="8" y="12" width="48" height="40" rx="7"/><path d="M8 25h48M8 38h48M26 12v40"/>',
  send: '<path d="M8 30l46-20-14 44-10-18z"/><path d="M30 36l24-26"/>',
  server: '<rect x="10" y="10" width="44" height="18" rx="5"/><rect x="10" y="36" width="44" height="18" rx="5"/><circle cx="19" cy="19" r="2.5" class="fill"/><circle cx="19" cy="45" r="2.5" class="fill"/>',
  stack: '<path d="M32 8l24 12-24 12L8 20z"/><path d="M8 32l24 12 24-12"/><path d="M8 44l24 12 24-12"/>',
  warn: '<path d="M32 8l26 46H6z"/><path d="M32 26v12"/><circle cx="32" cy="45" r="2.5" class="fill"/>',
  flask: '<path d="M24 8h16M27 8v16L12 52a4 4 0 0 0 4 6h32a4 4 0 0 0 4-6L37 24V8"/><path d="M18 42h28"/>',
  copy: '<rect x="18" y="18" width="34" height="34" rx="7"/><path d="M12 42V18a6 6 0 0 1 6-6h24"/>',
  loop: '<path d="M44 20a16 16 0 1 0 4 18"/><path d="M48 8v14H34"/>',
  globe: '<circle cx="32" cy="32" r="23"/><path d="M9 32h46M32 9c8 8 8 38 0 46M32 9c-8 8-8 38 0 46"/>'
};
// A bare glyph that takes the current text colour (for icon rows on the canvas).
export const glyph = name => svg(glyphs[name] || glyphs.route, '0 0 64 64', 'gl');
// A large floating glass icon with reflection: the hero object on text-led slides.
export const orb = name => `<div class="orb r" aria-hidden="true"><span class="app-icon orb-icon">${svg(glyphs[name] || glyphs.route, '0 0 64 64', 'glyph-svg')}</span></div>`;

// ---------- hero illustrations (decorative motion only) ----------------------------
export function routeHero() {
  const n = { S: [70, 250], a: [210, 110], b: [250, 300], c: [400, 190], d: [430, 60], e: [560, 300], f: [620, 140], T: [760, 210] };
  const E = [['S', 'a'], ['S', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'e'], ['c', 'f'], ['d', 'f'], ['c', 'e'], ['e', 'T'], ['f', 'T']];
  let g = '';
  E.forEach(([u, v]) => g += edge(n[u], n[v]));
  const best = P(n.S, n.b, n.c, n.f, n.T);
  g += `<path d="${best}" class="e e-hot e-best"/>`;
  g += `<g class="comet"><circle r="9" class="pk-head"><animateMotion path="${best}" dur="3.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines=".45 0 .55 1"/></circle></g>`;
  for (const k in n) g += node(n[k], k === 'S' || k === 'T' ? k : '', { key: k === 'S' || k === 'T', r: k === 'S' || k === 'T' ? 30 : 15, fs: 24 });
  g += `<text x="70" y="306" class="hero-l">Sumber</text><text x="760" y="266" class="hero-l">Tujuan</text>`;
  return `<figure class="visual r">${svg(g, '0 0 830 340', 'hero-art')}</figure>`;
}
export function fanHero() {
  const S = [120, 250], pts = [];
  for (let i = 0; i < 9; i++) { const a = (-46 + i * 11.5) * Math.PI / 180, r = 290 + (i % 2) * 60; pts.push([S[0] + Math.cos(a) * r, S[1] + Math.sin(a) * r]); }
  let g = '';
  pts.forEach((p, i) => g += `<path d="${P(S, p)}" class="e e-ray"/><circle r="6" class="pk-head"><animateMotion path="${P(S, p)}" dur="2.6s" begin="${(i * .12).toFixed(2)}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines=".4 0 .6 1"/></circle>`);
  pts.forEach(p => g += node(p, '', { r: 16 }));
  g += pulse(S, 40) + node(S, 'S', { key: true, r: 40, fs: 30 });
  return `<figure class="visual r">${svg(g, '0 0 560 500', 'hero-art')}</figure>`;
}
// Closing slide: two counter-rotating rings of routers around the title, packets riding the rings.
export function thanksArt() {
  const C = [960, 520], ring = (r, n, cls, phase = 0) => {
    const pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + phase; return [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r * .62]; });
    let g = `<ellipse cx="${C[0]}" cy="${C[1]}" rx="${r}" ry="${r * .62}" class="orbit"/>`;
    pts.forEach((p, i) => g += edge(p, pts[(i + 1) % n], 'e e-faint'));
    pts.forEach((p, i) => g += `<g class="router${i % 3 === 0 ? ' router-key' : ''}" transform="translate(${p[0]} ${p[1]}) scale(.5) translate(${-p[0]} ${-p[1]})"><circle cx="${p[0]}" cy="${p[1]}" r="50"/><rect x="${p[0] - 22}" y="${p[1] - 14}" width="44" height="28" rx="8"/><path d="M${p[0] - 13} ${p[1] - 4}H${p[0] + 13}M${p[0] - 13} ${p[1] + 4}H${p[0] + 3}"/></g>`);
    const path = `M${C[0] + r} ${C[1]}A${r} ${r * .62} 0 1 1 ${C[0] - r} ${C[1]}A${r} ${r * .62} 0 1 1 ${C[0] + r} ${C[1]}`;
    g += [0, .5].map(o => `<circle r="9" class="pk-cover"><animateMotion path="${path}" dur="14s" begin="${-o * 14}s" repeatCount="indefinite"/></circle>`).join('');
    return `<g class="${cls}">${g}</g>`;
  };
  return svg(ring(920, 16, 'ring-a') + ring(720, 12, 'ring-b', .26), '0 0 1920 1080', 'thanks-art');
}

// Four small illustrations for the routing stages (decorative loops).
export function stageArt(i) {
  const W = '0 0 360 160', mv = (d, dur, begin = 0, r = 6) => `<circle r="${r}" class="pk-head"><animateMotion path="${d}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines=".45 0 .55 1"/></circle>`;
  let g = '';
  if (i === 0) {
    const R = [180, 80], N = [[60, 30], [60, 130], [300, 30], [300, 130]];
    N.forEach((p, k) => { g += edge(p, R); g += mv(P(p, R), 2.2, -k * .55, 5); });
    N.forEach(p => g += node(p, '', { r: 13 }));
    g += pulse(R, 24) + node(R, 'R', { key: true, r: 24, fs: 18 });
  } else if (i === 1) {
    const n = [[40, 120], [130, 40], [150, 130], [250, 70], [320, 120]];
    [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 4]].forEach(([a, b]) => g += edge(n[a], n[b]));
    const best = P(n[0], n[2], n[4]);
    g += `<path d="${best}" class="e e-hot"/>` + mv(best, 2.4, 0, 7);
    n.forEach((p, k) => g += node(p, '', { r: k === 0 || k === 4 ? 15 : 11, key: k === 0 || k === 4 }));
  } else if (i === 2) {
    const rows = [['Tujuan A', 'via R1'], ['Tujuan B', 'via R2'], ['Tujuan C', 'via R3']];
    g += `<rect x="30" y="18" width="300" height="34" rx="12" class="tb-hi"><animate attributeName="y" values="18;66;114;18" keyTimes="0;.33;.66;1" dur="4.2s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1"/></rect>`;
    rows.forEach(([a, b], k) => g += `<text x="52" y="${41 + k * 48}" class="tb-t">${a}</text><text x="308" y="${41 + k * 48}" class="tb-t tb-r">${b}</text>${k ? `<line x1="40" y1="${11 + k * 48}" x2="320" y2="${11 + k * 48}" class="tb-l"/>` : ''}`);
  } else {
    const A = [60, 80], B = [300, 80];
    g += edge(A, B) + `<path d="M258 64l18 16-18 16" class="e e-hot" fill="none"/>`;
    g += mv(P(A, B), 1.8, 0, 7) + mv(P(A, B), 1.8, -.9, 7);
    g += node(A, 'R', { key: true, r: 26, fs: 18 }) + node(B, '', { r: 16 });
  }
  return svg(g, W, 'goal-art stage-art');
}

export function goalArt(i) {
  const W = '0 0 360 150';
  let g = '';
  if (i === 0) {
    const S = [30, 75], T = [330, 75];
    g += `<path d="M48 64C110 20 250 20 312 64" class="e e-cut-s"/><g class="cut" transform="translate(180 33)"><circle r="13"/><path d="M-4.5 -4.5L4.5 4.5M4.5 -4.5L-4.5 4.5"/></g>`;
    const d = 'M48 86C110 130 250 130 312 86';
    g += `<path d="${d}" class="e e-hot"/><circle r="7" class="pk-head"><animateMotion path="${d}" dur="2.6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines=".45 0 .55 1"/></circle>`;
    g += node(S, 'S', { key: true, r: 20, fs: 16 }) + node(T, 'T', { key: true, r: 20, fs: 16 });
  } else if (i === 1) {
    const S = [30, 75], A = [330, 30], B = [330, 120];
    g += `<path d="M48 68C140 30 230 26 312 30" class="e"/><path d="M48 82C140 118 230 122 312 120" class="e e-hot"/>`;
    g += `<circle r="7" class="pk-head"><animateMotion path="M48 82C140 118 230 122 312 120" dur="2.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines=".45 0 .55 1"/></circle>`;
    g += node(S, 'S', { key: true, r: 20, fs: 16 }) + node(A, '', { r: 14 }) + node(B, '', { r: 14, key: true });
  } else {
    [36, 75, 114].forEach((y, k) => {
      g += `<line x1="20" y1="${y}" x2="340" y2="${y}" class="e lane"/>`;
      for (let j = 0; j < 2; j++) g += `<circle r="6.5" class="pk-head"><animateMotion path="M20 ${y}H340" dur="3.6s" begin="${-(k * .6 + j * 1.8)}s" repeatCount="indefinite"/></circle>`;
    });
  }
  return svg(g, W, 'goal-art');
}

export function appIcon(name) {
  return `<span class="app-icon r" aria-hidden="true">${svg(glyphs[name] || glyphs.route, '0 0 64 64', 'glyph-svg')}</span>`;
}

// ---------- diagrams ----------------------------------------------------------
const BOX = '0 0 560 320';

function sdScene(kind) {
  const n = { S: [70, 140], X: [280, 52], Y: [280, 228], T: [490, 140] };
  const mid = [(n.X[0] + n.T[0]) / 2, (n.X[1] + n.T[1]) / 2];
  const k = (key, s) => s.replace(/^<(\w+)/, `<$1 data-k="${key}"`);
  let g = '';
  g += edge(n.S, n.X) + edge(n.S, n.Y) + edge(n.Y, n.T);
  g += k('xt', edge(n.X, n.T));
  // invisible sampling paths for packets
  g += `<path data-k="p1" d="${P(n.S, n.X, n.T)}" fill="none" stroke="none"/><path data-k="p2" d="${P(n.S, n.Y, n.T)}" fill="none" stroke="none"/>`;
  // visible route segments
  g += `<path data-k="r1a" d="${P(n.S, n.X)}" class="e e-hot"/><path data-k="r1b" d="${P(n.X, n.T)}" class="e e-hot"/>`;
  if (kind === 'dinamis') g += `<path data-k="r2" d="${P(n.S, n.Y, n.T)}" class="e e-hot" opacity="0"/>`;
  // blocked-packet marker (static only)
  if (kind === 'statis') g += `<g data-k="block" opacity="0"><circle cx="${mid[0]}" cy="${mid[1]}" r="20" class="block-ring"/></g>`;
  g += `<g data-k="cut" opacity="0" transform="translate(${mid[0]} ${mid[1]})"><g class="cut"><circle r="16"/><path d="M-5.5 -5.5L5.5 5.5M5.5 -5.5L-5.5 5.5"/></g></g>`;
  // packets: head + two trailing ghosts
  for (let i = 0; i < 3; i++) g += `<g data-k="pk${i}" opacity="0"><circle r="4" class="pk-trail" data-t="2"/><circle r="5.5" class="pk-trail" data-t="1"/><circle r="8.5" class="pk-head" data-t="0"/></g>`;
  if (kind === 'statis') {
    g += `<g class="lock" transform="translate(166 72) rotate(-23)"><rect x="-15" y="-4" width="30" height="23" rx="6"/><path d="M-8-4v-6a8 8 0 0 1 16 0v6"/></g>`;
    g += tag(96, 74, 'manual', 'tag-hot');
  } else {
    g += `<g data-k="tag2" opacity="0">${tag(410, 222, 'otomatis', 'tag-hot')}</g>`;
  }
  for (const key in n) {
    const big = key === 'S' || key === 'T';
    g += `<g data-k="n${key}">${node(n[key], key, { key: big, r: big ? 28 : 20, fs: big ? 22 : 17 })}</g>`;
  }
  if (kind === 'dinamis') g += `<g data-k="yOn" opacity="0">${node(n.Y, 'Y', { key: true, r: 20, fs: 17 })}</g>`;
  const caps = kind === 'statis'
    ? ['Rute manual: S → X → T', 'Link X–T putus, rute tetap, paket tertahan']
    : ['Rute aktif: S → X → T', 'Link X–T putus, rute pindah ke S → Y → T'];
  g += caps.map((c, i) => `<text data-k="cap${i + 1}" x="280" y="300" class="sd-cap${i ? ' sd-cap-alt' : ''}" opacity="${i ? 0 : 1}">${c}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 320" class="dia" data-scene="${kind}" aria-hidden="true" focusable="false">${g}</svg>`;
}
export const diagrams = {
  // Static vs dynamic routing share one geometry and one clock (see SCENES in deck.js),
  // so both cards play side by side: normal flow, link X–T breaks, then each reacts.
  statis: () => sdScene('statis'),
  dinamis: () => sdScene('dinamis'),
  // dv / ls / pv are looping scenes; geometry lives here, timing in SCENES (deck.js).
  dv() {
    const R = [280, 136], N = [[100, 54], [100, 218], [460, 54], [460, 218]], F = [[22, 136], [538, 136]];
    const FN = [[0, 0], [0, 1], [1, 2], [1, 3]];
    let g = `<circle data-k="timer" cx="${R[0]}" cy="${R[1]}" r="52" class="timer" pathLength="1"/>`;
    FN.forEach(([f, i]) => g += edge(F[f], N[i], 'e e-faint'));
    N.forEach(p => g += edge(R, p));
    N.forEach((p, i) => g += `<line data-k="h${i}" x1="${R[0]}" y1="${R[1]}" x2="${p[0]}" y2="${p[1]}" class="e e-hot" opacity="0"/>`);
    g += tag(190, 136, 'jarak') + tag(372, 136, 'arah');
    const chip = k => `<g data-k="${k}" opacity="0"><rect x="-15" y="-11" width="30" height="22" rx="6" class="vchip"/><path d="M-8 -3.5H8M-8 3.5H3" class="vchip-l"/></g>`;
    N.forEach((_, i) => g += chip('po' + i) + chip('pi' + i));
    g += chip('pf0') + chip('pf1');
    N.forEach((p, i) => g += `<circle data-k="rn${i}" cx="${p[0]}" cy="${p[1]}" r="20" class="ring-pulse" opacity="0"/>`);
    g += `<circle data-k="rr" cx="${R[0]}" cy="${R[1]}" r="38" class="ring-pulse" opacity="0"/>`;
    F.forEach((p, i) => g += `<circle data-k="rf${i}" cx="${p[0]}" cy="${p[1]}" r="11" class="ring-pulse" opacity="0"/>`);
    F.forEach(p => g += node(p, '', { r: 11, dim: true }));
    N.forEach(p => g += node(p, '', { r: 20 }));
    g += node(R, 'R', { key: true, r: 38 });
    g += `<g data-k="upd" opacity="0">${tag(280, 70, 'tabel diperbarui', 'tag-hot')}</g>`;
    g += ['R mengirim jarak dan arah ke router tetangga', 'Tetangga membalas, tabel R diperbarui', 'Pertukaran ini diulang secara berkala']
      .map((c, i) => `<text data-k="cap${i + 1}" x="280" y="304" class="sd-cap" opacity="${i ? 0 : 1}">${c}</text>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BOX}" class="dia" data-scene="dv" data-geo='${JSON.stringify({ R, N, F, FN })}' aria-hidden="true" focusable="false">${g}</svg>`;
  },
  ls() {
    const n = [[70, 140], [190, 48], [190, 232], [370, 48], [370, 232], [490, 140], [280, 140]];
    const E = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [1, 6], [2, 6], [3, 6], [4, 6]];
    let g = '';
    E.forEach(([a, b]) => g += edge(n[a], n[b]));
    E.forEach(([a, b], i) => g += `<line data-k="m${i}" x1="${n[a][0]}" y1="${n[a][1]}" x2="${n[b][0]}" y2="${n[b][1]}" class="e e-map-on"/><circle data-k="t${i}" r="5" class="pk-dot" opacity="0"/>`);
    g += `<path data-k="sp" d="${P(n[0], n[1], n[3], n[5])}" class="e e-hot e-sp" opacity="0"/>`;
    g += `<g data-k="pk" opacity="0"><circle r="4" class="pk-trail" data-t="2"/><circle r="5.5" class="pk-trail" data-t="1"/><circle r="8.5" class="pk-head" data-t="0"/></g>`;
    n.forEach((p, i) => g += `<circle data-k="rn${i}" cx="${p[0]}" cy="${p[1]}" r="${i ? 18 : 30}" class="ring-pulse" opacity="0"/>`);
    n.forEach((p, i) => g += `<g data-k="n${i}">${node(p, i === 0 ? 'R' : '', { key: i === 0, r: i === 0 ? 30 : 18 })}</g>`);
    n.forEach((p, i) => { if (i) g += `<g data-k="on${i}" opacity="0">${node(p, '', { key: true, r: 18 })}</g>`; });
    g += `<g data-k="map" opacity="0">${tag(84, 200, 'peta lengkap', 'tag-hot')}</g>`;
    g += ['Informasi link menyebar ke seluruh jaringan', 'Setiap router memiliki peta lengkap jaringan', 'Jalur terpendek dihitung, misalnya dengan Dijkstra']
      .map((c, i) => `<text data-k="cap${i + 1}" x="280" y="304" class="sd-cap" opacity="${i ? 0 : 1}">${c}</text>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BOX}" class="dia" data-scene="ls" data-geo='${JSON.stringify({ n, E })}' aria-hidden="true" focusable="false">${g}</svg>`;
  },
  pv() {
    const xs = [56, 128, 245, 317, 434, 506], y = 140;
    let g = '';
    const as = (x, i) => `<rect data-k="as${i}" x="${x}" y="78" width="150" height="124" rx="38" class="as"/><text x="${x + 75}" y="104" class="as-l">AS${i + 1}</text>`;
    g += as(16, 0) + as(205, 1) + as(394, 2);
    for (let i = 0; i < 5; i++) g += edge([xs[i], y], [xs[i + 1], y]);
    for (let i = 0; i < 5; i++) g += `<line data-k="h${i}" x1="${xs[i]}" y1="${y}" x2="${xs[i + 1]}" y2="${y}" class="e e-hot"/>`;
    const loop = `M${xs[5]} ${y + 22}C${xs[5]} 268 ${xs[0]} 268 ${xs[0] + 6} ${y + 26}`;
    g += `<path data-k="loop" d="${loop}" class="e e-loop" opacity="0"/>`;
    g += `<g data-k="pk" opacity="0"><circle r="4" class="pk-trail" data-t="2"/><circle r="5.5" class="pk-trail" data-t="1"/><circle r="8.5" class="pk-head" data-t="0"/></g>`;
    xs.forEach((x, i) => g += node([x, y], '', { r: 15, key: i === 0 || i === 5 }));
    g += `<g data-k="cut" opacity="0" transform="translate(${xs[0] + 10} ${y + 46})"><g class="cut"><circle r="16"/><path d="M-5.5 -5.5L5.5 5.5M5.5 -5.5L-5.5 5.5"/></g></g>`;
    ['AS1', 'AS1 › AS2', 'AS1 › AS2 › AS3'].forEach((t, i) => g += `<g data-k="pt${i}" opacity="0">${tag(280, 34, t, 'tag-hot tag-wide')}</g>`);
    g += ['Setiap AS menambahkan dirinya ke catatan jalur', 'AS1 sudah tercatat di jalur, loop dicegah']
      .map((c, i) => `<text data-k="cap${i + 1}" x="280" y="304" class="sd-cap${i ? ' sd-cap-alt' : ''}" opacity="${i ? 0 : 1}">${c}</text>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BOX}" class="dia" data-scene="pv" data-geo='${JSON.stringify({ xs, y })}' aria-hidden="true" focusable="false">${g}</svg>`;
  },
  // flooding: copies go out on every link except back the way they came (timing in deck.js)
  flooding() {
    const n = { A: [80, 150], B: [220, 54], C: [220, 246], D: [380, 54], E: [380, 246], F: [500, 150] };
    const E = [['A', 'B'], ['A', 'C'], ['B', 'C'], ['B', 'D'], ['C', 'E'], ['D', 'E'], ['D', 'F'], ['E', 'F']];
    let g = '';
    E.forEach(([a, b]) => g += edge(n[a], n[b], 'e e-soft'));
    E.forEach(([a, b]) => g += `<line data-k="h-${a}${b}" x1="${n[a][0]}" y1="${n[a][1]}" x2="${n[b][0]}" y2="${n[b][1]}" class="e e-hot" opacity="0"/>`);
    for (let i = 0; i < 10; i++) g += `<circle data-k="p${i}" r="8" class="pk-head" opacity="0"/>`;
    Object.entries(n).forEach(([k, p]) => g += `<circle data-k="r-${k}" cx="${p[0]}" cy="${p[1]}" r="24" class="ring-pulse" opacity="0"/>`);
    Object.entries(n).forEach(([k, p]) => g += node(p, k, { key: k === 'A', r: k === 'A' ? 30 : 24 }) + (k === 'A' ? '' : `<g data-k="on-${k}" opacity="0">${node(p, k, { key: true, r: 24 })}</g>`));
    g += `<g data-k="dup" opacity="0">${tag(500, 214, 'duplikat ×2', 'tag-bad')}</g>`;
    g += ['Paket disalin ke semua arah, kecuali arah asal', 'Salinan terus menyebar dan berlipat ganda']
      .map((c, i) => `<text data-k="cap${i + 1}" x="280" y="304" class="sd-cap${i ? ' sd-cap-alt' : ''}" opacity="${i ? 0 : 1}">${c}</text>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BOX}" class="dia" data-scene="flooding" data-geo='${JSON.stringify(n)}' aria-hidden="true" focusable="false">${g}</svg>`;
  },
  // random: a die picks one neighbour each round (timing in deck.js)
  random() {
    const A = [100, 150], N = { B: [440, 46], C: [480, 150], D: [440, 254] };
    let g = '';
    for (const k in N) g += edge(A, N[k], 'e e-soft');
    for (const k in N) g += `<line data-k="h-${k}" x1="${A[0]}" y1="${A[1]}" x2="${N[k][0]}" y2="${N[k][1]}" class="e e-hot" opacity="0"/>`;
    g += `<circle data-k="pk" r="9" class="pk-head" opacity="0"/>`;
    for (const k in N) g += `<circle data-k="r-${k}" cx="${N[k][0]}" cy="${N[k][1]}" r="26" class="ring-pulse" opacity="0"/>`;
    g += `<g data-k="die" class="die" transform="translate(250 214)"><rect x="-26" y="-26" width="52" height="52" rx="14"/>${[[-11, -11], [11, -11], [0, 0], [-11, 11], [11, 11], [-11, 0], [11, 0]].map(([x, y], i) => `<circle data-k="pip${i}" cx="${x}" cy="${y}" r="4.5"/>`).join('')}</g>`;
    for (const k in N) g += node(N[k], k, { r: 26 }) + `<g data-k="on-${k}" opacity="0">${node(N[k], k, { key: true, r: 26 })}</g>`;
    g += node(A, 'A', { key: true, r: 34 });
    g += `<g data-k="pick" opacity="0">${tag(290, 104, 'acak', 'tag-hot')}</g>`;
    g += `<text data-k="cap1" x="280" y="304" class="sd-cap">Setiap pengiriman, A memilih tetangga secara acak</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BOX}" class="dia" data-scene="random" data-geo='${JSON.stringify({ A, N })}' aria-hidden="true" focusable="false">${g}</svg>`;
  }
};
export const diagram = id => `<figure class="dia-fig">${diagrams[id]()}<figcaption>Ilustrasi</figcaption></figure>`;

// ---------- tahapan connector -----------------------------------------------
export function pipelineTrack() {
  const xs = [0, 1, 2, 3].map(i => 34 + i * 444);
  let g = `<defs><linearGradient id="pipe-g" x1="0" x2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--accent-2)"/></linearGradient></defs>`;
  g += `<path d="M${xs[0]} 34H${xs[3] + 360}" class="pipe-line" pathLength="1"/>`;
  xs.forEach((x, i) => g += `<g class="stop"><circle cx="${x}" cy="34" r="30"/><text x="${x}" y="35">${i + 1}</text></g>`);
  return svg(g, '0 0 1760 68', 'pipe-art');
}

// ---------- cover network (decorative) ---------------------------------------
export function coverArt() {
  const pts = [[1010, 470], [1225, 220], [1270, 520], [1180, 800], [1530, 360], [1560, 700], [1800, 520]];
  const E = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 4], [2, 4], [2, 5], [3, 5], [4, 5], [4, 6], [5, 6]];
  let g = `<circle cx="1400" cy="510" r="420" class="orbit"/><circle cx="1400" cy="510" r="300" class="orbit orbit-dash"/>`;
  for (const [a, b] of E) g += edge(pts[a], pts[b], 'e e-cover');
  const best = P(pts[0], pts[1], pts[4], pts[6]);
  g += `<path d="${best}" class="e-cover-hot" pathLength="1"/>`;
  g += `<circle r="11" class="pk-cover"><animateMotion path="${best}" dur="6s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keyPoints="0;1" keySplines=".45 0 .55 1"/></circle>`;
  pts.forEach(([x, y], i) => {
    const key = [0, 1, 4, 6].includes(i);
    g += `<g class="router${key ? ' router-key' : ''}"><circle cx="${x}" cy="${y}" r="50"/><rect x="${x - 22}" y="${y - 14}" width="44" height="28" rx="8"/><path d="M${x - 13} ${y - 4}H${x + 13}M${x - 13} ${y + 4}H${x + 3}"/><circle cx="${x + 12}" cy="${y + 6}" r="3" class="led"/></g>`;
  });
  return svg(g, '0 0 1920 1080', 'cover-art');
}

// ---------- worked examples (animated step by step, timing in deck.js) ----------------
// Hooks: h-XY = route overlay for edge X→Y, w-XY = weight pill, on-X = node lit,
// r-X = pulse ring, d-X / d-X<value> = distance badge, route = packet path, pk = packet.
export function exampleGraph(kind) {
  const nodes = kind === 'dijkstra' ? [['A', 300, 56], ['B', 110, 200], ['C', 490, 200], ['D', 300, 344]] : [['A', 80, 300], ['B', 300, 80], ['C', 520, 300]];
  const edges = kind === 'dijkstra' ? [['A', 'B', 2], ['A', 'C', 4], ['B', 'C', 1], ['B', 'D', 3], ['C', 'D', 2]] : kind === 'bellman' ? [['A', 'B', 4], ['A', 'C', 5], ['B', 'C', -2]] : [['A', 'B', 3], ['A', 'C', 10], ['B', 'C', 2]];
  const route = kind === 'dijkstra' ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C'];
  const badges = {
    dijkstra: [['A', '0', 64, 0], ['B', '2', 0, 66], ['C', '3', 0, 66], ['D', '5', 64, 0]],
    bellman: [['A', '0', 0, 66], ['B', '4', 66, 0], ['C5', '5', 0, 66], ['C2', '2', 0, 66]],
    floyd: [['A', '0', 0, 66], ['B', '3', 66, 0], ['C10', '10', 0, 66], ['C5', '5', 0, 66]]
  }[kind];
  const pos = Object.fromEntries(nodes.map(([n, x, y]) => [n, [x, y]]));
  const directed = kind === 'bellman';
  const seg = (A, B, pad) => { const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l; return [[A[0] + ux * pad, A[1] + uy * pad], [B[0] - ux * (pad + (directed ? 8 : 0)), B[1] - uy * (pad + (directed ? 8 : 0))], ux, uy]; };
  const head = ([x, y], ux, uy, cls, k = '') => `<polygon ${k ? `data-k="${k}" opacity="0" ` : ''}points="${x + ux * 10},${y + uy * 10} ${x - ux * 8 - uy * 9},${y - uy * 8 + ux * 9} ${x - ux * 8 + uy * 9},${y - uy * 8 - ux * 9}" class="${cls}"/>`;
  let g = '';
  for (const [a, b, w] of edges) {
    const [s, e, ux, uy] = seg(pos[a], pos[b], 40), neg = w < 0 ? ' e-neg' : '';
    g += `<line x1="${s[0]}" y1="${s[1]}" x2="${e[0]}" y2="${e[1]}" class="e e-big"/>`;
    if (directed) g += head(e, ux, uy, 'ex-head');
    g += `<line data-k="h-${a}${b}" x1="${s[0]}" y1="${s[1]}" x2="${e[0]}" y2="${e[1]}" class="e ex-hot${neg}" opacity="0"/>`;
    if (directed) g += head(e, ux, uy, 'ex-head-hot' + (w < 0 ? ' neg' : ''), `hh-${a}${b}`);
    const A = pos[a], B = pos[b], off = kind === 'dijkstra' && a === 'B' && b === 'C' ? -26 : 30;
    const mx = (A[0] + B[0]) / 2 - uy * off, my = (A[1] + B[1]) / 2 + ux * off;
    const t = w < 0 ? '−' + (-w) : String(w), pw = 26 + t.length * 15;
    g += `<g data-k="w-${a}${b}" class="wpill${w < 0 ? ' wpill-neg' : ''}"><rect x="${mx - pw / 2}" y="${my - 21}" width="${pw}" height="42" rx="21"/><text x="${mx}" y="${my + 1}">${t}</text></g>`;
  }
  g += `<path data-k="route" d="${P(...route.map(k => pos[k]))}" fill="none" stroke="none"/>`;
  g += `<g data-k="pk" opacity="0"><circle r="5" class="pk-trail" data-t="2"/><circle r="7" class="pk-trail" data-t="1"/><circle r="11" class="pk-head" data-t="0"/></g>`;
  for (const [n, x, y] of nodes) g += `<circle data-k="r-${n}" cx="${x}" cy="${y}" r="38" class="ring-pulse" opacity="0"/>`;
  for (const [n, x, y] of nodes) g += node([x, y], n, { r: 38, fs: 30 }) + `<g data-k="on-${n}" opacity="0">${node([x, y], n, { key: true, r: 38, fs: 30 })}</g>`;
  for (const [k, v, dx, dy] of badges) {
    const [x, y] = pos[k[0]], w = 34 + v.length * 14;
    const fresh = (kind === 'bellman' && k === 'C2') || (kind === 'floyd' && k === 'C5');
    g += `<g data-k="d-${k}" class="dbadge${fresh ? ' dbadge-new' : ''}" opacity="0" transform="translate(${x + dx} ${y + dy})"><rect x="${-w / 2}" y="-19" width="${w}" height="38" rx="19"/><text y="1">${v}</text></g>`;
  }
  const note = kind === 'bellman' ? 'Panah menunjukkan arah sisi. Ungu menandai bobot negatif.' : 'Angka bulat di samping node adalah jarak dari A.';
  return `<figure class="example-graph">${`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -10 640 420" class="ex-art" data-scene="ex-${kind}" aria-hidden="true" focusable="false">${g}</svg>`}<figcaption>${note}</figcaption></figure>`;
}

export function floydMatrix() {
  const L = ['A', 'B', 'C'], M = [['0', '3', '10'], ['3', '0', '2'], ['10', '2', '0']];
  let h = '<div class="matrix" role="img" aria-label="Matriks jarak: d(A,C) diperbarui dari 10 menjadi 5"><span></span>' + L.map(l => `<b>${l}</b>`).join('');
  M.forEach((row, i) => {
    h += `<b>${L[i]}</b>`;
    row.forEach((v, j) => {
      const upd = (i === 0 && j === 2) || (i === 2 && j === 0);
      h += upd ? `<span class="cell upd"><i class="old">10</i><i class="new">5</i></span>` : `<span class="cell${i === j ? ' dim' : ''}${i === 1 || j === 1 ? ' via' : ''}">${v}</span>`;
    });
  });
  return h + '</div>';
}
