-- Migration: Add User Activity Tracking
-- Created: 2026-06-11
-- Purpose: Track user login/logout activity, sessions, and device information

-- Create user_activity_logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'session_start', 'session_end'
  device_type VARCHAR(50), -- 'mobile', 'web', 'tablet', 'unknown'
  device_info TEXT, -- User agent string
  ip_address INET,
  platform VARCHAR(50), -- 'ios', 'android', 'web'
  app_version VARCHAR(20), -- Mobile app version
  session_duration_seconds INTEGER, -- For logout/session_end events
  metadata JSONB, -- Additional context data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX idx_activity_logs_device_type ON user_activity_logs(device_type);

-- Add last_login_at column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
  END IF;
END $$;

-- Add last_activity_at column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP;
  END IF;
END $$;

-- Create view for active users (logged in within last 5 minutes)
CREATE OR REPLACE VIEW active_users AS
SELECT
  u.id,
  u.email,
  u.name,
  u.last_login_at,
  u.last_activity_at,
  EXTRACT(EPOCH FROM (NOW() - u.last_activity_at))/60 AS minutes_since_activity
FROM users u
WHERE u.last_activity_at >= NOW() - INTERVAL '5 minutes'
  AND (u.is_admin = false OR u.is_admin IS NULL);

-- Create function to update last_activity_at
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_activity_at = NEW.created_at
  WHERE id = NEW.user_id;

  -- Update last_login_at for login events
  IF NEW.activity_type = 'login' THEN
    UPDATE users
    SET last_login_at = NEW.created_at
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update user activity timestamps
DROP TRIGGER IF EXISTS trigger_update_user_activity ON user_activity_logs;
CREATE TRIGGER trigger_update_user_activity
  AFTER INSERT ON user_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_activity();

-- Add comments for documentation
COMMENT ON TABLE user_activity_logs IS 'Tracks all user login, logout, and session activity';
COMMENT ON COLUMN user_activity_logs.activity_type IS 'Type of activity: login, logout, session_start, session_end';
COMMENT ON COLUMN user_activity_logs.device_type IS 'Device category: mobile, web, tablet, unknown';
COMMENT ON COLUMN user_activity_logs.session_duration_seconds IS 'Duration of session for logout events';
