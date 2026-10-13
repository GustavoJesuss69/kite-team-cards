import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import './style.css';
import { TEAM, bio } from './team.js';
import { SCRIPT, DURATION } from './script.js';

const W = 1920, H = 1080, CW = 300, CH = 410, TETHER = 64;
const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
const stage = document.getElementById('stage');
const viewport = document.getElementById('viewport');
const pad = (n) => String(n).padStart(2, '0');
const wireY = (x) => 392 + 22 * (1 - Math.pow((x - W / 2) / (W / 2), 2));

stage.innerHTML = `
<div class="top-left">
  <div class="eyebrow mono"><img src="./Kite_Logo.svg" alt="Kite AI"><span class="dot"></span><span>Kite AI · Team</span></div>
  <h1>The people building the payments layer for the <em>agent economy.</em></h1>
</div>
<div class="top-right">The team behind Kite, giving autonomous agents verifiable trust and a chain to transact on.
  <div class="count mono">05 people, one team</div></div>
<svg class="wire" width="${W}" height="${H}"><path d="M60 ${wireY(60)} Q ${W / 2} ${2 * wireY(W / 2) - (wireY(60) + wireY(W - 60)) / 2} ${W - 60} ${wireY(W - 60)}" stroke="#6b665a" stroke-width="1.6" fill="none"/>
<circle cx="60" cy="${wireY(60)}" r="4" fill="#6b665a"/><circle cx="${W - 60}" cy="${wireY(W - 60)}" r="4" fill="#6b665a"/></svg>
<div class="hint l mono">Hover to discover · Flick / tap to flip</div>
<div class="hint r mono">gokite.ai · @GoKiteAI</div>
<div class="wm">@gustavo jesus</div>
<svg id="cursor" viewBox="0 0 24 24"><path d="M4 2.5l15 8.6-6.6 1.6-3 6.3z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

const arrow = `<svg viewBox="0 0 14 14"><path d="M3 11L11 3M5 3h6v6" stroke="#FEF8F0" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
const REST = [-2.4, 1.7, -1.1, 2.3, -1.9];
const cards = TEAM.map((p, i) => {
  const cx = W / 2 + (i - 2) * 352;
  const py = wireY(cx);
  const slot = document.createElement('div');
  slot.className = 'slot';
  slot.style.left = cx - CW / 2 + 'px';
  slot.style.top = py + 'px';
  const n = pad(i + 1);
  slot.innerHTML = `<div class="swing">
    <div class="tether t1"></div><div class="tether t2"></div>
    <div class="clip" style="left:${42}px;top:${TETHER - 14}px"></div><div class="clip" style="left:${CW - 58}px;top:${TETHER - 14}px"></div>
    <div class="card" style="top:${TETHER}px">
      <div class="face front">
        <div class="row mono lbl"><span><b>Kite AI</b> · Team</span><span>#${n}</span></div>
        <div class="photo" style="background-image:url(${p.photo})"></div>
        <div class="name">${p.name}</div><div class="role">${p.role}</div>
        <div class="foot row"><span class="mono lbl">View profile</span><span class="arrow">${arrow}</span></div>
      </div>
      <div class="face back">
        <div class="mesh"></div><div class="glare"></div>
        <div class="pill mono">Profile #${n}</div>
        <div class="who"><div class="mini" style="background-image:url(${p.photo})"></div><div><div class="n">${p.name}</div><div class="r">${p.role}</div></div></div>
        <div class="biot">${bio(p)}</div>
        <div class="kv mono"><span>Team</span><span>Kite AI</span><span>Web</span><span>gokite.ai</span><span>X</span><span>@GoKiteAI</span></div>
        <div class="bfoot mono"><span>Kite AI · Team</span><img src="./favicon.svg" alt=""></div>
      </div>
    </div></div>`;
  stage.appendChild(slot);
  const el = {
    swing: slot.querySelector('.swing'), card: slot.querySelector('.card'),
    mesh: slot.querySelector('.mesh'), glare: slot.querySelector('.glare'),
    t1: slot.querySelector('.t1'), t2: slot.querySelector('.t2'),
  };
  return { i, cx, py, rest: REST[i], th: REST[i] + (i % 2 ? 5 : -5) * 0.8, thv: 0, ph: 0, phv: 0, face: 0, spinning: false, lift: 0, el,
    rect: { x: cx - CW / 2 - 6, y: py + TETHER - 6, w: CW + 12, h: CH + 12 } };
});
// tethers fixed geometry (anchored at a single wire point, splaying to the clips)
for (const c of cards) {
  for (const [t, x] of [[c.el.t1, 50], [c.el.t2, CW - 50]]) {
    const dx = x - CW / 2, len = Math.hypot(dx, TETHER - 8);
    t.style.left = CW / 2 + 'px'; t.style.height = len + 'px';
    t.style.transform = `rotate(${(-Math.atan2(dx, TETHER - 8) * 180) / Math.PI}deg)`;
  }
}

// ---------- input + physics (fixed step, deterministic) ----------
const ptr = { x: -999, y: -999, down: false, vx: 0, lx: -999, ly: -999 };
let drag = null, hover = -1, time = 0;
const hit = (x, y) => cards.findIndex((c) => x >= c.rect.x && x <= c.rect.x + c.rect.w && y >= c.rect.y && y <= c.rect.y + c.rect.h);
const ang = (c, x, y) => (Math.atan2(x - c.cx, y - c.py) * -180) / Math.PI;

function pointer(x, y, down) {
  if (down && !ptr.down) {
    const i = hit(x, y);
    if (i >= 0) { const c = cards[i]; drag = { c, a0: ang(c, x, y), th0: c.th, sx: x, sy: y, moved: 0 }; }
  }
  if (!down && ptr.down && drag) {
    const c = drag.c;
    if (drag.moved < 6) { c.face ^= 1; }
    else if (Math.abs(ptr.vx) > 900) { c.spinning = true; c.phv = Math.max(-2600, Math.min(2600, ptr.vx * 0.75)); c.thv += ptr.vx * 0.02; }
    drag = null;
  }
  ptr.x = x; ptr.y = y; ptr.down = down;
  if (drag) drag.moved = Math.max(drag.moved, Math.hypot(x - drag.sx, y - drag.sy));
}

const nearestWithParity = (ph, parity) => { let k = Math.round(ph / 180); if (((k % 2) + 2) % 2 !== parity) k += ph / 180 > k ? 1 : -1; return k * 180; };

function step(dt) {
  time += dt;
  ptr.vx = ptr.vx * 0.8 + ((ptr.x - ptr.lx) / dt) * 0.2 * (ptr.lx > -999 ? 1 : 0);
  ptr.lx = ptr.x; ptr.ly = ptr.y;
  hover = drag ? -1 : hit(ptr.x, ptr.y);
  for (const c of cards) {
    // swing (pendulum spring)
    if (drag && drag.c === c) {
      const target = Math.max(-28, Math.min(28, drag.th0 + (ang(c, ptr.x, ptr.y) - drag.a0) * 1.4));
      const a = 900 * (target - c.th) - 60 * c.thv; c.thv += a * dt;
    } else {
      const a = -38 * (c.th - c.rest) - 1.5 * c.thv; c.thv += a * dt;
    }
    c.th += c.thv * dt;
    // flip
    const want = c.face ^ (hover === c.i ? 1 : 0);
    if (c.spinning) {
      c.phv *= Math.exp(-1.05 * dt);
      if (Math.abs(c.phv) < 260) { c.spinning = false; const k = Math.round(c.ph / 180 + c.phv / 900); c.face = (((k % 2) + 2) % 2) ^ (hover === c.i ? 1 : 0); }
    } else {
      const tgt = nearestWithParity(c.ph, want);
      const a = 190 * (tgt - c.ph) - 17 * c.phv; c.phv += a * dt;
    }
    c.ph += c.phv * dt;
    c.lift += ((hover === c.i || (drag && drag.c === c) ? 1 : 0) - c.lift) * (1 - Math.exp(-10 * dt));
  }
}

function draw() {
  for (const c of cards) {
    const tiltX = Math.max(-10, Math.min(10, -c.thv * 0.06));
    c.el.swing.style.transform = `rotate(${c.th.toFixed(3)}deg)`;
    c.el.card.style.transform = `translateZ(${(c.lift * 30).toFixed(2)}px) rotateY(${c.ph.toFixed(2)}deg) rotateX(${tiltX.toFixed(2)}deg)`;
    const t = time + c.i * 1.7;
    const p = (a, b, s, o) => `${(50 + a * Math.sin(t * s + o)).toFixed(1)}% ${(50 + b * Math.cos(t * s * 0.8 + o)).toFixed(1)}%`;
    c.el.mesh.style.background = `radial-gradient(40% 45% at ${p(30, 26, 0.7, 0)}, #F3D9A4 0%, transparent 70%),
      radial-gradient(45% 40% at ${p(34, 30, 0.55, 2)}, #C9DD9A 0%, transparent 70%),
      radial-gradient(40% 45% at ${p(28, 34, 0.8, 4)}, #D6E6E0 0%, transparent 70%),
      radial-gradient(38% 40% at ${p(32, 28, 0.6, 5.5)}, #E4D2EA 0%, transparent 70%),
      linear-gradient(${(120 + 40 * Math.sin(t * 0.4)).toFixed(1)}deg, #FEF8F0, #E8F2D1 45%, #DBD5C7)`;
    let gx = 50, gy = 30, go = 0.35;
    if (hover === c.i || (drag && drag.c === c)) {
      gx = (1 - (ptr.x - c.rect.x) / c.rect.w) * 100; gy = ((ptr.y - c.rect.y) / c.rect.h) * 100; go = 0.85;
    }
    c.gx = (c.gx ?? gx) + (gx - (c.gx ?? gx)) * 0.25; c.gy = (c.gy ?? gy) + (gy - (c.gy ?? gy)) * 0.25; c.go = (c.go ?? go) + (go - (c.go ?? go)) * 0.2;
    c.el.glare.style.background = `radial-gradient(55% 45% at ${c.gx.toFixed(1)}% ${c.gy.toFixed(1)}%, rgba(255,255,255,${c.go.toFixed(2)}), rgba(255,255,255,0) 70%)`;
  }
}

// ---------- live mode ----------
const fit = () => { const s = Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `scale(${s})`; stage._s = s; };
const toStage = (e) => { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / stage._s, (e.clientY - r.top) / stage._s]; };
const SUB = 1 / 240;
if (!RENDER) {
  fit(); addEventListener('resize', fit);
  let down = false;
  viewport.addEventListener('pointerdown', (e) => { down = true; viewport.setPointerCapture(e.pointerId); pointer(...toStage(e), true); });
  viewport.addEventListener('pointermove', (e) => pointer(...toStage(e), down));
  const up = (e) => { down = false; pointer(...toStage(e), false); if (e.pointerType !== 'mouse') pointer(-999, -999, false); };
  viewport.addEventListener('pointerup', up); viewport.addEventListener('pointercancel', up);
  viewport.addEventListener('pointerleave', () => { if (!down) pointer(-999, -999, false); });
  let last = performance.now(), acc = 0;
  const loop = (now) => { acc += Math.min(0.1, (now - last) / 1000); last = now; while (acc >= SUB) { step(SUB); acc -= SUB; } draw(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
} else {
  // ---------- deterministic render mode ----------
  const FPS = 30; let frame = 0;
  const cur = document.getElementById('cursor'); cur.style.display = 'block';
  const at = (t) => {
    let k = 0; while (k < SCRIPT.length - 2 && SCRIPT[k + 1][0] <= t) k++;
    const [t0, x0, y0, d0, e] = SCRIPT[k], [t1, x1, y1] = SCRIPT[k + 1];
    let u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
    if (e !== 'lin') u = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, !!d0];
  };
  window.duration = DURATION;
  window.renderAt = (f) => {
    while (frame < f) { for (let s = 0; s < 240 / FPS; s++) { const t = time + SUB; const [x, y, d] = at(t); pointer(x, y, d); step(SUB); } frame++; }
    draw(); const [x, y, d] = at(time);
    cur.style.transform = `translate(${x - 6}px,${y - 4}px) scale(${d ? 0.88 : 1})`;
  };
  window.ready = document.fonts.ready.then(() => Promise.all([...TEAM.map((t) => t.photo), './Kite_Logo.svg', './favicon.svg'].map((u) => { const i = new Image(); i.src = u; return i.decode().catch(() => {}); }))).then(() => new Promise((r) => setTimeout(r, 300)));
}
