-- Adds direct contact fields to parents so an invite is usable before the
-- parent ever creates a users row (invite flow currently discards the email
-- and phone a coach types in on Add Player).
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
