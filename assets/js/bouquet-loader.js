/* bouquet-loader.js — the voxel-cube bouquet as the site's first-paint loader.
 *
 * SOURCE: ~/Desktop/Vyomi's Birthday/Experiments/bouquet/disperse.html (v6),
 * lines 59-852, copied by scratchpad/assemble.js with ten asserted edits:
 * no DPR <select> (cap 2) · size from the canvas's parent box · no pin rig ·
 * transparent ground (clearRect, alpha canvas) · no axis crosshair ·
 * TURNS 0.4 / T_TOTAL 4200 / FILL 0.69 defaults (owner-picked) · constant
 * unwind per block (uniform angular speed) · FILL 0.46 default · fly-in clearance solved at the true
 * start angle (a real bug at any turn count other than 1, see edit 8 in the
 * assembler). Otherwise the maths, the generator, the schedule and the draw
 * loop are UNCHANGED. Read bouquet/NOTES.md before
 * touching anything below the driver.
 *
 * Removed entirely (the loader never needs them): the #hudbar inspection rig,
 * pointer/wheel input, setYaw (yaw is fixed at 0, so the diagonal cull is
 * always valid at rest: 710 cubes drawn, not 1,519), and the benchmark.
 *
 * API (window.BouquetLoader):
 *   mount(canvas)        -> renderer {setP, setQ, fit, tune, state, draw, bench}
 *   shouldRun()          -> {run:boolean, why:string}
 *   run(opts)            -> Promise<'played'|'skipped'>, drives #bq-loader end to end
 */
(function(){

// ===========================================================================
// DRIVER — everything above is the renderer, verbatim. This is the loader.
// ===========================================================================
function mount(canvas){
  const cv  = canvas;
  const ctx = cv.getContext('2d', {alpha:true});   // transparent: the overlay owns the ground
  // ---------------------------------------------------------------------------
  // PALETTE  [top, +X side, +Z side]
  // Face tones are CONSTANT in screen space: cubes never change orientation as
  // the model turns (see render()), so a face's tone is fixed for all time.
  // ---------------------------------------------------------------------------
  const PALETTE = [
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
  // ---------------------------------------------------------------------------
  // CONTINUOUS SHADING
  //
  // Every cube is axis-aligned and identical, so the whole model has just FIVE
  // distinct face normals (+y, +-x, +-z). The shade therefore depends only on
  // the face orientation and the yaw - not on the cube - so it is computed 5x
  // per frame instead of once per cube. O(1) in cube count.
  //
  // The light is fixed in CAMERA space, so as the camera orbits a face's shade
  // varies smoothly instead of snapping between three discrete tones.
  //
  // L and the ambient term are SOLVED from the reference itself: its tone
  // ratios are top:+x:+z ~= 1.00:0.78:0.56, so with shade = A + n.L and
  // A = 0.35 we need n.L = 0.65 / 0.43 / 0.21 for +y / +x / +z. That makes
  // L = (0.43, 0.65, 0.21) and reproduces the reference exactly at yaw 0.
  // ---------------------------------------------------------------------------
  const AMB = 0.35, LX = 0.43, LY = 0.65, LZ = 0.21;
  const S_TOP = AMB+LY, S_PX = AMB+LX, S_PZ = AMB+LZ;   // 1.00 / 0.78 / 0.56
  
  function hex2rgb(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
  function rgb2hex(c){ return '#'+c.map(function(v){ return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'); }).join(''); }
  
  // Per-material ramp anchored on the reference's own three colours, with a
  // fourth control point extrapolated by continuing the +x -> +z channel ratio
  // so faces turned away from the light keep going darker smoothly.
  const RAMP = PALETTE.map(function(t){
    const c0=hex2rgb(t[0]), c1=hex2rgb(t[1]), c2=hex2rgb(t[2]);
    const r  = [0,1,2].map(function(i){ return c1[i]>0 ? c2[i]/c1[i] : 0.72; });
    const c3 = [0,1,2].map(function(i){ return c2[i]*r[i]; });
    const c4 = [0,1,2].map(function(i){ return c3[i]*r[i]; });
    return [[1.30,c0],[S_TOP,c0],[S_PX,c1],[S_PZ,c2],[S_PZ-0.22,c3],[-1,c4]];
  });
  
  // Memoised on shade quantised to 1/128 - imperceptible, and it means each
  // colour string is built at most once for the life of the page.
  const TONE_CACHE = new Map();
  function toneFor(pal, sh){
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
  }
  
  const PALNAME = ['crimson*','crimson ctr','rose mid','rose mid ctr','rose light',
                   'rose light ctr','cream paper*','olive*','dark green*','bright green*'];
  // * = still an eyeballed estimate. rose mid / rose light are SAMPLED values;
  // their side tones are solved for a constant OKLab dL of 0.090, which is the
  // step the rest of the palette already used (measured 0.088-0.092).
  const PETAL = [[0,1],[2,3],[4,5]];
  const CSEQ  = [2,1,0,2,1,2,1,0,2,1,2,0];   // ~25% crimson / 33% mid / 42% pale
  
  // ---------------------------------------------------------------------------
  // PARAMS
  // ---------------------------------------------------------------------------
  const P = {
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
  // GENERATOR
  // ---------------------------------------------------------------------------
  // Cells store  pal | (part << 4).  The schedule assembles armature-first, so
  // it needs to know what each cube belongs to. Blooms are part 0 -> unchanged.
  const PART = { BLOOM:0, LEAF:1, PAPER:2, RIBBON:3, STEM:4 };
  const PARTNAME = ['bloom','leaf','paper','ribbon','stem'];
  function key(x,y,z){ return x+','+y+','+z; }
  
  // Dome height profile, shared by blooms, canopy foliage AND underfill.
  // Blends sphere with cone: a pure sphere has zero slope at its apex, so the
  // top blooms all round to one cube height and the dome plateaus.
  function domeY(u){
    const c = Math.min(1, Math.max(0, u));
    const prof = P.domeCone*(1-c) + (1-P.domeCone)*Math.sqrt(Math.max(0,1-c*c));
    return P.domeCY + P.domeR*P.domeSquash*prof;
  }
  
  function greenAt(x,y,z){
    return ((x*7+z*13+y) % 5 === 0) ? 9 : ((x+z) % 2 ? 7 : 8);
  }
  
  // A bloom is built from SQUARE (Chebyshev) rings, not a radius-thresholded
  // annulus.
  //
  // WHY: a square border is always a CLOSED, face-connected loop, and an
  // unbroken ring around a recessed dark centre is exactly what makes a bloom
  // read as a flower in the reference. Radius thresholds fail at small sizes -
  // measured, the medium bloom emitted 4 inner + 8 outer cells of which ALL 12
  // had no face neighbour, so the most numerous bloom in the bouquet was twelve
  // disconnected specks rather than a flower.
  //
  // Profile per size: [chebyshev ring, height offset]. Centre sits below the
  // innermost ring so it reads as recessed.
  // Reference's widest bloom is ~5 cubes across, so nothing goes to 7. The
  // large size differs by HEIGHT, not footprint: ring 2 is doubled to give it a
  // two-cube-tall outer wall, which reads as a fuller, deeper rose.
  // Ring spec is [chebyshev k, height offset, cut]. cut=1 drops the four
  // CORNERS of that ring.
  //
  // Complete square rings made every bloom read as a heavy square terrace.
  // Cutting the corners of the outer/lower rings does two things at once: it
  // lightens the bloom, and it rounds the silhouette toward the octagonal
  // blooms in the reference. Ring 1 is never cut - that closed inner loop is
  // what makes a bloom read as a flower at all.
  const BLOOM = {
    1: { rings: [[1, 0, 0]],                        ctr: -1, fp: 1 },  // 3 wide, 1 level
    2: { rings: [[1, 0, 0], [2, -1, 1]],            ctr: -1, fp: 2 },  // 5 wide, 2 levels
    3: { rings: [[1, 1, 0], [2, 0, 1], [2, -1, 0]], ctr:  0, fp: 2 },  // 5 wide, 3 levels
  };
  
  // pass 'outer' lays the wide rings, pass 'inner' lays ring 1 plus the centre.
  // Running ALL outer rings before ANY inner ring stops a neighbouring bloom's
  // petals from eating the ring that defines this flower.
  function addBloom(cells, cx, cy, cz, R, pPetal, pCtr, pass){
    const spec = BLOOM[R] || BLOOM[2];
    // deterministic per-bloom variation so the blooms are not identical -
    // one extra mid-edge cell comes off roughly half of them
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
  
  function build(){
    const cells = new Map();
    const GA = Math.PI*(3-Math.sqrt(5));
    const bloomAt = [];
  
    // ---- blooms: golden-angle spiral, size INDEPENDENT of spiral index
    //      (the spiral puts low indices at the top centre, so "first N are
    //      large" crams every big bloom into one overlapping plateau)
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
      const cy = Math.round(domeY(Math.sin(phi)));
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
    for(const b of bloomAt) addBloom(cells, b[0],b[1],b[2],b[3], b[4][0], b[4][1], 'outer');
    for(const b of bloomAt) addBloom(cells, b[0],b[1],b[2],b[3], b[4][0], b[4][1], 'inner');
  
    // ---- canopy foliage: green in the gaps between blooms
    if(P.foliage){
      const FR = P.foliageR;
      for(let x=-Math.ceil(FR); x<=Math.ceil(FR); x++){
        for(let z=-Math.ceil(FR); z<=Math.ceil(FR); z++){
          const rxz = Math.hypot(x,z);
          if(rxz > FR) continue;
          const yTop = Math.round(domeY(rxz/P.domeR) - P.foliageDrop);
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
  
    // ---- greenery UNDERFILL: the void between the canopy underside and the
    //      paper rim was reading as empty space you could see through.
    if(P.underfill){
      const UR = P.underfillR;
      for(let x=-Math.ceil(UR); x<=Math.ceil(UR); x++){
        for(let z=-Math.ceil(UR); z<=Math.ceil(UR); z++){
          const r = Math.hypot(x,z);
          if(r > UR) continue;
          const yTop = Math.round(domeY(r/P.domeR)) - 1;
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
  
    // ---- gathered handle: a SHELL around the stems, not a solid plug, so the
    //      paper visibly wraps OUTSIDE the stem bundle
    for(let y=P.handleY0; y<=P.handleY1; y++){
      const r = P.handleR;
      const lim = Math.ceil(r)+1;
      for(let x=-lim; x<=lim; x++) for(let z=-lim; z<=lim; z++){
        const d = Math.hypot(x,z);
        if(d > r+0.4 || d < r-P.handleThick) continue;
        cells.set(key(x,y,z), 6 | (PART.PAPER<<4));
      }
    }
  
    // ---- stems: ONE tight bundle, contiguous, running from below the paper
    //      up inside it. No gaps between stems.
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
    //
    // Authored in a SCREEN-ALIGNED frame: a = steps along the screen
    // horizontal, b = height, c = outward from the axis.
    //
    // One +a step is a face-connected staircase (+x then -z), which projects to
    // pure screen-horizontal with only a half-cube zigzag. Authoring in the 45
    // degree diagonal frame (as I did before) moves x by -0.707 and z by +0.707
    // per step, so Math.round collapses every step onto a corner-touching
    // diagonal and the shape dissolves.
    //
    // The loops are RINGS WITH HOLES. That is the whole visual signature of a
    // bow - you see through each loop. Solid lumps read as a blob no matter how
    // they are shaped or sized.
    if(P.bow){
      // a -> lattice offset, as a face-connected staircase
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
      // one cube deep so the hole stays open; loops sit above the knot and
      // the right one reaches a little further, as a tied bow does
      for(const L of RING) put(-P.bowSpread + L[0], 2 + L[1], OUT, 0);
      for(const L of RING) put( P.bowSpread + L[0], 2 + L[1], OUT, 0);
      // a couple of cells joining each loop back to the knot
      put(-2, 1, OUT, 0); put(-2, 2, OUT, 0);
      put( 2, 1, OUT, 0); put( 2, 2, OUT, 0);
  
      // tails — hang from under the knot, one cube wide, drifting apart.
      // a>0 is screen-right, so the right tail must drift a>0 and the left a<0.
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
  
  // ===========================================================================
  // PHASE 2 RENDER PATH
  //
  // Differs from index.html in four ways, all of them prerequisites for the
  // fly-in. No animation yet — p is wired but every block sits at p = 1.
  //
  //  1. DIAGONAL CULL. At yaw 0 the view ray IS the (1,1,1) lattice diagonal,
  //     so a cube with (x+1,y+1,z+1) occupied projects to the identical hexagon
  //     and can never be seen. Measured: 1519 -> 710 drawn (53.3%), 1422
  //     differing pixels of 168416 (0.84%), visually indistinguishable.
  //     Licensed ONLY by fixed yaw 0 — void the moment the camera orbits.
  //  2. FIXED FRAMING. S / ox / oy are computed ONCE from the landed model and
  //     held for every p. index.html re-fits per frame, which would rubber-band
  //     the whole bouquet as blocks converge.
  //  3. SoA TYPED ARRAYS + FROZEN DRAW ORDER. Order is sorted once by final
  //     depth. Blocks interpenetrate in flight, so no per-object order is
  //     correct anyway — a stable wrong order is invisible in motion where a
  //     flickering correct one is not. Also removes ~25k allocations/frame.
  //  4. DPR DONE PROPERLY. index.html had none: backing store from innerWidth
  //     with no CSS size, pad in backing px, and an S cap that did not scale,
  //     so the model shrank to a third at dpr 3.
  // ===========================================================================
  
  const COS30 = Math.sqrt(3)/2;
  
  // ---- build the volume ------------------------------------------------------
  const SRC = build();
  function srcAt(x,y,z){ return SRC.has(key(x,y,z)); }
  
  // surface cells: anything not fully enclosed
  const SURFACE = [];
  SRC.forEach(function(v,k){
    const q = k.split(','), x=+q[0], y=+q[1], z=+q[2];
    if(srcAt(x+1,y,z) && srcAt(x-1,y,z) && srcAt(x,y+1,z) &&
       srcAt(x,y-1,z) && srcAt(x,y,z+1) && srcAt(x,y,z-1)) return;
    SURFACE.push([x,y,z, v & 15, v >> 4]);          // x,y,z,pal,part
  });
  // diagonal cull — exactly covered along the view ray at yaw 0
  const VISIBLE = SURFACE.filter(function(c){ return !srcAt(c[0]+1,c[1]+1,c[2]+1); });
  
  // ---- SoA, frozen order -----------------------------------------------------
  let N=0, AX,AY,AZ,APAL,APART;
  function pack(list){
    // sort ONCE, back-to-front by final depth; ES2019 guarantees a stable sort
    const s = list.slice().sort(function(a,b){ return (a[0]+a[1]+a[2])-(b[0]+b[1]+b[2]); });
    N = s.length;
    AX=new Float32Array(N); AY=new Float32Array(N); AZ=new Float32Array(N);
    APAL=new Uint8Array(N); APART=new Uint8Array(N); ACULL=new Uint8Array(N);
    for(let i=0;i<N;i++){
      AX[i]=s[i][0]; AY[i]=s[i][1]; AZ[i]=s[i][2]; APAL[i]=s[i][3]; APART[i]=s[i][4];
      ACULL[i] = srcAt(s[i][0]+1, s[i][1]+1, s[i][2]+1) ? 1 : 0;
    }
  }
  
  // ---- fixed frame, computed once from the LANDED model ----------------------
  let PIVX=0, PIVZ=0, S=1, OX=0, OY=0, DPR=1, PROG=1, YAW=0;
  // ACULL[i]=1 when this cube is exactly covered along the (1,1,1) view ray.
  // PROVEN valid only at yaw 0: forcing it on at yaw 12 differed from the honest
  // render by 486,274 pixels of 2,378,376. So it is a per-frame SKIP gated on
  // yaw===0, not a removal from the model.
  let ACULL=null, RCYL=0, YMINs=0, YMAXs=0;
  let FILL = 0.69;        // share of the viewport the landed bouquet occupies (FIT() overrides)
  function computePivot(list){
    let sx=0, sz=0;
    for(let i=0;i<list.length;i++){ sx+=list[i][0]; sz+=list[i][2]; }
    PIVX = list.length ? sx/list.length : 0;
    PIVZ = list.length ? sz/list.length : 0;
  }
  function fitCanvas(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = cv.parentNode.clientWidth  || window.innerWidth;
    const cssH = cv.parentNode.clientHeight || window.innerHeight;
    cv.style.width  = cssW + 'px';        // CSS size, so the page never overflows
    cv.style.height = cssH + 'px';
    cv.width  = Math.round(cssW * DPR);   // backing store
    cv.height = Math.round(cssH * DPR);
  
    // Yaw-INVARIANT frame, ported from index.html's proven renderSolid: size
    // from the bounding CYLINDER about the axis (tightened by a per-height
    // radius profile), and put the AXIS DEAD CENTRE horizontally. A bounding
    // box would rubber-band the whole bouquet as it turns; deriving ox from a
    // bbox was one of the bugs in my first attempt at this.
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
    // The model occupies FILL of the viewport, not all of it. Fitting it to the
    // whole canvas leaves the dispersal nowhere to travel: blocks would exit
    // almost immediately. The remaining margin IS the animation's runway.
    const wU = 2*sxHalf + 2*hw, hU = (YMAXs-YMINs) + 2*hh;
    S  = Math.min((cv.width*FILL)/wU, (cv.height*FILL)/hU);
    OX = cv.width/2;                                 // axis dead centre
    OY = cv.height/2 - ((YMINs+YMAXs)/2)*S;
    // entry radius derived from the LIVE canvas, in u-units, + a hexagon margin.
    // A hardcoded offset is a guaranteed visible bug in one direction or the
    // other: mobile-tuned leaves blocks parked inside a desktop margin.
    ENTRY_R = (cv.width/2)/(COS30*S) + 4;
    ENTRY_V = ((cv.height/2)/S + 18)/0.375;
  }
  
  // ---- shading: 3 dot products per frame, not per cube ------------------------
  // Yaw is fixed at 0 for the loader, so this is constant — but keep the shape
  // so the fly-in can vary it later without restructuring.
  
  let COL = PALETTE.map(function(){ return ['#fff','#fff','#fff']; });
  function buildTones(){
    const ct=1, st=0;                                   // yaw 0
    const shTop = AMB + LY, shX = AMB + (LX*ct - LZ*st), shZ = AMB + (LX*st + LZ*ct);
  }
  function prewarmTones(){                              // never build a string mid-flight
    for(let i=0;i<PALETTE.length;i++) for(let q=0;q<=160;q++) toneFor(i, q/128);
  }
  
  let   T_TOTAL = 4200;                 // ms  (TUNE() overrides)
  let   TURNS   = 0.4;                  // turns every block unwinds (+-0.06), see edit 10
  // beats as FRACTIONS of T_TOTAL, so they follow the duration
  const BEATS_F = [
    ['entry',    0.00, 0.07], ['spread',   0.07, 0.31], ['the turn', 0.31, 0.56],
    ['funnel',   0.56, 0.69], ['assembly', 0.69, 0.98], ['stillness',0.98, 1.00],
  ];
  // Proportional to T_TOTAL, or changing the duration only appends dead time
  // and per-frame displacement never improves. 0.29 + 0.69 = 0.98 of T.
  function STAGGER(){ return 0.29*T_TOTAL; }
  function FLIGHT(){  return 0.69*T_TOTAL; }
  const PART_ORDER = [4, 2, 1, 0, 3];   // stem, paper, leaf, bloom, RIBBON LAST
  
  // deterministic hash - never Math.random, or scrubbing stops reproducing
  function h32(i){ let h=Math.imul(i^0x9E3779B9,2654435761)>>>0; h^=h>>>15;
                   h=Math.imul(h,2246822519)>>>0; h^=h>>>13; return h>>>0; }
  function rnd(i,salt){ return (h32(i*7919 + salt*104729)>>>8)/16777216; }
  
  let FR0,FA0,FW,FR,FA,FY0,FDLY;        // per-block flight table (SoA)
  let ENTRY_R = 40, ENTRY_V = 60;
  
  function buildFlight(){
    FR0=new Float32Array(N); FA0=new Float32Array(N); FW=new Float32Array(N);
    FR =new Float32Array(N); FA =new Float32Array(N); FY0=new Float32Array(N);
    FDLY=new Float32Array(N);
  
    // --- EXACT half/half sides. A hash bit gives 50/50 only in expectation
    //     (sigma ~ 19.5 blocks); a shuffled parity array gives it exactly.
    const side=new Int8Array(N);
    for(let i=0;i<N;i++) side[i] = i < (N>>1) ? -1 : 1;
    for(let i=N-1;i>0;i--){ const j=Math.floor(rnd(i,11)*(i+1)); const t=side[i]; side[i]=side[j]; side[j]=t; }
  
    // --- schedule: part-ordered, depth tiebreak (back to front) inside a part
    const idx=[]; for(let i=0;i<N;i++) idx.push(i);
    idx.sort(function(a,b){
      const pa=PART_ORDER.indexOf(APART[a]), pb=PART_ORDER.indexOf(APART[b]);
      if(pa!==pb) return pa-pb;
      return (AX[a]+AY[a]+AZ[a]) - (AX[b]+AY[b]+AZ[b]);
    });
    const stg = STAGGER();
    for(let k=0;k<N;k++) FDLY[idx[k]] = N>1 ? stg*k/(N-1) : 0;
  
    let ySum=0; for(let i=0;i<N;i++) ySum+=AY[i];
    const yMid = ySum/N;
  
    for(let i=0;i<N;i++){
      const ax=AX[i]-PIVX, az=AZ[i]-PIVZ;
      const uf=ax-az, vf=ax+az;
      FR[i]=Math.hypot(uf,vf); FA[i]=Math.atan2(vf,uf);
      // entry angle: 0 = screen-right, PI = screen-left, +-35deg of spread
      const a0 = (side[i]>0 ? 0 : Math.PI) + (rnd(i,3)-0.5)*(70*Math.PI/180);
      // Entry radius must clear the canvas AT THIS BLOCK'S OWN ANGLE. A flat
      // radius only clears it on the horizontal axis: at 35deg off-axis the
      // horizontal reach is cos(35)=0.82 of it, so the block spawns INSIDE the
      // frame. Measured 438 of 710 visible at p=0 before this divide.
      //  ^ one-sided: a +-10% jitter can multiply by 0.9 and undo the clearance
      FA0[i] = a0;
      // unwind a full TURNS from the entry angle down to the final angle
      FW[i] = (TURNS + (rnd(i,9)-0.5)*0.12)*Math.PI*2;   // constant unwind, tiny jitter: one speed for all
      const aS = FA[i] + FW[i];                    // the angle the block really starts at (ea=0)
      const rH = ENTRY_R / Math.max(1e-3, Math.abs(Math.cos(aS)));
      const rV = ENTRY_V / Math.max(1e-3, Math.abs(Math.sin(aS)));
      FR0[i] = Math.min(rH, rV) * (1 + rnd(i,5)*0.2);   // one-sided jitter, as before
      // entry height: 55% toward the block's own final height, 45% free
      FY0[i] = AY[i]*0.55 + (yMid + (rnd(i,7)-0.5)*26)*0.45;
    }
  }
  
  const smooth = function(x){ return x*x*(3-2*x); };
  const clamp01 = function(x){ return x<0?0:x>1?1:x; };
  
  // world (u, v, y) for block i at global progress p in [0,1]
  function flightAt(i, p, out){
    const ms = p*T_TOTAL;
    const tau = clamp01((ms - FDLY[i]) / (0.69*T_TOTAL));
    if(tau >= 1){ const ax=AX[i]-PIVX, az=AZ[i]-PIVZ; out[0]=ax-az; out[1]=ax+az; out[2]=AY[i]; return 1; }
    const t = smooth(tau);
    const rho = Math.min(0.50, Math.max(0.06, FR[i]/FR0[i]));
    const ea  = 0.55*(rho*t)/(1-(1-rho)*t) + 0.45*t;
    const r   = FR0[i] + (FR[i]-FR0[i])*t;
    const a   = FA[i] + FW[i]*(1-ea);
    const vs  = 1 - 0.25*(1-t);
    out[0] = r*Math.cos(a);
    out[1] = r*Math.sin(a)*vs;
    out[2] = FY0[i] + (AY[i]-FY0[i])*t;
    return tau;
  }
  
  // ===========================================================================
  // PHASE 3 — DISPERSAL.  Scroll or swipe down: the blocks separate and fly up
  // and apart.
  //
  // Driven by a SCROLL SCALAR q, not by time. That is forced by the input: a
  // scroll-linked animation must scrub BOTH ways, so scrolling back up has to
  // reassemble the bouquet. Time-based ballistics cannot run backwards - once
  // you integrate velocity you have destroyed the ability to seek. So every
  // trajectory here is a closed-form function of q, exactly like the fly-in is
  // a closed-form function of p.
  //
  // "Up AND apart" is two separate eases on two separate axes:
  //   outward  eOut = q^1.35   accelerating  - they part slowly, then commit
  //   upward   eUp  = q*(1+0.55q)/1.55   accelerating - they exit the top
  // Outward distance scales with each block's OWN radius, so the bouquet opens
  // outward like a hand releasing rather than translating as a slab.
  //
  // q = 0 is the landed bouquet, bit-identical to phase 2. q = 1 is clear.
  // ===========================================================================
  let   Q = 0;
  // out/up are DERIVED from the live canvas in fitCanvas(), not hardcoded.
  // A fixed distance is the same bug class as a fixed entry radius: measured,
  // 278 of 710 blocks (39%) never left a 43u-tall viewport on a 34u rise.
  // outK/upK are multiples of the visible extent, so travel tracks the frame.
  // outK 2.2 = blocks carry to ~1.3x the half-frame, so the swarm fills the
  // width and exits the sides as well as the top. Widening this is safe: the
  // per-block clearance below includes the +DV*0.5 v-coupling term, so a wider
  // spread automatically raises the rise needed and the frame still clears.
  const D = { outK: 2.2, outMin: 0.62, upK: 1.30, upMin: 0.55, stagger: 0.30, spin: false };
  let DU, DV, DUP, DDLY;
  
  
  function buildDisperse(){
    DU=new Float32Array(N); DV=new Float32Array(N);
    DUP=new Float32Array(N); DDLY=new Float32Array(N);
    let maxR = 1e-6, minY = 1e9, maxY = -1e9;
    for(let i=0;i<N;i++){ if(FR[i]>maxR) maxR=FR[i];
      if(AY[i]<minY) minY=AY[i]; if(AY[i]>maxY) maxY=AY[i]; }
    for(let i=0;i<N;i++){
      // blocks on the axis have no meaningful outward direction - give them one
      const ang = FR[i] > 0.6 ? FA[i] : rnd(i,21)*Math.PI*2;
      const OUT = D.outK * (cv.width/2)/(COS30*S);      // half the frame, in u
      const UP  = D.upK  * (cv.height/S);                // frame height, in u
      const rad = OUT * (D.outMin + (1-D.outMin)*(FR[i]/maxR)) * (0.75 + rnd(i,23)*0.5);
      DU[i]  = Math.cos(ang)*rad;
      DV[i]  = Math.sin(ang)*rad;
      // Per-block: compute how far THIS block must rise to clear the top of
      // the frame, then add variation ON TOP. Scaling a shared maximum by a
      // random fraction leaves the slowest blocks short - measured, 18 of 710
      // never left. Guaranteeing the minimum keeps every block exiting while
      // still varying how fast it gets there.
      // Rise needed to clear the top, accounting for the fact that the OUTWARD
      // motion also shifts the block vertically: screen Y = OY + (v*0.5 - y)*S,
      // so a positive-v block is pushed DOWN and partly cancels its own rise.
      // Ignoring that coupling left 7 of 710 on screen at q=1.
      const ax0=AX[i]-PIVX, az0=AZ[i]-PIVZ;
      const Y0 = OY + ((ax0+az0)*0.5 - AY[i])*S;      // landed screen Y, px
      const needU = Y0/S + DV[i]*0.5 + 3.5;           // in u, incl. the v-coupling
      DUP[i] = Math.max(needU, UP*D.upMin) * (1 + rnd(i,25)*0.55);
      // top of the bouquet releases first - it is what a hand opening looks like
      const hNorm = (AY[i]-minY)/Math.max(1e-6,(maxY-minY));
      DDLY[i] = D.stagger * (1-hNorm) * (0.7 + rnd(i,27)*0.6);
    }
  }
  
  function disperseAt(i, q, out){
    if(q <= 0) return;
    const d = DDLY[i];
    const e = clamp01((q - d) / Math.max(1e-6, 1 - d));
    if(e <= 0) return;
    const eOut = Math.pow(e, 1.35);
    const eUp  = e*(1 + 0.55*e)/1.55;
    out[0] += DU[i]*eOut;
    out[1] += DV[i]*eOut;
    out[2] += DUP[i]*eUp;
  }
  
  // ---- draw ------------------------------------------------------------------
  const _uv=[0,0,0];
  
  function draw(){
    const th = YAW*Math.PI/180, ct = Math.cos(th), st = Math.sin(th);
    // WHEN TO SORT.
    //
    // The frozen order is sorted by depth AT YAW 0, and it is only justifiable
    // during the fly-in, where blocks interpenetrate so no order is correct and
    // a stable wrong one beats a flickering right one.
    //
    // It is NOT justifiable once the model is rotated: at yaw 146 the yaw-0
    // order is badly wrong and wrong painter order shows as triangular speckle
    // across the paper. My previous condition (PROG>=1 && Q<=0) meant a single
    // stray scroll nudging q to 0.001 silently disabled the sort. MEASURED:
    // q 0 -> 0.001 changed 507,387 px (22.3% of frame) while the largest block
    // moved 0.0317 units - proof the change was the sort, not the dispersal.
    //
    // So: sort whenever the fly-in is done, OR whenever the model is rotated.
    const flying  = (PROG < 1);
    const doSort  = !flying || YAW !== 0;
    const useCull = (PROG >= 1 && Q <= 0 && YAW === 0);
  
    // --- screen basis + shading: index.html's renderSolid, unchanged.
    // Direction is carried by sgnX/sgnZ inside the SHADE. There is NO tone
    // swap on top of that - adding one double-counts the direction, which is
    // exactly what broke my first attempt.
    const ExX=(ct+st)*COS30*S, ExY=(ct-st)*0.5*S;
    const EzX=(st-ct)*COS30*S, EzY=(st+ct)*0.5*S;
    const EyY=-S;
    const vxp=(ct-st)>0, vzp=(st+ct)>0;
    // THE FIX for full 360. At yaw +-45 and +-135 one side face collapses to
    // EXACTLY zero projected width. It contributes no fill - but we still
    // STROKE it (the stroke seals the seams between a cube's three faces and
    // cannot be dropped), and a stroke on a degenerate quad paints a visible
    // hairline. 1519 stray hairlines is the diagonal streaking.
    // A face's screen width is the |x| of the basis vector it does NOT contain:
    // the x-face spans Ey+Ez so its width is |EzX|; the z-face spans Ey+Ex so
    // its width is |ExX|. Skip below half a pixel. These are per-FRAME
    // constants, so this costs two comparisons for the whole frame.
    const drawXFace = Math.abs(EzX) >= 0.5;
    const drawZFace = Math.abs(ExX) >= 0.5;
    const sgnX = vxp ? 1 : -1, sgnZ = vzp ? 1 : -1;
    const shTop = AMB + LY;
    const shX   = AMB + sgnX*(LX*ct - LZ*st);
    const shZ   = AMB + sgnZ*(LX*st + LZ*ct);
    for(let i=0;i<PALETTE.length;i++){
      COL[i][0]=toneFor(i,shTop); COL[i][1]=toneFor(i,shX); COL[i][2]=toneFor(i,shZ);
    }
  
    // --- gather. Sort every frame when at rest (that is the state the user
    // rotates and inspects, so it must be correct); keep the frozen order in
    // flight, where blocks interpenetrate and no order is correct anyway.
    const list = [];
    const p = PROG, q = Q;
    for(let i=0;i<N;i++){
      if(useCull && ACULL[i]) continue;
      flightAt(i, p, _uv);
      if(q > 0) disperseAt(i, q, _uv);
      // _uv is (u,v,y) in the yaw-0 basis. Recover (ax,az) and rotate exactly
      // the way index.html does, then re-project.
      const ax = (_uv[0] + _uv[1])*0.5;
      const az = (_uv[1] - _uv[0])*0.5;
      const xr =  ax*ct + az*st;
      const zr = -ax*st + az*ct;
      list.push({u: xr-zr, v: xr+zr, y: _uv[2], pal: APAL[i], d: xr + _uv[2] + zr});
    }
    if(doSort) list.sort(function(a,b){ return a.d-b.d; });
  
    // Optional PIN: cancel the horizontal wander caused by the asymmetric bow
    // orbiting the axis. Uses the CENTROID of drawn cube centres, not the
    // bounding box: a bbox jumps whenever one extreme cube appears or
    // disappears, which is what made an earlier attempt read as rubber-banding.
    // Scale S is untouched, so this is a pure translation.
    const pinDX = 0;
  
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.lineWidth=1; ctx.lineJoin='miter';
    for(let k=0;k<list.length;k++){
      const c=list[k], t=COL[c.pal];
      const X = OX + c.u*COS30*S + pinDX;
      const Y = OY + (c.v*0.5 - c.y)*S;
      const bxX = vxp ? X+ExX : X, bxY = vxp ? Y+ExY : Y;
      const bzX = vzp ? X+EzX : X, bzY = vzp ? Y+EzY : Y;
      if(drawXFace) q4(bxX, bxY, bxX, bxY+EyY, bxX+EzX, bxY+EyY+EzY, bxX+EzX, bxY+EzY, t[1]);
      if(drawZFace) q4(bzX, bzY, bzX, bzY+EyY, bzX+ExX, bzY+EyY+ExY, bzX+ExX, bzY+ExY, t[2]);
      q4(X, Y+EyY, X+ExX, Y+EyY+ExY, X+ExX+EzX, Y+EyY+ExY+EzY, X+EzX, Y+EyY+EzY, t[0]);
    }
    LAST_DRAWN = list.length;
  }
  
  // scalar args, no arrays: the old quad() allocated 4 pairs per face = ~25k/frame
  function q4(x1,y1,x2,y2,x3,y3,x4,y4,fill){
    ctx.beginPath();
    ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.lineTo(x4,y4);
    ctx.closePath();
    ctx.fillStyle=fill; ctx.fill();
    // stroke seals the seams between THIS cube's three quads, not between
    // neighbours: 11.6% of interior pixels bleed without it. Do not remove.
    ctx.strokeStyle=fill; ctx.stroke();
  }

  function rebuild(){
    computePivot(SURFACE); pack(SURFACE); buildTones(); fitCanvas(); buildFlight(); buildDisperse(); draw();
  }
  function bench(frames){
    // FLUSHED timing (getImageData forces rasterisation) — same method as the source
    return new Promise(function(resolve){
      const FR = frames || 120, flush = [], gaps = [];
      let i = 0, last = performance.now();
      (function step(){
        const t0 = performance.now(); draw(); ctx.getImageData(0,0,1,1);
        const t2 = performance.now();
        if(i > 0){ flush.push(t2 - t0); gaps.push(t2 - last); }
        last = t2;
        if(++i < FR) requestAnimationFrame(step);
        else {
          const med = function(a){ const s=a.slice().sort(function(x,y){return x-y;}); return s[s.length>>1]; };
          const p99 = function(a){ const s=a.slice().sort(function(x,y){return x-y;}); return s[Math.floor(s.length*0.99)]; };
          resolve({ drawn: LAST_DRAWN, dpr: DPR, w: cv.width, h: cv.height,
                    flushedMed: med(flush), flushedP99: p99(flush), gapMed: med(gaps),
                    dropped: gaps.filter(function(g){ return g > 20; }).length, frames: gaps.length });
        }
      })();
    });
  }
  prewarmTones();
  rebuild();
  return {
    setP: function(v){ PROG = clamp01(v); draw(); },
    setQ: function(v){ Q = clamp01(v); draw(); },
    setYaw: function(deg){ let d = deg; while(d > 180) d -= 360; while(d < -180) d += 360; YAW = d; draw(); },   // full 360, no clamp (NOTES v5), fractional degrees
    fit:  function(f){ if(f !== undefined) FILL = f; fitCanvas(); buildFlight(); buildDisperse(); draw(); return FILL; },
    tune: function(o){ o = o || {}; if(o.turns !== undefined) TURNS = o.turns; if(o.ms !== undefined) T_TOTAL = o.ms; buildFlight(); draw(); return {TURNS:TURNS, T_TOTAL:T_TOTAL}; },
    state: function(){ return {N:N, surface:SURFACE.length, voxels:SRC.size, drawn:LAST_DRAWN, S:S, DPR:DPR, p:PROG, q:Q, yaw:YAW}; },
    resize: function(){ fitCanvas(); buildDisperse(); draw(); },
    draw: draw,
    bench: bench
  };
}

// --- when NOT to play ---------------------------------------------------------
// A loader is a curtain, not a progress bar: this site is static and paints in
// well under a second, so the sequence costs the visitor ~4 s it did not need.
// It is worth that once. It is not worth it on a deep link (a recruiter
// following #settlr wants the case study, not a bouquet), not twice in one
// tab, and never under reduced motion.
function shouldRun(){
  const sp = new URLSearchParams(location.search);
  if(sp.has('noloader')) return {run:false, why:'?noloader'};
  if(sp.has('loader'))   return {run:true,  why:'?loader forces it'};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return {run:false, why:'prefers-reduced-motion'};
  if(location.hash && location.hash !== '#') return {run:false, why:'deep link ' + location.hash};
  try{ if(sessionStorage.getItem('bq-seen')) return {run:false, why:'already played this tab (sessionStorage bq-seen)'}; }catch(e){}
  // Headless/automated browsers never see it, so the 206-check gate in tests/ is
  // unaffected; a loader test forces it with ?loader.
  if(navigator.webdriver) return {run:false, why:'navigator.webdriver'};
  return {run:true, why:'first paint of this tab'};
}

const EASE_IN  = function(x){ return x*x*(3-2*x); };                 // smoothstep
const EASE_OUT = function(x){ return 1 - Math.pow(1 - x, 3); };

// opts: {root, canvas, label, flyMs, turns, fill, holdMs, exitMs, scrollRange, yawIn, exit:'scroll'|'disperse'|'fade', remember, lockScroll, force}
function run(opts){
  opts = opts || {};
  const root   = opts.root   || document.getElementById('bq-loader');
  const canvas = opts.canvas || (root && root.querySelector('canvas'));
  if(!root || !canvas) return Promise.resolve('skipped');
  const decision = opts.force ? {run:true, why:'forced'} : shouldRun();
  root.dataset.why = decision.why;
  if(!decision.run){ root.remove(); return Promise.resolve('skipped'); }

  const FLY  = opts.flyMs  || 4200;
  const HOLD = opts.holdMs !== undefined ? opts.holdMs : 420;
  const EXIT = opts.exitMs || 1850;
  const MODE = opts.exit || 'scroll';          // 'scroll' (scrubbed, both ways) | 'disperse' (timed) | 'fade'
  const lock = opts.lockScroll !== false;
  const label = opts.label || root.querySelector('.bq-label');

  if(lock) document.documentElement.classList.add('bq-lock');
  root.hidden = false;
  const api = mount(canvas);
  api.tune({turns: opts.turns !== undefined ? opts.turns : 0, ms: FLY});
  if(opts.fill) api.fit(opts.fill);
  api.setP(0);                                   // p=0 draws nothing (NOTES: 0 visible)
  const onResize = function(){ api.resize(); };
  addEventListener('resize', onResize);

  const RANGE = opts.scrollRange || 800;   // px of scroll for a full dispersal
  // --- camera turn DURING the assembly. The camera comes around the forming
  // bouquet and arrives front-on with the last cube (yaw -> 0 at p = 1), so the
  // landed state is the cheap culled one.
  const YAW_IN = opts.yawIn !== undefined ? opts.yawIn : -360;   // degrees the camera sweeps through
  // Linear, not eased: any ease-out decelerates into 0 and the last stretch
  // reads as stopped while cubes are still landing (measured on contact sheets).
  const yawAt = function(p){ return YAW_IN * (1 - clamp01(p)); };   // STRICTLY linear: constant angular speed until the landed frame, then still
  const hint  = root.querySelector('.bq-hint');

  return new Promise(function(resolve){
    const t0 = performance.now();
    let phase = 'fly', qTarget = 0, qShown = 0, exitT0 = 0;
    // --- scroll-scrubbed exit: wheel / touch drive q both ways, like the birthday page.
    // The page itself does not move (scroll stays locked): the input is swallowed at
    // capture so the site's eased-scroll loop never sees it, and q is what scrolls.
    function onWheel(e){ if(phase !== 'scroll') return; e.preventDefault(); e.stopImmediatePropagation(); qTarget = clamp01(qTarget + e.deltaY / RANGE); }
    let ty = null;
    function onTS(e){ ty = e.touches[0].clientY; }
    function onTM(e){ if(phase !== 'scroll' || ty === null) return; e.preventDefault(); e.stopImmediatePropagation(); const y = e.touches[0].clientY; qTarget = clamp01(qTarget + (ty - y) / (RANGE*0.6)); ty = y; }
    function onKey(e){ if(phase !== 'scroll') return; const d = {ArrowDown:1, PageDown:3, ' ':3, ArrowUp:-1, PageUp:-3}[e.key]; if(d){ e.preventDefault(); qTarget = clamp01(qTarget + d*0.12); } }
    function arm(){ addEventListener('wheel', onWheel, {passive:false, capture:true}); addEventListener('touchstart', onTS, {passive:true, capture:true}); addEventListener('touchmove', onTM, {passive:false, capture:true}); addEventListener('keydown', onKey, true); }
    function disarm(){ removeEventListener('wheel', onWheel, true); removeEventListener('touchstart', onTS, true); removeEventListener('touchmove', onTM, true); removeEventListener('keydown', onKey, true); }
    function ground(q){ root.style.setProperty('--bq-ground', String(1 - EASE_OUT(clamp01((q - 0.25) / 0.6)))); }
    function finish(){
      disarm(); removeEventListener('resize', onResize);
      root.remove();
      if(lock){ document.documentElement.classList.remove('bq-lock'); dispatchEvent(new Event('resize')); }   // Windows: scrollbar returns, stacks re-measure
      if(opts.remember !== false){ try{ sessionStorage.setItem('bq-seen', '1'); }catch(err){} }
      dispatchEvent(new CustomEvent('bq-loader:done'));
      resolve('played');
    }
    root.__state = function(){ return {phase:phase, qTarget:qTarget, qShown:qShown}; };   // for the bench / tests

    (function tick(){
      const e = performance.now() - t0;
      if(phase === 'fly'){
        const p = e / FLY;
        api.setYaw(yawAt(p)); api.setP(p);
        if(label) label.style.opacity = clamp01((p - 0.62) / 0.30);   // rises with the assembly beat
        if(p < 1) return requestAnimationFrame(tick);
        api.setYaw(0); api.setP(1); phase = 'hold'; return requestAnimationFrame(tick);
      }
      if(phase === 'hold'){
        if(e < FLY + HOLD) return requestAnimationFrame(tick);
        if(MODE === 'scroll'){ phase = 'scroll'; arm(); if(hint) hint.style.opacity = 1; }
        else { phase = 'exit'; exitT0 = e; }
        root.classList.add('is-leaving');
        return requestAnimationFrame(tick);
      }
      if(phase === 'scroll'){
        // lerp the shown q toward the scrolled target: wheel notches arrive in
        // steps, and a step in q is a step in 1,519 block positions
        qShown += (qTarget - qShown) * 0.16;
        if(Math.abs(qTarget - qShown) < 0.0008) qShown = qTarget;
        api.setQ(qShown); ground(qShown);
        if(hint)  hint.style.opacity  = String(1 - clamp01(qShown / 0.15));
        if(label) label.style.opacity = String(1 - clamp01(qShown / 0.3));
        if(qShown >= 1) return finish();
        return requestAnimationFrame(tick);
      }
      // timed exit (kept as an option)
      const x = clamp01((e - exitT0) / EXIT);
      if(MODE === 'disperse'){ api.setQ(EASE_IN(x)); ground(EASE_IN(x)); }
      else { root.style.setProperty('--bq-ground', String(1 - EASE_OUT(x))); canvas.style.opacity = String(1 - EASE_OUT(x)); }
      if(label) label.style.opacity = String(1 - clamp01(x / 0.4));
      if(x < 1) return requestAnimationFrame(tick);
      finish();
    })();
  });
  function clamp01(x){ return x<0?0:x>1?1:x; }
}

window.BouquetLoader = { mount: mount, shouldRun: shouldRun, run: run };
})();
