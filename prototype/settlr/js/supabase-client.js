/* ============================================================
   Settlr — Supabase client + auth helper
   Loads supabase-js (v2) from CDN and exposes a tiny auth API on
   window.SettlrAuth. Reads credentials from window.SETTLR_SUPABASE
   (js/supabase-config.js).

   If credentials are missing/placeholder, SettlrAuth.configured === false
   and the app can stay in local/demo mode (no crash).

   Public API (all async unless noted):
     SettlrAuth.configured            → boolean (sync)
     SettlrAuth.ready                 → Promise (resolves once SDK + client are up)
     SettlrAuth.client()              → the supabase client (or null)
     SettlrAuth.getUser()             → current auth user or null
     SettlrAuth.getSession()          → current session or null
     SettlrAuth.signUpEmail(email,pw) → { data, error }
     SettlrAuth.signInEmail(email,pw) → { data, error }
     SettlrAuth.signInWithGoogle(redirectTo?) → { data, error }
     SettlrAuth.signOut()             → { error }
     SettlrAuth.onChange(cb)          → unsubscribe fn; cb(event, session)
     SettlrAuth.requireAuth(loginUrl) → redirects to loginUrl if not signed in
   ============================================================ */
(function () {
  'use strict';

  var SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  var cfg = window.SETTLR_SUPABASE || {};
  var configured = !!(cfg.url && cfg.anonKey &&
    cfg.url.indexOf('YOUR_') === -1 && cfg.anonKey.indexOf('YOUR_') === -1);

  var _client = null;
  var _resolveReady;
  var ready = new Promise(function (res) { _resolveReady = res; });

  // Inject the supabase-js UMD bundle once (exposes window.supabase.createClient).
  function loadSdk() {
    return new Promise(function (resolve, reject) {
      if (window.supabase && window.supabase.createClient) return resolve();
      var s = document.createElement('script');
      s.src = SDK_URL;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed to load supabase-js')); };
      document.head.appendChild(s);
    });
  }

  function init() {
    if (!configured) { _resolveReady(false); return; }
    loadSdk().then(function () {
      _client = window.supabase.createClient(cfg.url, cfg.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      _resolveReady(true);
    }).catch(function (e) {
      console.error('[SettlrAuth] init failed:', e);
      _resolveReady(false);
    });
  }

  function client() { return _client; }

  function getSession() {
    return ready.then(function (ok) {
      if (!ok || !_client) return null;
      return _client.auth.getSession().then(function (r) {
        return (r && r.data && r.data.session) || null;
      });
    });
  }

  function getUser() {
    return getSession().then(function (s) { return s ? s.user : null; });
  }

  function signUpEmail(email, password) {
    return ready.then(function (ok) {
      if (!ok) return { error: new Error('Supabase not configured') };
      return _client.auth.signUp({ email: email, password: password });
    });
  }

  function signInEmail(email, password) {
    return ready.then(function (ok) {
      if (!ok) return { error: new Error('Supabase not configured') };
      return _client.auth.signInWithPassword({ email: email, password: password });
    });
  }

  function signInWithGoogle(redirectTo) {
    return ready.then(function (ok) {
      if (!ok) return { error: new Error('Supabase not configured') };
      return _client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectTo || window.location.origin + '/index.html' }
      });
    });
  }

  function signOut() {
    return ready.then(function (ok) {
      if (!ok || !_client) return { error: null };
      return _client.auth.signOut();
    });
  }

  function onChange(cb) {
    var sub = null;
    ready.then(function (ok) {
      if (!ok || !_client) return;
      var r = _client.auth.onAuthStateChange(function (event, session) { cb(event, session); });
      sub = r && r.data && r.data.subscription;
    });
    return function () { if (sub && sub.unsubscribe) sub.unsubscribe(); };
  }

  // Redirect to login when there's no session. Returns a Promise<boolean>
  // (true = authed). Safe no-op when Supabase isn't configured yet.
  function requireAuth(loginUrl) {
    return getUser().then(function (u) {
      if (!configured) return false;       // local/demo mode — don't gate
      if (!u) { window.location.replace(loginUrl || '/screens/login.html'); return false; }
      return true;
    });
  }

  window.SettlrAuth = {
    configured: configured,
    ready: ready,
    client: client,
    getUser: getUser,
    getSession: getSession,
    signUpEmail: signUpEmail,
    signInEmail: signInEmail,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    onChange: onChange,
    requireAuth: requireAuth
  };

  init();
})();
