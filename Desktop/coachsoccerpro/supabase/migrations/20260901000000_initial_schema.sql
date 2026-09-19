-- ══════════════════════════════════════════════════════════════════════════════
-- COACHSOCCERPRO DATABASE SCHEMA
-- A mentorship platform disguised as a youth soccer app
-- ══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════════════════════════
-- ORGANIZATIONS (for white label / multi-team support)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#00E676',
  secondary_color VARCHAR(7) DEFAULT '#00B0FF',
  subscription_tier VARCHAR(20) DEFAULT 'standard', -- 'standard', 'whitelabel'
  stripe_account_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- TEAMS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  age_group VARCHAR(50), -- 'U8', 'U10', 'U12', etc.
  season VARCHAR(100),
  invite_code VARCHAR(20) UNIQUE,
  primary_color VARCHAR(7) DEFAULT '#00E676',
  secondary_color VARCHAR(7) DEFAULT '#00B0FF',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- USERS (base table for all user types)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL, -- 'coach', 'assistant_coach', 'parent', 'child'
  preferred_language VARCHAR(5) DEFAULT 'en', -- 'en', 'es'
  timezone VARCHAR(100) DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- COACHES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  is_head_coach BOOLEAN DEFAULT true,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(20) DEFAULT 'trialing',
  voice_note_count INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_id)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PARENTS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  invited_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  invite_token VARCHAR(100),
  invite_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted'
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PLAYERS (the children)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- null for young kids
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  position VARCHAR(50), -- 'goalkeeper', 'defender', 'midfielder', 'forward', etc.
  jersey_number INTEGER,
  avatar_url TEXT,
  -- Calculated stats
  total_points INTEGER DEFAULT 0,
  attendance_streak INTEGER DEFAULT 0,
  effort_streak INTEGER DEFAULT 0,
  teammate_streak INTEGER DEFAULT 0,
  streak_shield_available BOOLEAN DEFAULT true,
  card_frame VARCHAR(20) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  games_played INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PLAYER STATS (detailed stats tracking)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  attendance_rate DECIMAL(5,2),
  effort_rating INTEGER, -- 1-100
  teamwork_rating INTEGER, -- 1-100
  skill_rating INTEGER, -- 1-100
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, stat_date)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- BADGE DEFINITIONS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE badge_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- null = global
  key VARCHAR(100) NOT NULL, -- 'perfectWeek', 'firstGoal', etc.
  category VARCHAR(50) NOT NULL, -- 'attendance', 'skills', 'teamwork', 'milestones', 'special', 'effort'
  rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  icon VARCHAR(50), -- icon name or emoji
  points_value INTEGER DEFAULT 10,
  auto_award_criteria JSONB, -- criteria for automatic awarding
  is_limited_time BOOLEAN DEFAULT false,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, key)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PLAYER BADGES (earned badges)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE player_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badge_definitions(id) ON DELETE CASCADE,
  awarded_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  note TEXT,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, badge_id)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- EVENTS (practices, games, tournaments, meetings)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  created_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  event_type VARCHAR(20) NOT NULL, -- 'practice', 'game', 'tournament', 'meeting'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location_name VARCHAR(255),
  location_address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  notes TEXT,
  opponent_name VARCHAR(255), -- for games
  is_home_game BOOLEAN DEFAULT true,
  recurring_pattern VARCHAR(20), -- 'weekly', 'biweekly', null
  recurring_until DATE,
  parent_event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- for recurring
  reminder_sent_48h BOOLEAN DEFAULT false,
  reminder_sent_24h BOOLEAN DEFAULT false,
  reminder_sent_2h BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- EVENT RSVPs
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  status VARCHAR(10) NOT NULL, -- 'yes', 'no', 'maybe'
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- ATTENDANCE
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  marked_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'excused'
  arrived_early BOOLEAN DEFAULT false,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- QUICK TAGS (post-practice recognition)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE quick_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  tag_type VARCHAR(30) NOT NULL, -- 'gave_effort', 'great_teammate', 'showed_improvement', 'coachs_pick'
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id, tag_type)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- MESSAGES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL, -- null = team-wide
  recipient_player_id UUID REFERENCES players(id) ON DELETE SET NULL, -- for coach→player messages
  subject VARCHAR(255),
  body TEXT NOT NULL,
  original_voice_url TEXT,
  transcribed_text TEXT,
  ai_enhanced BOOLEAN DEFAULT false,
  message_type VARCHAR(20) DEFAULT 'standard', -- 'standard', 'encouragement', 'reminder', 'prohabit', 'nutrition'
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- MESSAGE DELIVERY TRACKING
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE message_delivery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL, -- 'app', 'email', 'sms', 'push'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- VOICE NOTES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  transcription TEXT,
  ai_enhanced_text TEXT,
  used_in_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- DEVELOPMENT NOTES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE development_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  original_voice_url TEXT,
  visible_to_parent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PRO HABITS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE pro_habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(30) NOT NULL, -- 'sleep', 'nutrition', 'training', 'mindset'
  player_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PRO HABIT SENDS (when coach sends a pro habit to team/player)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE pro_habit_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pro_habit_id UUID REFERENCES pro_habits(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL, -- null = sent to whole team
  coach_note TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- HABIT TRACKING (child's daily habits)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE habit_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  habit_date DATE NOT NULL,
  water BOOLEAN DEFAULT false,
  sleep_8hrs BOOLEAN DEFAULT false,
  healthy_food BOOLEAN DEFAULT false,
  stretched BOOLEAN DEFAULT false,
  all_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, habit_date)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- JOURNEY MILESTONES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE journey_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  milestone_key VARCHAR(50) NOT NULL, -- 'firstPractice', 'firstGoal', etc.
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, milestone_key)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PAYMENT REQUESTS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  created_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL,
  due_date DATE NOT NULL,
  allow_partial BOOLEAN DEFAULT false,
  allow_installments BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- PLAYER PAYMENTS
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE player_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_request_id UUID REFERENCES payment_requests(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed', 'refunded'
  platform_fee_cents INTEGER,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- AI INTERACTIONS TRACKING
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'voice_enhance', 'draft_message', 'summarize', 'suggest'
  input_text TEXT,
  output_text TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  model_used VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- LEADERBOARD HISTORY (for tracking rank changes)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE leaderboard_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  rank_position INTEGER NOT NULL,
  points_this_week INTEGER DEFAULT 0,
  points_this_season INTEGER DEFAULT 0,
  points_all_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, week_start)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATION PREFERENCES
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  event_reminders BOOLEAN DEFAULT true,
  payment_reminders BOOLEAN DEFAULT true,
  badge_notifications BOOLEAN DEFAULT true,
  coach_messages BOOLEAN DEFAULT true,
  streak_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ══════════════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_parent ON players(parent_id);
CREATE INDEX idx_events_team ON events(team_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_attendance_player ON attendance(player_id);
CREATE INDEX idx_messages_team ON messages(team_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_player_badges_player ON player_badges(player_id);
CREATE INDEX idx_quick_tags_event ON quick_tags(event_id);
CREATE INDEX idx_habit_tracking_player_date ON habit_tracking(player_id, habit_date);
CREATE INDEX idx_leaderboard_history_team_week ON leaderboard_history(team_id, week_start);

-- ══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ══════════════════════════════════════════════════════════════════════════════
-- FUNCTIONS FOR CALCULATED FIELDS
-- ══════════════════════════════════════════════════════════════════════════════

-- Function to calculate and update player points
CREATE OR REPLACE FUNCTION update_player_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE players
  SET total_points = (
    SELECT COALESCE(SUM(points_awarded), 0)
    FROM quick_tags
    WHERE player_id = NEW.player_id
  ) + (
    SELECT COALESCE(SUM(bd.points_value), 0)
    FROM player_badges pb
    JOIN badge_definitions bd ON pb.badge_id = bd.id
    WHERE pb.player_id = NEW.player_id
  )
  WHERE id = NEW.player_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for quick_tags
CREATE TRIGGER trigger_update_points_on_tag
AFTER INSERT OR UPDATE ON quick_tags
FOR EACH ROW EXECUTE FUNCTION update_player_points();

-- Trigger for player_badges
CREATE TRIGGER trigger_update_points_on_badge
AFTER INSERT ON player_badges
FOR EACH ROW EXECUTE FUNCTION update_player_points();

-- Function to determine card frame based on points
CREATE OR REPLACE FUNCTION get_card_frame(points INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
  IF points >= 500 THEN RETURN 'diamond';
  ELSIF points >= 250 THEN RETURN 'platinum';
  ELSIF points >= 100 THEN RETURN 'gold';
  ELSIF points >= 25 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update card frame when points change
CREATE OR REPLACE FUNCTION update_card_frame()
RETURNS TRIGGER AS $$
BEGIN
  NEW.card_frame := get_card_frame(NEW.total_points);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_card_frame
BEFORE UPDATE OF total_points ON players
FOR EACH ROW EXECUTE FUNCTION update_card_frame();

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED DATA: DEFAULT BADGE DEFINITIONS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO badge_definitions (key, category, rarity, icon, points_value, auto_award_criteria) VALUES
-- Attendance badges
('perfectWeek', 'attendance', 'common', '📅', 10, '{"type": "attendance", "days": 7}'),
('perfectMonth', 'attendance', 'uncommon', '🗓️', 25, '{"type": "attendance", "days": 30}'),
('ironPlayer', 'attendance', 'rare', '🛡️', 50, '{"type": "attendance", "days": 90}'),
('earlyBird', 'attendance', 'common', '🐦', 10, '{"type": "early_arrival", "count": 5}'),
('rainyDayWarrior', 'attendance', 'uncommon', '🌧️', 15, '{"type": "manual"}'),
('fourWeekStreak', 'attendance', 'uncommon', '🔥', 20, '{"type": "streak", "weeks": 4}'),
('eightWeekStreak', 'attendance', 'rare', '💪', 35, '{"type": "streak", "weeks": 8}'),
('ironWill', 'attendance', 'legendary', '⚔️', 100, '{"type": "season_perfect"}'),

-- Skills badges
('firstGoal', 'skills', 'common', '⚽', 15, '{"type": "goals", "count": 1}'),
('hatTrick', 'skills', 'rare', '🎩', 40, '{"type": "goals_single_game", "count": 3}'),
('cleanSheet', 'skills', 'uncommon', '🧤', 20, '{"type": "manual"}'),
('bothFeet', 'skills', 'uncommon', '👟', 25, '{"type": "manual"}'),
('setPieceSpecialist', 'skills', 'rare', '🎯', 30, '{"type": "manual"}'),
('speedDemon', 'skills', 'uncommon', '⚡', 20, '{"type": "manual"}'),
('wallOfDefense', 'skills', 'uncommon', '🧱', 20, '{"type": "manual"}'),
('goldenGloves', 'skills', 'rare', '🥇', 30, '{"type": "manual"}'),

-- Teamwork badges
('assistKing', 'teamwork', 'uncommon', '🤝', 25, '{"type": "assists", "count": 5}'),
('encourager', 'teamwork', 'common', '💬', 15, '{"type": "manual"}'),
('goodSport', 'teamwork', 'common', '🏅', 15, '{"type": "manual"}'),
('teamCaptain', 'teamwork', 'rare', '©️', 35, '{"type": "manual"}'),
('helperHand', 'teamwork', 'common', '🙌', 10, '{"type": "manual"}'),
('greatTeammate', 'teamwork', 'uncommon', '❤️', 20, '{"type": "tag_count", "tag": "great_teammate", "count": 3}'),

-- Milestones badges
('firstPractice', 'milestones', 'common', '🌟', 5, '{"type": "auto_first_event"}'),
('firstGame', 'milestones', 'common', '🎮', 10, '{"type": "auto_first_game"}'),
('firstSeason', 'milestones', 'uncommon', '🏆', 30, '{"type": "season_complete"}'),
('games25', 'milestones', 'uncommon', '2️⃣', 25, '{"type": "games_played", "count": 25}'),
('games50', 'milestones', 'rare', '5️⃣', 40, '{"type": "games_played", "count": 50}'),
('games100', 'milestones', 'epic', '💯', 75, '{"type": "games_played", "count": 100}'),
('oneYear', 'milestones', 'rare', '🎂', 50, '{"type": "tenure_days", "days": 365}'),
('mostImproved', 'milestones', 'rare', '📈', 40, '{"type": "manual"}'),

-- Special badges
('worldCup2026', 'special', 'epic', '🌍', 50, '{"type": "time_limited", "start": "2026-06-01", "end": "2026-07-31"}'),
('tournamentChampion', 'special', 'rare', '🏆', 50, '{"type": "manual"}'),
('penaltyPerfect', 'special', 'uncommon', '🥅', 20, '{"type": "manual"}'),
('matchMVP', 'special', 'rare', '⭐', 35, '{"type": "manual"}'),
('coachsPick', 'special', 'uncommon', '👆', 25, '{"type": "tag_count", "tag": "coachs_pick", "count": 1}'),
('messiSleep', 'special', 'rare', '😴', 40, '{"type": "habit_streak", "habit": "sleep", "days": 7}'),
('ronaldoWorkEthic', 'special', 'rare', '💪', 40, '{"type": "manual"}'),
('healthyHabits', 'special', 'uncommon', '💚', 30, '{"type": "all_habits_streak", "days": 7}'),

-- Effort badges
('gaveEverything', 'effort', 'common', '🔥', 15, '{"type": "tag_count", "tag": "gave_effort", "count": 3}'),
('neverGaveUp', 'effort', 'uncommon', '🦁', 20, '{"type": "manual"}'),
('practiceHard', 'effort', 'uncommon', '💪', 25, '{"type": "tag_count", "tag": "gave_effort", "count": 5}');

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED DATA: PRO HABITS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO pro_habits (key, category, player_name) VALUES
-- Sleep
('messi9Hours', 'sleep', 'Lionel Messi'),
('ronaldo5Naps', 'sleep', 'Cristiano Ronaldo'),
('haalandBedtime', 'sleep', 'Erling Haaland'),
('mbappeNoScreens', 'sleep', 'Kylian Mbappé'),
('benzemaRoutine', 'sleep', 'Karim Benzema'),
('sakaRest', 'sleep', 'Bukayo Saka'),
('viniJrRecovery', 'sleep', 'Vinícius Jr'),

-- Nutrition
('messiPasta', 'nutrition', 'Lionel Messi'),
('ronaldoNoSugar', 'nutrition', 'Cristiano Ronaldo'),
('haalandProtein', 'nutrition', 'Erling Haaland'),
('mbappeNoSoda', 'nutrition', 'Kylian Mbappé'),
('pulisicGameDay', 'nutrition', 'Christian Pulisic'),
('pedriWater', 'nutrition', 'Pedri'),
('bellinghamFuel', 'nutrition', 'Jude Bellingham'),

-- Training
('ronaldoExtra', 'training', 'Cristiano Ronaldo'),
('messiWeakFoot', 'training', 'Lionel Messi'),
('mbappeTired', 'training', 'Kylian Mbappé'),
('haalandFinishing', 'training', 'Erling Haaland'),
('salahRepetition', 'training', 'Mohamed Salah'),
('debruyneVision', 'training', 'Kevin De Bruyne'),
('neymarCreativity', 'training', 'Neymar'),

-- Mindset
('messiSmallSteps', 'mindset', 'Lionel Messi'),
('ronaldoHardWork', 'mindset', 'Cristiano Ronaldo'),
('morganGoals', 'mindset', 'Alex Morgan'),
('rapinoeVisualize', 'mindset', 'Megan Rapinoe'),
('sonThankful', 'mindset', 'Son Heung-min'),
('putellasBelieve', 'mindset', 'Alexia Putellas'),
('modricNeverQuit', 'mindset', 'Luka Modrić'),
('rashfordMistakes', 'mindset', 'Marcus Rashford');
