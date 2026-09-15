// ══════════════════════════════════════════════════════════════════════════
// PIPE C — drill assignment relay (coach app → CSP → SoccerMental)
//
// The coach's browser never holds pipe secrets. The app calls this function
// with the user's own Supabase JWT (default verification ON); we resolve
// their coach + active code, log the assignment append-only, and forward to
// SoccerMental with the server-held PIPE_C_SECRET.
//
//   POST /pipe-c   { drill_id, players: ["ref", ...] | "all" }
//   → forwards { code, drill_id, ts, players } to SM (ruled payload)
//
// Deploy: supabase functions deploy pipe-c
// Secrets: PIPE_C_SECRET, SM_PIPE_C_URL
// ══════════════════════════════════════════════════════════════════════════

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  // Caller identity from their own JWT
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("authorization") || "" } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const drill_id = String(body?.drill_id || "");
  const players = body?.players === "all" ? "all" : Array.isArray(body?.players) ? body.players : null;
  if (!drill_id || players === null) return new Response("missing fields", { status: 400 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: coach } = await admin
    .from("coaches").select("id").eq("user_id", user.id).maybeSingle();
  if (!coach) return new Response("not a coach", { status: 403 });

  const { data: codeRow } = await admin
    .from("coach_codes").select("code").eq("coach_id", coach.id).eq("active", true).maybeSingle();
  if (!codeRow) return Response.json({ ok: false, reason: "no-active-code" });

  const payload = { code: codeRow.code, drill_id, ts: new Date().toISOString(), players };

  // Append-only log first — the record exists even if delivery fails
  const { data: logRow } = await admin
    .from("drill_assignments")
    .insert([{ coach_id: coach.id, code: codeRow.code, drill_id, players }])
    .select("id").single();

  // Forward to SoccerMental
  let delivered = false;
  const smUrl = Deno.env.get("SM_PIPE_C_URL");
  const smSecret = Deno.env.get("PIPE_C_SECRET");
  if (smUrl && smSecret) {
    try {
      const res = await fetch(smUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${smSecret}`,
          "Idempotency-Key": logRow?.id || crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });
      delivered = res.ok;
    } catch { delivered = false; }
  }
  if (logRow?.id) {
    await admin.from("drill_assignments").update({ delivered }).eq("id", logRow.id);
  }
  return Response.json({ ok: true, delivered });
});
