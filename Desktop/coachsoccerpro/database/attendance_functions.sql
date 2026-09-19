-- ══════════════════════════════════════════════════════════════════════════════
-- COACHSOCCERPRO ATTENDANCE FUNCTIONS
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Function to increment a player's attendance streak
CREATE OR REPLACE FUNCTION increment_attendance_streak(player_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE players
  SET
    attendance_streak = attendance_streak + 1,
    total_points = total_points + 5  -- 5 points per attendance
  WHERE id = player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_attendance_streak(UUID) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- ATTENDANCE RLS POLICIES
-- ══════════════════════════════════════════════════════════════════════════════

-- Coaches can view attendance for their team's events
CREATE POLICY "Coaches can view team attendance" ON attendance
FOR SELECT TO authenticated
USING (
  event_id IN (
    SELECT e.id FROM events e
    JOIN coaches c ON c.team_id = e.team_id
    WHERE c.user_id = auth.uid()
  )
);

-- Coaches can insert attendance for their team's events
CREATE POLICY "Coaches can insert team attendance" ON attendance
FOR INSERT TO authenticated
WITH CHECK (
  event_id IN (
    SELECT e.id FROM events e
    JOIN coaches c ON c.team_id = e.team_id
    WHERE c.user_id = auth.uid()
  )
);

-- Coaches can update attendance for their team's events
CREATE POLICY "Coaches can update team attendance" ON attendance
FOR UPDATE TO authenticated
USING (
  event_id IN (
    SELECT e.id FROM events e
    JOIN coaches c ON c.team_id = e.team_id
    WHERE c.user_id = auth.uid()
  )
);

-- Coaches can delete attendance for their team's events
CREATE POLICY "Coaches can delete team attendance" ON attendance
FOR DELETE TO authenticated
USING (
  event_id IN (
    SELECT e.id FROM events e
    JOIN coaches c ON c.team_id = e.team_id
    WHERE c.user_id = auth.uid()
  )
);

-- Parents can view their child's attendance
CREATE POLICY "Parents can view child attendance" ON attendance
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM players p
    JOIN parents pr ON pr.id = p.parent_id
    WHERE pr.user_id = auth.uid()
  )
);
