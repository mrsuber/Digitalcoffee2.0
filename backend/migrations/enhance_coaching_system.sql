-- Enhanced Coaching System Migration
-- Adds messaging, check-ins, ratings, and coach activity tracking

-- Coach check-ins table (track when coaches check on students)
CREATE TABLE IF NOT EXISTS coach_checkins (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES coaching_relationships(id) ON DELETE CASCADE,
    coach_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notes TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coaching messages table (in-app messaging)
CREATE TABLE IF NOT EXISTS coaching_messages (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES coaching_relationships(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Coach ratings table (students rate their coaches)
CREATE TABLE IF NOT EXISTS coach_ratings (
    id SERIAL PRIMARY KEY,
    relationship_id INTEGER REFERENCES coaching_relationships(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    coach_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(relationship_id)
);

-- Add columns to coaching_relationships for better tracking
ALTER TABLE coaching_relationships ADD COLUMN IF NOT EXISTS last_coach_checkin TIMESTAMP;
ALTER TABLE coaching_relationships ADD COLUMN IF NOT EXISTS last_student_activity TIMESTAMP;
ALTER TABLE coaching_relationships ADD COLUMN IF NOT EXISTS total_checkins INTEGER DEFAULT 0;
ALTER TABLE coaching_relationships ADD COLUMN IF NOT EXISTS success_rating DECIMAL(3,2);

-- Add columns to user_profiles for coach performance
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS total_checkins INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2) DEFAULT 100.00;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_active_as_coach TIMESTAMP;

-- Create indexes
CREATE INDEX idx_coach_checkins_relationship ON coach_checkins(relationship_id, checked_at DESC);
CREATE INDEX idx_coaching_messages_relationship ON coaching_messages(relationship_id, created_at DESC);
CREATE INDEX idx_coaching_messages_unread ON coaching_messages(receiver_id, is_read);
CREATE INDEX idx_coach_ratings_coach ON coach_ratings(coach_id);
CREATE INDEX idx_coach_ratings_relationship ON coach_ratings(relationship_id);

-- Function to update coach stats after check-in
CREATE OR REPLACE FUNCTION update_coach_checkin_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update relationship
    UPDATE coaching_relationships
    SET
        last_coach_checkin = NEW.checked_at,
        total_checkins = total_checkins + 1
    WHERE id = NEW.relationship_id;

    -- Update coach profile
    UPDATE user_profiles
    SET
        total_checkins = total_checkins + 1,
        last_active_as_coach = NEW.checked_at
    WHERE user_id = NEW.coach_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update coach rating after student rates
CREATE OR REPLACE FUNCTION update_coach_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    -- Calculate average rating for coach
    SELECT AVG(rating)::DECIMAL(3,2) INTO avg_rating
    FROM coach_ratings
    WHERE coach_id = NEW.coach_id;

    -- Update coach profile
    UPDATE user_profiles
    SET
        average_rating = avg_rating
    WHERE user_id = NEW.coach_id;

    -- Update relationship success rating
    UPDATE coaching_relationships
    SET success_rating = NEW.rating
    WHERE id = NEW.relationship_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify on new message
CREATE OR REPLACE FUNCTION notify_coaching_message()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_name VARCHAR(255);
BEGIN
    -- Get sender name
    SELECT name INTO v_sender_name FROM users WHERE id = NEW.sender_id;

    -- Create notification for receiver
    PERFORM create_notification(
        NEW.receiver_id,
        'system_message',
        'New Message from ' || CASE
            WHEN NEW.sender_id = (SELECT coach_id FROM coaching_relationships WHERE id = NEW.relationship_id)
            THEN 'Your Coach'
            ELSE 'Your Student'
        END,
        v_sender_name || ' sent you a message',
        jsonb_build_object(
            'relationship_id', NEW.relationship_id,
            'message_id', NEW.id,
            'sender_id', NEW.sender_id,
            'sender_name', v_sender_name
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_coach_checkin_stats ON coach_checkins;
CREATE TRIGGER trigger_coach_checkin_stats
    AFTER INSERT ON coach_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_coach_checkin_stats();

DROP TRIGGER IF EXISTS trigger_update_coach_rating ON coach_ratings;
CREATE TRIGGER trigger_update_coach_rating
    AFTER INSERT OR UPDATE ON coach_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_coach_rating();

DROP TRIGGER IF EXISTS trigger_coaching_message_notification ON coaching_messages;
CREATE TRIGGER trigger_coaching_message_notification
    AFTER INSERT ON coaching_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_coaching_message();

-- Create view for coach dashboard
CREATE OR REPLACE VIEW coach_dashboard_stats AS
SELECT
    u.id as coach_id,
    u.name as coach_name,
    up.average_rating,
    up.students_coached,
    up.courses_helped_complete,
    up.total_checkins,
    up.last_active_as_coach,
    COUNT(DISTINCT cr.id) FILTER (WHERE cr.is_active = true) as active_students,
    COUNT(DISTINCT cr.id) as total_students_ever,
    AVG(cr.success_rating) as avg_student_success,
    COUNT(DISTINCT cm.id) as total_messages_sent,
    COUNT(DISTINCT cc.id) as total_checkins_performed
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN coaching_relationships cr ON u.id = cr.coach_id
LEFT JOIN coaching_messages cm ON u.id = cm.sender_id AND cm.sender_id = cr.coach_id
LEFT JOIN coach_checkins cc ON u.id = cc.coach_id
WHERE up.is_available_as_coach = true
GROUP BY u.id, u.name, up.average_rating, up.students_coached,
         up.courses_helped_complete, up.total_checkins, up.last_active_as_coach;

-- Create view for admin coaching analytics
CREATE OR REPLACE VIEW admin_coaching_analytics AS
SELECT
    (SELECT COUNT(*) FROM coaching_relationships WHERE is_active = true) as total_active_relationships,
    (SELECT COUNT(*) FROM coaching_requests WHERE status = 'pending') as pending_requests,
    (SELECT COUNT(DISTINCT coach_id) FROM coaching_relationships WHERE is_active = true) as active_coaches,
    (SELECT COUNT(*) FROM users u JOIN user_profiles up ON u.id = up.user_id WHERE up.is_available_as_coach = true) as total_available_coaches,
    (SELECT AVG(rating) FROM coach_ratings) as platform_average_rating,
    (SELECT COUNT(*) FROM coach_checkins WHERE checked_at > NOW() - INTERVAL '7 days') as checkins_last_week,
    (SELECT COUNT(*) FROM coaching_messages WHERE created_at > NOW() - INTERVAL '7 days') as messages_last_week;

-- Sample data: Add some initial stats
UPDATE user_profiles
SET last_active_as_coach = NOW()
WHERE is_available_as_coach = true;
