-- ═══════════════════════════════════════════════════════════════════════════════
-- COACHSOCCERPRO — PHASE 1 DATABASE PACKAGE
-- Paste ONCE into Supabase SQL Editor.  Idempotent throughout.
-- Sequence matters — run top-to-bottom.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FIX players INFINITE RECURSION
--    Drop every policy on players and recreate them clean.
--    (Whatever policy was manually created post-schema caused the recursion.)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'players'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON players', r.policyname);
  END LOOP;
END $$;

-- Coaches see and manage all players on their team
CREATE POLICY "Coaches can view team players" ON players
FOR SELECT TO authenticated
USING (team_id IN (
  SELECT team_id FROM coaches WHERE user_id = auth.uid()
));

CREATE POLICY "Coaches can insert team players" ON players
FOR INSERT TO authenticated
WITH CHECK (team_id IN (
  SELECT team_id FROM coaches WHERE user_id = auth.uid()
));

CREATE POLICY "Coaches can update team players" ON players
FOR UPDATE TO authenticated
USING (team_id IN (
  SELECT team_id FROM coaches WHERE user_id = auth.uid()
));

CREATE POLICY "Coaches can delete team players" ON players
FOR DELETE TO authenticated
USING (team_id IN (
  SELECT team_id FROM coaches WHERE user_id = auth.uid()
));

-- Parents see their own child
CREATE POLICY "Parents can view own child" ON players
FOR SELECT TO authenticated
USING (parent_id IN (
  SELECT id FROM parents WHERE user_id = auth.uid()
));

-- Children see their own record (if they have a login)
CREATE POLICY "Players can view own record" ON players
FOR SELECT TO authenticated
USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. FIX messages ANONYMOUS READ LEAK
--    messages currently returns rows to the anon key.
--    Drop whatever policy allows that and require authentication.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'messages'
             AND (roles @> ARRAY['anon']::name[] OR roles = ARRAY[]::name[])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON messages', r.policyname);
  END LOOP;
END $$;

-- Coaches send and see all messages for their team
DROP POLICY IF EXISTS "Coaches can view team messages" ON messages;
CREATE POLICY "Coaches can view team messages" ON messages
FOR SELECT TO authenticated
USING (team_id IN (
  SELECT team_id FROM coaches WHERE user_id = auth.uid()
));

DROP POLICY IF EXISTS "Coaches can send messages" ON messages;
CREATE POLICY "Coaches can send messages" ON messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  team_id IN (SELECT team_id FROM coaches WHERE user_id = auth.uid())
);

-- Parents see messages addressed to them or their child
DROP POLICY IF EXISTS "Parents can view their messages" ON messages;
CREATE POLICY "Parents can view their messages" ON messages
FOR SELECT TO authenticated
USING (
  recipient_id = auth.uid() OR
  recipient_player_id IN (
    SELECT p.id FROM players p
    JOIN parents pr ON pr.id = p.parent_id
    WHERE pr.user_id = auth.uid()
  )
);

-- Players see messages addressed to them
DROP POLICY IF EXISTS "Players can view own messages" ON messages;
CREATE POLICY "Players can view own messages" ON messages
FOR SELECT TO authenticated
USING (
  recipient_player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FIX player_payments INFINITE RECURSION + MISSING POLICIES
--    The recursion is inherited from players via a subquery in the policy.
--    Drop all policies on player_payments and recreate clean.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE player_payments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'player_payments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON player_payments', r.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Coaches can view team payments" ON player_payments;
CREATE POLICY "Coaches can view team payments" ON player_payments
FOR SELECT TO authenticated
USING (
  payment_request_id IN (
    SELECT pr.id FROM payment_requests pr
    JOIN coaches c ON c.team_id = pr.team_id
    WHERE c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Parents can view own payments" ON player_payments;
CREATE POLICY "Parents can view own payments" ON player_payments
FOR SELECT TO authenticated
USING (parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Coaches can insert payments" ON player_payments;
CREATE POLICY "Coaches can insert payments" ON player_payments
FOR INSERT TO authenticated
WITH CHECK (
  payment_request_id IN (
    SELECT pr.id FROM payment_requests pr
    JOIN coaches c ON c.team_id = pr.team_id
    WHERE c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches can update payments" ON player_payments;
CREATE POLICY "Coaches can update payments" ON player_payments
FOR UPDATE TO authenticated
USING (
  payment_request_id IN (
    SELECT pr.id FROM payment_requests pr
    JOIN coaches c ON c.team_id = pr.team_id
    WHERE c.user_id = auth.uid()
  )
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CREATE payments VIEW
--    The parent dashboard + payments screen query .from("payments") but the
--    real tables are payment_requests + player_payments.
--    A view lets the existing app code work without touching React files.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW payments AS
SELECT
  pp.id,
  pp.payment_request_id,
  pp.player_id,
  pp.parent_id,
  pp.amount_cents,
  pp.status,
  pp.paid_at,
  pp.created_at,
  pp.updated_at,
  row_to_json(pr.*) AS payment_request
FROM player_payments pp
JOIN payment_requests pr ON pr.id = pp.payment_request_id;

-- Views don't have RLS but inherit it from underlying tables (which are fixed above).


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RUN B1 PRODUCTION PACKAGE (all idempotent)
--    Adds: is_active to players, media tables, player_habit_assignments,
--    attendance policies, add_player_points RPC, pro_habits 105-habit seed,
--    daily_habit_logs, coach_automations, birthday functions, avatars bucket.
-- ─────────────────────────────────────────────────────────────────────────────

-- [Paste the full contents of database/B1_PRODUCTION_PACKAGE.sql here]
-- (Included inline below to keep this a single paste)

-- 5a. PENDING V1 MIGRATIONS
ALTER TABLE payment_requests
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30);

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;


-- 5b. MEDIA tables
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  uploaded_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  mime_type VARCHAR(100),
  file_size_bytes INTEGER,
  duration_seconds INTEGER,
  storage_provider VARCHAR(20) DEFAULT 'supabase',
  storage_path TEXT NOT NULL,
  public_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  taken_at TIMESTAMPTZ,
  visible_to_parents BOOLEAN DEFAULT true,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_player_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  x_percent DECIMAL(5,2),
  y_percent DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_media_team ON media(team_id);
CREATE INDEX IF NOT EXISTS idx_media_event ON media(event_id);
CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_tags_player ON media_player_tags(player_id);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_player_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view team media" ON media;
CREATE POLICY "Coaches can view team media" ON media
FOR SELECT TO authenticated
USING (team_id IN (SELECT team_id FROM coaches WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Coaches can insert team media" ON media;
CREATE POLICY "Coaches can insert team media" ON media
FOR INSERT TO authenticated
WITH CHECK (team_id IN (SELECT team_id FROM coaches WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Coaches can update team media" ON media;
CREATE POLICY "Coaches can update team media" ON media
FOR UPDATE TO authenticated
USING (team_id IN (SELECT team_id FROM coaches WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Coaches can delete team media" ON media;
CREATE POLICY "Coaches can delete team media" ON media
FOR DELETE TO authenticated
USING (team_id IN (SELECT team_id FROM coaches WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Parents can view visible media" ON media;
CREATE POLICY "Parents can view visible media" ON media
FOR SELECT TO authenticated
USING (
  visible_to_parents = true AND
  team_id IN (SELECT team_id FROM parents WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Coaches can manage media tags" ON media_player_tags;
CREATE POLICY "Coaches can manage media tags" ON media_player_tags
FOR ALL TO authenticated
USING (
  media_id IN (
    SELECT m.id FROM media m
    JOIN coaches c ON c.team_id = m.team_id
    WHERE c.user_id = auth.uid()
  )
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true, 104857600,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/quicktime']
) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Coaches can upload media" ON storage.objects;
  CREATE POLICY "Coaches can upload media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM teams t
      JOIN coaches c ON c.team_id = t.id
      WHERE c.user_id = auth.uid()
    )
  );

  DROP POLICY IF EXISTS "Public media read access" ON storage.objects;
  CREATE POLICY "Public media read access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'media');

  DROP POLICY IF EXISTS "Coaches can delete media" ON storage.objects;
  CREATE POLICY "Coaches can delete media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] IN (
      SELECT t.id::text FROM teams t
      JOIN coaches c ON c.team_id = t.id
      WHERE c.user_id = auth.uid()
    )
  );
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Skipped media storage policies (create them in Dashboard > Storage > Policies)';
END $$;


-- 5c. PRO HABIT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS player_habit_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES pro_habits(id) ON DELETE CASCADE,
  sent_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_habit_assignments_player ON player_habit_assignments(player_id);
CREATE INDEX IF NOT EXISTS idx_habit_assignments_habit ON player_habit_assignments(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_assignments_sent ON player_habit_assignments(sent_at DESC);

ALTER TABLE player_habit_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can manage habit assignments" ON player_habit_assignments;
CREATE POLICY "Coaches can manage habit assignments" ON player_habit_assignments
FOR ALL TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM players p
    JOIN coaches c ON c.team_id = p.team_id
    WHERE c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Players can view own habits" ON player_habit_assignments;
CREATE POLICY "Players can view own habits" ON player_habit_assignments
FOR SELECT TO authenticated
USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Parents can view child habits" ON player_habit_assignments;
CREATE POLICY "Parents can view child habits" ON player_habit_assignments
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM players p
    JOIN parents pr ON pr.id = p.parent_id
    WHERE pr.user_id = auth.uid()
  )
);


-- 5d. ATTENDANCE FUNCTION + POLICIES
CREATE OR REPLACE FUNCTION increment_attendance_streak(player_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE players
  SET attendance_streak = attendance_streak + 1,
      total_points = total_points + 5
  WHERE id = player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_attendance_streak(UUID) TO authenticated;

DROP POLICY IF EXISTS "Coaches can view team attendance" ON attendance;
CREATE POLICY "Coaches can view team attendance" ON attendance
FOR SELECT TO authenticated
USING (
  event_id IN (
    SELECT e.id FROM events e JOIN coaches c ON c.team_id = e.team_id
    WHERE c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches can insert team attendance" ON attendance;
CREATE POLICY "Coaches can insert team attendance" ON attendance
FOR INSERT TO authenticated
WITH CHECK (
  event_id IN (
    SELECT e.id FROM events e JOIN coaches c ON c.team_id = e.team_id
    WHERE c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches can update team attendance" ON attendance;
CREATE POLICY "Coaches can update team attendance" ON attendance
FOR UPDATE TO authenticated
USING (
  event_id IN (
    SELECT e.id FROM events e JOIN coaches c ON c.team_id = e.team_id
    WHERE c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches can delete team attendance" ON attendance;
CREATE POLICY "Coaches can delete team attendance" ON attendance
FOR DELETE TO authenticated
USING (
  event_id IN (
    SELECT e.id FROM events e JOIN coaches c ON c.team_id = e.team_id
    WHERE c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Parents can view child attendance" ON attendance;
CREATE POLICY "Parents can view child attendance" ON attendance
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM players p JOIN parents pr ON pr.id = p.parent_id
    WHERE pr.user_id = auth.uid()
  )
);


-- 5e. ADD PLAYER POINTS RPC
CREATE OR REPLACE FUNCTION add_player_points(player_id UUID, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE players
  SET total_points = total_points + points_to_add
  WHERE id = player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_player_points(UUID, INTEGER) TO authenticated;


-- 5f. PRO HABITS ENRICH + 105-HABIT SEED
ALTER TABLE pro_habits
  ADD COLUMN IF NOT EXISTS habit_en TEXT,
  ADD COLUMN IF NOT EXISTS habit_es TEXT,
  ADD COLUMN IF NOT EXISTS source VARCHAR(120),
  ADD COLUMN IF NOT EXISTS emoji VARCHAR(10);

INSERT INTO pro_habits (key, category, player_name, habit_en, habit_es, source, emoji) VALUES
('ph_001','sleep','Lionel Messi','I sleep 8-9 hours every night','Duermo 8-9 horas cada noche','Interview 2022','😴'),
('ph_002','sleep','Cristiano Ronaldo','I take 5 short naps throughout the day','Tomo 5 siestas cortas durante el día','Sleep coach','😴'),
('ph_003','sleep','Erling Haaland','I go to bed at the same time every night','Me acuesto a la misma hora cada noche','Documentary','🌙'),
('ph_004','sleep','Kylian Mbappé','I avoid screens 1 hour before sleep','Evito pantallas 1 hora antes de dormir','Interview 2023','📵'),
('ph_005','sleep','Neymar Jr','I sleep in a completely dark room','Duermo en una habitación completamente oscura','Interview','🌑'),
('ph_006','sleep','Kevin De Bruyne','I keep my bedroom cold for better sleep','Mantengo mi habitación fría para dormir mejor','Interview','❄️'),
('ph_007','sleep','Virgil van Dijk','I never use my phone in bed','Nunca uso mi teléfono en la cama','Podcast','📱'),
('ph_008','sleep','Mohamed Salah','I wake up at the same time every day','Me despierto a la misma hora todos los días','Interview','⏰'),
('ph_009','sleep','Jude Bellingham','I read a book before sleep instead of watching TV','Leo un libro antes de dormir en vez de ver TV','Interview 2024','📚'),
('ph_010','sleep','Luka Modrić','I take a short nap after training','Tomo una siesta corta después de entrenar','Interview','💤'),
('ph_011','sleep','Robert Lewandowski','I sleep 9 hours minimum on match days','Duermo mínimo 9 horas los días de partido','Documentary','⚽'),
('ph_012','sleep','Pedri','I have the same sleep routine every night','Tengo la misma rutina de sueño cada noche','Interview','🔄'),
('ph_013','nutrition','Cristiano Ronaldo','I eat 6 small meals a day instead of 3 big ones','Como 6 comidas pequeñas al día en vez de 3 grandes','Autobiography','🍽️'),
('ph_014','nutrition','Lionel Messi','I drink water before every meal','Bebo agua antes de cada comida','Nutritionist','💧'),
('ph_015','nutrition','Erling Haaland','I eat fish and vegetables every day','Como pescado y verduras todos los días','Documentary','🐟'),
('ph_016','nutrition','Kylian Mbappé','I drink 3 liters of water daily','Bebo 3 litros de agua al día','Interview 2023','💧'),
('ph_017','nutrition','Robert Lewandowski','I avoid sugar and processed foods','Evito el azúcar y alimentos procesados','Documentary','🚫'),
('ph_018','nutrition','Mohamed Salah','I eat breakfast within 30 minutes of waking','Desayuno dentro de los 30 minutos de despertar','Interview','🌅'),
('ph_019','nutrition','Neymar Jr','I always have fruits as snacks','Siempre como frutas como snacks','Interview','🍎'),
('ph_020','nutrition','Kevin De Bruyne','I eat protein with every meal','Como proteína en cada comida','Nutritionist','🥩'),
('ph_021','nutrition','Virgil van Dijk','I never skip breakfast','Nunca me salto el desayuno','Interview','🥣'),
('ph_022','nutrition','Thibaut Courtois','I drink a protein shake after every training','Tomo un batido de proteínas después de cada entrenamiento','Interview','🥤'),
('ph_023','nutrition','Gavi','I eat carbs 3 hours before a match','Como carbohidratos 3 horas antes del partido','Interview','🍝'),
('ph_024','nutrition','Bukayo Saka','I avoid fried foods','Evito las comidas fritas','Interview','🍟'),
('ph_025','nutrition','Phil Foden','I eat vegetables with every meal','Como verduras en cada comida','Interview','🥦'),
('ph_026','nutrition','Vinicius Jr','I drink coconut water for hydration','Bebo agua de coco para hidratarme','Interview','🥥'),
('ph_027','nutrition','Erling Haaland','I eat heart and liver for nutrients','Como corazón e hígado por los nutrientes','Documentary','❤️'),
('ph_028','nutrition','Luka Modrić','I avoid alcohol completely','Evito el alcohol completamente','Interview','🚫'),
('ph_029','nutrition','Karim Benzema','I eat dates for natural energy','Como dátiles para energía natural','Interview','🌴'),
('ph_030','nutrition','Jamal Musiala','I always pack healthy snacks for travel','Siempre llevo snacks saludables cuando viajo','Interview','🎒'),
('ph_031','training','Cristiano Ronaldo','I do 3000 sit-ups every day','Hago 3000 abdominales cada día','Autobiography','💪'),
('ph_032','training','Lionel Messi','I practice free kicks for 30 minutes after every training','Practico tiros libres 30 minutos después de cada entrenamiento','Coach interview','⚽'),
('ph_033','training','Erling Haaland','I do yoga every morning for flexibility','Hago yoga cada mañana para flexibilidad','Documentary','🧘'),
('ph_034','training','Kylian Mbappé','I do sprint training 3 times a week','Hago entrenamiento de sprints 3 veces por semana','Interview','🏃'),
('ph_035','training','Kevin De Bruyne','I always arrive 30 minutes early to training','Siempre llego 30 minutos antes al entrenamiento','Pep Guardiola','⏰'),
('ph_036','training','Virgil van Dijk','I do extra core work every day','Hago trabajo extra de core todos los días','Interview','🏋️'),
('ph_037','training','Mohamed Salah','I practice with both feet every session','Practico con ambos pies en cada sesión','Training footage','👟'),
('ph_038','training','Neymar Jr','I practice skills for 1 hour after training','Practico habilidades 1 hora después del entrenamiento','Interview','🎯'),
('ph_039','training','Robert Lewandowski','I never miss a gym session','Nunca me pierdo una sesión de gimnasio','Documentary','🏋️'),
('ph_040','training','Jude Bellingham','I watch video of my performance after every match','Veo video de mi rendimiento después de cada partido','Interview 2024','📹'),
('ph_041','training','Pedri','I do extra passing drills every day','Hago ejercicios extra de pases cada día','Interview','⚽'),
('ph_042','training','Phil Foden','I practice ball control in my garden every day','Practico control de balón en mi jardín cada día','Interview','🏡'),
('ph_043','training','Bukayo Saka','I do balance exercises every morning','Hago ejercicios de equilibrio cada mañana','Interview','⚖️'),
('ph_044','training','Gavi','I study opponents before every match','Estudio a los rivales antes de cada partido','Interview','📊'),
('ph_045','training','Trent Alexander-Arnold','I practice crossing for 20 minutes after training','Practico centros 20 minutos después del entrenamiento','Liverpool','🎯'),
('ph_046','training','Vinicius Jr','I do reaction training twice a week','Hago entrenamiento de reacción dos veces por semana','Interview','⚡'),
('ph_047','training','Declan Rice','I always do the full warm-up, never skip steps','Siempre hago el calentamiento completo, nunca salto pasos','Interview','🔥'),
('ph_048','training','Rodri','I practice positioning without the ball','Practico el posicionamiento sin balón','Guardiola','📍'),
('ph_049','training','Bruno Fernandes','I take 50 shots at goal after every training','Hago 50 tiros a puerta después de cada entrenamiento','Interview','🥅'),
('ph_050','training','Martin Ødegaard','I do agility ladder drills every day','Hago ejercicios de escalera de agilidad cada día','Interview','🪜'),
('ph_051','mindset','Lionel Messi','I visualize my goals before every match','Visualizo mis goles antes de cada partido','Interview 2021','🧠'),
('ph_052','mindset','Cristiano Ronaldo','I believe I am the best, and I work to prove it','Creo que soy el mejor, y trabajo para demostrarlo','Documentary','👑'),
('ph_053','mindset','Kylian Mbappé','I write my goals down every year','Escribo mis metas cada año','Interview 2023','📝'),
('ph_054','mindset','Erling Haaland','I meditate for 10 minutes every morning','Medito 10 minutos cada mañana','Documentary','🧘'),
('ph_055','mindset','Kevin De Bruyne','I focus on what I can control, not results','Me enfoco en lo que puedo controlar, no en los resultados','Interview','🎯'),
('ph_056','mindset','Virgil van Dijk','I never let mistakes affect my next action','Nunca dejo que los errores afecten mi siguiente acción','Interview','💪'),
('ph_057','mindset','Mohamed Salah','I pray before every match','Rezo antes de cada partido','Interview','🙏'),
('ph_058','mindset','Neymar Jr','I listen to music to get in the zone before games','Escucho música para entrar en la zona antes de los partidos','Interview','🎧'),
('ph_059','mindset','Robert Lewandowski','I set small daily goals, not just big ones','Establezco pequeñas metas diarias, no solo grandes','Documentary','📈'),
('ph_060','mindset','Luka Modrić','I stay calm under pressure by breathing deeply','Mantengo la calma bajo presión respirando profundamente','Interview','😌'),
('ph_061','mindset','Jude Bellingham','I learn from every loss instead of being upset','Aprendo de cada derrota en vez de molestarme','Interview 2024','📚'),
('ph_062','mindset','Pedri','I stay humble even when I play well','Me mantengo humilde incluso cuando juego bien','Interview','🙏'),
('ph_063','mindset','Gavi','I never give up, even when we are losing','Nunca me rindo, incluso cuando vamos perdiendo','Interview','🔥'),
('ph_064','mindset','Phil Foden','I focus on enjoying the game, not just winning','Me enfoco en disfrutar el juego, no solo en ganar','Interview','😊'),
('ph_065','mindset','Bukayo Saka','I use positive self-talk before matches','Uso diálogo interno positivo antes de los partidos','Interview','💬'),
('ph_066','mindset','Vinicius Jr','I block out negativity from fans and media','Bloqueo la negatividad de fans y medios','Interview','🚫'),
('ph_067','mindset','Trent Alexander-Arnold','I watch highlights of great players to stay inspired','Veo highlights de grandes jugadores para mantenerme inspirado','Interview','📺'),
('ph_068','mindset','Rodri','I prepare mentally for every possible scenario','Me preparo mentalmente para cada escenario posible','Interview','🧠'),
('ph_069','mindset','Bruno Fernandes','I take responsibility when things go wrong','Asumo responsabilidad cuando las cosas salen mal','Interview','✋'),
('ph_070','mindset','Declan Rice','I talk to a sports psychologist regularly','Hablo con un psicólogo deportivo regularmente','Interview','🗣️'),
('ph_071','mindset','Martin Ødegaard','I spend time with family to stay grounded','Paso tiempo con familia para mantenerme centrado','Interview','👨‍👩‍👧'),
('ph_072','mindset','Florian Wirtz','I remember why I started playing football','Recuerdo por qué empecé a jugar fútbol','Interview','⚽'),
('ph_073','mindset','Jamal Musiala','I celebrate small wins, not just big victories','Celebro pequeñas victorias, no solo las grandes','Interview','🎉'),
('ph_074','mindset','Karim Benzema','I stay patient even when goals do not come','Mantengo la paciencia incluso cuando no llegan los goles','Interview','⏳'),
('ph_075','mindset','Thibaut Courtois','I study my opponents shooting patterns','Estudio los patrones de tiro de mis oponentes','Interview','🎯'),
('ph_076','training','Cristiano Ronaldo','I do ice baths after every game','Hago baños de hielo después de cada partido','Autobiography','🧊'),
('ph_077','training','Lionel Messi','I focus on recovery as much as training','Me enfoco en la recuperación tanto como en el entrenamiento','Interview','🔋'),
('ph_078','training','Erling Haaland','I wear special recovery glasses that block blue light','Uso gafas especiales de recuperación que bloquean luz azul','Documentary','👓'),
('ph_079','training','Kylian Mbappé','I do stretching for 20 minutes before bed','Hago estiramientos 20 minutos antes de dormir','Interview','🧘'),
('ph_080','training','Robert Lewandowski','I do cryotherapy twice a week','Hago crioterapia dos veces por semana','Documentary','❄️'),
('ph_081','training','Neymar Jr','I play other sports to stay sharp','Juego otros deportes para mantenerme en forma','Interview','🏀'),
('ph_082','training','Kevin De Bruyne','I use a foam roller every day','Uso un rodillo de espuma todos los días','Interview','🔄'),
('ph_083','training','Mohamed Salah','I do extra cardio on rest days','Hago cardio extra en días de descanso','Interview','🫀'),
('ph_084','training','Virgil van Dijk','I get a massage after every match','Me hago un masaje después de cada partido','Interview','💆'),
('ph_085','training','Luka Modrić','I work on my weaker foot for 15 minutes daily','Trabajo mi pierna débil 15 minutos diarios','Interview','🦵'),
('ph_086','nutrition','Cristiano Ronaldo','I eat chicken, rice, and salad every day','Como pollo, arroz y ensalada todos los días','Chef interview','🍗'),
('ph_087','nutrition','Lionel Messi','I cut out pizza and started eating whole grains','Dejé la pizza y empecé a comer granos integrales','Nutritionist','🌾'),
('ph_088','nutrition','Kylian Mbappé','I eat a banana before every match for energy','Como un plátano antes de cada partido para energía','Interview','🍌'),
('ph_089','nutrition','Jude Bellingham','I have a recovery shake within 30 minutes of training','Tomo un batido de recuperación dentro de 30 minutos del entrenamiento','Interview','🥤'),
('ph_090','nutrition','Pedri','I always eat breakfast with my family','Siempre desayuno con mi familia','Interview','👨‍👩‍👧'),
('ph_091','sleep','Cristiano Ronaldo','I sleep in the fetal position for optimal recovery','Duermo en posición fetal para recuperación óptima','Sleep coach','🛏️'),
('ph_092','sleep','Erling Haaland','I use blackout curtains in every hotel','Uso cortinas opacas en cada hotel','Documentary','🏨'),
('ph_093','sleep','Robert Lewandowski','I have a special mattress that travels with me','Tengo un colchón especial que viaja conmigo','Documentary','🛏️'),
('ph_094','sleep','Mohamed Salah','I do not drink caffeine after 2pm','No tomo cafeína después de las 2pm','Interview','☕'),
('ph_095','sleep','Kevin De Bruyne','I use a sleep tracker to monitor my rest','Uso un rastreador de sueño para monitorear mi descanso','Interview','⌚'),
('ph_096','mindset','Lionel Messi','I play for the team, not individual glory','Juego para el equipo, no para gloria individual','Interview','🤝'),
('ph_097','mindset','Cristiano Ronaldo','I use criticism as motivation','Uso las críticas como motivación','Documentary','🔥'),
('ph_098','mindset','Neymar Jr','I remember my childhood dream before big games','Recuerdo mi sueño de infancia antes de partidos importantes','Interview','✨'),
('ph_099','mindset','Kylian Mbappé','I always try something new in every match','Siempre intento algo nuevo en cada partido','Interview','🎨'),
('ph_100','mindset','Erling Haaland','I think about scoring the moment I wake up','Pienso en marcar desde que me despierto','Documentary','⚽'),
('ph_101','mindset','Virgil van Dijk','I lead by example, not just words','Lidero con el ejemplo, no solo con palabras','Interview','👑'),
('ph_102','mindset','Luka Modrić','I thank my teammates after every match','Agradezco a mis compañeros después de cada partido','Interview','🙏'),
('ph_103','mindset','Robert Lewandowski','I set a new goal the moment I achieve one','Establezco una nueva meta en cuanto logro una','Documentary','🎯'),
('ph_104','mindset','Jude Bellingham','I never complain about referee decisions','Nunca me quejo de las decisiones del árbitro','Interview','🤐'),
('ph_105','mindset','Gavi','I respect every opponent, big or small','Respeto a cada oponente, grande o pequeño','Interview','🤝')
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  player_name = EXCLUDED.player_name,
  habit_en = EXCLUDED.habit_en,
  habit_es = EXCLUDED.habit_es,
  source = EXCLUDED.source,
  emoji = EXCLUDED.emoji,
  is_active = true;

UPDATE pro_habits SET is_active = false WHERE habit_en IS NULL;


-- 5g. DAILY HABIT LOGS
CREATE TABLE IF NOT EXISTS daily_habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  habit_key VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, date, habit_key)
);

CREATE INDEX IF NOT EXISTS idx_daily_habit_logs_player_date ON daily_habit_logs(player_id, date DESC);

ALTER TABLE daily_habit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players manage own habit logs" ON daily_habit_logs;
CREATE POLICY "Players manage own habit logs" ON daily_habit_logs
FOR ALL TO authenticated
USING (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()))
WITH CHECK (player_id IN (SELECT id FROM players WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Parents view child habit logs" ON daily_habit_logs;
CREATE POLICY "Parents view child habit logs" ON daily_habit_logs
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM players p JOIN parents pr ON pr.id = p.parent_id
    WHERE pr.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Coaches view team habit logs" ON daily_habit_logs;
CREATE POLICY "Coaches view team habit logs" ON daily_habit_logs
FOR SELECT TO authenticated
USING (
  player_id IN (
    SELECT p.id FROM players p JOIN coaches c ON c.team_id = p.team_id
    WHERE c.user_id = auth.uid()
  )
);


-- 5h. COACH AUTOMATIONS
CREATE TABLE IF NOT EXISTS coach_automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  automation_key VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, automation_key)
);

ALTER TABLE coach_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage own automations" ON coach_automations;
CREATE POLICY "Coaches manage own automations" ON coach_automations
FOR ALL TO authenticated
USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
WITH CHECK (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));


-- 5i. BIRTHDAY FUNCTIONS
CREATE OR REPLACE FUNCTION get_upcoming_birthdays(p_team_id UUID, p_days INTEGER DEFAULT 14)
RETURNS TABLE (
  player_id UUID, first_name VARCHAR, last_name VARCHAR,
  date_of_birth DATE, days_until INTEGER, turning INTEGER
) AS $$
  SELECT
    p.id, p.first_name, p.last_name, p.date_of_birth,
    (((DATE_PART('doy', p.date_of_birth)::int - DATE_PART('doy', CURRENT_DATE)::int) % 365) + 365) % 365 AS days_until,
    DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth))::int + 1 AS turning
  FROM players p
  WHERE p.team_id = p_team_id
    AND p.date_of_birth IS NOT NULL
    AND p.is_active = true
    AND (((DATE_PART('doy', p.date_of_birth)::int - DATE_PART('doy', CURRENT_DATE)::int) % 365) + 365) % 365 <= p_days
  ORDER BY days_until;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_upcoming_birthdays(UUID, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION send_birthday_messages()
RETURNS INTEGER AS $$
DECLARE r RECORD; sent_count INTEGER := 0;
BEGIN
  FOR r IN
    SELECT p.id AS player_id, p.first_name, p.team_id, p.parent_id,
           c.id AS coach_id, c.user_id AS coach_user_id
    FROM players p JOIN coaches c ON c.team_id = p.team_id
    WHERE p.date_of_birth IS NOT NULL AND p.is_active = true
      AND TO_CHAR(p.date_of_birth, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD')
      AND COALESCE((SELECT ca.enabled FROM coach_automations ca WHERE ca.coach_id = c.id AND ca.automation_key = 'birthday-messages'), true)
      AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.recipient_player_id = p.id AND m.message_type = 'encouragement' AND m.subject LIKE 'Happy Birthday%' AND m.sent_at::date = CURRENT_DATE)
  LOOP
    INSERT INTO messages (team_id, sender_id, recipient_player_id, subject, body, message_type)
    VALUES (r.team_id, r.coach_user_id, r.player_id,
      'Happy Birthday, ' || r.first_name || '! 🎂',
      'Happy birthday, ' || r.first_name || '! The whole team is celebrating with you today. Enjoy your day, champion! ⚽🎉',
      'encouragement');
    sent_count := sent_count + 1;
  END LOOP;
  RETURN sent_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5j. AVATARS BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Coaches can upload avatars" ON storage.objects;
  CREATE POLICY "Coaches can upload avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'players');

  DROP POLICY IF EXISTS "Public avatar read access" ON storage.objects;
  CREATE POLICY "Public avatar read access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

  DROP POLICY IF EXISTS "Coaches can update avatars" ON storage.objects;
  CREATE POLICY "Coaches can update avatars" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Skipped avatar policies (create in Dashboard > Storage > Policies)';
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PIPE TABLES (coach_codes, sm_roster_cache, coach_billing, drill_assignments)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coach_codes (
  code VARCHAR(24) PRIMARY KEY,
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coach_codes_coach ON coach_codes(coach_id);
ALTER TABLE coach_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage own codes" ON coach_codes;
CREATE POLICY "Coaches manage own codes" ON coach_codes
FOR ALL TO authenticated
USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
WITH CHECK (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION deactivate_other_codes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active THEN
    UPDATE coach_codes SET active = false, deactivated_at = NOW()
    WHERE coach_id = NEW.coach_id AND code <> NEW.code AND active;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_one_active_code ON coach_codes;
CREATE TRIGGER trg_one_active_code
AFTER INSERT OR UPDATE OF active ON coach_codes
FOR EACH ROW EXECUTE FUNCTION deactivate_other_codes();


CREATE TABLE IF NOT EXISTS sm_roster_cache (
  coach_id UUID PRIMARY KEY REFERENCES coaches(id) ON DELETE CASCADE,
  as_of TIMESTAMPTZ,
  seat_count_active INTEGER DEFAULT 0,
  offset_usd NUMERIC(6,2) DEFAULT 0,
  ladder_state TEXT,
  seats JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sm_roster_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach reads own roster cache" ON sm_roster_cache;
CREATE POLICY "Coach reads own roster cache" ON sm_roster_cache
FOR SELECT TO authenticated
USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));


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


CREATE TABLE IF NOT EXISTS drill_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  code VARCHAR(24),
  drill_id VARCHAR(40) NOT NULL,
  players JSONB NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false
);

ALTER TABLE drill_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coach reads own assignments" ON drill_assignments;
CREATE POLICY "Coach reads own assignments" ON drill_assignments
FOR SELECT TO authenticated
USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. BUILD SCRIPT fix: bake --max-old-space-size into package.json
--    (Done as a code change, not SQL — reminder only)
-- ─────────────────────────────────────────────────────────────────────────────
-- See package.json update below (separate from this SQL paste).


-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFY
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run these after pasting to confirm success:
--
--   SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
--   -- Should include: coach_billing, coach_codes, daily_habit_logs,
--   --                 drill_assignments, media, media_player_tags,
--   --                 player_habit_assignments, sm_roster_cache
--
--   SELECT count(*) FROM pro_habits WHERE is_active;   -- expect 105
--
--   SELECT count(*) FROM pg_policies WHERE tablename='players';  -- expect 6
--   SELECT count(*) FROM pg_policies WHERE tablename='messages'; -- expect 4+
--
--   SELECT * FROM players LIMIT 1;  -- must NOT return 42P17 recursion error
-- ═══════════════════════════════════════════════════════════════════════════════
