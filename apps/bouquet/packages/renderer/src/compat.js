// compat.js — the only DOM-aware file. Wraps core.js's createModel() and
// painter-canvas.js's paint() around a real (or fake, for tests) canvas to
// reproduce reference/bouquet-loader.ref.js's mount() API. See CONTRACT.md
// section 3.

import { createModel } from './core.js';
import { paint } from './painter-canvas.js';

/**
 * @param {HTMLCanvasElement|object} canvas
 * @param {{devicePixelRatio:number, innerWidth:number, innerHeight:number}} [win]
 */
export function mount(canvas, win = globalThis.window){
  const cv = canvas;
  const ctx = cv.getContext('2d', { alpha: true });   // exactly once, these options
  const model = createModel();

  function measure(){
    const dpr  = win.devicePixelRatio;
    const cssW = cv.parentNode.clientWidth  || win.innerWidth;
    const cssH = cv.parentNode.clientHeight || win.innerHeight;
    return { cssW, cssH, dpr };
  }

  function applySize(vp, width, height){
    cv.style.width  = vp.cssW + 'px';
    cv.style.height = vp.cssH + 'px';
    cv.width  = width;
    cv.height = height;
  }

  function draw(){ paint(ctx, model.frame()); }

  // at mount
  {
    const vp = measure();
    const dims = model.layout(vp);
    applySize(vp, dims.width, dims.height);
    draw();
  }

  return {
    setP: function(v){ model.set({ p: v }); draw(); },
    setQ: function(v){ model.set({ q: v }); draw(); },
    setYaw: function(deg){ model.set({ yaw: deg }); draw(); },
    fit: function(f){
      const vp = measure();
      const r = model.fit(f, vp);
      const st = model.state();
      applySize(vp, st.width, st.height);
      draw();
      return r;
    },
    resize: function(){
      const vp = measure();
      const dims = model.layout(vp);
      applySize(vp, dims.width, dims.height);
      draw();
    },
    tune: function(o){ const r = model.tune(o); draw(); return r; },
    dtune: function(o){ const r = model.dtune(o); draw(); return r; },
    ftune: function(o){
      const willRebuild = !!(o && o.fillHollow !== undefined && !!o.fillHollow !== model.state().fillHollow);
      const vp = willRebuild ? measure() : undefined;
      const r = model.ftune(o, vp);
      if(vp){
        const st = model.state();
        applySize(vp, st.width, st.height);
      }
      draw();
      return r;
    },
    params: function(o){
      const vp = measure();
      const r = model.params(o, vp);
      const st = model.state();
      applySize(vp, st.width, st.height);
      draw();
      return r;
    },
    state: function(){
      const s = model.state();
      return {
        N: s.N, surface: s.surface, voxels: s.voxels, drawn: s.drawn, onscreen: s.onscreen,
        S: s.S, DPR: s.DPR, p: s.p, q: s.q, yaw: s.yaw,
        show: 'auto', limit: null, sortInFlight: false,
      };
    },
    sets: function(){ return model.sets(); },
    project: function(x, y, z){ return model.project(x, y, z); },
    basis: function(){ return model.basis(); },
    draw: function(){ draw(); },
    canvas: function(){ return cv; },
  };
}
