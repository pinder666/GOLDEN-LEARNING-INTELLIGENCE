-- payment_requests has no status column, but the Payments screen filters
-- Active vs Completed by one — every request created there currently
-- vanishes from both tabs the instant it's made. Add it.
ALTER TABLE payment_requests
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
