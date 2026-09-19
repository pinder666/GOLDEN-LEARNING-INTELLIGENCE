-- ══════════════════════════════════════════════════════════════════════════════
-- COACHSOCCERPRO MEDIA SCHEMA
-- Photos and Videos from games and practices
-- ══════════════════════════════════════════════════════════════════════════════

-- Media uploads table
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- optional link to event
  uploaded_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,

  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(20) NOT NULL, -- 'image', 'video'
  mime_type VARCHAR(100),
  file_size_bytes INTEGER,
  duration_seconds INTEGER, -- for videos

  -- Storage
  storage_provider VARCHAR(20) DEFAULT 'supabase', -- 'supabase', 'r2', 's3'
  storage_path TEXT NOT NULL, -- path in bucket
  public_url TEXT, -- CDN URL for viewing
  thumbnail_url TEXT, -- thumbnail for videos/large images

  -- Metadata
  caption TEXT,
  taken_at TIMESTAMPTZ, -- when photo/video was taken (from EXIF or manual)

  -- Visibility
  visible_to_parents BOOLEAN DEFAULT true,

  -- Dimensions (for images)
  width INTEGER,
  height INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media tags (for tagging players in photos)
CREATE TABLE media_player_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  -- Position in image (optional, for face tagging)
  x_percent DECIMAL(5,2),
  y_percent DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(media_id, player_id)
);

-- Indexes
CREATE INDEX idx_media_team ON media(team_id);
CREATE INDEX idx_media_event ON media(event_id);
CREATE INDEX idx_media_created ON media(created_at DESC);
CREATE INDEX idx_media_tags_player ON media_player_tags(player_id);

-- RLS
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_player_tags ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKET SETUP (run these in Supabase SQL Editor)
-- ══════════════════════════════════════════════════════════════════════════════

-- Create media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600, -- 100MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- Allow authenticated users to upload to their team's folder
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

-- Allow anyone to read public media
CREATE POLICY "Public media read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'media');

-- Allow coaches to delete their team's media
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

-- ══════════════════════════════════════════════════════════════════════════════
-- RLS POLICIES FOR MEDIA TABLES
-- ══════════════════════════════════════════════════════════════════════════════

-- Coaches can view media for their team
CREATE POLICY "Coaches can view team media" ON media
FOR SELECT TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM coaches WHERE user_id = auth.uid()
  )
);

-- Coaches can insert media for their team
CREATE POLICY "Coaches can insert team media" ON media
FOR INSERT TO authenticated
WITH CHECK (
  team_id IN (
    SELECT team_id FROM coaches WHERE user_id = auth.uid()
  )
);

-- Coaches can update media for their team
CREATE POLICY "Coaches can update team media" ON media
FOR UPDATE TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM coaches WHERE user_id = auth.uid()
  )
);

-- Coaches can delete media for their team
CREATE POLICY "Coaches can delete team media" ON media
FOR DELETE TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM coaches WHERE user_id = auth.uid()
  )
);

-- Parents can view media if visible_to_parents is true
CREATE POLICY "Parents can view visible media" ON media
FOR SELECT TO authenticated
USING (
  visible_to_parents = true AND
  team_id IN (
    SELECT team_id FROM parents WHERE user_id = auth.uid()
  )
);

-- Media player tags policies
CREATE POLICY "Coaches can manage media tags" ON media_player_tags
FOR ALL TO authenticated
USING (
  media_id IN (
    SELECT m.id FROM media m
    JOIN coaches c ON c.team_id = m.team_id
    WHERE c.user_id = auth.uid()
  )
);
