-- Notifications System Migration
-- Enables in-app notifications for coaching requests, comments, likes, etc.

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
    'coaching_request',
    'coaching_accepted',
    'coaching_rejected',
    'community_comment',
    'community_like',
    'course_milestone',
    'system_message'
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id INTEGER,
    p_type notification_type,
    p_title VARCHAR(255),
    p_message TEXT,
    p_data JSONB DEFAULT '{}'
) RETURNS INTEGER AS $$
DECLARE
    v_notification_id INTEGER;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create notification when coaching request is made
CREATE OR REPLACE FUNCTION notify_coaching_request()
RETURNS TRIGGER AS $$
DECLARE
    v_student_name VARCHAR(255);
BEGIN
    -- Get student name
    SELECT name INTO v_student_name FROM users WHERE id = NEW.student_id;

    -- Create notification for the coach
    PERFORM create_notification(
        NEW.coach_id,
        'coaching_request',
        'New Coaching Request',
        v_student_name || ' wants you as their meditation coach!',
        jsonb_build_object(
            'request_id', NEW.id,
            'student_id', NEW.student_id,
            'student_name', v_student_name
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create notification when coaching request is accepted
CREATE OR REPLACE FUNCTION notify_coaching_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_coach_name VARCHAR(255);
    v_request coaching_requests%ROWTYPE;
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Get request details
        SELECT * INTO v_request FROM coaching_requests WHERE id = NEW.id;

        -- Get coach name
        SELECT name INTO v_coach_name FROM users WHERE id = v_request.coach_id;

        -- Create notification for the student
        PERFORM create_notification(
            v_request.student_id,
            'coaching_accepted',
            'Coaching Request Accepted!',
            v_coach_name || ' accepted your coaching request. Your journey together begins now!',
            jsonb_build_object(
                'request_id', NEW.id,
                'coach_id', v_request.coach_id,
                'coach_name', v_coach_name
            )
        );
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        -- Get request details
        SELECT * INTO v_request FROM coaching_requests WHERE id = NEW.id;

        -- Get coach name
        SELECT name INTO v_coach_name FROM users WHERE id = v_request.coach_id;

        -- Create notification for the student
        PERFORM create_notification(
            v_request.student_id,
            'coaching_rejected',
            'Coaching Request Update',
            v_coach_name || ' is currently unavailable. Try reaching out to other coaches!',
            jsonb_build_object(
                'request_id', NEW.id,
                'coach_id', v_request.coach_id,
                'coach_name', v_coach_name
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create notification when someone comments on your post
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id INTEGER;
    v_commenter_name VARCHAR(255);
BEGIN
    -- Get post owner
    SELECT user_id INTO v_post_owner_id FROM community_posts WHERE id = NEW.post_id;

    -- Only notify if comment is not by post owner
    IF v_post_owner_id != NEW.user_id THEN
        -- Get commenter name
        SELECT name INTO v_commenter_name FROM users WHERE id = NEW.user_id;

        -- Create notification for post owner
        PERFORM create_notification(
            v_post_owner_id,
            'community_comment',
            'New Comment',
            v_commenter_name || ' commented on your post',
            jsonb_build_object(
                'post_id', NEW.post_id,
                'comment_id', NEW.id,
                'commenter_id', NEW.user_id,
                'commenter_name', v_commenter_name
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create notification when someone likes your post
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id INTEGER;
    v_liker_name VARCHAR(255);
BEGIN
    -- Get post owner
    SELECT user_id INTO v_post_owner_id FROM community_posts WHERE id = NEW.post_id;

    -- Only notify if like is not by post owner
    IF v_post_owner_id != NEW.user_id THEN
        -- Get liker name
        SELECT name INTO v_liker_name FROM users WHERE id = NEW.user_id;

        -- Create notification for post owner
        PERFORM create_notification(
            v_post_owner_id,
            'community_like',
            'New Like',
            v_liker_name || ' liked your post',
            jsonb_build_object(
                'post_id', NEW.post_id,
                'liker_id', NEW.user_id,
                'liker_name', v_liker_name
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_coaching_request_notification ON coaching_requests;
CREATE TRIGGER trigger_coaching_request_notification
    AFTER INSERT ON coaching_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_coaching_request();

DROP TRIGGER IF EXISTS trigger_coaching_status_notification ON coaching_requests;
CREATE TRIGGER trigger_coaching_status_notification
    AFTER UPDATE ON coaching_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_coaching_accepted();

DROP TRIGGER IF EXISTS trigger_post_comment_notification ON community_comments;
CREATE TRIGGER trigger_post_comment_notification
    AFTER INSERT ON community_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_post_comment();

DROP TRIGGER IF EXISTS trigger_post_like_notification ON community_post_likes;
CREATE TRIGGER trigger_post_like_notification
    AFTER INSERT ON community_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION notify_post_like();
