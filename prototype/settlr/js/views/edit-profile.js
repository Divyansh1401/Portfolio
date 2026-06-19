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
  var state = { dirty: false, beforeUnload: null, copyTimer: null, photoDataUrl: null };

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
    var saveBtn = root.querySelector('#js-save-btn-profile');
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
      if (!state.dirty) return;
      // Persist the editable fields to the Store before leaving.
      if (typeof Store.updateProfile === 'function') {
        var fields = {};
        if (nameInput) fields.name = nameInput.value.trim();
        if (upiInput) fields.upi = upiInput.value.trim();
        if (bankInput) fields.bank = bankInput.value.trim();
        if (bioInput) fields.bio = bioInput.value.trim();
        if (state.photoDataUrl) fields.photo = state.photoDataUrl;
        Store.updateProfile(fields);
      }
      if (saveBtn) {
        saveBtn.textContent = 'Saved!';
        saveBtn.disabled = true;
      }
      setTimeout(function () {
        if (window.SettlrRouterSPA) {
          window.SettlrRouterSPA.navigate('settings');
        } else {
          window.location.href = 'settings';
        }
      }, 800);
    }

    if (nameInput) nameInput.addEventListener('input', onFieldChange);
    if (upiInput) upiInput.addEventListener('input', onFieldChange);
    if (bankInput) bankInput.addEventListener('input', onFieldChange);
    if (bioInput) bioInput.addEventListener('input', updateCharCount);
    if (avatarWrap && avatarInput) {
      avatarWrap.addEventListener('click', function () { avatarInput.click(); });
    }
    if (avatarInput) avatarInput.addEventListener('change', previewAvatar);
    if (copyBtn) copyBtn.addEventListener('click', copyId);
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);
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

    var saveBtn = root.querySelector('#js-save-btn-profile');
    if (saveBtn) {
      saveBtn.textContent = 'Save';
      saveBtn.disabled = false;
    }
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
