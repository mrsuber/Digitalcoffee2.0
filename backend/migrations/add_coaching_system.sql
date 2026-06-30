-- Coaching System Migration
-- Enables users to coach each other and track progress together

-- Coaching request status enum
CREATE TYPE coaching_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

-- Coaching requests table
CREATE TABLE IF NOT EXISTS coaching_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    coach_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status coaching_request_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, coach_id, status)
);

-- Coaching relationships table (active coaching pairs)
CREATE TABLE IF NOT EXISTS coaching_relationships (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    coach_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(student_id, coach_id, is_active)
);

-- Coaching milestones (track student achievements under coach)
CREATE TABLE IF NOT EXISTS coaching_milestones (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES coaching_relationships(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50) NOT NULL, -- 'course_completed', 'streak_milestone', 'session_count', etc.
    milestone_data JSONB DEFAULT '{}',
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add coaching stats to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS students_coached INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS courses_helped_complete INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_available_as_coach BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS coaching_bio TEXT;

-- Create indexes for better query performance
CREATE INDEX idx_coaching_requests_student ON coaching_requests(student_id, status);
CREATE INDEX idx_coaching_requests_coach ON coaching_requests(coach_id, status);
CREATE INDEX idx_coaching_relationships_student ON coaching_relationships(student_id, is_active);
CREATE INDEX idx_coaching_relationships_coach ON coaching_relationships(coach_id, is_active);
CREATE INDEX idx_coaching_milestones_relationship ON coaching_milestones(relationship_id);

-- Insert sample data: User 1 is a coach with some achievements
UPDATE user_profiles
SET
    is_available_as_coach = true,
    coaching_bio = 'Meditation practitioner for 2 years. Helped many people start their mindfulness journey. Let me guide you!'
WHERE user_id = 1;

-- Create a sample coaching relationship (if there are multiple users)
-- This will fail gracefully if there's only one user
INSERT INTO coaching_relationships (student_id, coach_id, started_at)
SELECT 2, 1, NOW() - INTERVAL '30 days'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 2)
ON CONFLICT DO NOTHING;

-- Create sample milestones for the relationship
INSERT INTO coaching_milestones (relationship_id, milestone_type, milestone_data, achieved_at)
SELECT
    cr.id,
    'course_completed',
    '{"course_name": "Quick Focus Boost", "course_id": 1}',
    NOW() - INTERVAL '15 days'
FROM coaching_relationships cr
WHERE cr.student_id = 2 AND cr.coach_id = 1
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO coaching_milestones (relationship_id, milestone_type, milestone_data, achieved_at)
SELECT
    cr.id,
    'streak_milestone',
    '{"days": 14, "milestone": "2_week_streak"}',
    NOW() - INTERVAL '5 days'
FROM coaching_relationships cr
WHERE cr.student_id = 2 AND cr.coach_id = 1
LIMIT 1
ON CONFLICT DO NOTHING;

-- Update coaching stats
UPDATE user_profiles
SET
    students_coached = (
        SELECT COUNT(DISTINCT student_id)
        FROM coaching_relationships
        WHERE coach_id = user_profiles.user_id
    ),
    courses_helped_complete = (
        SELECT COUNT(*)
        FROM coaching_milestones cm
        JOIN coaching_relationships cr ON cm.relationship_id = cr.id
        WHERE cr.coach_id = user_profiles.user_id
        AND cm.milestone_type = 'course_completed'
    );
