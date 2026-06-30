-- Add soft delete functionality to users table
-- This allows marking accounts as deleted without removing the data

-- Add deleted columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Create an index on is_deleted for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);

-- Create an index on deleted_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Add a comment to explain the soft delete columns
COMMENT ON COLUMN users.is_deleted IS 'Indicates if the account has been soft-deleted';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when the account was soft-deleted';
COMMENT ON COLUMN users.deletion_reason IS 'Optional reason for account deletion (user provided or system generated)';

-- Update existing records to ensure is_deleted is false
UPDATE users SET is_deleted = FALSE WHERE is_deleted IS NULL;
