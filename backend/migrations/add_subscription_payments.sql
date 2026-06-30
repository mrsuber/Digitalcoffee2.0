-- Add Stripe fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Create payment_logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL, -- 'monthly' or 'yearly'
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  error_message TEXT,
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe_payment_intent ON payment_logs(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires ON users(subscription_expires_at);

-- Add comments
COMMENT ON TABLE payment_logs IS 'Stores all subscription payment transactions';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for the user';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID if applicable';
COMMENT ON COLUMN users.subscription_started_at IS 'When the current premium subscription started';
COMMENT ON COLUMN users.subscription_expires_at IS 'When the premium subscription expires';
