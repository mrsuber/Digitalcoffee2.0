-- Add analytics tracking for re-registered accounts
-- This allows linking new accounts to previously deleted ones

-- Add column to track if this account was created after a previous deletion
ALTER TABLE users
ADD COLUMN IF NOT EXISTS previous_account_id INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS original_email TEXT;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_users_previous_account_id ON users(previous_account_id);
CREATE INDEX IF NOT EXISTS idx_users_original_email ON users(original_email);

-- Add comments
COMMENT ON COLUMN users.previous_account_id IS 'Links to previous deleted account for analytics (churn/win-back tracking)';
COMMENT ON COLUMN users.original_email IS 'Stores original email before deletion signature was added';
