-- ══════════════════════════════════════════════════════════════════════════════
-- COACHSOCCERPRO QUICK TAGS SCHEMA
-- Post-practice quick recognition tags
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Quick tags table
CREATE TABLE IF NOT EXISTS quick_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  tag_key VARCHAR(50) NOT NULL, -- 'effort', 'teammate', 'improvement', 'coachspick'
  awarded_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id, tag_key)
);

-- Indexes
CREATE INDEX idx_quick_tags_event ON quick_tags(event_id);
CREATE INDEX idx_quick_tags_player ON quick_tags(player_id);
CREATE INDEX idx_quick_tags_tag ON quick_tags(tag_key);

-- RLS
ALTER TABLE quick_tags ENABLE ROW LEVEL SECURITY;

-- Coaches can manage quick tags for their team
CREATE POLICY "Coaches can manage quick tags" ON quick_tags
FOR ALL TO authenticated
USING (
  event_id IN (
    SELECT e.id FROM events e
    JOIN coaches c ON c.team_id = e.team_id
    WHERE c.user_id = auth.uid()
  )
);

-- ══════════════════════════════════════════════════════════════════════════════
-- POINTS FUNCTION
-- ══════════════════════════════════════════════════════════════════════════════

-- Function to add points to a player
CREATE OR REPLACE FUNCTION add_player_points(player_id UUID, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE players
  SET total_points = total_points + points_to_add
  WHERE id = player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_player_points(UUID, INTEGER) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- MESSAGES TABLE (if not exists)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  sender_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'individual', -- 'team', 'individual'
  subject VARCHAR(255),
  body TEXT NOT NULL,
  original_text TEXT, -- before AI enhancement
  was_ai_enhanced BOOLEAN DEFAULT false,
  recipient_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  recipient_parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sent', 'delivered', 'read'
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_team ON messages(team_id);
CREATE INDEX IF NOT EXISTS idx_messages_coach ON messages(sender_coach_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their messages
CREATE POLICY "Coaches can manage own messages" ON messages
FOR ALL TO authenticated
USING (
  sender_coach_id IN (
    SELECT id FROM coaches WHERE user_id = auth.uid()
  )
);

-- Parents can view messages sent to them
CREATE POLICY "Parents can view their messages" ON messages
FOR SELECT TO authenticated
USING (
  recipient_parent_id IN (
    SELECT id FROM parents WHERE user_id = auth.uid()
  )
  OR
  (message_type = 'team' AND team_id IN (
    SELECT team_id FROM parents WHERE user_id = auth.uid()
  ))
);
