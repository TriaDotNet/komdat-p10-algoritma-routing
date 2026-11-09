// Deck runtime: fit, spring choreography, liquid-glass optics, pointer light, navigation, overview.
const root = document.documentElement;
const stage = document.getElementById('stage');
const slides = [...document.querySelectorAll('#slides > .slide')];
const dock = document.querySelector('.dock');
const track = dock.querySelector('.track');
const pill = dock.querySelector('.pill');
const tip = document.querySelector('.tip');
const live = document.getElementById('live');
const wall = document.getElementById('wall');
// Motion preference. Many Windows laptops report prefers-reduced-motion when "Animation effects"
// is off, which used to freeze the whole deck there while phones animated. Motion now defaults to
// on and the presenter decides with the dock button (or the M key); the choice is remembered.
let motionPref = 'on';
try { motionPref = localStorage.getItem('komdat-motion') || 'on'; } catch {}
const reduce = { get matches() { return motionPref === 'off'; } };
document.documentElement.dataset.motion = motionPref;
let index = -1, scale = 1, busyOverview = false;

// ---------- springs -----------------------------------------------------------
// A damped spring sampled into a CSS linear() easing so WAAPI can play real spring motion.
function springEasing(stiffness, damping, mass = 1) {
  let x = 0, v = 0, t = 0; const dt = 1 / 240, pts = [0];
  while (t < 3) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt; x += v * dt; t += dt; pts.push(x);
    if (t > .25 && Math.abs(x - 1) < .0006 && Math.abs(v) < .02) break;
  }
  const n = 64, out = [];
  for (let i = 0; i <= n; i++) out.push(+pts[Math.round(i / n * (pts.length - 1))].toFixed(4));
  out[0] = 0; out[n] = 1;
  return { easing: `linear(${out.join(',')})`, duration: Math.round(t * 1000) };
}
const linearOK = CSS.supports('animation-timing-function', 'linear(0, 0.5, 1)');
const fallback = d => ({ easing: 'cubic-bezier(.16,1,.3,1)', duration: d });
const SOFT = linearOK ? springEasing(130, 2 * Math.sqrt(130)) : fallback(1000);   // calm, no visible overshoot
const SNAP = linearOK ? springEasing(220, 22) : fallback(800);    // quick settle
const BOUNCY = linearOK ? springEasing(260, 17) : fallback(900);  // playful pop
const OUT = 'cubic-bezier(.16,1,.3,1)', IN = 'cubic-bezier(.5,0,.75,0)';

// ---------- fit ---------------------------------------------------------------------
function fit() {
  scale = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transform = `translate(${(innerWidth - 1920 * scale) / 2}px,${(innerHeight - 1080 * scale) / 2}px) scale(${scale})`;
}
const stageRect = () => stage.getBoundingClientRect();
const toStage = e => { const r = stageRect(); return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }; };

// ---------- liquid glass: displacement maps -----------------------------------------
// Convex squircle bezel; rays refract through n=1.5 glass and sample inward.
// `bend` is the peak rim shift in px; `mag` > 1 also magnifies the flat centre.
function displacementMap(w, h, radius, bezel, bend, mag = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  const prof = x => Math.pow(1 - Math.pow(1 - x, 4), .25);
  const rim = x => {
    const e = .001, s = (prof(Math.min(1, x + e)) - prof(Math.max(0, x - e))) / (2 * e);
    const t1 = Math.atan(s), t2 = Math.asin(Math.sin(t1) / 1.5);
    return prof(x) * Math.tan(t1 - t2);
  };
  let peak = 0; const table = [];
  for (let i = 0; i <= 256; i++) { const m = rim(i / 256); table.push(m); peak = Math.max(peak, m); }
  const cx = w / 2, cy = h / 2, hx = w / 2 - radius, hy = h / 2 - radius, shrink = 1 - 1 / mag;
  const vx = new Float32Array(w * h), vy = new Float32Array(w * h);
  let big = 1e-6;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = x + .5 - cx, py = y + .5 - cy, qx = Math.abs(px) - hx, qy = Math.abs(py) - hy;
    let dist, nx, ny;
    if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy); dist = l - radius; nx = qx / l * Math.sign(px); ny = qy / l * Math.sign(py); }
    else if (qx > qy) { dist = qx - radius; nx = Math.sign(px); ny = 0; }
    else { dist = qy - radius; nx = 0; ny = Math.sign(py); }
    const inside = -dist, i = y * w + x;
    if (inside <= 0) continue;
    const m = inside < bezel ? table[Math.round(inside / bezel * 256)] / peak * bend : 0;
    vx[i] = -nx * m - px * shrink; vy[i] = -ny * m - py * shrink;
    big = Math.max(big, Math.abs(vx[i]), Math.abs(vy[i]));
  }
  for (let i = 0; i < w * h; i++) { const k = i * 4; d[k] = 128 + vx[i] / big * 127; d[k + 1] = 128 + vy[i] / big * 127; d[k + 2] = 128; d[k + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return { url: c.toDataURL(), scale: big * 2 };
}
function setMap(id, map, w, h) {
  const el = document.getElementById(id + '-map');
  el.setAttribute('href', map.url); el.setAttribute('width', w); el.setAttribute('height', h);
  document.querySelectorAll(`#${id} feDisplacementMap`).forEach(n => n.setAttribute('scale', (map.scale * n.dataset.k).toFixed(2)));
}
const chromium = !!navigator.userAgentData?.brands?.some(b => /Chromium/i.test(b.brand));
function buildDockGlass() {
  if (!chromium) return;
  const w = dock.offsetWidth, h = dock.offsetHeight;
  if (!w) return;
  setMap('dock-refract', displacementMap(w, h, h / 2, 24, 16), w, h);
  dock.classList.add('refract');
}

// ---------- cover lens ------------------------------------------------------------------
const cover = slides[0].querySelector('.cover');
const lens = cover?.querySelector('.lens');
const LENS = 340;
const lensState = { x: 1230, y: 340, vx: 0, vy: 0, tx: 1230, ty: 340, drag: null, idleAt: 0, raf: 0, last: 0, t0: performance.now() };
function setupLens() {
  if (!lens) return;
  if (chromium) {
    setMap('lens-bd', displacementMap(LENS, LENS, LENS / 2, 84, 44, 1.16), LENS, LENS);
    lens.classList.add('bd');
  } else {
    const clone = cover.querySelector('.cover-scene').cloneNode(true);
    clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    lens.querySelector('.lens-clone').append(...clone.childNodes);
    setMap('lens-refract', displacementMap(LENS, LENS, LENS / 2, 78, 44), LENS, LENS);
  }
  lens.addEventListener('pointerdown', e => {
    const p = toStage(e);
    lensState.drag = { dx: p.x - lensState.x, dy: p.y - lensState.y };
    lens.setPointerCapture(e.pointerId); lens.classList.add('dragging');
  });
  lens.addEventListener('pointermove', e => {
    if (!lensState.drag) return;
    const p = toStage(e);
    lensState.tx = Math.max(-60, Math.min(1920 - LENS + 60, p.x - lensState.drag.dx));
    lensState.ty = Math.max(-60, Math.min(1080 - LENS + 60, p.y - lensState.drag.dy));
  });
  const end = () => { lensState.drag = null; lensState.idleAt = performance.now() + 3500; lens.classList.remove('dragging'); };
  lens.addEventListener('pointerup', end); lens.addEventListener('pointercancel', end);
}
function lensFrame(now) {
  const s = lensState;
  if (!s.drag && now > s.idleAt) {
    const t = (now - s.t0) / 1000;
    s.tx = 1230 + Math.sin(t * .23) * 300;
    s.ty = 340 + Math.sin(t * .37 + 1) * 190;
  }
  let left = Math.min(.1, (now - (s.last || now)) / 1000); s.last = now;
  const k = s.drag ? 520 : 60, c = s.drag ? 42 : 16;
  while (left > 0) {
    const dt = Math.min(left, 1 / 240); left -= dt;
    s.vx += (k * (s.tx - s.x) - c * s.vx) * dt; s.vy += (k * (s.ty - s.y) - c * s.vy) * dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
  }
  const sp = Math.min(Math.hypot(s.vx, s.vy) / 6000, .09), a = Math.atan2(s.vy, s.vx) * 180 / Math.PI;
  lens.style.transform = `translate3d(${s.x}px,${s.y}px,0) rotate(${a}deg) scale(${1 + sp},${1 - sp * .7}) rotate(${-a}deg)`;
  const cl = lens.querySelector('.lens-clone'); if (cl.firstChild) cl.style.transform = `translate3d(${-s.x}px,${-s.y}px,0)`;
  s.raf = requestAnimationFrame(lensFrame);
}
function lensRun(on) {
  if (!lens) return;
  cancelAnimationFrame(lensState.raf); lensState.last = 0;
  if (on) lensState.raf = requestAnimationFrame(lensFrame);
}

// ---------- svg timelines (cover packet) --------------------------------------------------
function svgs(slide, on) {
  slide.querySelectorAll('svg').forEach(s => {
    if (!s.pauseAnimations) return;
    if (on && !reduce.matches) s.unpauseAnimations(); else s.pauseAnimations();
  });
}

// ---------- choreography ----------------------------------------------------------------------
const kindOf = el =>
  el.classList.contains('r-line') ? 'line' :
  el.matches('.title .w > span') ? 'word' :
  el.classList.contains('chip') ? 'chip' :
  el.classList.contains('app-icon') ? 'icon' :
  el.matches('.pane,.result-bar') ? 'glass' :
  el.matches('.visual,.orb') ? 'visual' :
  el.classList.contains('grow') ? 'grow' : 'text';
const actors = slide => [...slide.querySelectorAll('.r,.r-line,.grow,.title .w > span')].filter(el => !el.closest('.lens-clone,.map-ic,.class-card .app-icon'));
const cancelAll = el => el.getAnimations().forEach(a => a.cancel());

function countUp(el, delay) {
  const to = +el.dataset.count; el.textContent = '0';
  setTimeout(() => {
    const t0 = performance.now(), D = 1100;
    const step = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(2, -10 * k); el.textContent = String(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, delay);
}

function enter(slide, dir, sameChapter, B = 0) {
  const list = actors(slide);
  list.forEach(cancelAll);
  slide.querySelectorAll('.pane.lit').forEach(p => p.classList.remove('lit'));
  slide.querySelector('.pipe-track')?.classList.remove('drawn');
  if (reduce.matches) {
    slide.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    slide.querySelector('.pipe-track')?.classList.add('drawn');
    return;
  }
  let t = 60 + B, words = 0, lines = 0, glass = 0;
  for (const el of list) {
    const k = kindOf(el);
    if (k === 'chip') {
      if (sameChapter) continue;
      el.animate([{ scale: .8, opacity: 0 }, { scale: 1, opacity: 1 }], { ...SOFT, delay: t, fill: 'backwards' });
      t += 40;
    } else if (k === 'icon') {
      el.animate([{ scale: .4, rotate: '-18deg', opacity: 0 }, { scale: 1, rotate: '0deg', opacity: 1 }], { ...BOUNCY, delay: 20 + B, fill: 'backwards' });
    } else if (k === 'word') {
      const d = 90 + B + words++ * 38;
      el.animate([{ translate: '0 105%', rotate: '4deg' }, { translate: '0 0', rotate: '0deg' }], { ...SOFT, delay: d, fill: 'backwards' });
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, easing: OUT, delay: d, fill: 'backwards' });
      t = Math.max(t, d + 60);
    } else if (k === 'line') {
      el.animate([{ translate: '0 108%', rotate: '3deg' }, { translate: '0 0', rotate: '0deg' }], { ...BOUNCY, duration: BOUNCY.duration * 1.15, delay: 220 + B + lines++ * 120, fill: 'backwards' });
    } else if (k === 'glass') {
      const d = t + 30 + glass++ * 55;
      el.animate([{ translate: `${dir * 110}px 60px`, scale: .9 }, { translate: '0 0', scale: 1 }], { ...SOFT, delay: d, fill: 'backwards' });
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 650, easing: OUT, delay: d, fill: 'backwards' });
      if (el.classList.contains('pane')) setTimeout(() => { if (!slide.hidden) { el.classList.add('lit'); setTimeout(() => el.classList.remove('lit'), 1500); } }, d + 380);
      el.querySelectorAll('[data-count]').forEach(n => countUp(n, d + 300));
    } else if (k === 'visual') {
      const d = t + 60; t += 60;
      el.animate([{ scale: .94, opacity: 0 }, { scale: 1, opacity: 1 }], { ...SOFT, delay: d, fill: 'backwards' });
    } else if (k === 'grow') {
      el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1400, easing: OUT, delay: t + 200, fill: 'backwards' });
    } else {
      const d = t + 20; t += 50;
      el.animate([{ translate: '0 26px', opacity: 0 }, { translate: '0 0', opacity: 1 }], { ...SOFT, delay: d, fill: 'backwards' });
      if (el.classList.contains('pipe-track')) setTimeout(() => el.classList.add('drawn'), d);
    }
  }
  slide.querySelectorAll('svg.dia, svg.ex-art').forEach(svg => drawIn(svg, 420 + B));
  if (slide === slides[0] && lens) {
    cancelAll(lens);
    lens.animate([{ opacity: 0, scale: .3 }, { opacity: 1, scale: 1 }], { ...BOUNCY, delay: 700 + B, fill: 'backwards' });
  }
}
// ---------- liquid-glass iris transition ---------------------------------------------------
// The next slide opens inside a growing glass circle that starts at its dot in the dock.
// The circle's rim is a refracting glass ring; the old slide recedes into depth behind it.
const IRIS = 'cubic-bezier(.76,0,.18,1)', IRIS_MS = 1150;
const iris = document.createElement('div');
iris.className = 'iris'; iris.setAttribute('aria-hidden', 'true');
stage.insertBefore(iris, dock);
let flight = null;
function landFlight() { if (!flight) return; const f = flight; flight = null; f.done(); }
function irisOrigin(i, dir) {
  if (!stage.classList.contains('dock-hidden')) {
    const d = dots[i].getBoundingClientRect(), r = stageRect();
    if (d.width) return [(d.left + d.width / 2 - r.left) / scale, (d.top + d.height / 2 - r.top) / scale];
  }
  return [dir > 0 ? 1740 : 180, 540];
}
// Every slide has its own entrance; going back replays the same move mirrored.
// Rules for smoothness: animate only transform / opacity (plus a clip where the effect needs it),
// drive motion with critically damped springs (fast start, soft landing, no wobble),
// and let the new slide rasterise for two frames before anything moves.
const slidesEl = document.getElementById('slides');
const sweep = document.createElement('div'); sweep.className = 'sweep'; sweep.setAttribute('aria-hidden', 'true'); stage.insertBefore(sweep, dock);
const rim = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
rim.setAttribute('class', 'wave-rim'); rim.setAttribute('viewBox', '0 0 1920 1080'); rim.setAttribute('aria-hidden', 'true');
rim.innerHTML = '<path class="wave-glow"/><path class="wave-line"/>'; stage.insertBefore(rim, dock);
const TRANS = ['zoom', 'iris', 'cube', 'sweep', 'zoom', 'liquid', 'iris', 'door', 'cube', 'sweep', 'zoom', 'liquid', 'cube', 'door', 'sweep', 'cube', 'liquid', 'zoom', 'door', 'iris'];
// critically damped springs (damping = 2·√stiffness): no overshoot, quick response
const crit = k => linearOK ? springEasing(k, 2 * Math.sqrt(k)) : { easing: 'cubic-bezier(.22,1,.36,1)', duration: 900 };
const GLIDE = crit(110);   // big surfaces: portal, cube, sweep
const SETTLE = crit(150);  // secondary motion
const FADE_OUT = 'cubic-bezier(.33,0,.67,1)';
let sweepMap = false;
// Liquid Glass sheet: a lens element plus a separate lit rim (so the rim can flare on its own)
const glassSheet = document.createElement('div'); glassSheet.className = 'lg-sheet'; glassSheet.setAttribute('aria-hidden', 'true');
const glassRim = document.createElement('div'); glassRim.className = 'lg-rim'; glassSheet.append(glassRim);
stage.insertBefore(glassSheet, dock);
const MORPH = crit(240);
// the full-screen refraction map is large, so build it when the browser is idle
(window.requestIdleCallback || (f => setTimeout(f, 1200)))(() => {
  if (!chromium) return;
  setMap('sheet-refract', displacementMap(1980, 1140, 64, 260, 70, 1.025), 1980, 1140);
  glassSheet.classList.add('refract');
}, { timeout: 4000 });
function buildSweepGlass() {
  if (!chromium || sweepMap) return;
  setMap('sweep-refract', displacementMap(320, 1240, 160, 120, 46, 1.06), 320, 1240);
  sweep.classList.add('refract'); sweepMap = true;
}
// a rising wave front, as a closed clip path or as the open rim line
function wavePath(level, amp, phase, closed, up) {
  const n = 8, w = 1920 / n;
  const yAt = i => level + Math.sin(phase + i * 1.15) * amp;
  let d = 'M-20 ' + yAt(0).toFixed(1);
  for (let i = 0; i < n; i++) {
    const x0 = i * w - (i ? 0 : 20), x1 = (i + 1) * w + (i === n - 1 ? 20 : 0), y0 = yAt(i), y1 = yAt(i + 1);
    d += ' C' + (x0 + w * .5).toFixed(1) + ' ' + y0.toFixed(1) + ' ' + (x1 - w * .5).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
  }
  if (closed) d += up ? ' L1940 1200 L-20 1200 Z' : ' L1940 -120 L-20 -120 Z';
  return d;
}
// sample a spring curve so keyframed effects (liquid) follow the same physics
function springAt(k) {
  let x = 0, v = 0; const K = 110, C = 2 * Math.sqrt(K), dt = 1 / 240, T = k * GLIDE.duration / 1000;
  for (let t = 0; t < T; t += dt) { v += (-K * (x - 1) - C * v) * dt; x += v * dt; }
  return x;
}
function transition(old, s, dir, nextIndex) {
  // Apple-style Liquid Glass for every slide (the other kinds below are kept but unused)
  const kind = reduce.matches ? 'fade' : 'glass';
  const anims = [], extra = [];
  let B = 0;
  old.style.zIndex = 1; s.style.zIndex = 3;
  old.style.willChange = s.style.willChange = 'transform, opacity';
  svgs(old, false);                                     // freeze the outgoing slide's own motion
  const add = (el, kf, opt) => { const a = el.animate(kf, { fill: 'both', ...opt }); anims.push(a); return a; };
  const recede = (sc, op = .35) => add(old, [{ scale: 1, opacity: 1 }, { scale: sc, opacity: op }], { ...GLIDE });
  if (kind === 'fade') {
    add(s, [{ opacity: 0 }, { opacity: 1 }], { duration: 280 });
  } else if (kind === 'glass') {
    // Liquid Glass, after Apple's WWDC25 description: glass doesn't fade, it materializes by
    // modulating how strongly it bends light. A droplet morphs out of the target dot in the dock
    // into a full-screen lens; the slide swaps underneath; then the lensing relaxes into focus.
    const SW = 1980, SH = 1140, X0 = -30, Y0 = -30, SWAP = 300;
    const d = dots[nextIndex].getBoundingClientRect(), r = stageRect();
    const hidden = stage.classList.contains('dock-hidden') || !d.width;
    const cx = hidden ? (dir > 0 ? 1700 : 220) : (d.left + d.width / 2 - r.left) / scale;
    const cy = hidden ? 540 : (d.top + d.height / 2 - r.top) / scale;
    const pw = 46, ph = 40, sx = pw / SW, sy = ph / SH;
    const start = 'translate(' + (cx - pw / 2 - X0) + 'px,' + (cy - ph / 2 - Y0) + 'px) scale(' + sx + ',' + sy + ')';
    glassSheet.style.display = 'block';
    // flex: the dock's pill gives a small elastic squeeze as it is pressed
    add(pill, [{ scale: 1 }, { scale: '1.28 .86' , offset: .3 }, { scale: 1 }], { ...BOUNCY });
    // morph: droplet to sheet, its corner radius easing from pill-round to soft
    add(glassSheet, [
      { transform: start, borderRadius: (ph / 2 / sx) + 'px / ' + (ph / 2 / sy) + 'px' },
      { transform: 'translate(0px,0px) scale(1,1)', borderRadius: '64px' }], { ...MORPH });
    // energize: the rim lights up while the glass is forming, then settles
    add(glassRim, [{ opacity: 0 }, { opacity: 1, offset: .25 }, { opacity: .55, offset: .5 }, { opacity: 0 }], { duration: 1100, easing: 'linear' });
    // dematerialize: fading the lens element fades its refraction and blur together
    add(glassSheet, [{ opacity: 1 }, { opacity: 1, offset: .32 }, { opacity: 0 }], { duration: 1100, easing: 'cubic-bezier(.3,0,.2,1)' });
    // the swap happens behind the densest glass
    add(old, [{ opacity: 1 }, { opacity: 1, offset: .999 }, { opacity: 0 }], { duration: SWAP });
    add(old, [{ scale: 1 }, { scale: .985 }], { duration: SWAP, easing: OUT });
    add(s, [{ opacity: 0 }, { opacity: 0, offset: .999 }, { opacity: 1 }], { duration: SWAP });
    add(s, [{ scale: 1.03 }, { scale: 1 }], { ...SETTLE, delay: SWAP });
    extra.push(() => { glassSheet.style.display = 'none'; pill.style.scale = ''; });
    B = SWAP - 40;
  } else if (kind === 'slide') {
    // the old slide drifts aside and fades; the new one glides in from the other side
    add(old, [{ translate: '0 0', opacity: 1 }, { translate: (-dir * 90) + 'px 0', opacity: 0 }], { duration: 420, easing: FADE_OUT });
    add(s, [{ translate: (dir * 120) + 'px 0', opacity: 0 }, { translate: '0 0', opacity: 1 }], { ...SETTLE, delay: 60 });
  } else if (kind === 'iris') {
    // a glass portal grows out of the target dot in the dock
    const [x, y] = irisOrigin(nextIndex, dir);
    const R = Math.max(...[[0, 0], [1920, 0], [0, 1080], [1920, 1080]].map(([cx, cy]) => Math.hypot(cx - x, cy - y))) + 60;
    const origin = x + 'px ' + y + 'px';
    old.style.transformOrigin = origin; s.style.transformOrigin = origin;
    add(s, [{ clipPath: 'circle(0px at ' + origin + ')' }, { clipPath: 'circle(' + R + 'px at ' + origin + ')' }], { ...GLIDE });
    add(s, [{ scale: 1.08 }, { scale: 1 }], { ...SETTLE, duration: SETTLE.duration + 150 });
    recede(.9, .25);
    iris.style.cssText = 'display:block;left:' + (x - R) + 'px;top:' + (y - R) + 'px;width:' + 2 * R + 'px;height:' + 2 * R + 'px';
    add(iris, [{ transform: 'scale(0.001)' }, { transform: 'scale(1)' }], { ...GLIDE });
    add(iris, [{ opacity: 1 }, { opacity: 1, offset: .55 }, { opacity: 0 }], { duration: GLIDE.duration, easing: 'linear' });
    extra.push(() => { iris.style.display = 'none'; });
  } else if (kind === 'cube') {
    // two faces of a cube sharing an edge; a soft shade sweeps across the face turning away
    slidesEl.style.perspective = '2400px';
    old.style.transformOrigin = dir > 0 ? '100% 50%' : '0% 50%';
    s.style.transformOrigin = dir > 0 ? '0% 50%' : '100% 50%';
    add(old, [
      { transform: 'translateX(0%) translateZ(0px) rotateY(0deg)' },
      { transform: 'translateX(' + (-dir * 50) + '%) translateZ(-220px) rotateY(' + (-dir * 45) + 'deg)', offset: .5 },
      { transform: 'translateX(' + (-dir * 100) + '%) translateZ(0px) rotateY(' + (-dir * 90) + 'deg)' }], { ...GLIDE });
    add(s, [
      { transform: 'translateX(' + (dir * 100) + '%) translateZ(0px) rotateY(' + (dir * 90) + 'deg)' },
      { transform: 'translateX(' + (dir * 50) + '%) translateZ(-220px) rotateY(' + (dir * 45) + 'deg)', offset: .5 },
      { transform: 'translateX(0%) translateZ(0px) rotateY(0deg)' }], { ...GLIDE });
    old.classList.add('shade-out'); s.classList.add('shade-in');
    add(old, [{ opacity: 0 }, { opacity: .5 }], { ...GLIDE, pseudoElement: '::after' });
    add(s, [{ opacity: .5 }, { opacity: 0 }], { ...GLIDE, pseudoElement: '::after' });
    extra.push(() => { slidesEl.style.perspective = ''; old.classList.remove('shade-out'); s.classList.remove('shade-in'); });
    B = -1;                                               // the face turns in fully built
  } else if (kind === 'door') {
    // the old slide swings open on a hinge, away from us; the new one rises from just behind it
    slidesEl.style.perspective = '2200px';
    old.style.zIndex = 3; s.style.zIndex = 1;
    old.style.transformOrigin = dir > 0 ? '0% 50%' : '100% 50%';
    add(old, [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(' + (dir * 88) + 'deg)' }], { ...GLIDE });
    add(old, [{ opacity: 1 }, { opacity: 1, offset: .5 }, { opacity: 0 }], { duration: GLIDE.duration * .8, easing: FADE_OUT });
    add(s, [{ scale: .92, opacity: .4 }, { scale: 1, opacity: 1 }], { ...SETTLE, duration: SETTLE.duration + 200 });
    extra.push(() => { slidesEl.style.perspective = ''; });
    B = 120;
  } else if (kind === 'zoom') {
    // fly through: the old slide drifts past the camera, the new one arrives from depth
    const out = dir > 0 ? 1.18 : .9, inn = dir > 0 ? .9 : 1.12;
    add(old, [{ scale: 1, opacity: 1 }, { scale: out, opacity: 0 }], { duration: 520, easing: FADE_OUT });
    add(s, [{ scale: inn, opacity: 0 }, { scale: 1, opacity: 1 }], { ...SETTLE, duration: SETTLE.duration + 200, delay: 60 });
    B = 80;
  } else if (kind === 'liquid') {
    // the new slide fills in like rising liquid, with a lit, wobbling surface
    const up = dir > 0, steps = 30, D = GLIDE.duration, frames = [], rimFrames = [];
    for (let i = 0; i <= steps; i++) {
      const k = i / steps, e = springAt(k);
      const level = up ? 1170 - e * 1300 : -90 + e * 1300, amp = 56 * Math.sin(Math.PI * Math.min(1, e * 1.05)), ph = k * 6;
      frames.push({ clipPath: 'path("' + wavePath(level, amp, ph, true, up) + '")', offset: k });
      rimFrames.push({ d: 'path("' + wavePath(level, amp, ph, false, up) + '")', offset: k });
    }
    add(s, frames, { duration: D, easing: 'linear' });
    add(s, [{ translate: '0 ' + (up ? 40 : -40) + 'px' }, { translate: '0 0' }], { ...SETTLE, duration: SETTLE.duration + 150 });
    recede(.97, .3);
    rim.style.display = 'block';
    rim.querySelectorAll('path').forEach(p => add(p, rimFrames, { duration: D, easing: 'linear' }));
    add(rim, [{ opacity: 1 }, { opacity: 1, offset: .6 }, { opacity: 0 }], { duration: D, easing: 'linear' });
    extra.push(() => { rim.style.display = 'none'; });
  } else if (kind === 'sweep') {
    // a tall refracting glass pane glides across; the new slide is revealed behind it
    buildSweepGlass();
    const x0 = dir > 0 ? 1980 : -340, x1 = dir > 0 ? -340 : 1980;
    const cut = x => dir > 0
      ? 'polygon(' + x + 'px -20px, 1960px -20px, 1960px 1100px, ' + x + 'px 1100px)'
      : 'polygon(-20px -20px, ' + x + 'px -20px, ' + x + 'px 1100px, -20px 1100px)';
    sweep.style.display = 'block';
    add(s, [{ clipPath: cut(x0 + 160) }, { clipPath: cut(x1 + 160) }], { ...GLIDE });
    add(sweep, [{ transform: 'translateX(' + x0 + 'px)' }, { transform: 'translateX(' + x1 + 'px)' }], { ...GLIDE });
    add(s, [{ translate: (dir * 70) + 'px 0' }, { translate: '0 0' }], { ...SETTLE, duration: SETTLE.duration + 150 });
    old.style.transformOrigin = dir > 0 ? '0% 50%' : '100% 50%';
    recede(.96, .4);
    extra.push(() => { sweep.style.display = 'none'; });
  }
  // hold every animation on its first frame for two frames so the new slide is painted first
  anims.forEach(a => a.pause());
  requestAnimationFrame(() => requestAnimationFrame(() => anims.forEach(a => { if (a.playState === 'paused') a.play(); })));
  const done = () => {
    anims.forEach(a => a.cancel()); extra.forEach(f => f());
    old.style.zIndex = ''; old.style.transformOrigin = ''; old.style.willChange = '';
    s.style.transformOrigin = ''; s.style.willChange = ''; s.style.zIndex = 2;
    if (slides[index] !== old) { old.hidden = true; actors(old).forEach(cancelAll); resetTilt(old); if (old === slides[0]) lensRun(false); }
  };
  const me = { done };
  flight = me;
  Promise.all(anims.map(a => a.finished)).then(() => { if (flight === me) { flight = null; done(); } }).catch(() => {});
  return B;
}

function leave(slide, dir, sameChapter) {
  const finish = () => { if (slides[index] === slide) return; slide.hidden = true; svgs(slide, false); actors(slide).forEach(cancelAll); if (slide === slides[0]) lensRun(false); resetTilt(slide); };
  if (reduce.matches) { finish(); return; }
  const list = actors(slide).filter(el => !(sameChapter && kindOf(el) === 'chip'));
  const anims = [];
  list.forEach((el, i) => {
    cancelAll(el);
    const k = kindOf(el), d = Math.min(i * 9, 110);
    if (k === 'glass') anims.push(el.animate([{ opacity: 1, translate: '0 0', scale: 1 }, { opacity: 0, translate: `${-dir * 90}px -20px`, scale: .94 }], { duration: 380, easing: IN, delay: d, fill: 'forwards' }));
    else anims.push(el.animate([{ opacity: 1, translate: '0 0', filter: 'blur(0px)' }, { opacity: 0, translate: `${-dir * 70}px 0`, filter: 'blur(10px)' }], { duration: 340, easing: IN, delay: d, fill: 'forwards' }));
  });
  slide.style.zIndex = 0;
  Promise.all(anims.map(a => a.finished)).then(finish).catch(() => {});
}

// ---------- diagram entrance: edges draw themselves, nodes pop ------------------------------
function drawIn(svg, delay) {
  if (reduce.matches) return;
  svg.querySelectorAll('line.e:not([data-k]), path.e:not([data-k])').forEach((el, i) => {
    const len = el.getTotalLength?.() || 0; if (!len) return;
    cancelAll(el);
    el.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }],
      { duration: 900, easing: OUT, delay: delay + i * 55, fill: 'backwards' });
  });
  svg.querySelectorAll('.gn, .tag, .lock, .die, .wpill').forEach((el, i) => {
    if (el.closest('[data-k][opacity="0"]')) return;
    cancelAll(el);
    el.animate([{ scale: .2, opacity: 0 }, { scale: 1, opacity: 1 }], { ...BOUNCY, delay: delay + 160 + i * 45, fill: 'backwards' });
  });
}

// ---------- scenes: looping illustrations driven by one clock ----------------------------------
// Each scene renders a pure function of time, so both cards of a slide stay perfectly in sync.
const ease = {
  io: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  out: x => 1 - Math.pow(1 - x, 3),
  back: x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
};
const clamp01 = x => Math.max(0, Math.min(1, x));
const ramp = (t, a, d) => clamp01((t - a) / d);               // 0→1 starting at a over d seconds
const SD = { T: 10, BREAK: 4.3, RESTORE: 8.9, travel: 1.55, gap: 1.2 };
function sdScene(svg, kind) {
  const q = k => svg.querySelector(`[data-k="${k}"]`);
  const p1 = q('p1'), p2 = q('p2'), L1 = p1.getTotalLength(), L2 = p2.getTotalLength();
  const r1a = q('r1a'), r1b = q('r1b'), r2 = q('r2'), xt = q('xt'), cut = q('cut'), cap1 = q('cap1'), cap2 = q('cap2');
  const block = q('block'), tag2 = q('tag2'), yOn = q('yOn');
  const pks = [0, 1, 2].map(i => q('pk' + i));
  const lenA = r1a.getTotalLength(), lenB = r1b.getTotalLength(), lenR2 = r2 ? r2.getTotalLength() : 0;
  const fBreak = (lenA + lenB / 2) / L1;                         // where X–T is cut, as a fraction of route 1
  const cutT = cut.getAttribute('transform');
  // packet launches for one cycle: [start, path, stopFraction]
  const launches = [];
  for (let s = .35; s < SD.T - 1.2; s += SD.gap) {
    if (s + SD.travel < SD.BREAK) launches.push([s, 1, 1]);
    else if (kind === 'statis' && s > SD.BREAK + .2 && s + SD.travel * fBreak < SD.RESTORE - .4) launches.push([s, 1, fBreak]);
    else if (kind === 'dinamis' && s > SD.BREAK + 1.1 && s + SD.travel < SD.RESTORE - .2) launches.push([s, 2, 1]);
  }
  const dash = (el, len, v) => { el.style.strokeDasharray = `${len} ${len}`; el.style.strokeDashoffset = String(len * (1 - v)); };
  return (tAbs) => {
    const t = tAbs % SD.T, first = tAbs < SD.T;
    const broken = ease.out(ramp(t, SD.BREAK, .35)) * (1 - ease.io(ramp(t, SD.RESTORE, .6)));
    // initial route draw (first cycle only), afterwards fully drawn
    const draw1 = first ? ease.io(ramp(t, .05, .7)) : 1;
    xt.setAttribute('opacity', (1 - .78 * broken).toFixed(3));
    xt.style.strokeDasharray = broken > .5 ? '7 9' : '';
    const pop = ease.back(ramp(t, SD.BREAK, .45)) * (1 - ease.io(ramp(t, SD.RESTORE, .45)));
    cut.setAttribute('opacity', clamp01(pop * 1.4).toFixed(3));
    cut.setAttribute('transform', `${cutT} scale(${Math.max(.001, pop).toFixed(3)})`);
    if (kind === 'statis') {
      dash(r1a, lenA, draw1); dash(r1b, lenB, first ? ease.io(ramp(t, .5, .5)) : 1);
      r1b.setAttribute('opacity', (1 - .7 * broken).toFixed(3));
      r1b.style.strokeDasharray = broken > .5 ? '10 10' : r1b.style.strokeDasharray;
      const stuck = ramp(t, SD.BREAK + .2 + SD.travel * fBreak * .9, .3) * (1 - ramp(t, SD.RESTORE - .1, .4));
      block.setAttribute('opacity', (stuck * (.55 + .45 * Math.sin(t * 7))).toFixed(3));
    } else {
      const off = ease.io(ramp(t, SD.BREAK + .25, .5)), back = ease.io(ramp(t, SD.RESTORE + .1, .7));
      dash(r1a, lenA, first && t < SD.BREAK ? draw1 : 1);
      const vis1 = Math.max(1 - off, back);
      r1a.setAttribute('opacity', vis1.toFixed(3)); r1b.setAttribute('opacity', vis1.toFixed(3));
      dash(r1b, lenB, first && t < SD.BREAK ? ease.io(ramp(t, .5, .5)) : 1);
      const on2 = ease.io(ramp(t, SD.BREAK + .55, .8)) * (1 - ease.io(ramp(t, SD.RESTORE, .5)));
      dash(r2, lenR2, ease.io(ramp(t, SD.BREAK + .55, .8)));
      r2.setAttribute('opacity', (1 - ease.io(ramp(t, SD.RESTORE, .5))).toFixed(3));
      if (t < SD.BREAK) r2.setAttribute('opacity', '0');
      const tp = ease.back(ramp(t, SD.BREAK + 1.15, .5)) * (1 - ease.io(ramp(t, SD.RESTORE, .4)));
      tag2.setAttribute('opacity', clamp01(tp).toFixed(3));
      tag2.setAttribute('transform', `translate(410 222) scale(${Math.max(.001, tp).toFixed(3)}) translate(-410 -222)`);
      yOn.setAttribute('opacity', on2.toFixed(3));
    }
    const c2 = ease.io(ramp(t, SD.BREAK + .3, .5)) * (1 - ease.io(ramp(t, SD.RESTORE + .2, .5)));
    cap1.setAttribute('opacity', (1 - c2).toFixed(3)); cap2.setAttribute('opacity', c2.toFixed(3));
    // packets
    let slot = 0;
    pks.forEach(pk => pk.setAttribute('opacity', '0'));
    for (const [s, which, stop] of launches) {
      const life = (t - s) / (SD.travel * stop);
      const hold = stop < 1 ? .55 : .12;                          // blocked packets linger, then vanish
      if (life < 0 || life > 1 + hold / (SD.travel * stop) || slot > 2) continue;
      const pk = pks[slot++], path = which === 1 ? p1 : p2, L = which === 1 ? L1 : L2;
      const f = ease.io(clamp01(life)) * stop;
      const fade = life > 1 ? 1 - clamp01((life - 1) * (SD.travel * stop) / hold) : clamp01(life * 8);
      pk.setAttribute('opacity', fade.toFixed(3));
      pk.querySelectorAll('circle').forEach(c => {
        const lag = +c.dataset.t * .035;
        const pt = path.getPointAtLength(Math.max(0, f - lag * (life < 1 ? 1 : 0)) * L);
        c.setAttribute('cx', pt.x.toFixed(2)); c.setAttribute('cy', pt.y.toFixed(2));
      });
      pk.classList.toggle('pk-stuck', stop < 1 && life >= 1);
    }
  };
}
// --- shared helpers for the classification scenes
const setO = (el, v) => el && el.setAttribute('opacity', clamp01(v).toFixed(3));
const lerpP = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
const window01 = (t, a, d, out = .35) => ease.out(ramp(t, a, .3)) * (1 - ramp(t, a + d, out)); // fade in at a, hold d, fade out
function pulseRing(el, t, at, r0, grow = 18) {
  if (!el) return;
  const k = ramp(t, at, .75);
  setO(el, k > 0 && k < 1 ? .75 * (1 - k) : 0);
  el.setAttribute('r', (r0 + grow * ease.out(k)).toFixed(2));
}
function placeChip(el, p, v) { setO(el, v); el.setAttribute('transform', `translate(${p[0].toFixed(2)} ${p[1].toFixed(2)})`); }
function placeComet(group, pointAt, f, v) {   // head + two trailing ghosts along any curve
  setO(group, v);
  group.querySelectorAll('circle').forEach(c => { const p = pointAt(Math.max(0, f - +c.dataset.t * .035)); c.setAttribute('cx', p[0].toFixed(2)); c.setAttribute('cy', p[1].toFixed(2)); });
}
const drawLine = (el, len, v) => { el.style.strokeDasharray = `${len} ${len}`; el.style.strokeDashoffset = String(len * (1 - clamp01(v))); };

// Distance Vector: R shares its vector with neighbours only; they answer; repeated periodically.
function dvScene(svg) {
  const q = k => svg.querySelector(`[data-k="${k}"]`), G = JSON.parse(svg.dataset.geo), T = 9;
  const { R, N, F, FN } = G, timer = q('timer');
  return tAbs => {
    const t = tAbs % T;
    timer.style.strokeDasharray = '1 1'; timer.style.strokeDashoffset = String(1 - ease.io(clamp01(t / (T - .3))));
    N.forEach((p, i) => {
      const h = q('h' + i), len = Math.hypot(p[0] - R[0], p[1] - R[1]);
      const outF = ease.io(ramp(t, .5 + i * .06, 1.1)), inF = ease.io(ramp(t, 3.7 + i * .06, 1.1));
      drawLine(h, len, t < 3.6 ? outF : 1);
      setO(h, t < 3.6 ? (outF > 0 ? 1 - ramp(t, 1.7, .5) : 0) : ramp(t, 3.7, .2) * (1 - ramp(t, 4.9, .4)));
      placeChip(q('po' + i), lerpP(R, p, outF), outF > 0 && outF < 1 ? Math.min(1, outF * 6, (1 - outF) * 6) : 0);
      placeChip(q('pi' + i), lerpP(p, R, inF), inF > 0 && inF < 1 ? Math.min(1, inF * 6, (1 - inF) * 6) : 0);
      pulseRing(q('rn' + i), t, 1.6 + i * .06, 20);
    });
    // neighbours pass it one hop further, to routers R never talks to directly
    [[0, 0], [1, 3]].forEach(([f, i], j) => {
      const a = N[i], b = F[f], k = ease.io(ramp(t, 2.2, 1));
      placeChip(q('pf' + j), lerpP(a, b, k), k > 0 && k < 1 ? Math.min(1, k * 6, (1 - k) * 6) * .8 : 0);
      pulseRing(q('rf' + j), t, 3.2, 11, 12);
    });
    pulseRing(q('rr'), t, 4.85, 38, 22);
    const u = q('upd'), uv = ease.back(ramp(t, 4.9, .5)) * (1 - ease.io(ramp(t, 7.9, .4)));
    setO(u, uv); u.setAttribute('transform', `translate(280 70) scale(${Math.max(.001, uv).toFixed(3)}) translate(-280 -70)`);
    const c2 = ease.io(ramp(t, 3.5, .45)), c3 = ease.io(ramp(t, 6.6, .45));
    setO(q('cap1'), 1 - c2); setO(q('cap2'), c2 * (1 - c3)); setO(q('cap3'), c3 * (1 - ramp(t, T - .35, .3)));
    if (t < .4) setO(q('cap1'), ease.io(ramp(t, 0, .35)));
  };
}

// Link State: link information floods outward until every router holds the full map; then a shortest path.
function lsScene(svg) {
  const q = k => svg.querySelector(`[data-k="${k}"]`), { n, E } = JSON.parse(svg.dataset.geo), T = 9.5;
  // breadth-first depth from R decides when each link lights up
  const depth = [0]; const order = [0];
  while (order.length) { const u = order.shift(); E.forEach(([a, b]) => { const v = a === u ? b : b === u ? a : -1; if (v > -1 && depth[v] === undefined) { depth[v] = depth[u] + 1; order.push(v); } }); }
  const start = E.map(([a, b]) => .35 + Math.min(depth[a], depth[b]) * .7);
  const sp = q('sp'), spLen = sp.getTotalLength(), pk = q('pk');
  return tAbs => {
    const t = tAbs % T, fadeAll = 1 - ease.io(ramp(t, T - .9, .6));
    E.forEach(([a, b], i) => {
      const m = q('m' + i), tip = q('t' + i), len = Math.hypot(n[b][0] - n[a][0], n[b][1] - n[a][1]);
      const from = depth[a] <= depth[b] ? n[a] : n[b], to = from === n[a] ? n[b] : n[a];
      const k = ease.io(ramp(t, start[i], .65));
      m.setAttribute('x1', from[0]); m.setAttribute('y1', from[1]); m.setAttribute('x2', to[0]); m.setAttribute('y2', to[1]);
      drawLine(m, len, k); setO(m, fadeAll);
      const p = lerpP(from, to, k); tip.setAttribute('cx', p[0].toFixed(2)); tip.setAttribute('cy', p[1].toFixed(2));
      setO(tip, k > 0 && k < 1 ? 1 : 0);
    });
    n.forEach((_, i) => {
      const at = i ? .35 + depth[i] * .7 - .05 : .2;
      pulseRing(q('rn' + i), t, at, i ? 18 : 30, i ? 14 : 20);
      if (i) setO(q('on' + i), ease.io(ramp(t, at, .3)) * fadeAll * .9);
    });
    const mv = ease.back(ramp(t, 2.7, .5)) * fadeAll, mp = q('map');
    setO(mp, mv); mp.setAttribute('transform', `translate(84 200) scale(${Math.max(.001, mv).toFixed(3)}) translate(-84 -200)`);
    const d = ease.io(ramp(t, 4.4, .9));
    drawLine(sp, spLen, d); setO(sp, d > 0 ? fadeAll : 0);
    const f = ease.io(ramp(t, 5.4, 1.8));
    placeComet(pk, x => { const pt = sp.getPointAtLength(x * spLen); return [pt.x, pt.y]; }, f, f > 0 ? Math.min(1, f * 8) * fadeAll * (1 - ramp(t, 7.3, .3)) : 0);
    pulseRing(q('rn5'), t, 7.2, 18, 16);
    const c2 = ease.io(ramp(t, 2.5, .45)), c3 = ease.io(ramp(t, 4.3, .45));
    setO(q('cap1'), 1 - c2); setO(q('cap2'), c2 * (1 - c3)); setO(q('cap3'), c3 * fadeAll);
  };
}

// Path Vector: each AS appends itself to the path record; a path back into AS1 is rejected (loop prevented).
function pvScene(svg) {
  const q = k => svg.querySelector(`[data-k="${k}"]`), { xs, y } = JSON.parse(svg.dataset.geo), T = 9;
  const loop = q('loop'), loopLen = loop.getTotalLength(), pk = q('pk'), cut = q('cut'), cutT = cut.getAttribute('transform');
  const seg = xs.slice(1).map((x, i) => x - xs[i]), total = xs[5] - xs[0];
  return tAbs => {
    const t = tAbs % T, fadeAll = 1 - ease.io(ramp(t, T - .7, .5));
    const f = ease.io(ramp(t, .5, 3.4)), x = xs[0] + total * f;
    for (let i = 0; i < 5; i++) {
      const h = q('h' + i), k = clamp01((x - xs[i]) / seg[i]);
      drawLine(h, seg[i], k); setO(h, fadeAll);
    }
    const asIn = [x < 166 ? 1 : 0, x >= 205 && x < 355 ? 1 : 0, x >= 394 ? 1 : 0];
    [0, 1, 2].forEach(i => { const r = q('as' + i), on = i === 0 ? (t > .4 && x < 180) : i === 1 ? asIn[1] : (x >= 394 && t < 7.6); r.classList.toggle('as-on', !!on && fadeAll > .5); });
    // the path record grows as the advertisement crosses each AS
    const stage = x >= 394 ? 2 : x >= 205 ? 1 : 0;
    [0, 1, 2].forEach(i => {
      const el = q('pt' + i), v = t < .45 ? 0 : (i === stage ? 1 : 0) * fadeAll;
      const cur = +el.getAttribute('opacity') || 0, nv = cur + (v - cur) * .22;
      setO(el, nv); el.setAttribute('transform', `translate(280 34) scale(${(.85 + .15 * nv).toFixed(3)}) translate(-280 -34)`);
    });
    placeComet(pk, ff => [xs[0] + total * ff, y], f, f > 0 && t < 4.2 ? Math.min(1, f * 8) : 0);
    // loop attempt: advertisement heads back towards AS1 and is refused
    const lp = ease.io(ramp(t, 4.6, 1.5)) * .9, refused = t > 6.1;
    setO(loop, ramp(t, 4.4, .3) * fadeAll * (refused ? .5 : 1));
    if (t > 4.4) placeComet(pk, ff => { const pt = loop.getPointAtLength(ff * loopLen); return [pt.x, pt.y]; }, lp, refused ? (1 - ramp(t, 6.1, .5)) : ramp(t, 4.6, .2));
    pk.classList.toggle('pk-stuck', refused);
    const cv = ease.back(ramp(t, 6.05, .45)) * fadeAll;
    setO(cut, cv); cut.setAttribute('transform', `${cutT} scale(${Math.max(.001, cv).toFixed(3)})`);
    const c2 = ease.io(ramp(t, 4.5, .45));
    setO(q('cap1'), 1 - c2); setO(q('cap2'), c2 * fadeAll);
  };
}
const SCENE_FN = { statis: sdScene, dinamis: sdScene, dv: dvScene, ls: lsScene, pv: pvScene };

const scenes = [];
let sceneRaf = 0;
function scenesStart(slide, delay = 0) {
  slide.querySelectorAll('svg[data-scene]').forEach(svg => {
    if (svg.closest('.thumb')) return;
    let s = scenes.find(x => x.svg === svg);
    if (!s) { s = { svg, render: SCENE_FN[svg.dataset.scene](svg, svg.dataset.scene) }; scenes.push(s); }
    s.t0 = performance.now() + delay; s.slide = slide;
    s.render(0);
    if (reduce.matches) s.render(2.2);
  });
  if (!sceneRaf && !reduce.matches) sceneRaf = requestAnimationFrame(sceneLoop);
}
function sceneLoop(now) {
  if (reduce.matches) { sceneRaf = 0; return; }   // motion switched off: leave the static frame
  let live = false;
  for (const s of scenes) {
    if (s.slide.hidden) continue;
    live = true;
    s.render(Math.max(0, (now - s.t0) / 1000));
  }
  sceneRaf = live ? requestAnimationFrame(sceneLoop) : 0;
}

// ---------- navigation --------------------------------------------------------------------
const dots = [...track.querySelectorAll('.dot')];
const chOf = i => META[i].ch;
function go(value, opts = {}) {
  const next = Math.max(0, Math.min(slides.length - 1, Number(value) || 0));
  if (next === index) return;
  const prev = index, dir = prev < 0 ? 1 : Math.sign(next - prev);
  const same = prev >= 0 && chOf(prev) === chOf(next) && Math.abs(next - prev) === 1;
  landFlight();
  let B = 0;
  index = next;
  const s = slides[next];
  s.hidden = false; s.style.zIndex = 2;
  if (prev >= 0) {
    if (opts.quiet) { const o = slides[prev]; o.hidden = true; svgs(o, false); if (prev === 0) lensRun(false); }
    else B = transition(slides[prev], s, dir, next);
  }
  svgs(s, true);
  scenesStart(s, opts.quiet ? 0 : 900);
  if (next === 0) lensRun(true);
  if (!opts.quiet && B >= 0) enter(s, dir, same, B);
  else if (!opts.quiet) { actors(s).forEach(cancelAll); s.querySelectorAll('svg.dia, svg.ex-art').forEach(svg => drawIn(svg, 500)); }
  else { actors(s).forEach(cancelAll); s.querySelector('.pipe-track')?.classList.add('drawn'); }
  root.dataset.ch = chOf(next);
  panWall(next);
  document.getElementById('cur').textContent = String(next + 1).padStart(2, '0');
  dots.forEach((d, i) => { d.classList.toggle('on', i === next); d.setAttribute('aria-current', i === next ? 'step' : 'false'); });
  dock.querySelector('[data-action="prev"]').disabled = next === 0;
  dock.querySelector('[data-action="next"]').disabled = next === slides.length - 1;
  live.textContent = `Slide ${next + 1} dari ${slides.length}: ${META[next].title}`;
  movePill(prev < 0 || opts.quiet);
  history.replaceState(null, '', `#${next + 1}`);
}

// The wallpaper drifts like a camera dolly as the talk progresses; the network layer moves more (depth).
function panWall(i) {
  const far = wall.querySelector('.pan-far'), near = wall.querySelector('.pan-near');
  const x = -i * .4, y = Math.sin(i * .9) * 1.6;
  far.style.transform = `translate3d(${x}%,${y}%,0)`;
  near.style.transform = `translate3d(${x * 1.25}%,${y * 1.5}%,0)`;
}

// The selection pill rides a spring between dots and stretches with speed.
const pillState = { x: 0, v: 0, target: 0, raf: 0 };
function movePill(jump) {
  const d = dots[index];
  pillState.target = d.offsetLeft + d.offsetWidth / 2 - 22;
  if (jump || reduce.matches) { pillState.x = pillState.target; pillState.v = 0; drawPill(); return; }
  cancelAnimationFrame(pillState.raf);
  let last = performance.now();
  const step = now => {
    let left = Math.min(.05, (now - last) / 1000); last = now;
    while (left > 0) { const dt = Math.min(left, 1 / 240); left -= dt; pillState.v += (340 * (pillState.target - pillState.x) - 26 * pillState.v) * dt; pillState.x += pillState.v * dt; }
    drawPill();
    if (Math.abs(pillState.target - pillState.x) > .3 || Math.abs(pillState.v) > 2) pillState.raf = requestAnimationFrame(step);
    else { pillState.x = pillState.target; pillState.v = 0; drawPill(); }
  };
  pillState.raf = requestAnimationFrame(step);
}
function drawPill() {
  const stretch = Math.min(Math.abs(pillState.v) / 38, 30);
  pill.style.transform = `translateX(${pillState.x - stretch / 2}px)`;
  pill.style.width = `${44 + stretch}px`;
  pill.style.height = `${40 - stretch * .22}px`;
  pill.style.top = `${8 + stretch * .11}px`;
}

// Dock dots magnify around the pointer, like the macOS Dock.
track.addEventListener('pointermove', e => {
  const x = toStage(e).x, r = stageRect();
  for (const d of dots) {
    const b = d.getBoundingClientRect(), cx = (b.left + b.width / 2 - r.left) / scale;
    const m = 1 + .95 * Math.exp(-Math.pow((x - cx) / 30, 2));
    d.style.setProperty('--m', (m * (d.classList.contains('on') ? 1.35 : 1)).toFixed(3));
  }
});
track.addEventListener('pointerleave', () => { dots.forEach(d => d.style.removeProperty('--m')); tip.classList.remove('show'); });
function showTip(dot) {
  const i = dots.indexOf(dot);
  tip.innerHTML = `<small>${String(i + 1).padStart(2, '0')}</small>${META[i].title}`;
  const r = dot.getBoundingClientRect(), s = stageRect();
  const cx = (r.left + r.width / 2 - s.left) / scale;
  tip.style.left = '0px';
  const w = tip.offsetWidth;
  tip.style.left = `${Math.max(20, Math.min(1900 - w, cx - w / 2))}px`;
  tip.classList.add('show');
}
track.addEventListener('pointerover', e => { const d = e.target.closest('.dot'); if (d) showTip(d); });
track.addEventListener('focusin', e => { const d = e.target.closest('.dot'); if (d) showTip(d); });
track.addEventListener('focusout', () => tip.classList.remove('show'));

// ---------- pointer light: wallpaper spotlight, glass highlight and tilt --------------------
const spot = wall.querySelector('.spot');
const ptr = { x: innerWidth / 2, y: innerHeight / 2, sx: innerWidth / 2, sy: innerHeight / 2 };
const tilts = new Map(); // pane -> {rx, ry, tx, ty}
let ptrRaf = 0;
function ptrLoop() {
  ptr.sx += (ptr.x - ptr.sx) * .08; ptr.sy += (ptr.y - ptr.sy) * .08;
  spot.style.transform = `translate3d(${ptr.sx}px,${ptr.sy}px,0)`;
  let busy = Math.abs(ptr.x - ptr.sx) + Math.abs(ptr.y - ptr.sy) > .5;
  for (const [el, s] of tilts) {
    s.rx += (s.tx - s.rx) * .12; s.ry += (s.ty - s.ry) * .12;
    el.style.transform = `perspective(1400px) rotateX(${s.rx.toFixed(3)}deg) rotateY(${s.ry.toFixed(3)}deg)`;
    if (Math.abs(s.tx - s.rx) + Math.abs(s.ty - s.ry) > .01) busy = true;
    else if (!s.tx && !s.ty) { el.style.transform = ''; tilts.delete(el); }
  }
  ptrRaf = busy ? requestAnimationFrame(ptrLoop) : 0;
}
const kick = () => { if (!ptrRaf) ptrRaf = requestAnimationFrame(ptrLoop); };
let hovered = null;
addEventListener('pointermove', e => {
  ptr.x = e.clientX; ptr.y = e.clientY;
  if (reduce.matches) return;
  const pane = e.target.closest?.('#slides .pane, #slides .visual, #slides .class-item');
  if (hovered && hovered !== pane) { const s = tilts.get(hovered); if (s) { s.tx = 0; s.ty = 0; } }
  hovered = pane;
  if (pane) {
    const b = pane.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
    pane.style.setProperty('--lx', `${(e.clientX - b.left) / scale}px`);
    pane.style.setProperty('--ly', `${(e.clientY - b.top) / scale}px`);
    const s = tilts.get(pane) || { rx: 0, ry: 0, tx: 0, ty: 0 };
    const amp = Math.max(1, 5 - b.width / scale / 260);
    s.tx = (.5 - py) * amp; s.ty = (px - .5) * amp * 1.2;
    tilts.set(pane, s);
  }
  kick();
}, { passive: true });
function resetTilt(slide) { slide.querySelectorAll('.pane').forEach(p => { p.style.transform = ''; p.style.removeProperty('--lx'); p.style.removeProperty('--ly'); tilts.delete(p); }); }

// ---------- overview: Keynote-style light table --------------------------------------------
const ov = document.querySelector('.overview'), ovGrid = ov.querySelector('.ov-grid'), ovBg = ov.querySelector('.ov-bg');
let thumbs = [];
function buildThumbs() {
  if (thumbs.length) return;
  slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'thumb'; b.dataset.thumb = i; b.setAttribute('aria-label', `Buka slide ${i + 1}: ${META[i].title}`);
    const inner = document.createElement('div'); inner.className = 'thumb-in'; inner.dataset.ch = META[i].ch;
    const c = s.cloneNode(true); c.hidden = false; c.removeAttribute('aria-label');
    c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    c.querySelectorAll('button').forEach(n => n.setAttribute('tabindex', '-1'));
    inner.append(c); b.append(inner);
    const n = document.createElement('span'); n.className = 'thumb-n'; n.textContent = i + 1; b.append(n);
    ovGrid.append(b); thumbs.push(b);
  });
}
function openOverview() {
  if (busyOverview || ov.classList.contains('open')) return;
  buildThumbs();
  ov.classList.add('open'); stage.classList.add('overview-on');
  const w = thumbs[0].offsetWidth;
  thumbs.forEach((t, i) => { t.querySelector('.thumb-in').style.transform = `scale(${w / 1920})`; t.classList.toggle('cur', i === index); });
  ovBg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: OUT, fill: 'forwards' });
  ov.querySelector('.ov-title').animate([{ opacity: 0, translate: '0 -20px' }, { opacity: 1, translate: '0 0' }], { ...SOFT, delay: 120, fill: 'backwards' });
  const cur = thumbs[index], cr = cur.getBoundingClientRect(), sr = stageRect();
  const x = (cr.left - sr.left) / scale, y = (cr.top - sr.top) / scale, k = 1920 / cur.offsetWidth;
  cur.animate([{ transformOrigin: '0 0', transform: `translate(${-x}px,${-y}px) scale(${k})`, borderRadius: '0px' }, { transformOrigin: '0 0', transform: 'none', borderRadius: '20px' }], { ...SOFT, duration: SOFT.duration * .9 });
  thumbs.forEach((t, i) => {
    if (t === cur) return;
    const dist = Math.abs(i - index);
    t.animate([{ opacity: 0, scale: .82, translate: '0 30px' }, { opacity: 1, scale: 1, translate: '0 0' }], { ...SOFT, delay: 80 + dist * 28, fill: 'backwards' });
  });
  setTimeout(() => cur.focus({ preventScroll: true }), 300);
}
function closeOverview(to = index) {
  if (busyOverview || !ov.classList.contains('open')) return;
  busyOverview = true;
  const t = thumbs[to], cr = t.getBoundingClientRect(), sr = stageRect();
  const x = (cr.left - sr.left) / scale, y = (cr.top - sr.top) / scale, k = 1920 / t.offsetWidth;
  go(to, { quiet: true });
  t.style.zIndex = 2;
  const grow = t.animate([{ transformOrigin: '0 0', transform: 'none', borderRadius: '20px' }, { transformOrigin: '0 0', transform: `translate(${-x}px,${-y}px) scale(${k})`, borderRadius: '0px' }], { ...SNAP, fill: 'forwards' });
  thumbs.forEach((o, i) => { if (o !== t) o.animate([{ opacity: 1 }, { opacity: 0, scale: .9 }], { duration: 300, easing: IN, delay: Math.abs(i - to) * 12, fill: 'forwards' }); });
  ov.querySelector('.ov-title').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
  grow.finished.then(() => {
    ovBg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' });
    t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).finished.then(() => {
      ov.classList.remove('open'); stage.classList.remove('overview-on');
      ov.querySelectorAll('*').forEach(cancelAll); ovBg.getAnimations().forEach(a => a.cancel());
      t.style.zIndex = ''; busyOverview = false;
      movePill(true); dock.querySelector('[data-action="next"]').focus({ preventScroll: true });
    });
  });
}
ovGrid.addEventListener('click', e => { const t = e.target.closest('.thumb'); if (t) closeOverview(+t.dataset.thumb); });

// ---------- controls ------------------------------------------------------------------------
function fullscreen() { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); }
function setMotion(m) {
  motionPref = m; root.dataset.motion = m;
  try { localStorage.setItem('komdat-motion', m); } catch {}
  const b = dock.querySelector('[data-action="motion"]');
  if (b) { b.setAttribute('aria-pressed', String(m === 'on')); b.setAttribute('aria-label', m === 'on' ? 'Matikan animasi (M)' : 'Nyalakan animasi (M)'); }
  if (index < 0) return;
  const s = slides[index];
  svgs(s, true);                              // pauses or resumes the slide's own loops
  scenesStart(s);                             // restarts (or freezes) the live diagrams
  lensRun(index === 0);
}
function setTheme(t) {
  root.dataset.theme = t;
  try { localStorage.setItem('komdat-theme', t); } catch {}
  dock.querySelector('[data-action="theme"]').setAttribute('aria-label', t === 'dark' ? 'Mode terang' : 'Mode gelap');
}
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.closest('.overview')) return;
  if (b.dataset.go !== undefined) { go(b.dataset.go); return; }
  switch (b.dataset.action) {
    case 'prev': go(index - 1); break;
    case 'next': go(index + 1); break;
    case 'fullscreen': fullscreen(); break;
    case 'overview': openOverview(); break;
    case 'theme': setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); break;
    case 'motion': setMotion(motionPref === 'on' ? 'off' : 'on'); break;
  }
});
addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const inOv = ov.classList.contains('open');
  if (inOv) {
    if (e.key === 'Escape' || e.key === 'g' || e.key === 'G') { e.preventDefault(); closeOverview(); }
    else if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const cur = thumbs.indexOf(document.activeElement), i = cur < 0 ? index : cur;
      const n = Math.max(0, Math.min(slides.length - 1, i + { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 5, ArrowUp: -5 }[e.key]));
      thumbs[n].focus();
    }
    return;
  }
  if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
  switch (e.key) {
    case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': e.preventDefault(); go(index + 1); break;
    case 'ArrowLeft': case 'ArrowUp': case 'PageUp': e.preventDefault(); go(index - 1); break;
    case 'Home': go(0); break;
    case 'End': go(slides.length - 1); break;
    case 'f': case 'F': fullscreen(); break;
    case 'g': case 'G': case 'Escape': openOverview(); break;
    case 't': case 'T': setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); break;
    case 'm': case 'M': setMotion(motionPref === 'on' ? 'off' : 'on'); break;
    case 'h': case 'H': stage.classList.toggle('dock-hidden'); break;
  }
});
let touchX = null;
document.getElementById('slides').addEventListener('touchstart', e => { if (!e.target.closest('.lens')) touchX = e.touches[0].clientX; }, { passive: true });
document.getElementById('slides').addEventListener('touchend', e => { if (touchX === null) return; const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1)); touchX = null; }, { passive: true });

// ---------- wallpaper network ----------------------------------------------------------------
function wallNet() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pts = Array.from({ length: 34 }, () => [40 + rnd() * 1920, 40 + rnd() * 1120]);
  const E = new Set(); let g = '';
  pts.forEach((p, i) => {
    pts.map((q, j) => [Math.hypot(p[0] - q[0], p[1] - q[1]), j]).sort((a, b) => a[0] - b[0]).slice(1, 3)
      .forEach(([, j]) => E.add(i < j ? `${i}-${j}` : `${j}-${i}`));
  });
  const edges = [...E].map(k => k.split('-').map(Number));
  edges.forEach(([a, b]) => g += `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}"/>`);
  pts.forEach(([x, y]) => g += `<circle cx="${x}" cy="${y}" r="4"/>`);
  edges.filter((_, i) => i % 5 === 0).forEach(([a, b], i) => {
    g += `<circle r="3.5" class="pk"><animateMotion dur="${7 + (i % 4) * 2.5}s" repeatCount="indefinite" path="M${pts[a]}L${pts[b]}" keyPoints="0;1;1" keyTimes="0;.7;1" calcMode="linear"/></circle>`;
  });
  wall.querySelector('.net').innerHTML = g;
}

// ---------- boot ------------------------------------------------------------------------------
(function boot() {
  let theme = 'light';
  try { theme = localStorage.getItem('komdat-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch {}
  setTheme(theme); setMotion(motionPref);
  wallNet(); fit(); setupLens();
  slides.forEach(s => { s.hidden = true; svgs(s, false); });
  go(Number(location.hash.slice(1)) - 1 || 0);
  document.fonts?.ready.then(() => { buildDockGlass(); movePill(true); });
  addEventListener('resize', () => { fit(); if (ov.classList.contains('open')) { const w = thumbs[0].offsetWidth; thumbs.forEach(t => t.querySelector('.thumb-in').style.transform = `scale(${w / 1920})`); } });
  addEventListener('hashchange', () => go(Number(location.hash.slice(1)) - 1));
})();
