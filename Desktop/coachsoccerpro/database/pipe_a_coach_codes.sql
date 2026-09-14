-- ══════════════════════════════════════════════════════════════════════════
-- PIPE A — COACH CODE REGISTRY (CSP side, source of truth)
-- SoccerMental checkout validates codes against this via the pipe-a Edge
-- Function. Paste once in Supabase SQL Editor. Idempotent.
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS coach_codes (
  code VARCHAR(24) PRIMARY KEY,          -- e.g. THUNDER-K4M2
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coach_codes_coach ON coach_codes(coach_id);

ALTER TABLE coach_codes ENABLE ROW LEVEL SECURITY;

-- Coaches manage only their own codes from the app
DROP POLICY IF EXISTS "Coaches manage own codes" ON coach_codes;
CREATE POLICY "Coaches manage own codes" ON coach_codes
FOR ALL TO authenticated
USING (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()))
WITH CHECK (coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid()));

-- One ACTIVE code per coach: generating a new one deactivates the old
CREATE OR REPLACE FUNCTION deactivate_other_codes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.active THEN
    UPDATE coach_codes
    SET active = false, deactivated_at = NOW()
    WHERE coach_id = NEW.coach_id AND code <> NEW.code AND active;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_one_active_code ON coach_codes;
CREATE TRIGGER trg_one_active_code
AFTER INSERT OR UPDATE OF active ON coach_codes
FOR EACH ROW EXECUTE FUNCTION deactivate_other_codes();
