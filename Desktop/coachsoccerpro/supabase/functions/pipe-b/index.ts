// ══════════════════════════════════════════════════════════════════════════
// PIPE B — roster summary receiver (SoccerMental → CSP, PUSH)
//
//   POST /pipe-b            Authorization: Bearer <PIPE_B_SECRET>
//
//   Snapshot/recalc body:
//     { type:"snapshot", coach_id, as_of, seat_count_active, offset_usd,
//       ladder_state, seats:[{player_ref, player_alias, status,
//       progress_card:{days_sealed, current_streak, preseason_status,
//                      last_sealed_date, sessions_this_week}}] }
//
//   Instant event body (merged into the cached snapshot):
//     { type:"seat.attached"|"seat.detached"|"seat.repointed",
//       coach_id, seat:{player_ref, ...} }
//
// CSP stores and displays — never computes money from this data (ruled).
// Deploy: supabase functions deploy pipe-b --no-verify-jwt
// ══════════════════════════════════════════════════════════════════════════

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const auth = req.headers.get("authorization") || "";
  const secret = Deno.env.get("PIPE_B_SECRET") || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  let body: any;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  if (!body?.coach_id || !body?.type) return new Response("missing fields", { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (body.type === "snapshot") {
    const { error } = await supabase.from("sm_roster_cache").upsert({
      coach_id: body.coach_id,
      as_of: body.as_of || new Date().toISOString(),
      seat_count_active: body.seat_count_active ?? 0,
      offset_usd: body.offset_usd ?? 0,
      ladder_state: body.ladder_state ?? null,
      seats: body.seats ?? [],
      updated_at: new Date().toISOString(),
    });
    if (error) return new Response(error.message, { status: 500 });
    return Response.json({ ok: true });
  }

  // Instant seat events: merge into the existing snapshot so the cockpit
  // fills within seconds; the next snapshot reconciles everything.
  const { data: row } = await supabase
    .from("sm_roster_cache")
    .select("seats, seat_count_active")
    .eq("coach_id", body.coach_id)
    .maybeSingle();

  const seats: any[] = Array.isArray(row?.seats) ? row!.seats : [];
  const ref = body.seat?.player_ref;
  const without = seats.filter((s) => s.player_ref !== ref);

  let nextSeats = seats;
  let delta = 0;
  if (body.type === "seat.attached" && ref) {
    nextSeats = [...without, body.seat];
    delta = seats.length === without.length ? 1 : 0;
  } else if (body.type === "seat.detached" && ref) {
    nextSeats = without;
    delta = without.length - seats.length; // 0 or -1
  } else if (body.type === "seat.repointed" && ref) {
    nextSeats = without; // repointed away from this coach
    delta = without.length - seats.length;
  }

  const { error } = await supabase.from("sm_roster_cache").upsert({
    coach_id: body.coach_id,
    seats: nextSeats,
    seat_count_active: Math.max(0, (row?.seat_count_active ?? 0) + delta),
    updated_at: new Date().toISOString(),
  });
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ ok: true });
});
