-- Professional Coaching System Migration
-- Adds premium tier with professional coaches hired by Digital Coffee

-- =====================================================
-- 1. SUBSCRIPTION PLANS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2),
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features) VALUES
('free', 'Free', 'Community peer-to-peer coaching', 0.00, 0.00, '{"peer_coaching": true, "professional_coaches": false, "max_peer_coaches": null, "priority_support": false}'::jsonb),
('premium', 'Premium', 'Unlimited access to professional coaches plus all app features', 9.99, 99.99, '{"peer_coaching": true, "professional_coaches": true, "max_peer_coaches": null, "priority_support": true, "custom_programs": true, "scheduled_sessions": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. USER SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  payment_method VARCHAR(50), -- 'stripe', 'paypal', 'apple_pay', 'google_pay', etc.
  payment_id VARCHAR(255), -- External payment provider ID
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, plan_id, status)
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id, status);
CREATE INDEX idx_user_subscriptions_expires ON user_subscriptions(expires_at) WHERE status = 'active';

-- =====================================================
-- 3. PROFESSIONAL COACHES (Employees of Digital Coffee)
-- =====================================================
CREATE TABLE IF NOT EXISTS professional_coaches (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  specialties TEXT[], -- e.g., {'anxiety', 'focus', 'sleep', 'productivity'}
  certifications JSONB, -- [{"name": "Certified Meditation Instructor", "issuer": "...", "year": 2020}]
  years_experience INTEGER,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_students INTEGER DEFAULT 0,
  total_sessions_completed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_accepting_students BOOLEAN DEFAULT true,
  max_students INTEGER, -- NULL = unlimited
  hourly_rate DECIMAL(10, 2), -- For future per-session pricing
  languages TEXT[] DEFAULT ARRAY['English'],
  timezone VARCHAR(50) DEFAULT 'UTC',
  availability JSONB, -- {"monday": ["09:00-12:00", "14:00-17:00"], ...}
  credentials TEXT, -- Additional credentials/qualifications
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_professional_coaches_active ON professional_coaches(is_active, is_accepting_students);
CREATE INDEX idx_professional_coaches_specialties ON professional_coaches USING GIN(specialties);

-- =====================================================
-- 4. PROFESSIONAL COACHING RELATIONSHIPS
-- =====================================================
CREATE TABLE IF NOT EXISTS professional_coaching_relationships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  coach_id INTEGER REFERENCES professional_coaches(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  total_sessions INTEGER DEFAULT 0,
  last_session_at TIMESTAMP,
  next_session_at TIMESTAMP,
  notes TEXT, -- Private notes from coach about student progress
  goals TEXT[], -- Student's goals
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, coach_id, status)
);

CREATE INDEX idx_prof_coaching_rel_user ON professional_coaching_relationships(user_id, status);
CREATE INDEX idx_prof_coaching_rel_coach ON professional_coaching_relationships(coach_id, status);

-- =====================================================
-- 5. SCHEDULED SESSIONS (1-on-1 sessions with professional coaches)
-- =====================================================
CREATE TABLE IF NOT EXISTS professional_coaching_sessions (
  id SERIAL PRIMARY KEY,
  relationship_id INTEGER REFERENCES professional_coaching_relationships(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  coach_id INTEGER REFERENCES professional_coaches(id) ON DELETE CASCADE,
  session_type VARCHAR(50) DEFAULT 'coaching' CHECK (session_type IN ('coaching', 'check-in', 'goal_setting', 'progress_review')),
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  meeting_url VARCHAR(500), -- Zoom/Google Meet link
  notes TEXT, -- Session notes from coach
  student_feedback TEXT,
  student_rating INTEGER CHECK (student_rating >= 1 AND student_rating <= 5),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prof_sessions_user ON professional_coaching_sessions(user_id, scheduled_at);
CREATE INDEX idx_prof_sessions_coach ON professional_coaching_sessions(coach_id, scheduled_at);
CREATE INDEX idx_prof_sessions_upcoming ON professional_coaching_sessions(scheduled_at) WHERE status IN ('scheduled', 'confirmed');

-- =====================================================
-- 6. CUSTOM COACHING PROGRAMS (Created by professional coaches)
-- =====================================================
CREATE TABLE IF NOT EXISTS coaching_programs (
  id SERIAL PRIMARY KEY,
  coach_id INTEGER REFERENCES professional_coaches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  focus_areas TEXT[], -- e.g., ['anxiety', 'focus', 'sleep']
  daily_activities JSONB, -- [{day: 1, activity: "...", audio_id: 123}, ...]
  is_published BOOLEAN DEFAULT false,
  total_enrollments INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coaching_programs_coach ON coaching_programs(coach_id, is_published);

-- =====================================================
-- 7. PROGRAM ENROLLMENTS (Users enrolled in custom programs)
-- =====================================================
CREATE TABLE IF NOT EXISTS program_enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES coaching_programs(id) ON DELETE CASCADE,
  coach_id INTEGER REFERENCES professional_coaches(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  current_day INTEGER DEFAULT 1,
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  last_activity_at TIMESTAMP,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, program_id)
);

CREATE INDEX idx_program_enrollments_user ON program_enrollments(user_id, status);
CREATE INDEX idx_program_enrollments_program ON program_enrollments(program_id, status);

-- =====================================================
-- 8. PROFESSIONAL COACH REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS professional_coach_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  coach_id INTEGER REFERENCES professional_coaches(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  is_verified BOOLEAN DEFAULT false, -- Only verified if user actually worked with coach
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, coach_id)
);

CREATE INDEX idx_prof_coach_reviews_coach ON professional_coach_reviews(coach_id);

-- =====================================================
-- 9. Update existing users table to track subscription
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'expired'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Create function to check if user has premium access
CREATE OR REPLACE FUNCTION user_has_premium(user_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_id_param
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. Sample Professional Coaches (For testing)
-- =====================================================
INSERT INTO professional_coaches (
  full_name, email, bio, specialties, certifications, years_experience,
  is_active, is_accepting_students, languages, timezone
) VALUES
(
  'Dr. Sarah Mitchell',
  'sarah.mitchell@digitalcoffee.cafe',
  'Certified meditation instructor with 15 years of experience helping individuals overcome anxiety and achieve mental clarity. Specializes in mindfulness-based stress reduction and cognitive behavioral techniques.',
  ARRAY['anxiety', 'stress', 'mindfulness', 'focus'],
  '[{"name": "Certified Meditation & Mindfulness Instructor", "issuer": "McLean Meditation Institute", "year": 2010}, {"name": "Cognitive Behavioral Therapy Certification", "issuer": "Beck Institute", "year": 2012}]'::jsonb,
  15,
  true,
  true,
  ARRAY['English', 'Spanish'],
  'America/New_York'
),
(
  'Michael Chen',
  'michael.chen@digitalcoffee.cafe',
  'Former tech executive turned focus and productivity coach. Helps high-performers optimize their mental performance and achieve peak productivity states through brainwave entrainment and meditation.',
  ARRAY['focus', 'productivity', 'performance', 'executive_coaching'],
  '[{"name": "Certified Performance Coach", "issuer": "International Coaching Federation", "year": 2018}, {"name": "Neurofeedback Practitioner", "issuer": "BCIA", "year": 2019}]'::jsonb,
  8,
  true,
  true,
  ARRAY['English', 'Mandarin'],
  'America/Los_Angeles'
),
(
  'Emma Rodriguez',
  'emma.rodriguez@digitalcoffee.cafe',
  'Sleep specialist and wellness coach dedicated to helping individuals achieve restorative sleep and overcome insomnia. Uses evidence-based techniques combining meditation, binaural beats, and sleep hygiene.',
  ARRAY['sleep', 'insomnia', 'relaxation', 'wellness'],
  '[{"name": "Certified Sleep Science Coach", "issuer": "Spencer Institute", "year": 2017}, {"name": "Wellness & Lifestyle Coach", "issuer": "American Council on Exercise", "year": 2016}]'::jsonb,
  10,
  true,
  true,
  ARRAY['English', 'Spanish', 'Portuguese'],
  'America/Chicago'
)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- COMPLETED
-- =====================================================
SELECT 'Professional coaching system installed successfully!' as message;
SELECT 'Added ' || COUNT(*) || ' professional coaches' as info FROM professional_coaches;
SELECT 'Created ' || COUNT(*) || ' subscription plans' as info FROM subscription_plans;
