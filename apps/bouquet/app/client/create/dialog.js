/**
 * @file A minimal focus-managed dialog controller: traps Tab/Shift+Tab
 * inside `root` while open, closes on Escape, and restores focus to
 * whatever was focused before `open()` was called. No animation, no ARIA
 * attribute management beyond focus — the caller's markup already carries
 * role="dialog" aria-modal="true".
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * @param {HTMLElement} root the dialog element itself (shown/hidden by the caller)
 * @param {{onClose: () => void}} opts
 * @returns {{open: () => void, close: () => void, handleKeydown: (e: KeyboardEvent) => void}}
 */
export function createFocusTrap(root, opts) {
  const onClose = opts.onClose;
  let lastFocused = null;

  function focusables() {
    return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
  }

  function open() {
    lastFocused = document.activeElement;
    const items = focusables();
    (items[0] || root).focus({ preventScroll: true });
    document.addEventListener('keydown', handleKeydown, true);
  }

  function close() {
    document.removeEventListener('keydown', handleKeydown, true);
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
    lastFocused = null;
  }

  /** @param {KeyboardEvent} e */
  function handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!root.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  }

  return { open, close, handleKeydown };
}
