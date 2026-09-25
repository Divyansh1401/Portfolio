// main.js — owner-facing playground entry. Bundled by scripts/build-demo.mjs
// and inlined into demo/dist/playground.html. Talks only to the public
// package surface (core.js, painter-canvas.js, driver.js) — nothing else in
// apps/bouquet is read at runtime, per the package's isolation rule.
//
// Two rendering modes share one canvas:
//   - idle:      this file's own core.js model, painted directly, driven by
//                the q/yaw sliders (landed pose, p=1).
//   - replaying: driver.js's createPlayer owns the canvas and the RAF loop
//                for the canonical fly-in (Replay/Skip buttons).
// driver.js exposes no way to read its internal model's cube counts, so the
// readout during replay is produced by a second, unpainted core.js model
// stepped with the SAME linear p/yaw formula driver.js's tick() uses
// (p = min(1, elapsed/flyMs), yaw = yawIn*(1-p)) — see updateShadowStats().

import { createModel } from '../src/core.js';
import { paint, assertPaintable } from '../src/painter-canvas.js';
import { createPlayer } from '../src/driver.js';

// Mirrors driver.js's own DEFAULT_YAW_IN (not exported) so the shadow stats
// model's camera sweep matches the player it is shadowing.
const SHADOW_YAW_IN = -540;

function capDpr(raw) {
  return Math.min(raw || 1, 2);
}

function measure(parent) {
  return {
    cssW: parent.clientWidth,
    cssH: parent.clientHeight,
    dpr: capDpr(typeof window !== 'undefined' ? window.devicePixelRatio : 1),
  };
}

function applySize(canvas, vp) {
  canvas.style.width = vp.cssW + 'px';
  canvas.style.height = vp.cssH + 'px';
  canvas.width = Math.max(1, Math.round(vp.cssW * vp.dpr));
  canvas.height = Math.max(1, Math.round(vp.cssH * vp.dpr));
}

function prefersReducedMotion() {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function init() {
  const canvas = document.getElementById('bq-canvas');
  const wrap = canvas.parentNode;
  const ctx = canvas.getContext('2d', { alpha: true });

  const ui = {
    replay: document.getElementById('btn-replay'),
    skip: document.getElementById('btn-skip'),
    q: document.getElementById('sl-q'),
    qOut: document.getElementById('out-q'),
    yaw: document.getElementById('sl-yaw'),
    yawOut: document.getElementById('out-yaw'),
    fly: document.getElementById('sl-fly'),
    flyOut: document.getElementById('out-fly'),
    drawn: document.getElementById('stat-drawn'),
    onscreen: document.getElementById('stat-onscreen'),
    fps: document.getElementById('stat-fps'),
    note: document.getElementById('reduced-note'),
  };

  const reducedMotion = prefersReducedMotion();
  if (reducedMotion) ui.note.hidden = false;

  const model = createModel();
  let vp = measure(wrap);
  applySize(canvas, vp);
  try {
    assertPaintable(canvas, ctx);
  } catch {
    ui.drawn.textContent = 'n/a';
    ui.onscreen.textContent = 'n/a';
    ui.fps.textContent = 'n/a';
    ui.replay.disabled = true;
    ui.skip.disabled = true;
    return;
  }
  model.layout(vp);

  let mode = 'idle'; // 'idle' | 'replaying'
  let player = null;
  let replayStart = 0;
  let replayFlyMs = Number(ui.fly.value);
  let replaySkipped = false;

  function relayout() {
    const v = measure(wrap);
    if (v.cssW === vp.cssW && v.cssH === vp.cssH) return;
    vp = v;
    applySize(canvas, vp);
    model.relayout(vp);
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(relayout) : null;
  if (ro) ro.observe(wrap);

  function paintIdle() {
    model.set({ p: 1, q: Number(ui.q.value), yaw: Number(ui.yaw.value) });
    const f = model.frame();
    paint(ctx, f);
    ui.drawn.textContent = String(f.n);
    ui.onscreen.textContent = String(f.onscreen);
  }

  function updateShadowStats() {
    let p, yaw;
    if (replaySkipped) {
      p = 1;
      yaw = 0;
    } else {
      const elapsed = performance.now() - replayStart;
      p = replayFlyMs > 0 ? Math.min(1, elapsed / replayFlyMs) : 1;
      yaw = SHADOW_YAW_IN * (1 - p);
    }
    model.set({ p, q: 0, yaw });
    const f = model.frame();
    ui.drawn.textContent = String(f.n);
    ui.onscreen.textContent = String(f.onscreen);
  }

  function enterIdle() {
    mode = 'idle';
    if (player) {
      player.destroy();
      player = null;
    }
    ui.skip.disabled = true;
    ui.q.disabled = reducedMotion;
    ui.yaw.disabled = reducedMotion;
    relayout();
    paintIdle();
  }

  function enterReplay() {
    if (reducedMotion) return; // note explains why; buttons are disabled too
    mode = 'replaying';
    replaySkipped = false;
    replayFlyMs = Number(ui.fly.value);
    replayStart = performance.now();
    ui.q.disabled = true;
    ui.yaw.disabled = true;
    ui.skip.disabled = false;
    player = createPlayer(canvas, {
      flyMs: replayFlyMs,
      onLanded() {
        enterIdle();
      },
    });
    player.play();
  }

  ui.replay.addEventListener('click', enterReplay);
  ui.skip.addEventListener('click', () => {
    if (mode !== 'replaying' || !player) return;
    replaySkipped = true;
    player.skip();
  });

  ui.q.addEventListener('input', () => {
    ui.qOut.textContent = Number(ui.q.value).toFixed(2);
    if (mode === 'idle') paintIdle();
  });
  ui.yaw.addEventListener('input', () => {
    ui.yawOut.textContent = `${ui.yaw.value}°`;
    if (mode === 'idle') paintIdle();
  });
  ui.fly.addEventListener('input', () => {
    ui.flyOut.textContent = `${ui.fly.value} ms`;
  });

  ui.qOut.textContent = Number(ui.q.value).toFixed(2);
  ui.yawOut.textContent = `${ui.yaw.value}°`;
  ui.flyOut.textContent = `${ui.fly.value} ms`;

  let fpsLast = performance.now();
  let fpsFrames = 0;
  function tick(ts) {
    fpsFrames++;
    const dt = ts - fpsLast;
    if (dt >= 500) {
      ui.fps.textContent = String(Math.round((fpsFrames * 1000) / dt));
      fpsFrames = 0;
      fpsLast = ts;
    }
    if (mode === 'replaying') updateShadowStats();
    requestAnimationFrame(tick);
  }

  if (reducedMotion) {
    ui.fps.textContent = '—';
    ui.q.value = '0';
    ui.yaw.value = '0';
    ui.q.disabled = true;
    ui.yaw.disabled = true;
    ui.replay.disabled = true;
    ui.skip.disabled = true;
    ui.qOut.textContent = '0.00';
    ui.yawOut.textContent = '0°';
    paintIdle();
  } else {
    requestAnimationFrame(tick);
    enterIdle();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
