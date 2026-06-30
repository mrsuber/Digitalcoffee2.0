-- Add FCM token column for push notifications
-- This allows the backend to send push notifications to mobile devices

ALTER TABLE users
ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token) WHERE fcm_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
