/* ============================================================
   Settlr — Edit Profile view module
   Migrated from the inline IIFE in screens/edit-profile.html.
   All DOM lookups are scoped to `root` (the <body> in standalone,
   the view <section> in the compiled shell).
   ============================================================ */
(function () {
  'use strict';

  // Inline SVGs lifted verbatim from js/icons.js (regular weight), used to
  // swap the copy button glyph at runtime — replaces the old js/icon-upgrade.js
  // behaviour now that Phosphor font icons are gone.
  var ICON_COPY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"/></svg>';
  var ICON_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>';

  // Per-view state held in a closure-scoped map keyed by root, so multiple
  // in-DOM views never clobber each other.
  var state = { dirty: false, beforeUnload: null, copyTimer: null, photoDataUrl: null,
                handleTimer: null, handleToken: 0, handleOk: false };

  // Default helper line for the Settlr ID editor (also the reset state).
  var HANDLE_HINT = 'Letters, numbers and underscores · your invite link updates too';
  var HANDLE_RE = /^[a-z0-9_]{3,20}$/;

  function init(root, params) {
    var nameInput = root.querySelector('#input-name');
    var upiInput = root.querySelector('#input-upi');
    var bankInput = root.querySelector('#input-bank-name');
    var bioInput = root.querySelector('#input-bio');
    var charCount = root.querySelector('#js-char-count');
    var avatarWrap = root.querySelector('#js-avatar-wrap');
    var avatarInput = root.querySelector('#js-avatar-input');
    var avatar = root.querySelector('#js-avatar');
    var copyBtn = root.querySelector('#js-copy-id');
    var saveCta = root.querySelector('#js-save-cta');

    function onFieldChange() { state.dirty = true; }

    function updateCharCount() {
      onFieldChange();
      if (charCount) charCount.textContent = bioInput.value.length + ' / 120';
    }

    function copyId() {
      var cur = (typeof Store.getCurrentUser === 'function' && Store.getCurrentUser()) || {};
      var handle = '@' + String(cur.handle || 'divyansh').replace(/^@/, '');
      if (navigator.clipboard) navigator.clipboard.writeText(handle);
      var holder = copyBtn ? copyBtn.querySelector('.icon-holder') : null;
      if (!holder) return;
      holder.innerHTML = ICON_CHECK;
      if (state.copyTimer) clearTimeout(state.copyTimer);
      state.copyTimer = setTimeout(function () { holder.innerHTML = ICON_COPY; }, 1500);
    }

    function previewAvatar() {
      if (!avatarInput.files || !avatarInput.files.length) return;
      var file = avatarInput.files[0];
      var reader = new FileReader();
      reader.onload = function (e) {
        state.photoDataUrl = e.target.result;
        if (!avatar) return;
        avatar.style.backgroundImage = 'url(' + e.target.result + ')';
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.textContent = '';
      };
      reader.readAsDataURL(file);
      state.dirty = true;
    }

    function saveProfile() {
      // Persist only when there are edits; either way show feedback + navigate
      // back so a clean tap doesn't look like a dead button (review fix).
      if (state.dirty && typeof Store.updateProfile === 'function') {
        var fields = {};
        if (nameInput) fields.name = nameInput.value.trim();
        if (upiInput) fields.upi = upiInput.value.trim();
        if (bankInput) fields.bank = bankInput.value.trim();
        if (bioInput) fields.bio = bioInput.value.trim();
        if (state.photoDataUrl) fields.photo = state.photoDataUrl;
        Store.updateProfile(fields);
      }
      if (saveCta) {
        var ctaLabel = saveCta.querySelector('.btn__content');
        if (ctaLabel) ctaLabel.textContent = 'Saved!';
        saveCta.disabled = true;
      }
      setTimeout(function () {
        if (window.SettlrRouterSPA) {
          window.SettlrRouterSPA.navigate('settings');
        } else {
          window.location.href = 'settings';
        }
      }, 800);
    }

    // ── Settlr ID editor (pencil on the banner → inline editor + live check) ──
    var editBtn = root.querySelector('#js-edit-id');
    var editor = root.querySelector('#js-handle-editor');
    var handleField = root.querySelector('#js-handle-field');
    var handleInput = root.querySelector('#input-handle');
    var handleHelper = root.querySelector('#js-handle-helper');
    var handleSave = root.querySelector('#js-handle-save');
    var handleCancel = root.querySelector('#js-handle-cancel');

    function currentHandle() {
      var cur = (window.Store && Store.getCurrentUser && Store.getCurrentUser()) || {};
      return String(cur.handle || '').replace(/^@/, '').toLowerCase();
    }
    function setHandleStatus(msg, isError, ok) {
      if (handleHelper) handleHelper.textContent = msg;
      if (handleField) handleField.classList.toggle('input-field--error', !!isError);
      state.handleOk = !!ok;
      if (handleSave) handleSave.disabled = !ok;
    }
    function closeHandleEditor() {
      if (editor) editor.hidden = true;
      if (editBtn) editBtn.setAttribute('aria-expanded', 'false');
      if (state.handleTimer) { clearTimeout(state.handleTimer); state.handleTimer = null; }
      state.handleToken++; // invalidate any in-flight availability check
      setHandleStatus(HANDLE_HINT, false, false);
    }
    function openHandleEditor() {
      if (!editor) return;
      editor.hidden = false;
      if (editBtn) editBtn.setAttribute('aria-expanded', 'true');
      if (handleInput) { handleInput.value = currentHandle(); handleInput.focus(); }
      setHandleStatus(HANDLE_HINT, false, false);
    }
    function checkHandleNow() {
      var v = handleInput ? handleInput.value.trim() : '';
      if (!v) { setHandleStatus(HANDLE_HINT, false, false); return; }
      if (v === currentHandle()) { setHandleStatus('This is your current ID', false, false); return; }
      if (!HANDLE_RE.test(v)) { setHandleStatus('3–20 characters — lowercase letters, numbers, underscores', true, false); return; }
      if (!(window.Store && Store.checkHandle)) { setHandleStatus(HANDLE_HINT, false, false); return; }
      setHandleStatus('Checking availability…', false, false);
      var token = ++state.handleToken;
      Store.checkHandle(v).then(function (free) {
        if (state.handleToken !== token) return; // stale keystroke / editor closed
        if (free) setHandleStatus('@' + v + ' is available', false, true);
        else setHandleStatus('That ID is taken or not allowed', true, false);
      });
    }
    function saveHandle() {
      var v = handleInput ? handleInput.value.trim() : '';
      if (!state.handleOk || !v || !(window.Store && Store.setHandle)) return;
      if (handleSave) handleSave.disabled = true;
      Store.setHandle(v).then(function (okSet) {
        if (okSet) {
          var banner = root.querySelector('.id-banner__value');
          if (banner) banner.textContent = '@' + v;
          closeHandleEditor();
        } else {
          // Raced with someone else claiming it (server rechecks) — stay open.
          setHandleStatus('That ID just got taken — try another', true, false);
        }
      });
    }
    if (editBtn) editBtn.addEventListener('click', function () {
      if (editor && editor.hidden) openHandleEditor(); else closeHandleEditor();
    });
    if (handleCancel) handleCancel.addEventListener('click', closeHandleEditor);
    if (handleSave) handleSave.addEventListener('click', saveHandle);
    if (handleInput) handleInput.addEventListener('input', function () {
      // Normalize as they type (lowercase, strip anything but a-z 0-9 _).
      var clean = handleInput.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (clean !== handleInput.value) handleInput.value = clean;
      if (state.handleTimer) clearTimeout(state.handleTimer);
      state.handleTimer = setTimeout(checkHandleNow, 350);
    });

    if (nameInput) nameInput.addEventListener('input', onFieldChange);
    if (upiInput) upiInput.addEventListener('input', onFieldChange);
    if (bankInput) bankInput.addEventListener('input', onFieldChange);
    if (bioInput) bioInput.addEventListener('input', updateCharCount);
    if (avatarWrap && avatarInput) {
      avatarWrap.addEventListener('click', function () { avatarInput.click(); });
    }
    if (avatarInput) avatarInput.addEventListener('change', previewAvatar);
    if (copyBtn) copyBtn.addEventListener('click', copyId);
    if (saveCta) saveCta.addEventListener('click', saveProfile);
  }

  function onShow(root, params) {
    // Re-derive transient state on every activation.
    state.dirty = false;
    state.photoDataUrl = null;

    // Prefill the form from the persisted profile (fall back to whatever the
    // markup ships when a field is absent, so first-run still looks right).
    if (typeof Store.getCurrentUser === 'function') {
      var u = Store.getCurrentUser();
      var setVal = function (sel, val) {
        var el = root.querySelector(sel);
        if (el && val != null) el.value = val;
      };
      setVal('#input-name', u.name);
      setVal('#input-upi', u.upi);
      setVal('#input-bank-name', u.bank);
      setVal('#input-bio', u.bio);
      var banner = root.querySelector('.id-banner__value');
      if (banner && u.handle) banner.textContent = '@' + u.handle;
      var charCount = root.querySelector('#js-char-count');
      if (charCount) charCount.textContent = ((u.bio || '').length) + ' / 120';
      var avatar = root.querySelector('#js-avatar');
      if (avatar) {
        if (u.photo) {
          avatar.style.backgroundImage = 'url(' + u.photo + ')';
          avatar.style.backgroundSize = 'cover';
          avatar.style.backgroundPosition = 'center';
          avatar.textContent = '';
        } else {
          avatar.style.backgroundImage = '';
          avatar.textContent = u.initials || 'DR';
        }
      }
    }

    var saveCta = root.querySelector('#js-save-cta');
    if (saveCta) {
      var ctaLabel = saveCta.querySelector('.btn__content');
      if (ctaLabel) ctaLabel.textContent = 'Save Changes';
      saveCta.disabled = false;
    }

    // Reset the Settlr ID editor to collapsed + pristine on every activation.
    state.handleToken++; // drop any in-flight availability check
    state.handleOk = false;
    var hEditor = root.querySelector('#js-handle-editor');
    if (hEditor) hEditor.hidden = true;
    var hEdit = root.querySelector('#js-edit-id');
    if (hEdit) hEdit.setAttribute('aria-expanded', 'false');
    var hField = root.querySelector('#js-handle-field');
    if (hField) hField.classList.remove('input-field--error');
    var hHelper = root.querySelector('#js-handle-helper');
    if (hHelper) hHelper.textContent = HANDLE_HINT;
    var hInput = root.querySelector('#input-handle');
    if (hInput) hInput.value = '';
    var hSave = root.querySelector('#js-handle-save');
    if (hSave) hSave.disabled = true;
    // Warn before leaving with unsaved changes (standalone document only).
    state.beforeUnload = function (e) {
      if (state.dirty) e.returnValue = 'You have unsaved changes.';
    };
    window.addEventListener('beforeunload', state.beforeUnload);
  }

  function onHide(root) {
    if (state.beforeUnload) {
      window.removeEventListener('beforeunload', state.beforeUnload);
      state.beforeUnload = null;
    }
    if (state.copyTimer) {
      clearTimeout(state.copyTimer);
      state.copyTimer = null;
    }
    if (state.handleTimer) {
      clearTimeout(state.handleTimer);
      state.handleTimer = null;
    }
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('edit-profile', { init: init, onShow: onShow, onHide: onHide });
  }

  // Standalone bootstrap (Phase 1: screen still opens directly).
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="edit-profile"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
