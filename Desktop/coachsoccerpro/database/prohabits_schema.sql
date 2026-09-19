-- ══════════════════════════════════════════════════════════════════════════════
-- COACHSOCCERPRO PRO HABITS ASSIGNMENT SCHEMA
-- Track which habits have been sent to which players
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Pro habits assignment table
CREATE TABLE IF NOT EXISTS player_habit_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES pro_habits(id) ON DELETE CASCADE,
  sent_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(player_id, habit_id, DATE(sent_at))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_habit_assignments_player ON player_habit_assignments(player_id);
CREATE INDEX IF NOT EXISTS idx_habit_assignments_habit ON player_habit_assignments(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_assignments_sent ON player_habit_assignments(sent_at DESC);

-- RLS
ALTER TABLE player_habit_assignments ENABLE ROW LEVEL SECURITY;

-- Coaches can manage habit assignments for their team
CREATE POLICY "Coaches can manage habit assignments" ON player_habit_assignments
FOR ALL TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM players p
    JOIN coaches c ON c.team_id = p.team_id
    WHERE c.user_id = auth.uid()
  )
);

-- Players/Children can view their own habit assignments
CREATE POLICY "Players can view own habits" ON player_habit_assignments
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT id FROM players WHERE user_id = auth.uid()
  )
);

-- Parents can view their child's habit assignments
CREATE POLICY "Parents can view child habits" ON player_habit_assignments
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM players p
    JOIN parents pr ON pr.id = p.parent_id
    WHERE pr.user_id = auth.uid()
  )
);
