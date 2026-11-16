-- Migration 002: server-verified garden rewards and legacy local-account import.
-- Additive only: no existing rows or columns are removed.

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'token_transactions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%transaction_type%'
  LOOP
    EXECUTE format('ALTER TABLE token_transactions DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE token_transactions
  ADD CONSTRAINT token_transactions_transaction_type_check CHECK (
    transaction_type IN ('admin_gift', 'theme_purchase', 'study_reward', 'legacy_import', 'garden_reward')
  );

CREATE TABLE IF NOT EXISTS garden_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seed TEXT NOT NULL CHECK (seed IN ('oak', 'sunflower', 'pine')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (10, 20, 30, 45, 60, 90, 120, 150, 180)),
  reward_amount INTEGER NOT NULL CHECK (reward_amount > 0),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'rewarded', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  reward_transaction_id UUID UNIQUE REFERENCES token_transactions(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS garden_sessions_one_running_per_user
  ON garden_sessions (user_id) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS garden_sessions_user_started_idx
  ON garden_sessions (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS legacy_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  local_username TEXT NOT NULL,
  claimed_tokens BIGINT NOT NULL DEFAULT 0 CHECK (claimed_tokens BETWEEN 0 AND 1000000),
  claimed_theme_ids TEXT[] NOT NULL DEFAULT '{}',
  applied_theme_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'pending_review', 'approved', 'rejected')),
  approved_tokens BIGINT NOT NULL DEFAULT 0 CHECK (approved_tokens >= 0),
  approved_theme_ids TEXT[] NOT NULL DEFAULT '{}',
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS legacy_imports_status_created_idx
  ON legacy_imports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS legacy_imports_local_username_idx
  ON legacy_imports (LOWER(local_username));
