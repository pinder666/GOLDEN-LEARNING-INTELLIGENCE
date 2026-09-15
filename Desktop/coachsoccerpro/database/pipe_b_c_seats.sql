-- ══════════════════════════════════════════════════════════════════════════
-- PIPES B & C + BILLING (CSP side). Paste once in Supabase SQL Editor.
-- Idempotent. Lean per the depth-cap ruling.
-- ══════════════════════════════════════════════════════════════════════════

-- PIPE B CACHE — display-only mirror of SoccerMental's roster pushes.
-- CSP never computes money from this; offset_usd/ladder_state arrive final.
CREATE TABLE IF NOT EXISTS sm_roster_cache (
  coach_id UUID PRIMARY KEY REFERENCES coaches(id) ON DELETE CASCADE,
  as_of TIMESTAMPTZ,
  seat_count_active INTEGER DEFAULT 0,
  offset_usd NUMERIC(6,2) DEFAULT 0,
  ladder_state TEXT,
  seats JSONB DEFAULT '[]',   -- [{player_ref, player_alias, status, progress_card{...5 fields}}]
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sm_roster_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coach reads own roster cache" ON sm_roster_cache;
CREATE POLICY "Coach reads own roster cache" ON sm_roster_cache
FOR SELECT TO authenticated
USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));
-- writes come only from the pipe-b Edge Function (service role)

-- COACH BILLING — fee is always $99; offset displayed from cache;
-- hand_gift is the founder-only switch (set by Jason in the dashboard,
-- never exposed in any UI control).
CREATE TABLE IF NOT EXISTS coach_billing (
  coach_id UUID PRIMARY KEY REFERENCES coaches(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  hand_gift BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coach_billing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coach reads own billing" ON coach_billing;
CREATE POLICY "Coach reads own billing" ON coach_billing
FOR SELECT TO authenticated
USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- PIPE C LOG — append-only record of drill assignments sent to SoccerMental
CREATE TABLE IF NOT EXISTS drill_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  code VARCHAR(24),
  drill_id VARCHAR(40) NOT NULL,
  players JSONB NOT NULL,          -- ["ref1","ref2"] or "all"
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false
);

ALTER TABLE drill_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Coach reads own assignments" ON drill_assignments;
CREATE POLICY "Coach reads own assignments" ON drill_assignments
FOR SELECT TO authenticated
USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));
