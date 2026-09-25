/* bouquet-loader.js — the voxel-cube bouquet as the site's first-paint loader.
 *
 * RENDERER: the birthday experiment's disperse.html (v6), from
 * ~/Desktop/Vyomi's Birthday/Experiments/bouquet/ — the generator, the
 * projection, the fly-in schedule and the draw loop. Read bouquet/NOTES.md
 * there before touching anything inside mount(). Changes from that source:
 *   - no inspection rig, no pointer input of its own, no benchmark HUD;
 *     transparent ground (the overlay owns the colour), DPR capped at 2
 *   - collar and handle plugged with paper (enclosed at rest, so free)
 *   - fly-in: clearance solved at the block's true start angle; one unwind
 *     for every block (uniform angular speed); launch order and the within-part
 *     key are tunable (F); the flight-shape constants live in F for the bench
 *   - burst: rise sized to clear the top from ANY camera angle; progress not
 *     clamped at 1; outward spread 3.4 (D)
 *   - per-block easing table kept but parked (see EASES)
 *
 * DRIVER: run() plays the sequence on #bq-loader — fly-in with a linear
 * camera sweep, greeting, then a scroll-scrubbed dispersal (wheel / touch /
 * keys; side-scroll or drag turns the camera) that hands off once no cube is
 * left in the frame. shouldRun() holds the skip rules and the kill switch.
 *
 * API (window.BouquetLoader):
 *   mount(canvas) -> renderer {
 *     setP(p) setQ(q) setYaw(deg) fit(f) tune(o) ftune(o) dtune(o) state() resize() draw() bench(n)
 *
 *     EXPLAINER HOOKS (2026-09-16, for bouquet.html's beats). Every hook is
 *     additive: with none called the frame is byte-identical to the loader's.
 *     None starts a loop; each setter redraws once. resize()/fit()/tune()
 *     keep them. Indices i are the renderer's own: 0..N-1 is the surface set
 *     in its frozen (yaw-0 painter) order, N..all-1 the enclosed interior.
 *     cells()                 -> [{i,x,y,z,part,surface,visible}] one per cell of the
 *                                current volume, in yaw-0 painter order (far first).
 *                                visible = survives the diagonal cull at yaw 0.
 *                                Memoised until the model is rebuilt; do not mutate.
 *     sets()                  -> {all, surface, visible} counts (VOL.size / N / culled set)
 *     show(name?)             -> name. Which set is the draw list:
 *                                'auto' (default: cull at rest + yaw 0, else surface)
 *                                'all' (every cell, interior included, painter-sorted)
 *                                'surface' | 'visible' (the culled set even at yaw != 0,
 *                                so rotation exposes the gaps). Omit to read.
 *     tint(fn|null)           -> fn(cell) returns a CSS colour or null (material's own).
 *                                The override is shaded per face by a straight multiply
 *                                with the face's shade factor (1.00/0.78/0.56 at yaw 0),
 *                                not the material ramp; strings memoised per colour.
 *     alpha(fn|null)          -> fn(cell) returns 0..1 (null = 1); ctx.globalAlpha per
 *                                cube, so a cube's own face seams show through below 1.
 *     drawLimit(n|null)       -> paint only the first n of the sorted list (far first);
 *                                state().drawn reports what was actually painted.
 *     sortInFlight(bool?)     -> true re-sorts every frame while flying (the flicker);
 *                                false (default) keeps the frozen order in flight.
 *     params(o|null)          -> merges o into the CURRENT P (like ftune), then
 *                                regenerates the model, its surface/visible sets,
 *                                frame, flight and dispersal; null restores the
 *                                original P exactly. Returns a copy of P. Unknown
 *                                keys ignored, non-finite numbers dropped, domeR /
 *                                wrapStep clamped >= 1 (0 makes NaN cells). Big
 *                                radii/ranges or wrapY0 > wrapY1 just cost cells.
 *     path(i, samples=32)     -> [{u,v,y}] cube i's fly-in sampled p=0..1 in the current
 *                                flight build (yaw-0 basis); deterministic.
 *     order()                 -> Int32Array of cell indices i in the order the LAST
 *                                draw() painted them, first = painted first (farthest).
 *                                length === state().drawn. It is whatever that frame
 *                                did: frozen order in flight, depth-sorted when landed,
 *                                yaw != 0 or sortInFlight(true), the show() set, cut by
 *                                drawLimit. A fresh copy per call; nothing per frame.
 *     rank(i)                 -> position of cell i in order(), or -1 if that frame
 *                                did not paint it. Reverse map built lazily on the
 *                                first rank() after a draw, reused until the next.
 *                                (Beat 4: tint cubes whose rank moved between frames.)
 *     legacy(o|null)          -> {clearance, sides}. Puts the two renderer bugs the
 *                                loader fixed back, one at a time, rebuilding the
 *                                flight (same hash jitter, so still deterministic):
 *                                {clearance:true} sizes the entry radius at the ENTRY
 *                                angle a0 = start - TURNS*360deg (horizontal reach
 *                                only, cos floored at 0.35) instead of at the true
 *                                start angle: right by luck at turns 1, inside the
 *                                frame at any other turns (state().onscreen at p=0).
 *                                {sides:true} ties the unwind to the random entry side:
 *                                blocks unwind anywhere within a full revolution of
 *                                TURNS (measured 0.49..1.50 at turns 1) and the
 *                                swarm enters from two sides, not all around.
 *                                Only keys present change; null restores both to
 *                                false. Omit o to read.
 *     project(x, y, z)        -> {X, Y} canvas pixels (not CSS px) of a point in the
 *                                model's lattice coords (same frame as cells(): x/z
 *                                across, y up, pivot at the model's axis), at the
 *                                current yaw, S and origin. Fractional coords fine.
 *                                Lets a beat draw grids/markers in the bouquet's own
 *                                projection. Also basis() -> {S, OX, OY, yaw, pivX,
 *                                pivZ, cos30} for anyone who needs the raw numbers.
 *     canvas()                -> the element.  snapshot() -> ImageData of the frame.
 *   }
 *   shouldRun()   -> {run:boolean, why:string}
 *   run(opts)     -> Promise<'played'|'skipped'>
 */
(function(){

const clamp01 = function(x){ return x<0?0:x>1?1:x; };

// ===========================================================================
// RENDERER — mount() wraps the experiment's renderer around one canvas.
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
  let SRC = build();                   // params() regenerates it
  const P_ORIG = Object.assign({}, P); // params(null) restores this
  let VOL = SRC;                       // the volume in use (SRC, or SRC + hollow fill)
  function srcAt(x,y,z){ return VOL.has(key(x,y,z)); }
  
  // surface cells: anything not fully enclosed
  let SURFACE = [];
  function surfaceOf(vol){ const out = []; vol.forEach(function(v,k){
    const q = k.split(','), x=+q[0], y=+q[1], z=+q[2];
    if(srcAt(x+1,y,z) && srcAt(x-1,y,z) && srcAt(x,y+1,z) &&
       srcAt(x,y-1,z) && srcAt(x,y,z+1) && srcAt(x,y,z-1)) return;
    out.push([x,y,z, v & 15, v >> 4]); }); return out; }
  SRC.forEach(function(v,k){
    const q = k.split(','), x=+q[0], y=+q[1], z=+q[2];
    if(srcAt(x+1,y,z) && srcAt(x-1,y,z) && srcAt(x,y+1,z) &&
       srcAt(x,y-1,z) && srcAt(x,y,z+1) && srcAt(x,y,z-1)) return;
    SURFACE.push([x,y,z, v & 15, v >> 4]);          // x,y,z,pal,part
  });
  
  // ---- HOLLOW FILL (bench option). The collar and handle are shells with air
  //      inside, so mid-flight you look straight through the bouquet. This
  //      plugs that air with paper. Every added cell is enclosed at rest, so the
  //      diagonal cull skips it and the landed frame costs nothing extra.
  function filledVolume(){
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
  let HOLLOW_FILLED = true;             // owner default 2026-09-16: collar + handle plugged with paper
  function setFill(on){
    HOLLOW_FILLED = !!on;
    VOL = HOLLOW_FILLED ? filledVolume() : SRC;
    SURFACE = surfaceOf(VOL);
  }

  // ---- SoA, frozen order -----------------------------------------------------
  // N is the surface set and every loop below runs over it exactly as before.
  // The enclosed INTERIOR is appended at N..NT-1 (explainer hooks only): it
  // never enters the default draw, and its flight is scheduled over its own
  // range, so nothing about the first N entries changes.
  let N=0, NT=0, NVIS=0, AX,AY,AZ,APAL,APART, ORDER=null, CELL=null, CELLS=null;
  function pack(list){
    // sort ONCE, back-to-front by final depth; ES2019 guarantees a stable sort
    const s = list.slice().sort(function(a,b){ return (a[0]+a[1]+a[2])-(b[0]+b[1]+b[2]); });
    N = s.length;
    const inner = [];                                   // cells of VOL not in the list
    if(VOL.size > N){
      const seen = new Set(); for(let i=0;i<N;i++) seen.add(key(s[i][0],s[i][1],s[i][2]));
      VOL.forEach(function(v,k){ if(seen.has(k)) return; const q=k.split(','); inner.push([+q[0],+q[1],+q[2], v & 15, v >> 4]); });
      inner.sort(function(a,b){ return (a[0]+a[1]+a[2])-(b[0]+b[1]+b[2]); });
    }
    NT = N + inner.length;
    AX=new Float32Array(NT); AY=new Float32Array(NT); AZ=new Float32Array(NT);
    APAL=new Uint8Array(NT); APART=new Uint8Array(NT); ACULL=new Uint8Array(NT);
    NVIS = 0;
    for(let i=0;i<NT;i++){
      const c = i < N ? s[i] : inner[i-N];
      AX[i]=c[0]; AY[i]=c[1]; AZ[i]=c[2]; APAL[i]=c[3]; APART[i]=c[4];
      ACULL[i] = srcAt(c[0]+1, c[1]+1, c[2]+1) ? 1 : 0;
      if(i < N && !ACULL[i]) NVIS++;
    }
    // painter order over the WHOLE volume (show('all')): a stable merge of the
    // two depth-sorted runs, surface first on ties
    ORDER = new Int32Array(NT); for(let i=0;i<NT;i++) ORDER[i]=i;
    ORDER = Int32Array.from(Array.from(ORDER).sort(function(a,b){ return (AX[a]+AY[a]+AZ[a])-(AX[b]+AY[b]+AZ[b]); }));
    CELL = null; CELLS = null;                          // cells() rebuilds lazily
  }
  function ensureCells(){
    if(CELL) return;
    CELL = new Array(NT);
    for(let i=0;i<NT;i++) CELL[i] = {i:i, x:AX[i], y:AY[i], z:AZ[i], part:APART[i], surface:i<N, visible:i<N && !ACULL[i]};
    CELLS = new Array(NT); for(let k=0;k<NT;k++) CELLS[k] = CELL[ORDER[k]];
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
  let   TURNS   = 1.0;                  // turns every block unwinds (±F.angJit/2); run() and the bench set it via tune()
  // beats as FRACTIONS of T_TOTAL, so they follow the duration
  const BEATS_F = [
    ['entry',    0.00, 0.07], ['spread',   0.07, 0.31], ['the turn', 0.31, 0.56],
    ['funnel',   0.56, 0.69], ['assembly', 0.69, 0.98], ['stillness',0.98, 1.00],
  ];
  // Proportional to T_TOTAL, or changing the duration only appends dead time
  // and per-frame displacement never improves. 0.29 + 0.69 = 0.98 of T.
  // FLIGHT TUNING: the constants that shape the fly-in, as a live object so the
  // bench can drive them (FTUNE). Defaults are the source's literals.
  const F = { stagger: 0.29, flight: 0.69, rational: 0.55, rhoMin: 0.06, rhoMax: 0.50, vwin: 0.25, yMix: 0.55, yFree: 26, jitter: 0.20, angJit: 0.12, within: 'height' };   // within: 'height' (owner pick 2026-09-16; source used depth)
  function STAGGER(){ return F.stagger*T_TOTAL; }
  function FLIGHT(){  return F.flight*T_TOTAL; }
  let PART_ORDER = [4, 3, 2, 1, 0];     // stem, RIBBON, paper, leaf, bloom (owner default 2026-09-16; source had ribbon last)
  function setOrder(str){ const m = {stem:4, paper:2, leaf:1, bloom:0, ribbon:3}; const o = String(str).split(',').map(function(n){ return m[n.trim()]; }).filter(function(i){ return i !== undefined; }); if(o.length === 5) PART_ORDER = o; }
  
  // deterministic hash - never Math.random, or scrubbing stops reproducing
  function h32(i){ let h=Math.imul(i^0x9E3779B9,2654435761)>>>0; h^=h>>>15;
                   h=Math.imul(h,2246822519)>>>0; h^=h>>>13; return h>>>0; }
  function rnd(i,salt){ return (h32(i*7919 + salt*104729)>>>8)/16777216; }
  
  let FR0,FA0,FW,FR,FA,FY0,FDLY;        // per-block flight table (SoA)
  let ENTRY_R = 40, ENTRY_V = 60;
  // legacy(): the two renderer bugs the loader fixed, switchable back one at a
  // time for the making-of page. Both default false = the loader's formulas.
  const LEGACY = { clearance: false, sides: false };
  
  function buildFlight(){
    FR0=new Float32Array(NT); FA0=new Float32Array(NT); FW=new Float32Array(NT);
    FR =new Float32Array(NT); FA =new Float32Array(NT); FY0=new Float32Array(NT);
    FDLY=new Float32Array(NT);
    flightRange(0, N);                  // the surface set: exactly the source's schedule
    if(NT > N) flightRange(N, NT);      // the interior, scheduled over its own range
  }
  function flightRange(lo, hi){
    const n = hi - lo;
    // --- EXACT half/half sides. A hash bit gives 50/50 only in expectation
    //     (sigma ~ 19.5 blocks); a shuffled parity array gives it exactly.
    const side=new Int8Array(n);
    for(let i=0;i<n;i++) side[i] = i < (n>>1) ? -1 : 1;
    for(let i=n-1;i>0;i--){ const j=Math.floor(rnd(lo+i,11)*(i+1)); const t=side[i]; side[i]=side[j]; side[j]=t; }
  
    // --- schedule: part-ordered, depth tiebreak (back to front) inside a part
    const idx=[]; for(let i=lo;i<hi;i++) idx.push(i);
    // Within a part, the launch order decides WHICH cubes arrive last. The
    // source used depth (back to front), so the final arrivals are one front
    // slice that reads as a detached clump. F.within picks the key.
    const keyOf = function(i){
      switch(F.within){
        case 'height': return AY[i];                                            // bottom up: the dome closes at the top
        case 'radial': return Math.hypot(AX[i]-PIVX, AZ[i]-PIVZ);               // centre out: it blooms from the middle
        case 'random': return rnd(i,31);                                        // scattered: last cubes dotted everywhere
        default:       return AX[i]+AY[i]+AZ[i];                                // depth, back to front (source)
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
      // Entry radius must clear the canvas AT THIS BLOCK'S OWN ANGLE. A flat
      // radius only clears it on the horizontal axis: at 35deg off-axis the
      // horizontal reach is cos(35)=0.82 of it, so the block spawns INSIDE the
      // frame. Measured 438 of 710 visible at p=0 before this divide.
      //  ^ one-sided: a +-10% jitter can multiply by 0.9 and undo the clearance
      FA0[i] = a0;
      // unwind a full TURNS from the entry angle down to the final angle
      if(LEGACY.sides){
        // BUG (b), verbatim from disperse.html: the unwind is whatever closes
        // the gap from the random side angle a0 to the final angle, plus
        // TURNS — so blocks unwind anywhere within a full revolution of TURNS
        // (TURNS +- 1/2), and the swarm enters from the two sides a0 was drawn from.
        let base = a0 - FA[i];
        base = base - Math.PI*2*Math.floor((base+Math.PI)/(Math.PI*2));  // to (-PI,PI]
        FW[i] = base + TURNS*Math.PI*2;
      } else {
        FW[i] = (TURNS + (rnd(i,9)-0.5)*F.angJit)*Math.PI*2;   // constant unwind, tiny jitter: one speed for all
      }
      const aS = FA[i] + FW[i];                    // the angle the block really starts at (ea=0)
      if(LEGACY.clearance){
        // BUG (a), verbatim from disperse.html: the radius clears the frame at
        // the ENTRY angle a0 = aS - TURNS*2PI (horizontal reach only, cos
        // floored at 0.35), not at the angle the block really starts from.
        // Right by coincidence at TURNS = 1 (a0 == aS mod 2PI); at any other
        // TURNS the block spawns inside the frame. With sides:false there is
        // no a0, so the same wrong angle is derived from the true start.
        const aOld = LEGACY.sides ? a0 : aS - TURNS*Math.PI*2;
        FR0[i] = (ENTRY_R / Math.max(0.35, Math.abs(Math.cos(aOld)))) * (1 + rnd(i,5)*F.jitter);
      } else {
        const rH = ENTRY_R / Math.max(1e-3, Math.abs(Math.cos(aS)));
        const rV = ENTRY_V / Math.max(1e-3, Math.abs(Math.sin(aS)));
        FR0[i] = Math.min(rH, rV) * (1 + rnd(i,5)*F.jitter);   // one-sided jitter, as before
      }
      // entry height: 55% toward the block's own final height, 45% free
      FY0[i] = AY[i]*F.yMix + (yMid + (rnd(i,7)-0.5)*F.yFree)*(1-F.yMix);
    }
  }
  
  const smooth = function(x){ return x*x*(3-2*x); };
  // Flight easings (F.ease, reachable through ftune({ease})). PARKED 2026-09-16:
  // the owner tried them on the bench and they did not read right, so the
  // bench no longer exposes the control. The table stays for a later attempt;
  // the default is smoothstep and index.html never sets ease.
  const EASES = {
    smoothstep: smooth,
    linear:     function(x){ return x; },
    inOutCubic: function(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2; },
    inOutQuint: function(x){ return x < 0.5 ? 16*x*x*x*x*x : 1 - Math.pow(-2*x+2, 5)/2; },
    outCubic:   function(x){ return 1 - Math.pow(1-x, 3); },
    outExpo:    function(x){ return x >= 1 ? 1 : 1 - Math.pow(2, -10*x); },
    inCubic:    function(x){ return x*x*x; },
    outBack:    function(x){ const c1 = 1.70158, c3 = c1 + 1; return 1 + c3*Math.pow(x-1, 3) + c1*Math.pow(x-1, 2); },
    inOutBack:  function(x){ const c = 1.70158*1.525; return x < 0.5 ? (Math.pow(2*x,2)*((c+1)*2*x - c))/2 : (Math.pow(2*x-2,2)*((c+1)*(x*2-2) + c) + 2)/2; },
    outElastic: function(x){ if(x <= 0) return 0; if(x >= 1) return 1; const c = (2*Math.PI)/3; return Math.pow(2, -10*x)*Math.sin((x*10 - 0.75)*c) + 1; },
    outBounce:  function(x){ const n = 7.5625, d = 2.75; if(x < 1/d) return n*x*x; if(x < 2/d) return n*(x -= 1.5/d)*x + 0.75; if(x < 2.5/d) return n*(x -= 2.25/d)*x + 0.9375; return n*(x -= 2.625/d)*x + 0.984375; }
  };
  let EASE_FN = smooth;
  
  // world (u, v, y) for block i at global progress p in [0,1]
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
  const D = { outK: 3.4, outMin: 0.62, upK: 1.30, upMin: 0.55, stagger: 0.30, spin: false };   // outK 3.4 (source 2.2): owner wanted it to disperse further out, 2026-09-16
  let DU, DV, DUP, DDLY;
  
  
  function buildDisperse(){
    DU=new Float32Array(NT); DV=new Float32Array(NT);
    DUP=new Float32Array(NT); DDLY=new Float32Array(NT);
    disperseRange(0, N);
    if(NT > N) disperseRange(N, NT);
  }
  function disperseRange(lo, hi){
    let maxR = 1e-6, minY = 1e9, maxY = -1e9;
    for(let i=lo;i<hi;i++){ if(FR[i]>maxR) maxR=FR[i];
      if(AY[i]<minY) minY=AY[i]; if(AY[i]>maxY) maxY=AY[i]; }
    for(let i=lo;i<hi;i++){
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
      // The burst lives in the BOUQUET'S space (up its axis, out from it) and
      // only the camera moves, so the rise must clear the top from ANY angle.
      // Rotating the camera rotates a block's (u,v) vector, so its on-screen
      // v can be anything up to its radius, and the outward push's v-coupling
      // can be anything up to |DV|. Size for that worst case.
      const rL = Math.hypot(AX[i]-PIVX, AZ[i]-PIVZ);   // landed radius from the axis, in u
      const dR = Math.hypot(DU[i], DV[i]);              // outward push, in u
      const needU = (OY/S + rL*0.5 - AY[i]) + dR*0.5 + 3.5;   // worst case over all yaws
      DUP[i] = Math.max(needU, UP*D.upMin) * (1 + rnd(i,25)*0.55);
      // top of the bouquet releases first - it is what a hand opening looks like
      const hNorm = (AY[i]-minY)/Math.max(1e-6,(maxY-minY));
      DDLY[i] = D.stagger * (1-hNorm) * (0.7 + rnd(i,27)*0.6);
    }
  }
  
  function disperseAt(i, q, out){
    if(q <= 0) return;
    const d = DDLY[i];
    const e = (q - d) / Math.max(1e-6, 1 - d);          // NOT clamped above 1: past the range the blocks keep going 
    if(e <= 0) return;
    const eOut = Math.pow(e, 1.35);
    const eUp  = e*(1 + 0.55*e)/1.55;
    out[0] += DU[i]*eOut;
    out[1] += DV[i]*eOut;
    out[2] += DUP[i]*eUp;
  }
  
  // ---- explainer hook state (defaults = the loader's own behaviour) -----------
  let SHOW = 'auto', TINT = null, ALPHA = null, LIMIT = null, SORT_FLY = false;
  // Tint overrides are shaded by a straight multiply with the face's shade
  // factor (the material ramp is per palette entry and has no meaning for an
  // arbitrary colour). Tones are memoised per colour string and rebuilt only
  // when the frame's shade triple changes, so a set tint costs no per-cube
  // string work on the hot path.
  const TINT_CACHE = new Map();
  let TINT_KEY = -1;
  function parseColour(str){
    ctx.fillStyle = str; const n = ctx.fillStyle;      // the canvas normalises it
    if(n[0] === '#') return [parseInt(n.slice(1,3),16), parseInt(n.slice(3,5),16), parseInt(n.slice(5,7),16), 1];
    const m = /rgba?\(([^)]+)\)/.exec(n);
    if(!m) return [255,255,255,1];
    const q = m[1].split(',').map(parseFloat);
    return [q[0], q[1], q[2], q.length > 3 ? q[3] : 1];
  }
  function tintTones(str, shTop, shX, shZ){
    let e = TINT_CACHE.get(str);
    if(e === undefined){ e = {key:-1, rgb:parseColour(str), t:['','','']}; TINT_CACHE.set(str, e); }
    if(e.key !== TINT_KEY){
      const c = e.rgb, sh = [shTop, shX, shZ];
      for(let f=0;f<3;f++){
        const m = sh[f]/S_TOP;
        const hex = rgb2hex([c[0]*m, c[1]*m, c[2]*m]);
        e.t[f] = c[3] < 1 ? 'rgba(' + parseInt(hex.slice(1,3),16) + ',' + parseInt(hex.slice(3,5),16) + ',' + parseInt(hex.slice(5,7),16) + ',' + c[3] + ')' : hex;
      }
      e.key = TINT_KEY;
    }
    return e.t;
  }

  // ---- draw ------------------------------------------------------------------
  const _uv=[0,0,0];
  let LAST_DRAWN = 0, LAST_ONSCREEN = 0;
  // order()/rank(): the list draw() painted last, kept by reference (no copy
  // per frame). RANK is a reverse map built lazily on the first rank() call
  // after a draw and reused until the next draw (RANK_FRAME tags the frame).
  let LAST_LIST = null, RANK = null, RANK_FRAME = -1, FRAME_NO = 0;
  function orderOut(){
    const n = LAST_LIST ? LAST_DRAWN : 0, out = new Int32Array(n);
    for(let k=0;k<n;k++) out[k] = LAST_LIST[k].i;
    return out;
  }
  function rankOf(i){
    if(!LAST_LIST) return -1;
    if(RANK_FRAME !== FRAME_NO){
      if(!RANK || RANK.length !== NT) RANK = new Int32Array(NT);
      RANK.fill(-1);
      for(let k=0;k<LAST_DRAWN;k++) RANK[LAST_LIST[k].i] = k;
      RANK_FRAME = FRAME_NO;
    }
    return (i >= 0 && i < NT) ? RANK[i|0] : -1;
  }
  
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
    const doSort  = !flying || YAW !== 0 || SORT_FLY;
    // show(): 'auto' is the gate above; 'visible' forces the cull (rotation then
    // exposes the gaps it leaves); 'surface' / 'all' never cull
    const useCull = SHOW === 'auto' ? (PROG >= 1 && Q <= 0 && YAW === 0) : SHOW === 'visible';
    const showAll = SHOW === 'all';
  
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
    if(TINT){ ensureCells(); TINT_KEY = (Math.round(shTop*128)*161 + Math.round(shX*128))*161 + Math.round(shZ*128); }
    if(ALPHA) ensureCells();
  
    // --- gather. Sort every frame when at rest (that is the state the user
    // rotates and inspects, so it must be correct); keep the frozen order in
    // flight, where blocks interpenetrate and no order is correct anyway.
    const list = [];
    const p = PROG, q = Q;
    const NL = showAll ? NT : N;      // interior cubes only ever enter through show('all')
    for(let k=0;k<NL;k++){
      const i = showAll ? ORDER[k] : k;   // frozen painter order over the whole volume
      if(useCull && ACULL[i]) continue;
      flightAt(i, p, _uv);
      if(q > 0) disperseAt(i, q, _uv);      // in the bouquet's own space: the camera orbits the burst
      // _uv is (u,v,y) in the yaw-0 basis. Recover (ax,az) and rotate exactly
      // the way index.html does, then re-project.
      const ax = (_uv[0] + _uv[1])*0.5;
      const az = (_uv[1] - _uv[0])*0.5;
      const xr =  ax*ct + az*st;
      const zr = -ax*st + az*ct;
      list.push({i: i, u: xr-zr, v: xr+zr, y: _uv[2], pal: APAL[i], d: xr + _uv[2] + zr});
    }
    if(doSort) list.sort(function(a,b){ return a.d-b.d; });
    const lim = (LIMIT !== null && LIMIT < list.length) ? LIMIT : list.length;   // drawLimit(): far things first
  
    // Optional PIN: cancel the horizontal wander caused by the asymmetric bow
    // orbiting the axis. Uses the CENTROID of drawn cube centres, not the
    // bounding box: a bbox jumps whenever one extreme cube appears or
    // disappears, which is what made an earlier attempt read as rubber-banding.
    // Scale S is untouched, so this is a pure translation.
    const pinDX = 0;
  
    ctx.clearRect(0,0,cv.width,cv.height);
    let onscreen = 0; const M = 2.2*S;   // a cube's projected extent, with margin
    ctx.lineWidth=1; ctx.lineJoin='miter';
    for(let k=0;k<lim;k++){
      const c=list[k]; let t=COL[c.pal];
      if(TINT){ const o = TINT(CELL[c.i]); if(o) t = tintTones(o, shTop, shX, shZ); }
      if(ALPHA){ const a = ALPHA(CELL[c.i]); ctx.globalAlpha = (a === null || a === undefined) ? 1 : clamp01(+a); }
      const X = OX + c.u*COS30*S + pinDX;
      const Y = OY + (c.v*0.5 - c.y)*S;
      if(X > -M && X < cv.width + M && Y > -M && Y < cv.height + M) onscreen++;   // analytic 'is anything left?' — no readback
      const bxX = vxp ? X+ExX : X, bxY = vxp ? Y+ExY : Y;
      const bzX = vzp ? X+EzX : X, bzY = vzp ? Y+EzY : Y;
      if(drawXFace) q4(bxX, bxY, bxX, bxY+EyY, bxX+EzX, bxY+EyY+EzY, bxX+EzX, bxY+EzY, t[1]);
      if(drawZFace) q4(bzX, bzY, bzX, bzY+EyY, bzX+ExX, bzY+EyY+ExY, bzX+ExX, bzY+ExY, t[2]);
      q4(X, Y+EyY, X+ExX, Y+EyY+ExY, X+ExX+EzX, Y+EyY+ExY+EzY, X+EzX, Y+EyY+EzY, t[0]);
    }
    if(ALPHA) ctx.globalAlpha = 1;
    LAST_DRAWN = lim;
    LAST_ONSCREEN = onscreen;
    LAST_LIST = list; FRAME_NO++;         // order()/rank() read this frame; the rank map is now stale
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
  // params(): validate, apply, regenerate. Every key is a number or a boolean;
  // the two divisors (domeR, wrapStep) are the only ones that turn the volume
  // to NaN at 0, so they are clamped. Anything else merely costs cells.
  function setParams(o){
    if(o === null || o === undefined){ Object.keys(P).forEach(function(k){ delete P[k]; }); Object.assign(P, P_ORIG); }
    else Object.keys(o).forEach(function(k){
      if(!(k in P_ORIG)) return;
      const v = o[k];
      if(typeof P_ORIG[k] === 'boolean'){ P[k] = !!v; return; }
      if(typeof v !== 'number' || !isFinite(v)) return;
      P[k] = (k === 'domeR' || k === 'wrapStep') ? Math.max(1, v) : v;
    });
    SRC = build(); setFill(HOLLOW_FILLED); rebuild();
    return Object.assign({}, P);
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
  setFill(HOLLOW_FILLED);
  rebuild();
  return {
    setP: function(v){ PROG = clamp01(v); draw(); },
    setQ: function(v){ Q = Math.max(0, v); draw(); },   // may exceed 1 (see disperseAt)
    setYaw: function(deg){ let d = deg; while(d > 180) d -= 360; while(d < -180) d += 360; YAW = d; draw(); },   // full 360, no clamp (NOTES v5), fractional degrees
    fit:  function(f){ if(f !== undefined) FILL = f; fitCanvas(); buildFlight(); buildDisperse(); draw(); return FILL; },
    dtune: function(o){ Object.assign(D, o||{}); buildDisperse(); draw(); return Object.assign({}, D); },
    ftune: function(o){ o = o || {}; Object.assign(F, o); if(o.ease) EASE_FN = EASES[o.ease] || smooth; if(o.order) setOrder(o.order); if(o.fillHollow !== undefined && !!o.fillHollow !== HOLLOW_FILLED){ setFill(o.fillHollow); rebuild(); } else { buildFlight(); draw(); } return Object.assign({}, F, {order: PART_ORDER.slice(), fillHollow: HOLLOW_FILLED}); },
    tune: function(o){ o = o || {}; if(o.turns !== undefined) TURNS = o.turns; if(o.ms !== undefined) T_TOTAL = o.ms; buildFlight(); draw(); return {TURNS:TURNS, T_TOTAL:T_TOTAL}; },
    state: function(){ return {N:N, surface:SURFACE.length, voxels:VOL.size, drawn:LAST_DRAWN, onscreen:LAST_ONSCREEN, S:S, DPR:DPR, p:PROG, q:Q, yaw:YAW, show:SHOW, limit:LIMIT, sortInFlight:SORT_FLY}; },
    resize: function(){ fitCanvas(); buildDisperse(); draw(); },
    draw: draw,
    bench: bench,
    // --- explainer hooks (see the API block at the top) ---
    cells: function(){ ensureCells(); return CELLS; },
    sets:  function(){ return {all: VOL.size, surface: N, visible: NVIS}; },
    show:  function(name){ if(name !== undefined){ if(name === 'auto' || name === 'all' || name === 'surface' || name === 'visible'){ SHOW = name; draw(); } } return SHOW; },
    tint:  function(fn){ TINT = typeof fn === 'function' ? fn : null; draw(); },
    alpha: function(fn){ ALPHA = typeof fn === 'function' ? fn : null; draw(); },
    drawLimit: function(n){ LIMIT = (n === null || n === undefined) ? null : Math.max(0, Math.floor(n)); draw(); return LIMIT; },
    sortInFlight: function(on){ if(on !== undefined){ SORT_FLY = !!on; draw(); } return SORT_FLY; },
    params: setParams,
    order: orderOut,
    rank:  rankOf,
    legacy: function(o){
      if(o !== undefined){
        const c = o === null ? false : !!o.clearance, sd = o === null ? false : !!o.sides;
        if(o === null || 'clearance' in o) LEGACY.clearance = c;
        if(o === null || 'sides' in o)     LEGACY.sides = sd;
        buildFlight(); draw();
      }
      return { clearance: LEGACY.clearance, sides: LEGACY.sides };
    },
    path: function(i, samples){
      const n = Math.max(2, Math.floor(samples || 32)), out = [], t = [0,0,0];
      if(!(i >= 0 && i < NT)) return out;
      for(let k=0;k<n;k++){ flightAt(i, k/(n-1), t); out.push({u:t[0], v:t[1], y:t[2]}); }
      return out;
    },
    project: function(x, y, z){
      const ax = x - PIVX, az = z - PIVZ, r = YAW*Math.PI/180, ct = Math.cos(r), st = Math.sin(r);
      const xr = ax*ct + az*st, zr = -ax*st + az*ct;
      return { X: OX + (xr - zr)*COS30*S, Y: OY + ((xr + zr)*0.5 - y)*S };
    },
    basis: function(){ return {S:S, OX:OX, OY:OY, yaw:YAW, pivX:PIVX, pivZ:PIVZ, cos30:COS30}; },
    canvas: function(){ return cv; },
    snapshot: function(){ return ctx.getImageData(0, 0, cv.width, cv.height); }
  };
}

// --- when NOT to play ---------------------------------------------------------
// A loader is a curtain, not a progress bar: this site is static and paints in
// well under a second, so the sequence costs the visitor ~4 s it did not need.
// It is worth that once. It is not worth it on a deep link (a recruiter
// following #settlr wants the case study, not a bouquet), not twice in one
// tab, and never under reduced motion.
// ===========================================================================
// DRIVER
// ===========================================================================

// Visitor switch. Off 2026-09-11 while the fly-in was being fixed; ON again
// 2026-09-18 once the loader matched the making-of page's hero (turns 1).
// ?loader still forces it for the bench and the suite; ?noloader still skips.
const ENABLED = true;

// "Seen" memory: ONCE PER BROWSER (owner, 2026-09-18 — "once the site is
// cached, no loader"), not once per tab. localStorage first, sessionStorage
// as the fallback where storage is blocked. A functional key, not an
// analytics identifier — same posture as mobile.html's feed-theme.
function seenBefore(){
  try{ if(localStorage.getItem('bq-seen')) return 'localStorage'; }catch(e){}
  try{ if(sessionStorage.getItem('bq-seen')) return 'sessionStorage'; }catch(e){}
  return '';
}
function rememberSeen(){
  try{ localStorage.setItem('bq-seen', '1'); }catch(e){}
  try{ sessionStorage.setItem('bq-seen', '1'); }catch(e){}
}

function shouldRun(){
  const sp = new URLSearchParams(location.search);
  if(sp.has('noloader')) return {run:false, why:'?noloader'};
  if(sp.has('loader'))   return {run:true,  why:'?loader forces it'};
  if(!ENABLED) return {run:false, why:'disabled (ENABLED=false)'};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return {run:false, why:'prefers-reduced-motion'};
  if(location.hash && location.hash !== '#') return {run:false, why:'deep link ' + location.hash};
  const seen = seenBefore(); if(seen) return {run:false, why:'already played in this browser (' + seen + ' bq-seen)'};
  // Headless/automated browsers never see it, so the existing test gate is
  // unaffected; the loader suites force it with ?loader.
  if(navigator.webdriver) return {run:false, why:'navigator.webdriver'};
  return {run:true, why:'first paint in this browser'};
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
  // Analytics (2026-09-18): why the loader did or did not play. window.track is
  // index.html's PostHog buffer (safe before load, no-op when stats are off).
  const track = function(name, props){ try{ if(typeof window.track === 'function') window.track(name, props); }catch(e){} };
  if(!decision.run){ root.remove(); track('loader_skipped', {why: decision.why.replace(/\s*\(.*\)$/, '').replace(/^deep link .*/, 'deep link')}); return Promise.resolve('skipped'); }
  const shownAt = performance.now();
  track('loader_shown', {why: decision.why});

  const FLY  = opts.flyMs  || 4200;
  const HOLD = opts.holdMs !== undefined ? opts.holdMs : 420;
  const EXIT = opts.exitMs || 1850;
  const MODE = opts.exit || 'scroll';          // 'scroll' (scrubbed, both ways) | 'disperse' (timed) | 'fade'
  const lock = opts.lockScroll !== false;
  const label = opts.label || root.querySelector('.bq-label');

  if(lock) document.documentElement.classList.add('bq-lock');
  root.hidden = false;
  root.style.touchAction = 'none';   // the overlay owns both axes while it is up
  const api = mount(canvas);
  // turns 1 (2026-09-17): the same spiral the making-of page's hero runs. The old
  // fallback of 0 dated from when TURNS was a *minimum* (0 -> 0-1 turn); after the
  // equal-unwind fix it meant no spiral at all, and the two pages drifted apart.
  api.tune({turns: opts.turns !== undefined ? opts.turns : 1, ms: FLY});
  if(opts.fill) api.fit(opts.fill);
  if(opts.ftune) api.ftune(opts.ftune);
  if(opts.dtune) api.dtune(opts.dtune);
  api.setP(0);                                   // p=0 draws nothing (NOTES: 0 visible)
  const onResize = function(){ api.resize(); };
  addEventListener('resize', onResize);

  const RANGE = opts.scrollRange || 800;   // px of scroll for a full dispersal
  // --- camera turn DURING the assembly. The camera comes around the forming
  // bouquet and arrives front-on with the last cube (yaw -> 0 at p = 1), so the
  // landed state is the cheap culled one.
  const YAW_IN = opts.yawIn !== undefined ? opts.yawIn : -540;   // degrees the camera sweeps through
  // Linear, not eased: any ease-out decelerates into 0 and the last stretch
  // reads as stopped while cubes are still landing (measured on contact sheets).
  const yawAt = function(p){ return YAW_IN * (1 - clamp01(p)); };   // STRICTLY linear: constant angular speed until the landed frame, then still
  const hint  = root.querySelector('.bq-hint');

  return new Promise(function(resolve){
    // The clock is ACCUMULATED with a capped step, not read from wall time: the
    // site's init runs as one synchronous block right after this overlay is
    // painted, and a wall clock would jump the flight past that hitch (blocks
    // snapping into place, speed reading wrong). Capped at 120 ms, a hitch
    // pauses the animation instead.
    let e = 0, last = 0;
    let phase = 'fly', qTarget = 0, qShown = 0, exitT0 = 0;
    // --- scroll-scrubbed exit: wheel / touch drive q both ways, like the birthday page.
    // The page itself does not move (scroll stays locked): the input is swallowed at
    // capture so the site's eased-scroll loop never sees it, and q is what scrolls.
    // --- side-scroll / horizontal drag revolves the camera about the bouquet's
    //     axis once it has landed (hold + scroll phases). Vertical input keeps
    //     driving the dispersal; the axis that dominates a gesture wins. Yaw != 0
    //     voids the cull (all 1,519 draw), bounded by the visitor leaving.
    const YAW_PER_PX = opts.yawPerPx !== undefined ? opts.yawPerPx : 0.42;
    let yaw = 0;
    const landed = function(){ return phase === 'hold' || phase === 'scroll'; };
    function onWheel(e){
      if(!landed()) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if(Math.abs(e.deltaX) > Math.abs(e.deltaY)){ yaw += e.deltaX * 0.30; api.setYaw(yaw); return; }
      if(phase === 'scroll') qTarget = Math.max(0, Math.min(Q_MAX, qTarget + e.deltaY / RANGE));
    }
    let ty = null, tx = null, taxis = null;
    function onTS(e){ ty = e.touches[0].clientY; tx = e.touches[0].clientX; taxis = null; }
    function onTM(e){
      if(!landed() || ty === null) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const x = e.touches[0].clientX, y = e.touches[0].clientY, dx = x - tx, dy = y - ty;
      if(taxis === null){ if(Math.hypot(dx,dy) < 12) return; taxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; }
      if(taxis === 'x'){ yaw += dx * YAW_PER_PX; api.setYaw(yaw); }
      else if(phase === 'scroll') qTarget = Math.max(0, Math.min(Q_MAX, qTarget + (ty - y) / (RANGE*0.6)));
      tx = x; ty = y;
    }
    let pdrag = null;
    function onPD(e){ if(!landed() || e.pointerType === 'touch') return; pdrag = {x:e.clientX, y:e.clientY, yaw0:yaw, axis:null}; }
    function onPM(e){ if(!pdrag) return; const dx = e.clientX - pdrag.x, dy = e.clientY - pdrag.y;
      if(pdrag.axis === null){ if(Math.hypot(dx,dy) < 12) return; pdrag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; }
      if(pdrag.axis === 'x'){ yaw = pdrag.yaw0 + dx * YAW_PER_PX; api.setYaw(yaw); } }
    function onPU(){ pdrag = null; }
    function onKey(e){ if(phase !== 'scroll') return; const d = {ArrowDown:1, PageDown:3, ' ':3, ArrowUp:-1, PageUp:-3}[e.key]; if(d){ e.preventDefault(); qTarget = Math.max(0, Math.min(Q_MAX, qTarget + d*0.12)); } }
    function arm(){ addEventListener('wheel', onWheel, {passive:false, capture:true}); addEventListener('touchstart', onTS, {passive:true, capture:true}); addEventListener('touchmove', onTM, {passive:false, capture:true}); addEventListener('keydown', onKey, true); root.addEventListener('pointerdown', onPD); addEventListener('pointermove', onPM); addEventListener('pointerup', onPU); addEventListener('pointercancel', onPU); }
    function disarm(){ removeEventListener('wheel', onWheel, true); removeEventListener('touchstart', onTS, true); removeEventListener('touchmove', onTM, true); removeEventListener('keydown', onKey, true); root.removeEventListener('pointerdown', onPD); removeEventListener('pointermove', onPM); removeEventListener('pointerup', onPU); removeEventListener('pointercancel', onPU); }
    function ground(q){ root.style.setProperty('--bq-ground', String(1 - EASE_OUT(clamp01((q - 0.25) / 0.6)))); reveal(q); }
    // fired once when the dispersal passes 90%: the page's own reveals (the nav
    // typewriter) key off this, so they start as the last cubes leave
    let revealed = false;
    function reveal(q){ if(revealed || q < 0.9) return; revealed = true; root.dataset.revealed = '1'; dispatchEvent(new CustomEvent('bq-loader:reveal')); }
    function finish(){
      disarm(); removeEventListener('resize', onResize);
      root.remove();
      if(lock){ document.documentElement.classList.remove('bq-lock'); dispatchEvent(new Event('resize')); }   // Windows: scrollbar returns, stacks re-measure
      if(opts.remember !== false) rememberSeen();
      reveal(1);
      track('loader_done', {exit: MODE, seconds: Math.round((performance.now() - shownAt) / 100) / 10});
      dispatchEvent(new CustomEvent('bq-loader:done'));
      resolve('played');
    }
    root.__state = function(){ return {phase:phase, qTarget:qTarget, qShown:qShown, yaw:yaw}; };
    // The curtain drops on EVIDENCE: the draw loop counts cubes still inside
    // the frame (no canvas readback — a GPU sync every few frames stuttered the
    // scroll-out). Past q = 1 the swarm keeps flying and, if the visitor has
    // stopped scrolling, a short automatic tail carries the stragglers out.
    const Q_MAX = opts.qMax || 2.2;   // for the bench / tests

    function tick(){
      const now = performance.now();
      if(last) e += Math.min(120, now - last);   // 120 ms: passes 30 fps frames untouched, absorbs real stalls
      last = now;
      if(phase === 'fly'){
        const p = e / FLY;
        api.setYaw(yawAt(p)); api.setP(p);
        if(label) label.style.opacity = clamp01((p - 0.62) / 0.30);   // rises with the assembly beat
        if(p < 1) return requestAnimationFrame(tick);
        api.setYaw(0); api.setP(1); phase = 'hold'; arm(); return requestAnimationFrame(tick);
      }
      if(phase === 'hold'){
        if(e < FLY + HOLD) return requestAnimationFrame(tick);
        if(MODE === 'scroll'){ phase = 'scroll'; if(hint) hint.style.opacity = 1; }
        else { phase = 'exit'; exitT0 = e; }
        root.classList.add('is-leaving');
        return requestAnimationFrame(tick);
      }
      if(phase === 'scroll'){
        // lerp the shown q toward the scrolled target: wheel notches arrive in
        // steps, and a step in q is a step in 1,519 block positions
        if(qShown >= 1 && qTarget < Q_MAX) qTarget = Math.min(Q_MAX, qTarget + 0.012);   // the tail
        qShown += (qTarget - qShown) * 0.16;
        if(Math.abs(qTarget - qShown) < 0.0008) qShown = qTarget;
        api.setQ(qShown); ground(qShown);
        if(hint)  hint.style.opacity  = String(1 - clamp01(qShown / 0.15));
        if(label) label.style.opacity = String(1 - clamp01(qShown / 0.3));
        if(qShown >= 0.8 && api.state().onscreen === 0) return finish();
        if(qShown >= Q_MAX) return finish();                                  // safety net
        return requestAnimationFrame(tick);
      }
      // timed exit (kept as an option)
      const x = clamp01((e - exitT0) / EXIT);
      if(MODE === 'disperse'){ api.setQ(EASE_IN(x)); ground(EASE_IN(x)); }
      else { root.style.setProperty('--bq-ground', String(1 - EASE_OUT(x))); canvas.style.opacity = String(1 - EASE_OUT(x)); reveal(x); }
      if(label) label.style.opacity = String(1 - clamp01(x / 0.4));
      if(x < 1) return requestAnimationFrame(tick);
      finish();
    }
    // 2. Start only once the document has finished parsing and the page's own
    //    init scripts have run (DOMContentLoaded), plus one frame, so the first
    //    frames of the flight are not fighting the parser for the main thread.
    const start = function(){ requestAnimationFrame(function(){ last = 0; tick(); }); };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
  });
}

window.BouquetLoader = { mount: mount, shouldRun: shouldRun, run: run };
})();
