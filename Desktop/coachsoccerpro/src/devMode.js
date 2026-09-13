/**
 * Single switch for demo vs live data.
 *
 * Default in `npm start`: DEV_MODE = true (demo data, no Supabase needed).
 * To test the REAL auth + database flow locally, create/edit `.env.local`:
 *
 *   REACT_APP_LIVE=1
 *
 * then restart the dev server. Production builds are always live.
 */
export const DEV_MODE =
  process.env.NODE_ENV === "development" && process.env.REACT_APP_LIVE !== "1";
