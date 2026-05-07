-- Add admin support to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create an admin user (password: admin123)
-- Update this with your preferred admin credentials after deployment
INSERT INTO users (email, password_hash, name, is_admin)
VALUES (
  'admin@digitalcoffee.cafe',
  '$2a$10$YQz9kGKxPJvN8HZXJxVrD.mYqDqF7F.EKJnZ0kGz3jzFHqO/Q2.Gy', -- bcrypt hash of 'admin123'
  'Admin User',
  true
)
ON CONFLICT (email) DO UPDATE
SET is_admin = true;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
