// ══════════════════════════════════════════════════════════════════════════
// PIPE A — coach-code validation (CSP → SoccerMental, PULL)
//
//   GET /pipe-a/{code}
//   Authorization: Bearer <PIPE_A_SECRET>
//   → 200 {"valid":true,"coach_id":"...","active":true}
//   → 200 {"valid":false}            (unknown or inactive code)
//   → 401                             (bad/missing bearer)
//
// SoccerMental caches responses for max 5 minutes (ruled).
//
// Deploy:  supabase functions deploy pipe-a --no-verify-jwt
// Secrets: supabase secrets set PIPE_A_SECRET=...   (Jason places the same
//          value in SoccerMental's env himself — never through agent chat)
// ══════════════════════════════════════════════════════════════════════════

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Per-pipe bearer secret — the only key that ever crosses products
  const auth = req.headers.get("authorization") || "";
  const secret = Deno.env.get("PIPE_A_SECRET") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  if (req.method !== "GET") {
    return new Response("method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const code = decodeURIComponent(url.pathname.split("/").pop() || "")
    .trim()
    .toUpperCase();
  if (!code || code.length > 24) {
    return Response.json({ valid: false });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data } = await supabase
    .from("coach_codes")
    .select("code, coach_id, active")
    .eq("code", code)
    .maybeSingle();

  if (!data || !data.active) {
    return Response.json({ valid: false });
  }
  return Response.json({ valid: true, coach_id: data.coach_id, active: true });
});
