// matrix.mjs — the viewport x state grid the oracle sweeps for goldens and
// determinism checks.

export const VIEWPORTS = [
  { name: 'desktop', cssW: 1440, cssH: 900, dpr: 2 },
  { name: 'phone', cssW: 390, cssH: 844, dpr: 1.5 },
  { name: 'og', cssW: 1200, cssH: 630, dpr: 1 },
];

export const STATES = [
  { name: 'p0', p: 0, yaw: 0, q: 0 },
  { name: 'p015', p: 0.15, yaw: -459, q: 0 },
  { name: 'p05-yaw-270', p: 0.5, yaw: -270, q: 0 },
  { name: 'landed', p: 1, yaw: 0, q: 0 },
  { name: 'yaw30', p: 1, yaw: 30, q: 0 },
  { name: 'q0001', p: 1, yaw: 0, q: 0.001 },
  { name: 'q05', p: 1, yaw: 0, q: 0.5 },
  { name: 'q1', p: 1, yaw: 0, q: 1 },
  { name: 'q22', p: 1, yaw: 0, q: 2.2 },
];

/**
 * Applies a state to a mounted renderer, in the fixed order setYaw, setP,
 * setQ. Each setter redraws once (see the reference loader's API); callers
 * that want a single clean draw should rec.reset() and call api.draw()
 * themselves afterwards.
 * @param {object} api
 * @param {{p: number, yaw: number, q: number}} s
 */
export function applyState(api, s) {
  api.setYaw(s.yaw);
  api.setP(s.p);
  api.setQ(s.q);
}
