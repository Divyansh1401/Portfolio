// reveal-machine.js — pure input state machine for the bouquet reveal
// gesture (CONTRACT.md §6). No DOM: reveal.js is the only caller that
// touches the renderer/DOM, and it drives this machine with plain event
// objects. Fully deterministic given an injected clock, so it is tested
// with a fake `now` and hand-fed `tick` timestamps — no rAF, no timers.
//
// Time model: for every event OTHER than 'tick', the machine stamps "now"
// itself by calling the injected `now()` once, and uses that stamp as the
// anchor for whatever animation (hold / burst / spring-back) the event
// starts. 'tick' events instead carry their own `t` (the host's rAF clock)
// and are the only events that ever advance `q` for an in-progress
// animation — discrete events (pointerdown, wheel, key, open, ...)
// change *what* is animating, never advance the clock themselves. This
// keeps the machine trivially fake-clockable: tests pick any `now()` they
// like and hand the machine matching `t` values on 'tick'.

/** @typedef {'fly'|'landed'|'holding'|'scrubbing'|'bursting'|'revealed'} RevealPhase */

/**
 * @typedef {Object} RevealState
 * @property {RevealPhase} phase
 * @property {number} q 0..1.2 (bursts run past 1 up to BURST_TARGET_Q)
 * @property {boolean} skipFly whether the fly-in was cut short by user input
 * @property {boolean} revealed true from the instant q first reaches 1 (so a
 *   caller can show the message as soon as the threshold is crossed), even
 *   while `phase` is still 'bursting' finishing out its run to 1.2. `phase`
 *   itself only becomes the terminal 'revealed' once that burst completes.
 */

const HOLD_MS = 900;
const SCRUB_THRESHOLD_PX = 12;
const SCRUB_RANGE_PX = 180;
const WHEEL_DIVISOR = 240; // px of wheel dy to fill q from 0 to 1
const KEY_STEP = 0.15; // q added per qualifying keypress
const BURST_MS = 600;
const BURST_TARGET_Q = 1.2;
const SPRING_MS = 220; // not in CONTRACT.md (only "springs back ... over time"); chosen so a release feels snappy
const REVEAL_Q = 1;

const OPEN_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 'Space', 'Spacebar']);

/**
 * @param {{now: () => number}} opts injected clock; called once per non-tick event
 * @returns {{send: (event: object) => RevealState, getState: () => RevealState}}
 */
export function createRevealMachine({ now }) {
  if (typeof now !== 'function') {
    throw new TypeError('createRevealMachine requires { now }');
  }

  /** @type {RevealPhase} */
  let phase = 'fly';
  let q = 0;
  let skipFly = false;
  // true from the instant q first reaches REVEAL_Q; see RevealState.revealed.
  let revealed = false;

  /** id of the pointer currently holding/scrubbing, or null */
  let activePointerId = null;

  // scrubbing anchors: the q and dy readings at the instant we switched
  // from 'holding' into 'scrubbing', so the drag is continuous (no jump).
  let scrubBaseQ = 0;
  let scrubBaseDy = 0;

  // burst / spring-back animation anchors
  let burstAnchorT = 0;
  let burstStartQ = 0;
  // true from the moment a burst starts until it has run its full BURST_MS
  // course (q has reached BURST_TARGET_Q). This is tracked separately from
  // `phase` because the phase flips to the terminal 'revealed' as soon as
  // q crosses 1, partway through the animation (BURST_TARGET_Q is 1.2) —
  // the burst must keep advancing q on 'tick' after that latch, so a
  // non-tick event is the only thing that should ever see 'revealed' as a
  // true no-op.
  let burstActive = false;
  let springAnchorT = 0;
  let springStartQ = 0;
  let springActive = false;

  // last time reading seen by the machine (from a 'tick', or stamped via
  // now() on a discrete event) — lets the next 'tick' compute a correct dt
  // even across intervening discrete events.
  let trackedT = 0;

  function snapshot() {
    return { phase, q, skipFly, revealed };
  }

  function clampQ(v, max = BURST_TARGET_Q) {
    return Math.min(max, Math.max(0, v));
  }

  function endHold() {
    activePointerId = null;
  }

  function startBurst(anchorT) {
    phase = 'bursting';
    burstAnchorT = anchorT;
    burstStartQ = q;
    burstActive = true;
    endHold();
  }

  function startSpringBack(anchorT) {
    phase = 'landed';
    springActive = true;
    springAnchorT = anchorT;
    springStartQ = q;
    endHold();
  }

  /** Shared release logic for pointerup / pointercancel. */
  function release(anchorT) {
    if (phase !== 'holding' && phase !== 'scrubbing') return;
    if (q >= 0.5) {
      startBurst(anchorT);
    } else {
      startSpringBack(anchorT);
    }
  }

  // Sets the `revealed` flag the instant q crosses REVEAL_Q, and promotes
  // `phase` to the terminal 'revealed' too -- UNLESS a burst is under way:
  // a burst that has crossed 1 must keep animating (in 'bursting') out to
  // BURST_TARGET_Q over its full BURST_MS course; `phase` only becomes
  // 'revealed' when that burst actually finishes (see handleTick).
  function applyRevealLatch() {
    if (q >= REVEAL_Q) {
      revealed = true;
      if (phase !== 'revealed' && phase !== 'bursting') {
        phase = 'revealed';
      }
    }
  }

  function canAcceptQBump() {
    return phase === 'landed' || phase === 'holding' || phase === 'scrubbing';
  }

  function handleTick(t) {
    const dt = t - trackedT;
    if (burstActive) {
      // Keep advancing the burst on every tick even after `revealed` has
      // already flipped true (q crossed 1) — the animation still owes the
      // rest of its run out to BURST_TARGET_Q over BURST_MS, and `phase`
      // stays 'bursting' until it does.
      const progress = Math.min(1, Math.max(0, (t - burstAnchorT) / BURST_MS));
      q = burstStartQ + (BURST_TARGET_Q - burstStartQ) * progress;
      if (progress >= 1) {
        burstActive = false;
        phase = 'revealed'; // terminal, only now that the burst has finished
      }
    } else if (phase === 'holding') {
      q = clampQ(q + dt / HOLD_MS);
    } else if (phase === 'landed' && springActive) {
      const progress = Math.min(1, Math.max(0, (t - springAnchorT) / SPRING_MS));
      q = springStartQ * (1 - progress);
      if (progress >= 1) {
        springActive = false;
        q = 0;
      }
    }
    trackedT = t;
  }

  function handleEvent(event, t) {
    switch (event.type) {
      case 'flyDone': {
        if (phase === 'fly') phase = 'landed';
        break;
      }

      case 'pointerdown': {
        if (activePointerId !== null) break; // a second pointer is ignored
        activePointerId = event.id;
        phase = 'holding';
        scrubBaseQ = q;
        scrubBaseDy = 0;
        break;
      }

      case 'pointermove': {
        if (activePointerId === null || event.id !== activePointerId) break;
        const dy = event.dy;
        if (phase === 'holding') {
          if (Math.abs(dy) > SCRUB_THRESHOLD_PX) {
            phase = 'scrubbing';
            scrubBaseQ = q;
            scrubBaseDy = dy;
          }
        }
        if (phase === 'scrubbing') {
          // up (negative dy) opens: moving further up than the switch point increases q.
          q = clampQ(scrubBaseQ + (scrubBaseDy - dy) / SCRUB_RANGE_PX);
        }
        break;
      }

      case 'pointerup': {
        if (activePointerId === null || event.id !== activePointerId) break;
        release(t);
        break;
      }

      case 'pointercancel': {
        if (activePointerId === null) break;
        release(t);
        break;
      }

      case 'wheel': {
        if (!canAcceptQBump()) break;
        q = clampQ(q + Math.abs(event.dy) / WHEEL_DIVISOR);
        break;
      }

      case 'key': {
        if (!canAcceptQBump()) break;
        if (OPEN_KEYS.has(event.key)) {
          q = clampQ(q + KEY_STEP);
        }
        break;
      }

      case 'open': {
        if (phase === 'bursting' || phase === 'revealed') break;
        startBurst(t);
        break;
      }

      default:
        break;
    }
  }

  /**
   * @param {object} event one of the CONTRACT.md §6 event shapes
   * @returns {RevealState}
   */
  function send(event) {
    if (event.type === 'tick') {
      // Ticks keep driving an in-progress burst to its full BURST_TARGET_Q
      // even once 'revealed' has latched; once the burst has actually
      // finished (burstActive false) a tick in 'revealed' is a no-op.
      if (phase === 'revealed' && !burstActive) return snapshot();
      handleTick(event.t);
      applyRevealLatch();
      return snapshot();
    }

    // Every non-tick event is a true no-op once 'revealed' has latched,
    // regardless of whether the burst animation is still finishing out.
    if (phase === 'revealed') return snapshot(); // terminal

    const t = now();

    // Any input during 'fly' just skips the fly-in; the event that
    // triggered the skip is consumed by the skip and does NOT also run its
    // normal handler (so a pointerdown that skips does not start a hold).
    // 'flyDone' is the natural completion signal, not user input, so it
    // takes the normal landing path instead (no skipFly).
    //
    // EXCEPTION: 'open' (the Open button) during 'fly' both skips the fly-in
    // AND starts the burst in the same event, so a keyboard user pressing
    // Open once during the fly-in doesn't have to press it again once
    // landed.
    if (phase === 'fly' && event.type !== 'flyDone') {
      skipFly = true;
      phase = 'landed';
      trackedT = t;
      if (event.type === 'open') {
        startBurst(t);
      }
      applyRevealLatch();
      return snapshot();
    }

    handleEvent(event, t);
    trackedT = t;
    applyRevealLatch();
    return snapshot();
  }

  return { send, getState: snapshot };
}
