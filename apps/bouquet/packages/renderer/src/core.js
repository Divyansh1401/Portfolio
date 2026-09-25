// core.js — pure math model for the voxel-cube bouquet renderer.
//
// Ported from reference/bouquet-loader.ref.js mount() (ref lines 103-1140),
// with every DOM/canvas/timer touch removed. See CONTRACT.md section 1 for
// the full interface and parity rules this file must satisfy. Zero imports,
// no DOM, no timers, no Math.random, no module-level mutable state.

const clamp01 = function(x){ return x<0?0:x>1?1:x; };

const COS30 = Math.sqrt(3)/2;

// ---------------------------------------------------------------------------
// CONTINUOUS SHADING constants (see ref 123-140)
// ---------------------------------------------------------------------------
const AMB = 0.35, LX = 0.43, LY = 0.65, LZ = 0.21;
const S_TOP = AMB+LY, S_PX = AMB+LX, S_PZ = AMB+LZ;

function hex2rgb(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
function rgb2hex(c){ return '#'+c.map(function(v){ return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'); }).join(''); }

// ---------------------------------------------------------------------------
// PALETTE  [top, +X side, +Z side] (ref 111-122)
// ---------------------------------------------------------------------------
const DEFAULT_PALETTE = [
  ['#C41E5A','#981746','#6F1133'], // 0 crimson petal
  ['#7A1338','#5F0E2B','#450A1F'], // 1 crimson centre
  ['#FB6F92','#D15D7A','#A94B62'], // 2 rose mid petal   (SAMPLED #FB6F92)
  ['#9C455B','#763444','#522430'], // 3 rose mid centre
  ['#FFB3C6','#DB9AAA','#B8818F'], // 4 rose light petal (SAMPLED #FFB3C6)
  ['#9E6F7B','#7D5861','#5E4249'], // 5 rose light centre
  ['#F1E6D6','#D2C9BB','#B5ACA0'], // 6 cream paper
  ['#5F8C30','#4B6E26','#39531D'], // 7 olive
  ['#3E6B25','#2E4F1B','#1E3512'], // 8 dark green
  ['#8FBF4A','#78A03E','#628233'], // 9 bright green
];

const HEX6_RE = /^#[0-9a-fA-F]{6}$/;

function clonePalette(p){ return p.map(function(t){ return t.slice(); }); }

function validatePalette(palette){
  if(!Array.isArray(palette) || palette.length !== 10){
    throw new TypeError('bouquet: palette must have exactly 10 entries');
  }
  for(const t of palette){
    if(!Array.isArray(t) || t.length !== 3){
      throw new TypeError('bouquet: each palette entry must be [top, +x, +z]');
    }
    for(const s of t){
      if(typeof s !== 'string' || !HEX6_RE.test(s)){
        throw new TypeError('bouquet: palette colours must be #rrggbb strings');
      }
    }
  }
  return clonePalette(palette);
}

// Per-material ramp anchored on the reference's own three colours, with a
// fourth control point extrapolated by continuing the +x -> +z channel ratio
// so faces turned away from the light keep going darker smoothly. (ref 145-154)
function buildRamp(PALETTE){
  return PALETTE.map(function(t){
    const c0=hex2rgb(t[0]), c1=hex2rgb(t[1]), c2=hex2rgb(t[2]);
    const r  = [0,1,2].map(function(i){ return c1[i]>0 ? c2[i]/c1[i] : 0.72; });
    const c3 = [0,1,2].map(function(i){ return c2[i]*r[i]; });
    const c4 = [0,1,2].map(function(i){ return c3[i]*r[i]; });
    return [[1.30,c0],[S_TOP,c0],[S_PX,c1],[S_PZ,c2],[S_PZ-0.22,c3],[-1,c4]];
  });
}

// Memoised on shade quantised to 1/128 (ref 156-178).
function makeToneFor(RAMP, TONE_CACHE){
  return function toneFor(pal, sh){
    const q = Math.max(0, Math.min(160, Math.round(sh*128)));
    const k = pal*256 + q;
    let hex = TONE_CACHE.get(k);
    if(hex !== undefined) return hex;
    const s = q/128, cps = RAMP[pal];
    let out = cps[cps.length-1][1];
    for(let i=0;i<cps.length-1;i++){
      const a=cps[i], b=cps[i+1];
      if(s <= a[0] && s >= b[0]){
        const f = (a[0]-b[0]) > 1e-6 ? (s-b[0])/(a[0]-b[0]) : 1;
        out = [0,1,2].map(function(j){ return b[1][j] + (a[1][j]-b[1][j])*f; });
        break;
      }
      if(s > cps[0][0]) { out = cps[0][1]; break; }
    }
    hex = rgb2hex(out);
    TONE_CACHE.set(k, hex);
    return hex;
  };
}

const PETAL = [[0,1],[2,3],[4,5]];
const CSEQ  = [2,1,0,2,1,2,1,0,2,1,2,0];   // ~25% crimson / 33% mid / 42% pale

// ---------------------------------------------------------------------------
// PARAMS (ref 186-210)
// ---------------------------------------------------------------------------
const DEFAULT_P = {
  // flower dome
  nBlooms: 52, rLarge: 3, rMed: 2, rTiny: 1, packing: 0.90,
  domeCY: 19, domeR: 9.5, capFrac: 0.86, domeSquash: 1.0, domeCone: 0.55,
  holeFrac: 0.34, outerDrop: 0.75, bloomNibble: true,

  // foliage on the canopy surface
  foliage: true, foliageR: 8.8, foliageBand: 2, foliageDrop: 1.6,

  // greenery filling the void between canopy underside and the paper rim
  underfill: true, underfillR: 8.6,

  // flared paper collar — terraced so walls read as tall side faces
  wrapY0: 10, wrapY1: 17, wrapTop: 8.2, wrapBot: 3.4, wrapThick: 2.0, wrapStep: 3,

  // gathered paper handle — a SHELL, so the stem bundle sits inside it
  handleY0: 1, handleY1: 10, handleR: 2.8, handleThick: 1.0,

  // ribbon band + bow around the handle
  ribY: 3, ribH: 2, ribR: 3.5,
  bow: true, bowY: 5, bowOut: 3, bowSpread: 4, tailLen: 9,

  // stems — one tight bundle running up inside the paper
  stemY0: -6, stemTop: 11, stemR: 1.5,
};

// ---------------------------------------------------------------------------
// GENERATOR (ref 212-469)
// ---------------------------------------------------------------------------
const PART = { BLOOM:0, LEAF:1, PAPER:2, RIBBON:3, STEM:4 };
function key(x,y,z){ return x+','+y+','+z; }

function domeY(P, u){
  const c = Math.min(1, Math.max(0, u));
  const prof = P.domeCone*(1-c) + (1-P.domeCone)*Math.sqrt(Math.max(0,1-c*c));
  return P.domeCY + P.domeR*P.domeSquash*prof;
}

function greenAt(x,y,z){
  return ((x*7+z*13+y) % 5 === 0) ? 9 : ((x+z) % 2 ? 7 : 8);
}

const BLOOM = {
  1: { rings: [[1, 0, 0]],                        ctr: -1, fp: 1 },  // 3 wide, 1 level
  2: { rings: [[1, 0, 0], [2, -1, 1]],            ctr: -1, fp: 2 },  // 5 wide, 2 levels
  3: { rings: [[1, 1, 0], [2, 0, 1], [2, -1, 0]], ctr:  0, fp: 2 },  // 5 wide, 3 levels
};

function addBloom(cells, P, cx, cy, cz, R, pPetal, pCtr, pass){
  const spec = BLOOM[R] || BLOOM[2];
  const h = ((cx*73856093) ^ (cz*19349663) ^ (cy*83492791)) >>> 0;
  for(const rg of spec.rings){
    const k = rg[0], dy = rg[1], cut = rg[2];
    if(pass === 'inner' ? k !== 1 : k === 1) continue;
    let idx = 0;
    for(let dx=-k; dx<=k; dx++) for(let dz=-k; dz<=k; dz++){
      if(Math.max(Math.abs(dx), Math.abs(dz)) !== k) continue;   // border only
      idx++;
      if(cut && Math.abs(dx) === k && Math.abs(dz) === k) continue;   // corners
      if(cut && P.bloomNibble && (h % 7) === (idx % 7)) continue;     // one nibble
      cells.set(key(cx+dx, cy+dy, cz+dz), pPetal);
    }
  }
  if(pass === 'inner') cells.set(key(cx, cy+spec.ctr, cz), pCtr);
}

function build(P){
  const cells = new Map();
  const GA = Math.PI*(3-Math.sqrt(5));
  const bloomAt = [];

  const fpOf = function(R){ return (BLOOM[R]||BLOOM[2]).fp; };
  const sizeFor = function(i){
    if(i % 6 === 0) return P.rLarge;
    if(i % 2 === 1) return P.rMed;
    return P.rTiny;
  };
  for(let i=0;i<P.nBlooms;i++){
    const t   = (i+0.5)/P.nBlooms;
    const phi = Math.acos(1 - t*P.capFrac);
    const th  = i*GA;
    const R   = sizeFor(i);
    const cx = Math.round(P.domeR*Math.sin(phi)*Math.cos(th));
    const cz = Math.round(P.domeR*Math.sin(phi)*Math.sin(th));
    const cy = Math.round(domeY(P, Math.sin(phi)));
    let clash = false;
    for(const b of bloomAt){
      if(Math.hypot(cx-b[0], cz-b[2]) < (fpOf(R)+fpOf(b[3]))*P.packing && Math.abs(cy-b[1]) < 2){
        clash = true; break;
      }
    }
    if(clash) continue;
    bloomAt.push([cx,cy,cz,R,PETAL[CSEQ[i % CSEQ.length]]]);
  }
  // outer rings for every bloom first, then every inner ring + centre, so no
  // bloom's defining ring can be overwritten by a neighbour's outer petals
  for(const b of bloomAt) addBloom(cells, P, b[0],b[1],b[2],b[3], b[4][0], b[4][1], 'outer');
  for(const b of bloomAt) addBloom(cells, P, b[0],b[1],b[2],b[3], b[4][0], b[4][1], 'inner');

  // ---- canopy foliage: green in the gaps between blooms
  if(P.foliage){
    const FR = P.foliageR;
    for(let x=-Math.ceil(FR); x<=Math.ceil(FR); x++){
      for(let z=-Math.ceil(FR); z<=Math.ceil(FR); z++){
        const rxz = Math.hypot(x,z);
        if(rxz > FR) continue;
        const yTop = Math.round(domeY(P, rxz/P.domeR) - P.foliageDrop);
        for(let y=yTop; y>yTop-P.foliageBand; y--){
          const k = key(x,y,z);
          if(cells.has(k)) continue;
          let near = false;
          for(const b of bloomAt){
            if(Math.hypot(x-b[0], z-b[2]) < b[3]*0.65){ near = true; break; }
          }
          if(near) continue;
          cells.set(k, greenAt(x,y,z) | (PART.LEAF<<4));
        }
      }
    }
  }

  // ---- greenery UNDERFILL
  if(P.underfill){
    const UR = P.underfillR;
    for(let x=-Math.ceil(UR); x<=Math.ceil(UR); x++){
      for(let z=-Math.ceil(UR); z<=Math.ceil(UR); z++){
        const r = Math.hypot(x,z);
        if(r > UR) continue;
        const yTop = Math.round(domeY(P, r/P.domeR)) - 1;
        for(let y=P.wrapY1; y<=yTop; y++){
          const k = key(x,y,z);
          if(!cells.has(k)) cells.set(k, greenAt(x,y,z) | (PART.LEAF<<4));
        }
      }
    }
  }

  // ---- paper collar, terraced, capped at both ends
  {
    const nSeg = Math.max(2, Math.ceil((P.wrapY1-P.wrapY0+1)/P.wrapStep));
    for(let y=P.wrapY0; y<=P.wrapY1; y++){
      const seg = Math.min(nSeg-1, Math.floor((y-P.wrapY0)/P.wrapStep));
      const r = Math.round(P.wrapBot + (P.wrapTop-P.wrapBot)*(seg/(nSeg-1)));
      const lim = r+1;
      for(let x=-lim; x<=lim; x++) for(let z=-lim; z<=lim; z++){
        const d = Math.hypot(x,z);
        if(d > r+0.5 || d < r-P.wrapThick) continue;
        cells.set(key(x,y,z), 6 | (PART.PAPER<<4));
      }
      if(y === P.wrapY1){        // close the mouth: paper wraps under flowers
        for(let x=-lim; x<=lim; x++) for(let z=-lim; z<=lim; z++){
          if(Math.hypot(x,z) <= r+0.5) cells.set(key(x,y,z), 6 | (PART.PAPER<<4));
        }
      }
    }
  }

  // ---- gathered handle: a SHELL around the stems
  for(let y=P.handleY0; y<=P.handleY1; y++){
    const r = P.handleR;
    const lim = Math.ceil(r)+1;
    for(let x=-lim; x<=lim; x++) for(let z=-lim; z<=lim; z++){
      const d = Math.hypot(x,z);
      if(d > r+0.4 || d < r-P.handleThick) continue;
      cells.set(key(x,y,z), 6 | (PART.PAPER<<4));
    }
  }

  // ---- stems: ONE tight bundle
  for(let x=-2;x<=2;x++) for(let z=-2;z<=2;z++){
    const d = Math.hypot(x,z);
    if(d > P.stemR) continue;
    const ragged = ((x*3+z*5) % 3 + 3) % 3;      // uneven cut ends
    for(let y=P.stemY0+ragged; y<=P.stemTop; y++){
      cells.set(key(x,y,z), ((x+z) % 2 ? 7 : 8) | (PART.STEM<<4));
    }
  }

  // ---- ribbon band around the handle
  for(let y=P.ribY; y<P.ribY+P.ribH; y++){
    const lim = Math.ceil(P.ribR+1);
    for(let x=-lim; x<=lim; x++) for(let z=-lim; z<=lim; z++){
      const d = Math.hypot(x,z);
      if(d > P.ribR+0.5 || d < P.ribR-1.2) continue;
      cells.set(key(x,y,z), 0 | (PART.RIBBON<<4));
    }
  }

  // ---- bow + tails
  if(P.bow){
    const aToXZ = function(a){
      const sg = a < 0 ? -1 : 1, m = Math.abs(a);
      return [sg*Math.ceil(m/2), -sg*Math.floor(m/2)];
    };
    const put = function(a,b,c,pal){
      const xz = aToXZ(a);
      cells.set(key(xz[0]+c, P.bowY+b, xz[1]+c), pal | (PART.RIBBON<<4));
    };
    const OUT = P.bowOut;

    // knot — small and tight, 3 wide x 2 tall x 2 deep
    for(let a=-1;a<=1;a++) for(let b=0;b<=1;b++) for(let c=OUT;c<=OUT+1;c++) put(a,b,c,0);

    // loop ring: 4 wide x 4 tall with a 2x2 hole through the middle
    const RING = [        [-1, 2],[0, 2],
                  [-2, 1],                [1, 1],
                  [-2, 0],                [1, 0],
                          [-1,-1],[0,-1]        ];
    for(const L of RING) put(-P.bowSpread + L[0], 2 + L[1], OUT, 0);
    for(const L of RING) put( P.bowSpread + L[0], 2 + L[1], OUT, 0);
    put(-2, 1, OUT, 0); put(-2, 2, OUT, 0);
    put( 2, 1, OUT, 0); put( 2, 2, OUT, 0);

    // tails — hang from under the knot, one cube wide, drifting apart.
    for(const sg of [-1, 1]){
      const len = sg < 0 ? P.tailLen : P.tailLen - 2;
      let a = sg, b = -1;
      put(a, b, OUT, 0);
      for(let i=0;i<len;i++){
        b -= 1;                       put(a, b, OUT, 0);
        if(i % 3 === 2){ a += sg;     put(a, b, OUT, 0); }
      }
    }
  }

  return cells;
}

// ---- HOLLOW FILL (ref 516-535) ----
function filledVolume(SRC, P){
  const v = new Map(SRC);
  const nSeg = Math.max(2, Math.ceil((P.wrapY1-P.wrapY0+1)/P.wrapStep));
  for(let y=P.handleY0; y<=P.wrapY1; y++){
    let r;
    if(y < P.wrapY0) r = P.handleR;
    else { const seg = Math.min(nSeg-1, Math.floor((y-P.wrapY0)/P.wrapStep)); r = Math.round(P.wrapBot + (P.wrapTop-P.wrapBot)*(seg/(nSeg-1))); }
    const lim = Math.ceil(r)+1;
    for(let x=-lim; x<=lim; x++) for(let z=-lim; z<=lim; z++){
      if(Math.hypot(x,z) > r) continue;
      const k = key(x,y,z);
      if(!v.has(k)) v.set(k, 6 | (PART.PAPER<<4));
    }
  }
  return v;
}

// surface cells of `vol`: anything not fully enclosed (ref 504-508)
function surfaceOf(vol){
  const out = [];
  vol.forEach(function(v,k){
    const q = k.split(','), x=+q[0], y=+q[1], z=+q[2];
    if(vol.has(key(x+1,y,z)) && vol.has(key(x-1,y,z)) && vol.has(key(x,y+1,z)) &&
       vol.has(key(x,y-1,z)) && vol.has(key(x,y,z+1)) && vol.has(key(x,y,z-1))) return;
    out.push([x,y,z, v & 15, v >> 4]);          // x,y,z,pal,part
  });
  return out;
}

function computePivotOf(list){
  let sx=0, sz=0;
  for(let i=0;i<list.length;i++){ sx+=list[i][0]; sz+=list[i][2]; }
  return { PIVX: list.length ? sx/list.length : 0, PIVZ: list.length ? sz/list.length : 0 };
}

// deterministic hash - never Math.random (ref 666-668)
function h32(i){ let h=Math.imul(i^0x9E3779B9,2654435761)>>>0; h^=h>>>15;
                 h=Math.imul(h,2246822519)>>>0; h^=h>>>13; return h>>>0; }
function rnd(i,salt){ return (h32(i*7919 + salt*104729)>>>8)/16777216; }

const smooth = function(x){ return x*x*(3-2*x); };

const DEFAULT_F = { stagger: 0.29, flight: 0.69, rational: 0.55, rhoMin: 0.06, rhoMax: 0.50, vwin: 0.25, yMix: 0.55, yFree: 26, jitter: 0.20, angJit: 0.12, within: 'height' };
const DEFAULT_D = { outK: 3.4, outMin: 0.62, upK: 1.30, upMin: 0.55, stagger: 0.30, spin: false };
const DEFAULT_PART_ORDER = [4, 3, 2, 1, 0];   // stem, RIBBON, paper, leaf, bloom

// ref 663: parses a comma string into part indices; returns null when invalid
function setOrder(str){
  const m = {stem:4, paper:2, leaf:1, bloom:0, ribbon:3};
  const o = String(str).split(',').map(function(n){ return m[n.trim()]; }).filter(function(i){ return i !== undefined; });
  return o.length === 5 ? o : null;
}

function applyParamsPatch(P, P_ORIG, o){
  if(o === null || o === undefined){
    Object.keys(P).forEach(function(k){ delete P[k]; });
    Object.assign(P, P_ORIG);
    return;
  }
  Object.keys(o).forEach(function(k){
    if(!(k in P_ORIG)) return;
    const v = o[k];
    if(typeof P_ORIG[k] === 'boolean'){ P[k] = !!v; return; }
    if(typeof v !== 'number' || !isFinite(v)) return;
    P[k] = (k === 'domeR' || k === 'wrapStep') ? Math.max(1, v) : v;
  });
}

/**
 * @typedef {{cssW:number, cssH:number, dpr:number}} Viewport
 * @typedef {[string,string,string]} Tone
 */

/**
 * @param {{params?:object, palette?:Array, turns?:number, ms?:number, fill?:number}} [opts]
 */
export function createModel(opts = {}){
  const PALETTE = opts.palette !== undefined ? validatePalette(opts.palette) : clonePalette(DEFAULT_PALETTE);
  const RAMP = buildRamp(PALETTE);
  const TONE_CACHE = new Map();
  const toneFor = makeToneFor(RAMP, TONE_CACHE);

  const P_ORIG = Object.assign({}, DEFAULT_P);   // built-in defaults; params(null) restores THIS
  const P = Object.assign({}, DEFAULT_P);
  applyParamsPatch(P, P_ORIG, opts.params === undefined ? {} : opts.params);

  let SRC = build(P);
  let VOL = SRC;
  function srcAt(x,y,z){ return VOL.has(key(x,y,z)); }
  let SURFACE = [];

  let HOLLOW_FILLED = true;
  function setFill(on){
    HOLLOW_FILLED = !!on;
    VOL = HOLLOW_FILLED ? filledVolume(SRC, P) : SRC;
    SURFACE = surfaceOf(VOL);
  }

  // ---- SoA, frozen order (surface set only; interior is dropped, ref §4) ----
  let N = 0, NVIS = 0, AX=null, AY=null, AZ=null, APAL=null, APART=null, ACULL=null;
  let frameX=null, frameY=null, framePal=null;
  function pack(list){
    const s = list.slice().sort(function(a,b){ return (a[0]+a[1]+a[2])-(b[0]+b[1]+b[2]); });
    N = s.length;
    AX=new Float32Array(N); AY=new Float32Array(N); AZ=new Float32Array(N);
    APAL=new Uint8Array(N); APART=new Uint8Array(N); ACULL=new Uint8Array(N);
    NVIS = 0;
    for(let i=0;i<N;i++){
      const c = s[i];
      AX[i]=c[0]; AY[i]=c[1]; AZ[i]=c[2]; APAL[i]=c[3]; APART[i]=c[4];
      ACULL[i] = srcAt(c[0]+1, c[1]+1, c[2]+1) ? 1 : 0;
      if(!ACULL[i]) NVIS++;
    }
    frameX = new Float64Array(N);
    frameY = new Float64Array(N);
    framePal = new Uint8Array(N);
  }

  let PIVX=0, PIVZ=0;
  function computePivot(list){
    const pv = computePivotOf(list);
    PIVX = pv.PIVX; PIVZ = pv.PIVZ;
  }

  let S=1, OX=0, OY=0, DPR=1, PROG=1, YAW=0, Q=0;
  let width=0, height=0;
  let RCYL=0, YMINs=0, YMAXs=0;
  let FILL = opts.fill !== undefined ? opts.fill : 0.69;
  let ENTRY_R = 40, ENTRY_V = 60;

  // fitCanvas (ref 596-632), minus the DOM half — see CONTRACT.md §1.4
  function fitCanvas(vp){
    DPR = Math.min(vp.dpr || 1, 2);
    width  = Math.round(vp.cssW * DPR);
    height = Math.round(vp.cssH * DPR);

    RCYL = 0; const rAt = new Map();
    for(let i=0;i<N;i++){
      const d = Math.hypot(AX[i]-PIVX, AZ[i]-PIVZ);
      if(d > RCYL) RCYL = d;
      const pv = rAt.get(AY[i]); if(pv===undefined || d>pv) rAt.set(AY[i], d);
    }
    YMINs = 1e9; YMAXs = -1e9;
    rAt.forEach(function(r,y){ const h = r*Math.SQRT2*0.5;
      if(-h-y < YMINs) YMINs = -h-y;  if(h-y > YMAXs) YMAXs = h-y; });
    const sxHalf = RCYL*Math.SQRT2*COS30;
    const hw = 1.74, hh = 2.0;                       // worst-case hexagon margin
    const wU = 2*sxHalf + 2*hw, hU = (YMAXs-YMINs) + 2*hh;
    S  = Math.min((width*FILL)/wU, (height*FILL)/hU);
    OX = width/2;                                    // axis dead centre
    OY = height/2 - ((YMINs+YMAXs)/2)*S;
    ENTRY_R = (width/2)/(COS30*S) + 4;
    ENTRY_V = ((height/2)/S + 18)/0.375;
  }

  let T_TOTAL = opts.ms !== undefined ? opts.ms : 4200;
  let TURNS = opts.turns !== undefined ? opts.turns : 1;
  const F = Object.assign({}, DEFAULT_F);
  const D = Object.assign({}, DEFAULT_D);
  let PART_ORDER = DEFAULT_PART_ORDER.slice();
  function STAGGER(){ return F.stagger*T_TOTAL; }

  let FR0=null,FA0=null,FW=null,FR=null,FA=null,FY0=null,FDLY=null;

  function buildFlight(){
    FR0=new Float32Array(N); FA0=new Float32Array(N); FW=new Float32Array(N);
    FR =new Float32Array(N); FA =new Float32Array(N); FY0=new Float32Array(N);
    FDLY=new Float32Array(N);
    flightRange(0, N);
  }
  function flightRange(lo, hi){
    const n = hi - lo;
    // --- EXACT half/half sides via a shuffled parity array (ref 685-689)
    const side=new Int8Array(n);
    for(let i=0;i<n;i++) side[i] = i < (n>>1) ? -1 : 1;
    for(let i=n-1;i>0;i--){ const j=Math.floor(rnd(lo+i,11)*(i+1)); const t=side[i]; side[i]=side[j]; side[j]=t; }

    // --- schedule: part-ordered, within-part tiebreak
    const idx=[]; for(let i=lo;i<hi;i++) idx.push(i);
    const keyOf = function(i){
      switch(F.within){
        case 'height': return AY[i];
        case 'radial': return Math.hypot(AX[i]-PIVX, AZ[i]-PIVZ);
        case 'random': return rnd(i,31);
        default:       return AX[i]+AY[i]+AZ[i];
      }
    };
    idx.sort(function(a,b){
      const pa=PART_ORDER.indexOf(APART[a]), pb=PART_ORDER.indexOf(APART[b]);
      if(pa!==pb) return pa-pb;
      return keyOf(a) - keyOf(b);
    });
    const stg = STAGGER();
    for(let k=0;k<n;k++) FDLY[idx[k]] = n>1 ? stg*k/(n-1) : 0;

    let ySum=0; for(let i=lo;i<hi;i++) ySum+=AY[i];
    const yMid = ySum/n;

    for(let i=lo;i<hi;i++){
      const ax=AX[i]-PIVX, az=AZ[i]-PIVZ;
      const uf=ax-az, vf=ax+az;
      FR[i]=Math.hypot(uf,vf); FA[i]=Math.atan2(vf,uf);
      // entry angle: 0 = screen-right, PI = screen-left, +-35deg of spread
      const a0 = (side[i-lo]>0 ? 0 : Math.PI) + (rnd(i,3)-0.5)*(70*Math.PI/180);
      FA0[i] = a0;
      // constant unwind, tiny jitter: one speed for all (non-legacy branch only)
      FW[i] = (TURNS + (rnd(i,9)-0.5)*F.angJit)*Math.PI*2;
      const aS = FA[i] + FW[i];                    // the angle the block really starts at (ea=0)
      const rH = ENTRY_R / Math.max(1e-3, Math.abs(Math.cos(aS)));
      const rV = ENTRY_V / Math.max(1e-3, Math.abs(Math.sin(aS)));
      FR0[i] = Math.min(rH, rV) * (1 + rnd(i,5)*F.jitter);   // one-sided jitter, as before
      // entry height: 55% toward the block's own final height, 45% free
      FY0[i] = AY[i]*F.yMix + (yMid + (rnd(i,7)-0.5)*F.yFree)*(1-F.yMix);
    }
  }

  const EASE_FN = smooth;   // ftune's o.ease is ignored in wave 1; always smoothstep
  const _uv = [0,0,0];

  // world (u, v, y) for block i at global progress p in [0,1] (ref 780-794)
  function flightAt(i, p, out){
    const ms = p*T_TOTAL;
    const tau = clamp01((ms - FDLY[i]) / (F.flight*T_TOTAL));
    if(tau >= 1){ const ax=AX[i]-PIVX, az=AZ[i]-PIVZ; out[0]=ax-az; out[1]=ax+az; out[2]=AY[i]; return 1; }
    const t = EASE_FN(tau);
    const rho = Math.min(F.rhoMax, Math.max(F.rhoMin, FR[i]/FR0[i]));
    const ea  = F.rational*(rho*t)/(1-(1-rho)*t) + (1-F.rational)*t;
    const r   = FR0[i] + (FR[i]-FR0[i])*t;
    const a   = FA[i] + FW[i]*(1-ea);
    const vs  = 1 - F.vwin*(1-t);
    out[0] = r*Math.cos(a);
    out[1] = r*Math.sin(a)*vs;
    out[2] = FY0[i] + (AY[i]-FY0[i])*t;
    return tau;
  }

  let DU=null, DV=null, DUP=null, DDLY=null;
  function buildDisperse(){
    DU=new Float32Array(N); DV=new Float32Array(N);
    DUP=new Float32Array(N); DDLY=new Float32Array(N);
    disperseRange(0, N);
  }
  function disperseRange(lo, hi){
    let maxR = 1e-6, minY = 1e9, maxY = -1e9;
    for(let i=lo;i<hi;i++){ if(FR[i]>maxR) maxR=FR[i];
      if(AY[i]<minY) minY=AY[i]; if(AY[i]>maxY) maxY=AY[i]; }
    for(let i=lo;i<hi;i++){
      // blocks on the axis have no meaningful outward direction - give them one
      const ang = FR[i] > 0.6 ? FA[i] : rnd(i,21)*Math.PI*2;
      const OUT = D.outK * (width/2)/(COS30*S);
      const UP  = D.upK  * (height/S);
      const rad = OUT * (D.outMin + (1-D.outMin)*(FR[i]/maxR)) * (0.75 + rnd(i,23)*0.5);
      DU[i]  = Math.cos(ang)*rad;
      DV[i]  = Math.sin(ang)*rad;
      const rL = Math.hypot(AX[i]-PIVX, AZ[i]-PIVZ);   // landed radius from the axis, in u
      const dR = Math.hypot(DU[i], DV[i]);              // outward push, in u
      const needU = (OY/S + rL*0.5 - AY[i]) + dR*0.5 + 3.5;   // worst case over all yaws
      DUP[i] = Math.max(needU, UP*D.upMin) * (1 + rnd(i,25)*0.55);
      // top of the bouquet releases first
      const hNorm = (AY[i]-minY)/Math.max(1e-6,(maxY-minY));
      DDLY[i] = D.stagger * (1-hNorm) * (0.7 + rnd(i,27)*0.6);
    }
  }

  function disperseAt(i, q, out){
    if(q <= 0) return;
    const d = DDLY[i];
    const e = (q - d) / Math.max(1e-6, 1 - d);          // NOT clamped above 1
    if(e <= 0) return;
    const eOut = Math.pow(e, 1.35);
    const eUp  = e*(1 + 0.55*e)/1.55;
    out[0] += DU[i]*eOut;
    out[1] += DV[i]*eOut;
    out[2] += DUP[i]*eUp;
  }

  const COL = PALETTE.map(function(){ return ['#fff','#fff','#fff']; });

  let lastDrawn = 0, lastOnscreen = 0;
  let laidOut = false;
  let lastVp;

  // computePivot + pack, then (only once layout() has run at least once)
  // fitCanvas + buildFlight + buildDisperse with vp ?? lastVp — the tail of
  // ref's rebuild(), minus draw(). Before the first layout() this only
  // regenerates the volume-derived state, per CONTRACT.md §1.3.
  function rebuildAfterConfig(vp){
    computePivot(SURFACE);
    pack(SURFACE);
    if(laidOut){
      const useVp = vp !== undefined ? vp : lastVp;
      fitCanvas(useVp);
      lastVp = useVp;
      buildFlight();
      buildDisperse();
    }
  }

  // ---- construction: prewarmTones -> SRC=build() -> setFill(true) ->
  //      computePivot(SURFACE) -> pack(SURFACE). Flight/dispersal need a
  //      layout and are NOT built yet (ref 1090-1092, minus the layout tail).
  for(let i=0;i<PALETTE.length;i++) for(let q=0;q<=160;q++) toneFor(i, q/128);
  setFill(true);
  computePivot(SURFACE);
  pack(SURFACE);

  function layout(vp){
    fitCanvas(vp);
    lastVp = vp;
    if(!laidOut){
      buildFlight();
      laidOut = true;
    }
    buildDisperse();
    return { width, height, dpr: DPR };
  }

  // relayout(vp) — like layout(), but UNCONDITIONALLY rebuilds flight (not
  // just disperse). layout() only calls buildFlight() the first time
  // (ref/CONTRACT §1.3: flight is built once, at first layout); a later
  // resize therefore left FR0/FA0/FW (the entry radius/angle/spin, all
  // derived from ENTRY_R/ENTRY_V, which fitCanvas recomputes from the new
  // viewport) stale from whatever size the model first laid out at. Not a
  // reference/compat.resize bug fix — see CHANGES.md — this is a new entry
  // point for callers (the driver) that resize mid-flight and need the
  // entry geometry to match the CURRENT size, not the first one.
  function relayout(vp){
    fitCanvas(vp);
    lastVp = vp;
    laidOut = true;
    buildFlight();
    buildDisperse();
    return { width, height, dpr: DPR };
  }

  // setDpr(dpr) — relayout at the current cssW/cssH with a new (capped) DPR.
  function setDpr(dpr){
    if(!laidOut) throw new Error('bouquet: layout() must be called first');
    const capped = Math.min(dpr || 1, 2);
    const vp = Object.assign({}, lastVp, { dpr: capped });
    return relayout(vp);
  }

  // landed() — true once the flight-in has fully completed AND any
  // dispersal has been fully retracted (q back to 0 or below).
  function landed(){ return PROG >= 1 && Q <= 0; }

  function set(o){
    if(!o) return;
    if(o.p !== undefined) PROG = clamp01(o.p);
    if(o.q !== undefined) Q = Math.max(0, o.q);
    if(o.yaw !== undefined){ let d = o.yaw; while(d > 180) d -= 360; while(d < -180) d += 360; YAW = d; }
  }

  function frame(){
    if(!laidOut) throw new Error('bouquet: layout() must be called first');
    const th = YAW*Math.PI/180, ct = Math.cos(th), st = Math.sin(th);
    const flying  = PROG < 1;
    const doSort  = !flying || YAW !== 0;
    const useCull = PROG >= 1 && Q <= 0 && YAW === 0;

    const ExX=(ct+st)*COS30*S, ExY=(ct-st)*0.5*S;
    const EzX=(st-ct)*COS30*S, EzY=(st+ct)*0.5*S;
    const EyY=-S;
    const vxp=(ct-st)>0, vzp=(st+ct)>0;
    const drawXFace = Math.abs(EzX) >= 0.5;
    const drawZFace = Math.abs(ExX) >= 0.5;
    const sgnX = vxp ? 1 : -1, sgnZ = vzp ? 1 : -1;
    const shTop = AMB + LY;
    const shX   = AMB + sgnX*(LX*ct - LZ*st);
    const shZ   = AMB + sgnZ*(LX*st + LZ*ct);
    for(let i=0;i<PALETTE.length;i++){
      COL[i][0]=toneFor(i,shTop); COL[i][1]=toneFor(i,shX); COL[i][2]=toneFor(i,shZ);
    }

    const list = [];
    const p = PROG, q = Q;
    for(let k=0;k<N;k++){
      const i = k;
      if(useCull && ACULL[i]) continue;
      flightAt(i, p, _uv);
      if(q > 0) disperseAt(i, q, _uv);      // in the bouquet's own space
      const ax = (_uv[0] + _uv[1])*0.5;
      const az = (_uv[1] - _uv[0])*0.5;
      const xr =  ax*ct + az*st;
      const zr = -ax*st + az*ct;
      list.push({i: i, u: xr-zr, v: xr+zr, y: _uv[2], pal: APAL[i], d: xr + _uv[2] + zr});
    }
    if(doSort) list.sort(function(a,b){ return a.d-b.d; });

    let onscreen = 0; const M = 2.2*S;   // a cube's projected extent, with margin
    for(let k=0;k<list.length;k++){
      const c = list[k];
      const X = OX + c.u*COS30*S;
      const Y = OY + (c.v*0.5 - c.y)*S;
      if(X > -M && X < width + M && Y > -M && Y < height + M) onscreen++;
      frameX[k] = X; frameY[k] = Y; framePal[k] = c.pal;
    }

    lastDrawn = list.length;
    lastOnscreen = onscreen;

    return {
      n: list.length,
      X: frameX, Y: frameY, pal: framePal,
      tone: COL,
      basis: { ExX, ExY, EzX, EzY, EyY, vxp, vzp, drawXFace, drawZFace },
      onscreen,
      width, height,
    };
  }

  function state(){
    return {
      N, surface: SURFACE.length, voxels: VOL.size, drawn: lastDrawn, onscreen: lastOnscreen,
      S, DPR, p: PROG, q: Q, yaw: YAW, fill: FILL, fillHollow: HOLLOW_FILLED, width, height,
    };
  }

  function sets(){ return { all: VOL.size, surface: N, visible: NVIS }; }

  function project(x, y, z){
    if(!laidOut) throw new Error('bouquet: layout() must be called first');
    const ax = x - PIVX, az = z - PIVZ, r = YAW*Math.PI/180, ct = Math.cos(r), st = Math.sin(r);
    const xr = ax*ct + az*st, zr = -ax*st + az*ct;
    return { X: OX + (xr - zr)*COS30*S, Y: OY + ((xr + zr)*0.5 - y)*S };
  }

  function basis(){ return { S, OX, OY, yaw: YAW, pivX: PIVX, pivZ: PIVZ, cos30: COS30 }; }

  function params(o, vp){
    applyParamsPatch(P, P_ORIG, o);
    SRC = build(P);
    setFill(HOLLOW_FILLED);
    rebuildAfterConfig(vp);
    return Object.assign({}, P);
  }

  function tune(o){
    o = o || {};
    if(o.turns !== undefined) TURNS = o.turns;
    if(o.ms !== undefined) T_TOTAL = o.ms;
    if(laidOut) buildFlight();   // before the first layout(), layout() builds it (CONTRACT §1.3)
    return { TURNS, T_TOTAL };
  }

  function fit(f, vp){
    if(!laidOut) throw new Error('bouquet: layout() must be called first');
    if(f !== undefined) FILL = f;
    const useVp = vp !== undefined ? vp : lastVp;
    fitCanvas(useVp);
    lastVp = useVp;
    buildFlight();
    buildDisperse();
    return FILL;
  }

  function dtune(o){
    Object.assign(D, o || {});
    if(laidOut) buildDisperse();   // needs FR/FA and a layout (CONTRACT §1.3)
    return Object.assign({}, D);
  }

  function ftune(o, vp){
    o = o || {};
    Object.assign(F, o);
    if(o.order){ const next = setOrder(o.order); if(next) PART_ORDER = next; }
    if(o.fillHollow !== undefined && !!o.fillHollow !== HOLLOW_FILLED){
      setFill(o.fillHollow);
      rebuildAfterConfig(vp);
    } else if(laidOut){
      buildFlight();
    }
    return Object.assign({}, F, { order: PART_ORDER.slice(), fillHollow: HOLLOW_FILLED });
  }

  return {
    layout, relayout, setDpr, landed,
    set, frame, state, sets, project, basis, params, tune, fit, dtune, ftune,
  };
}
