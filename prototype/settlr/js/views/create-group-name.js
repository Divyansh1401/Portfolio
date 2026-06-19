/* ============================================================
   Settlr — Create Group (Name) view module
   Former inline IIFE from screens/create-group-name.html, adapted to the
   compiled-shell lifecycle. All DOM lookups are scoped to `root` (the view
   <section>) so they never collide with other in-DOM views.

   The Next action validates the group name, stores a transient new-group
   payload in sessionStorage, then hands off to the create-group-members step.
   The sessionStorage hand-off is preserved exactly; cross-screen navigation
   goes through SettlrRouterSPA.navigate when the SPA router is present, and
   falls back to the original location.href for standalone use of
   screens/create-group-name.html.
   ============================================================ */
(function () {
  'use strict';

  function handoff() {
    if (window.SettlrRouterSPA) window.SettlrRouterSPA.navigate('create-group-members');
    else location.href = 'create-group-members';
  }

  // Per-view state — the chosen photo dataURL is held here until handoff, keyed
  // off the root element so re-shows reuse it without clobbering other views.
  function state(root) {
    if (!root._createGroupNameState) root._createGroupNameState = { photoDataUrl: null };
    return root._createGroupNameState;
  }

  // Preview the picked image inside the .photo-upload tile (same FileReader →
  // dataURL pattern as edit-profile) and stash it for the Next handoff.
  function previewPhoto(root, tile, file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      state(root).photoDataUrl = e.target.result;
      if (tile) {
        tile.classList.add('photo-upload--photo');
        tile.style.backgroundImage = 'url(' + e.target.result + ')';
      }
    };
    reader.readAsDataURL(file);
  }

  function init(root) {
    // One-time wiring: attach the Next click handler once. Guarded by a flag
    // so re-shows (back navigation) don't stack listeners.
    var tile = root.querySelector('#js-group-photo');
    var photoInput = root.querySelector('#js-group-photo-input');
    if (tile && photoInput && !tile._wired) {
      tile._wired = true;
      tile.addEventListener('click', function () { photoInput.click(); });
      photoInput.addEventListener('change', function () {
        previewPhoto(root, tile, photoInput.files && photoInput.files[0]);
      });
    }

    var nextBtn = root.querySelector('#js-next-cgn');
    if (nextBtn && !nextBtn._wired) {
      nextBtn._wired = true;
      nextBtn.addEventListener('click', function () {
        var nameInput = root.querySelector('#js-group-name');
        var name = nameInput.value.trim();
        if (!name) {
          nameInput.focus();
          nameInput.closest('.input-field').classList.add('input-field--error');
          return;
        }
        var payload = { name: name, type: 'other', emoji: '📝' };
        var photo = state(root).photoDataUrl;
        if (photo) payload.photo = photo;
        sessionStorage.setItem('settlr_new_group', JSON.stringify(payload));
        handoff();
      });
    }
  }

  function onShow(root) {
    // Reset transient UI: clear any prior validation error so the field starts
    // clean each time the step is shown.
    var field = root.querySelector('.input-field');
    if (field) field.classList.remove('input-field--error');

    // Reset the photo picker so a fresh group never carries a previous preview.
    state(root).photoDataUrl = null;
    var tile = root.querySelector('#js-group-photo');
    if (tile) {
      tile.classList.remove('photo-upload--photo');
      tile.style.backgroundImage = '';
    }
    var photoInput = root.querySelector('#js-group-photo-input');
    if (photoInput) photoInput.value = '';
  }

  function onHide(root) {
    // Nothing persistent to tear down (no timers / viewport handlers). The
    // Next listener is attached idempotently and lives with the in-DOM view.
  }

  if (window.SettlrViews) {
    window.SettlrViews.register('create-group-name', { init: init, onShow: onShow, onHide: onHide });
  }
  if (!window.SettlrRouterSPA) {
    document.addEventListener('DOMContentLoaded', function () {
      var root = document.querySelector('[data-view="create-group-name"]');
      if (root) { init(root, {}); onShow(root, {}); }
    });
  }
})();
