-- ══════════════════════════════════════════════════════════════════════════════
-- COMPLETE DEMO SEED - RUN THIS ONCE IN SUPABASE SQL EDITOR
-- ══════════════════════════════════════════════════════════════════════════════

-- Fix table structure first
ALTER TABLE quick_tags ADD COLUMN IF NOT EXISTS tag_type VARCHAR(30);
ALTER TABLE quick_tags ADD COLUMN IF NOT EXISTS coach_id UUID;
ALTER TABLE quick_tags ADD COLUMN IF NOT EXISTS points_awarded INTEGER DEFAULT 0;
ALTER TABLE quick_tags ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Drop triggers that cause issues
DROP TRIGGER IF EXISTS trigger_update_points_on_tag ON quick_tags;
DROP TRIGGER IF EXISTS trigger_update_points_on_badge ON player_badges;
DROP FUNCTION IF EXISTS update_player_points() CASCADE;

-- Clear existing demo data
DELETE FROM player_payments;
DELETE FROM payment_requests;
DELETE FROM quick_tags;
DELETE FROM attendance;
DELETE FROM player_badges;
DELETE FROM events;
DELETE FROM messages;
DELETE FROM players;
DELETE FROM coaches;
DELETE FROM teams WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
DELETE FROM pro_habits;
DELETE FROM badge_definitions;

-- Badge definitions
INSERT INTO badge_definitions (key, category, rarity, icon, points_value) VALUES
('perfectWeek', 'attendance', 'common', '📅', 10),
('perfectMonth', 'attendance', 'uncommon', '🗓️', 25),
('ironPlayer', 'attendance', 'rare', '🛡️', 50),
('earlyBird', 'attendance', 'common', '🐦', 10),
('fourWeekStreak', 'attendance', 'uncommon', '🔥', 20),
('firstGoal', 'skills', 'common', '⚽', 15),
('hatTrick', 'skills', 'rare', '🎩', 40),
('cleanSheet', 'skills', 'uncommon', '🧤', 20),
('bothFeet', 'skills', 'uncommon', '👟', 25),
('speedDemon', 'skills', 'uncommon', '⚡', 20),
('assistKing', 'teamwork', 'uncommon', '🤝', 25),
('encourager', 'teamwork', 'common', '💬', 15),
('goodSport', 'teamwork', 'common', '🏅', 15),
('teamCaptain', 'teamwork', 'rare', '©️', 35),
('greatTeammate', 'teamwork', 'uncommon', '❤️', 20),
('firstPractice', 'milestones', 'common', '🌟', 5),
('firstGame', 'milestones', 'common', '🎮', 10),
('mostImproved', 'milestones', 'rare', '📈', 40),
('matchMVP', 'special', 'rare', '⭐', 35),
('coachsPick', 'special', 'uncommon', '👆', 25),
('gaveEverything', 'effort', 'common', '🔥', 15),
('neverGaveUp', 'effort', 'uncommon', '🦁', 20);

-- Pro habits
INSERT INTO pro_habits (key, category, player_name) VALUES
('messi9Hours', 'sleep', 'Lionel Messi'),
('ronaldo5Naps', 'sleep', 'Cristiano Ronaldo'),
('haalandBedtime', 'sleep', 'Erling Haaland'),
('mbappeNoScreens', 'sleep', 'Kylian Mbappé'),
('messiPasta', 'nutrition', 'Lionel Messi'),
('ronaldoNoSugar', 'nutrition', 'Cristiano Ronaldo'),
('haalandProtein', 'nutrition', 'Erling Haaland'),
('pedriWater', 'nutrition', 'Pedri'),
('ronaldoExtra', 'training', 'Cristiano Ronaldo'),
('messiWeakFoot', 'training', 'Lionel Messi'),
('mbappeTired', 'training', 'Kylian Mbappé'),
('salahRepetition', 'training', 'Mohamed Salah'),
('messiSmallSteps', 'mindset', 'Lionel Messi'),
('ronaldoHardWork', 'mindset', 'Cristiano Ronaldo'),
('morganGoals', 'mindset', 'Alex Morgan'),
('modricNeverQuit', 'mindset', 'Luka Modrić');

-- Demo team
INSERT INTO teams (id, name, age_group, season, invite_code, primary_color, secondary_color)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Las Vegas Lightning U12', 'U12', 'Spring 2026', 'LVLIGHT2026', '#FFD700', '#0075FF');

-- 40 players
INSERT INTO players (id, team_id, first_name, last_name, date_of_birth, position, jersey_number, total_points, attendance_streak, card_frame) VALUES
('00010000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sofia', 'Martinez', '2014-03-15', 'Forward', 10, 520, 12, 'diamond'),
('00020000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Marcus', 'Rodriguez', '2014-05-22', 'Midfielder', 8, 485, 10, 'platinum'),
('00030000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Emma', 'Johnson', '2014-01-08', 'Defender', 4, 445, 8, 'platinum'),
('00040000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lucas', 'Chen', '2014-07-30', 'Goalkeeper', 1, 410, 15, 'platinum'),
('00050000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Isabella', 'Garcia', '2014-09-12', 'Forward', 9, 380, 6, 'platinum'),
('00060000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Diego', 'Hernandez', '2014-02-28', 'Midfielder', 6, 245, 5, 'gold'),
('00070000-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mia', 'Williams', '2014-11-05', 'Forward', 11, 220, 7, 'gold'),
('00080000-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mateo', 'Lopez', '2014-04-18', 'Defender', 3, 195, 4, 'gold'),
('00090000-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ava', 'Brown', '2014-06-25', 'Midfielder', 7, 175, 9, 'gold'),
('00100000-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sebastian', 'Morales', '2014-08-14', 'Forward', 17, 160, 3, 'gold'),
('00110000-0000-0000-0000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Camila', 'Rivera', '2014-10-20', 'Defender', 5, 145, 6, 'gold'),
('00120000-0000-0000-0000-000000000012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ethan', 'Davis', '2014-12-03', 'Midfielder', 14, 130, 4, 'gold'),
('00130000-0000-0000-0000-000000000013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Valentina', 'Sanchez', '2014-01-17', 'Forward', 20, 115, 8, 'gold'),
('00140000-0000-0000-0000-000000000014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Noah', 'Miller', '2014-03-29', 'Goalkeeper', 12, 105, 2, 'gold'),
('00150000-0000-0000-0000-000000000015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Luna', 'Gonzalez', '2014-05-11', 'Midfielder', 16, 85, 5, 'silver'),
('00160000-0000-0000-0000-000000000016', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Liam', 'Anderson', '2014-07-08', 'Defender', 2, 78, 3, 'silver'),
('00170000-0000-0000-0000-000000000017', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Elena', 'Torres', '2014-09-22', 'Forward', 22, 72, 4, 'silver'),
('00180000-0000-0000-0000-000000000018', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oliver', 'Ramirez', '2014-11-15', 'Midfielder', 18, 65, 6, 'silver'),
('00190000-0000-0000-0000-000000000019', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Aria', 'Martinez', '2014-02-05', 'Defender', 15, 58, 2, 'silver'),
('00200000-0000-0000-0000-000000000020', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Benjamin', 'Flores', '2014-04-28', 'Forward', 19, 52, 7, 'silver'),
('00210000-0000-0000-0000-000000000021', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Gabriela', 'Reyes', '2014-06-19', 'Midfielder', 13, 48, 1, 'silver'),
('00220000-0000-0000-0000-000000000022', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Alexander', 'Cruz', '2014-08-07', 'Defender', 23, 42, 3, 'silver'),
('00230000-0000-0000-0000-000000000023', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Natalia', 'Vargas', '2014-10-31', 'Forward', 21, 38, 5, 'silver'),
('00240000-0000-0000-0000-000000000024', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Daniel', 'Mendoza', '2014-12-14', 'Midfielder', 24, 32, 2, 'silver'),
('00250000-0000-0000-0000-000000000025', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Victoria', 'Castro', '2014-01-26', 'Defender', 25, 28, 4, 'silver'),
('00260000-0000-0000-0000-000000000026', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'James', 'Ortiz', '2014-03-09', 'Forward', 26, 22, 1, 'bronze'),
('00270000-0000-0000-0000-000000000027', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Adriana', 'Delgado', '2014-05-21', 'Midfielder', 27, 20, 3, 'bronze'),
('00280000-0000-0000-0000-000000000028', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ryan', 'Gutierrez', '2014-07-14', 'Defender', 28, 18, 2, 'bronze'),
('00290000-0000-0000-0000-000000000029', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Carolina', 'Romero', '2014-09-03', 'Forward', 29, 16, 1, 'bronze'),
('00300000-0000-0000-0000-000000000030', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Michael', 'Jimenez', '2014-11-27', 'Midfielder', 30, 14, 4, 'bronze'),
('00310000-0000-0000-0000-000000000031', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Daniela', 'Ruiz', '2014-02-18', 'Defender', 31, 12, 0, 'bronze'),
('00320000-0000-0000-0000-000000000032', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Christopher', 'Navarro', '2014-04-06', 'Forward', 32, 10, 2, 'bronze'),
('00330000-0000-0000-0000-000000000033', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Valeria', 'Medina', '2014-06-29', 'Midfielder', 33, 8, 1, 'bronze'),
('00340000-0000-0000-0000-000000000034', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Andrew', 'Silva', '2014-08-22', 'Defender', 34, 6, 3, 'bronze'),
('00350000-0000-0000-0000-000000000035', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mariana', 'Perez', '2014-10-15', 'Forward', 35, 5, 0, 'bronze'),
('00360000-0000-0000-0000-000000000036', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Joshua', 'Herrera', '2014-12-08', 'Midfielder', 36, 5, 1, 'bronze'),
('00370000-0000-0000-0000-000000000037', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Paula', 'Aguilar', '2014-01-31', 'Defender', 37, 5, 2, 'bronze'),
('00380000-0000-0000-0000-000000000038', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kevin', 'Vega', '2014-03-24', 'Forward', 38, 5, 0, 'bronze'),
('00390000-0000-0000-0000-000000000039', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fernanda', 'Soto', '2014-05-17', 'Midfielder', 39, 5, 1, 'bronze'),
('00400000-0000-0000-0000-000000000040', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Brandon', 'Espinoza', '2014-07-10', 'Defender', 40, 5, 0, 'bronze');

-- Events
INSERT INTO events (id, team_id, title, event_type, start_time, end_time, location_name, location_address) VALUES
('e0010000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tuesday Practice', 'practice', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '90 minutes', 'Desert Breeze Park', '8425 Spring Mountain Rd, Las Vegas, NV'),
('e0020000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Thursday Practice', 'practice', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '90 minutes', 'Desert Breeze Park', '8425 Spring Mountain Rd, Las Vegas, NV'),
('e0030000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Game vs Phoenix Thunder', 'game', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '2 hours', 'Kellogg-Zaher Soccer Complex', '7901 W Washington Ave, Las Vegas, NV'),
('e0040000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tuesday Practice', 'practice', NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days' + INTERVAL '90 minutes', 'Desert Breeze Park', '8425 Spring Mountain Rd, Las Vegas, NV'),
('e0050000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Game vs Henderson Hawks', 'game', NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days' + INTERVAL '2 hours', 'Heritage Park', '350 S Racetrack Rd, Henderson, NV'),
('e0060000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Last Tuesday Practice', 'practice', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '90 minutes', 'Desert Breeze Park', NULL),
('e0070000-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Last Thursday Practice', 'practice', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '90 minutes', 'Desert Breeze Park', NULL);

-- Payment requests
INSERT INTO payment_requests (id, team_id, title, description, amount_cents, due_date) VALUES
('aaa10000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'July Monthly Dues', 'Monthly training fees for July 2026', 7500, '2026-07-15'),
('aaa20000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tournament Registration', 'Summer Showdown Tournament entry fee', 4000, '2026-07-20'),
('aaa30000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'New Uniforms', 'Team uniform set - jersey, shorts, socks', 6500, '2026-07-25');

-- Messages
INSERT INTO messages (team_id, subject, body, message_type, ai_enhanced, sent_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Great practice today!', 'Hi team parents! Just wanted to share that today''s practice was fantastic. The kids showed great energy and teamwork. Sofia and Marcus really stepped up as leaders. See everyone Thursday!', 'standard', true, NOW() - INTERVAL '3 days'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Game Saturday - Please RSVP', 'Reminder: We have our game against Phoenix Thunder this Saturday at 10am at Kellogg-Zaher Soccer Complex. Please confirm if your child can make it. Go Lightning!', 'reminder', false, NOW() - INTERVAL '1 day');

-- Show results
SELECT 'Players' as item, COUNT(*)::text as count FROM players WHERE team_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
UNION ALL SELECT 'Events', COUNT(*)::text FROM events WHERE team_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
UNION ALL SELECT 'Badge Types', COUNT(*)::text FROM badge_definitions
UNION ALL SELECT 'Pro Habits', COUNT(*)::text FROM pro_habits
UNION ALL SELECT 'Payment Requests', COUNT(*)::text FROM payment_requests
UNION ALL SELECT 'Messages', COUNT(*)::text FROM messages;
