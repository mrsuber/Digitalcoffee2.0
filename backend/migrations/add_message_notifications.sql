-- Add message notification types to the existing enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'message';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_message';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'checkin';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'student_checkin';

-- Trigger function to create notification when a new message is sent
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id INTEGER;
    v_sender_name VARCHAR(255);
    v_relationship coaching_relationships%ROWTYPE;
BEGIN
    -- Get relationship details
    SELECT * INTO v_relationship FROM coaching_relationships WHERE id = NEW.relationship_id;

    -- Determine recipient (the person who didn't send the message)
    IF NEW.sender_id = v_relationship.coach_id THEN
        v_recipient_id := v_relationship.student_id;
    ELSE
        v_recipient_id := v_relationship.coach_id;
    END IF;

    -- Get sender name
    SELECT name INTO v_sender_name FROM users WHERE id = NEW.sender_id;

    -- Create notification for recipient
    PERFORM create_notification(
        v_recipient_id,
        'new_message',
        'New Message',
        v_sender_name || ' sent you a message',
        jsonb_build_object(
            'message_id', NEW.id,
            'relationship_id', NEW.relationship_id,
            'sender_id', NEW.sender_id,
            'sender_name', v_sender_name
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create notification when a coach checks in on a student
CREATE OR REPLACE FUNCTION notify_student_checkin()
RETURNS TRIGGER AS $$
DECLARE
    v_coach_name VARCHAR(255);
    v_relationship coaching_relationships%ROWTYPE;
BEGIN
    -- Get relationship details
    SELECT * INTO v_relationship FROM coaching_relationships WHERE id = NEW.relationship_id;

    -- Get coach name
    SELECT name INTO v_coach_name FROM users WHERE id = v_relationship.coach_id;

    -- Create notification for student
    PERFORM create_notification(
        v_relationship.student_id,
        'student_checkin',
        'Coach Check-In',
        v_coach_name || ' checked in on your progress!',
        jsonb_build_object(
            'checkin_id', NEW.id,
            'relationship_id', NEW.relationship_id,
            'coach_id', v_relationship.coach_id,
            'coach_name', v_coach_name,
            'student_id', v_relationship.student_id
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_new_message_notification ON coaching_messages;
CREATE TRIGGER trigger_new_message_notification
    AFTER INSERT ON coaching_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coaching_messages_relationship ON coaching_messages(relationship_id, created_at DESC);
