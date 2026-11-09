import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSlides } from './src/slides.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const read = path => readFileSync(join(here, path), 'utf8');
const slides = buildSlides();
const meta = slides.map(({ id, ch, title }) => ({ id, ch, title }));

// Geist (SIL Open Font License) is embedded so the single HTML file looks identical offline.
const font = (file, range) => `@font-face{font-family:'Geist';font-style:normal;font-weight:400 800;font-display:block;src:url(data:font/woff2;base64,${readFileSync(join(here, 'fonts', file)).toString('base64')}) format('woff2');unicode-range:${range}}`;
const fontFaces =
  font('geist-latin-ext.woff2', 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF') +
  font('geist-latin.woff2', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD');

const icon = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const dots = slides.map((s, i) => `<button class="dot${i > 0 && s.ch !== slides[i - 1].ch ? ' gap' : ''}" data-go="${i}" aria-label="Slide ${i + 1}: ${s.title}"></button>`).join('');

// Liquid glass filters. Displacement maps are generated at runtime (see deck.js).
// Three passes at slightly different strengths give the rim a faint chromatic split.
const chroma = id => `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB" primitiveUnits="userSpaceOnUse">
<feImage id="${id}-map" x="0" y="0" width="10" height="10" preserveAspectRatio="none" result="map"/>
${['1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', '0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', '0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0'].map((m, i) =>
  `<feDisplacementMap in="SourceGraphic" in2="map" scale="0" data-k="${[1, .955, .91][i]}" xChannelSelector="R" yChannelSelector="G" result="d${i}"/><feColorMatrix in="d${i}" type="matrix" values="${m}" result="c${i}"/>`).join('')}
<feBlend in="c0" in2="c1" mode="screen" result="c01"/><feBlend in="c01" in2="c2" mode="screen"/>
</filter>`;
const filters = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
${chroma('lens-refract')}${chroma('lens-bd')}${chroma("sweep-refract")}
<filter id="dock-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB" primitiveUnits="userSpaceOnUse">
<feImage id="dock-refract-map" x="0" y="0" width="10" height="10" preserveAspectRatio="none" result="map"/>
<feDisplacementMap in="SourceGraphic" in2="map" scale="0" data-k="1" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="sheet-refract" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB" primitiveUnits="userSpaceOnUse">
<feImage id="sheet-refract-map" x="0" y="0" width="10" height="10" preserveAspectRatio="none" result="map"/>
<feDisplacementMap in="SourceGraphic" in2="map" scale="0" data-k="1" xChannelSelector="R" yChannelSelector="G"/>
</filter></svg>`;

const dock = `<nav class="dock" aria-label="Navigasi presentasi">
<button class="dbtn" data-action="overview" aria-label="Semua slide (G)">${icon('<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>')}</button>
<span class="sep" aria-hidden="true"></span>
<button class="dbtn" data-action="prev" aria-label="Slide sebelumnya">${icon('<path d="M15 5l-7 7 7 7"/>')}</button>
<div class="track"><span class="pill" aria-hidden="true"></span>${dots}</div>
<button class="dbtn" data-action="next" aria-label="Slide berikutnya">${icon('<path d="M9 5l7 7-7 7"/>')}</button>
<span class="sep" aria-hidden="true"></span>
<span class="count"><b id="cur">01</b><span> / ${slides.length}</span></span>
<span class="sep" aria-hidden="true"></span>
<button class="dbtn" data-action="motion" aria-pressed="true" aria-label="Matikan animasi (M)">${icon('<path d="M3 12c2.5-5 5.5-5 8 0s5.5 5 8 0" class="mo-wave"/><path d="M4 20L20 4" class="mo-off"/>')}</button>
<button class="dbtn" data-action="theme" aria-label="Mode gelap">${icon('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>')}</button>
<button class="dbtn" data-action="fullscreen" aria-label="Layar penuh">${icon('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>')}</button>
</nav>`;

const wall = `<div id="wall" aria-hidden="true"><div class="pan pan-far"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="blob b4"></div></div><div class="pan pan-near"><svg class="net" viewBox="0 0 2000 1200" preserveAspectRatio="xMidYMid slice"></svg></div><div class="spot"></div><div class="grain"></div></div>`;

const html = `<!doctype html>
<html lang="id" data-ch="cover"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Algoritma Routing</title>
<style>${fontFaces}${read('src/deck.css')}</style></head>
<body>${filters}${wall}
<div id="viewport"><div id="stage"><main id="slides">${slides.map((slide, i) => `<section class="slide" data-id="${slide.id}" aria-label="Slide ${i + 1}: ${slide.title}" hidden>${slide.html}</section>`).join('\n')}</main>${dock}<div class="tip" aria-hidden="true"></div>
<div class="overview" role="dialog" aria-label="Semua slide"><div class="ov-bg"></div><p class="ov-title">Semua slide</p><div class="ov-grid"></div></div></div></div>
<p id="live" class="sr" aria-live="polite"></p>
<script>const META=${JSON.stringify(meta)};\n${read('src/deck.js')}</script></body></html>`;

writeFileSync(join(here, 'index.html'), html);
console.log(`Built ${slides.length} slides (${Math.round(html.length / 1024)} KB).`);
