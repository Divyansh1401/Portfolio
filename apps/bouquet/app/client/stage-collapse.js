/**
 * @file After the reveal burst has run out, the canvas is empty: stop the
 * render loop and fold the stage away so the note and gifts move up.
 * Reduced motion folds instantly.
 */

const BURST_TAIL_MS = 700;
const FOLD_MS = 500;

/**
 * @param {HTMLElement} stage
 * @param {{destroy: () => void}} reveal
 * @param {() => void} [onFolded]
 * @returns {() => void} cancel: stops a pending fold and restores the stage
 */
export function collapseStage(stage, reveal, onFolded = () => {}) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = null;
  const fold = () => {
    timer = null;
    reveal.destroy();
    if (reduce) {
      stage.hidden = true;
      onFolded();
      return;
    }
    stage.style.height = `${stage.offsetHeight}px`;
    stage.style.aspectRatio = 'auto';
    stage.style.overflow = 'hidden';
    stage.style.transition = `height ${FOLD_MS}ms ease, opacity ${FOLD_MS}ms ease, margin ${FOLD_MS}ms ease`;
    void stage.offsetHeight;
    stage.style.height = '0px';
    stage.style.opacity = '0';
    stage.style.marginTop = '0px';
    timer = setTimeout(() => {
      timer = null;
      stage.hidden = true;
      onFolded();
    }, FOLD_MS);
  };
  if (reduce) fold();
  else timer = setTimeout(fold, BURST_TAIL_MS);
  return () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    for (const prop of ['height', 'aspectRatio', 'overflow', 'transition', 'opacity', 'marginTop']) stage.style[prop] = '';
    stage.hidden = false;
  };
}
