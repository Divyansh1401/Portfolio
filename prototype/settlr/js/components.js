/* ============================================================
   Settlr Web Components — single-source markup, light DOM.
   Each component renders into LIGHT DOM (no shadow root) and
   carries the existing design-system class on its host, so the
   global token + css/*.css styling applies unchanged.

   Loaded SYNCHRONOUSLY in <head> (after router.js) so custom
   elements are defined before the parser reaches them — no flash.

   Pattern: connectedCallback() sets this.className + this.innerHTML
   once. Variation comes from attributes (e.g. time, title, back).
   ============================================================ */
(function () {
  'use strict';
  if (window.__settlrComponents) return;
  window.__settlrComponents = true;

  function define(name, cls) {
    if (!customElements.get(name)) customElements.define(name, cls);
  }

  // ── Inline Phosphor SVGs for chrome icons ───────────────
  // No font icons: chrome renders inline SVG inside an .icon-holder. These
  // match what js/icon-upgrade.js produced at runtime for these glyphs
  // (the back caret used ph-bold, which had no bold map and fell back to
  // regular, so the regular weight is the faithful, unchanged rendering).
  var ICON = {
    'caret-left': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/></svg>',
    'house':      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z"/></svg>',
    'house-fill': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164a4,4,0,0,0-4-4H108a4,4,0,0,0-4,4v52a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V120a16,16,0,0,1,4.69-11.31l80-80a16,16,0,0,1,22.62,0l80,80A16,16,0,0,1,224,120Z"/></svg>',
    'user':       '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/></svg>',
    'user-fill':  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z"/></svg>',
    'clock':      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/></svg>',
    'clock-fill': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm56,112H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48a8,8,0,0,1,0,16Z"/></svg>'
  };

  // Wrap an inline SVG in the standard icon-holder. Bare holder (1em) matches
  // the prior icon-upgrade output; pass extra classes (e.g. a size modifier)
  // when a component needs explicit sizing.
  function holder(svg, extra) {
    return '<span class="icon-holder' + (extra ? ' ' + extra : '') +
      '" aria-hidden="true">' + svg + '</span>';
  }

  // ── <settlr-status-bar> ─────────────────────────────────
  // The mock iOS status bar is not part of the app — render nothing. The tag
  // stays defined so existing markup is valid, but it collapses to an empty,
  // zero-height element (no class, no children). The app relies on the real OS
  // status bar; safe-area insets clear the notch via each screen's CSS.
  define('settlr-status-bar', class extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.style.display = 'none';
    }
  });

  // ── <settlr-top-app-bar title back bordered brand> ──────
  // Prepends a back button + title before any authored right-action
  // child (light-DOM "slot"). Variants: --nav (when back present),
  // --bordered (bottom border), brand title colour.
  define('settlr-top-app-bar', class extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      var back = this.getAttribute('back');
      var title = this.getAttribute('title') || '';
      this.classList.add('top-app-bar');
      // --nav (compact 20px title) when there's a back button OR an explicit `nav` attr
      if (back !== null || this.hasAttribute('nav')) this.classList.add('top-app-bar--nav');
      if (this.hasAttribute('bordered')) this.classList.add('top-app-bar--bordered');
      var html = '';
      if (back !== null) {
        html += '<a href="' + back + '" class="icon-btn icon-btn--sm top-app-bar__back" aria-label="Back">' +
          holder(ICON['caret-left']) + '</a>';
      }
      if (title) {
        var brand = this.hasAttribute('brand') ? ' top-app-bar__title--brand' : '';
        html += '<span class="top-app-bar__title' + brand + '">' + title + '</span>';
      }
      if (html) this.insertAdjacentHTML('afterbegin', html);
    }
  });

  // ── <settlr-screen-footer> ──────────────────────────────
  // Fixed action footer. Keeps authored .btn children; just carries
  // the .screen-footer class so css/screen-footer.css applies.
  define('settlr-screen-footer', class extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;
      this.classList.add('screen-footer');
    }
  });

  // ── <settlr-bottom-nav active="home|people|activity"> ───
  function navTab(href, key, name, label, active) {
    var on = key === active;
    var svg = ICON[on ? name + '-fill' : name]; // active tab uses fill weight
    return '<a href="' + href + '" class="bottom-nav__tab' + (on ? ' is-active' : '') + '">' +
      '<div class="bottom-nav__tab-content">' +
        '<span class="bottom-nav__tab-icon">' + holder(svg) + '</span>' +
        '<span class="bottom-nav__tab-label text-caption-sm">' + label + '</span>' +
      '</div></a>';
  }
  define('settlr-bottom-nav', class extends HTMLElement {
    static get observedAttributes() { return ['active']; }
    connectedCallback() { this._render(); }
    attributeChangedCallback() { if (this.isConnected) this._render(); }
    _render() {
      var active = this.getAttribute('active') || '';
      this.classList.add('bottom-nav-bar');
      this.innerHTML = '<nav class="bottom-nav">' +
        navTab('home-dashboard', 'home', 'house', 'Home', active) +
        navTab('people', 'people', 'user', 'People', active) +
        navTab('activity', 'activity', 'clock', 'Activity', active) +
      '</nav>';
    }
  });
})();
