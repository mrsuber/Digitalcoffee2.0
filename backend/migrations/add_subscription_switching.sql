-- Migration: Add subscription switching functionality
-- This enables users to switch between free and premium accounts (both $0 for testing)

-- Add subscription history table to track account changes
CREATE TABLE IF NOT EXISTS subscription_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    CONSTRAINT subscription_history_status_check CHECK (
        previous_status IN ('free', 'premium', 'expired') AND
        new_status IN ('free', 'premium', 'expired')
    )
);

CREATE INDEX idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX idx_subscription_history_date ON subscription_history(changed_at);

-- Update existing users table to ensure proper defaults
ALTER TABLE users
    ALTER COLUMN subscription_status SET DEFAULT 'free';

-- Function to track subscription changes
CREATE OR REPLACE FUNCTION track_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.subscription_status IS DISTINCT FROM NEW.subscription_status THEN
        INSERT INTO subscription_history (user_id, previous_status, new_status, reason)
        VALUES (NEW.id, OLD.subscription_status, NEW.subscription_status, 'User changed subscription type');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tracking subscription changes
DROP TRIGGER IF EXISTS track_subscription_changes ON users;
CREATE TRIGGER track_subscription_changes
    AFTER UPDATE ON users
    FOR EACH ROW
    WHEN (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
    EXECUTE FUNCTION track_subscription_change();

-- Grant permissions
GRANT ALL ON subscription_history TO digitalcoffee_user;
GRANT ALL ON subscription_history_id_seq TO digitalcoffee_user;

-- Add comments
COMMENT ON TABLE subscription_history IS 'Tracks all subscription status changes for auditing';
COMMENT ON COLUMN subscription_history.reason IS 'Reason for subscription change (user upgrade, downgrade, payment, etc)';
