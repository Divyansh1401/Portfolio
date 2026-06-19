/* ============================================================
   Settlr — Supabase config (DISABLED for the portfolio prototype)
   This embedded copy runs fully offline in local/demo mode using
   the baked-in SEED_DATA mock dataset. No backend, no auth, no keys.
   The placeholder values below make SettlrAuth.configured === false,
   so index.html boots straight into the seeded home-dashboard.
   ============================================================ */
window.SETTLR_SUPABASE = {
  url: 'YOUR_SUPABASE_URL',
  anonKey: 'YOUR_SUPABASE_ANON_KEY'
};
