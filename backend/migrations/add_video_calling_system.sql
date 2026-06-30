-- Video Calling System for Professional Coaches
-- Premium feature only

-- 1. Coach Availability Table
-- Coaches set their regular weekly availability
CREATE TABLE IF NOT EXISTS coach_availability (
    id SERIAL PRIMARY KEY,
    coach_id INTEGER NOT NULL REFERENCES professional_coaches(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coach_id, day_of_week, start_time)
);

-- 2. Coach Blocked Dates/Times
-- Coaches can block specific dates or time ranges
CREATE TABLE IF NOT EXISTS coach_blocked_slots (
    id SERIAL PRIMARY KEY,
    coach_id INTEGER NOT NULL REFERENCES professional_coaches(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coach_id, blocked_date, start_time)
);

-- 3. Call Bookings
-- Students book calls with coaches
CREATE TABLE IF NOT EXISTS call_bookings (
    id SERIAL PRIMARY KEY,
    coach_id INTEGER NOT NULL REFERENCES professional_coaches(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    booking_notes TEXT,
    cancellation_reason TEXT,
    cancelled_by INTEGER REFERENCES users(id),
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_booking_advance CHECK (scheduled_at > created_at + INTERVAL '24 hours')
);

CREATE INDEX idx_call_bookings_coach ON call_bookings(coach_id, scheduled_at);
CREATE INDEX idx_call_bookings_student ON call_bookings(student_id, scheduled_at);
CREATE INDEX idx_call_bookings_status ON call_bookings(status);

-- 4. Call Sessions
-- Active and completed call sessions with WebRTC details
CREATE TABLE IF NOT EXISTS call_sessions (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES call_bookings(id) ON DELETE SET NULL,
    coach_id INTEGER NOT NULL REFERENCES professional_coaches(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    room_id VARCHAR(255) UNIQUE NOT NULL,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'failed', 'reconnecting')),
    coach_joined_at TIMESTAMP,
    student_joined_at TIMESTAMP,
    connection_quality VARCHAR(20) DEFAULT 'good' CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
    ended_by INTEGER REFERENCES users(id),
    disconnect_reason VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_sessions_room ON call_sessions(room_id);
CREATE INDEX idx_call_sessions_token ON call_sessions(session_token);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);

-- 5. Call Recordings
-- Video/Audio recordings stored on VPS
CREATE TABLE IF NOT EXISTS call_recordings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_size_mb DECIMAL(10, 2),
    duration_seconds INTEGER,
    recording_type VARCHAR(20) DEFAULT 'video_audio' CHECK (recording_type IN ('video_audio', 'audio_only', 'screen_only')),
    format VARCHAR(10) DEFAULT 'webm',
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'available', 'failed', 'deleted')),
    processed_at TIMESTAMP,
    viewed_by_admin BOOLEAN DEFAULT false,
    last_viewed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_recordings_session ON call_recordings(session_id);
CREATE INDEX idx_call_recordings_status ON call_recordings(status);

-- 6. Call Chat Messages
-- In-call text chat
CREATE TABLE IF NOT EXISTS call_chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file', 'emoji')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_chat_session ON call_chat_messages(session_id, created_at);

-- 7. Call Quality Metrics
-- Track connection quality and issues
CREATE TABLE IF NOT EXISTS call_quality_metrics (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    video_bitrate INTEGER,
    audio_bitrate INTEGER,
    packet_loss_percentage DECIMAL(5, 2),
    latency_ms INTEGER,
    jitter_ms INTEGER,
    frame_rate INTEGER,
    resolution VARCHAR(20),
    network_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_quality_session ON call_quality_metrics(session_id);

-- 8. Screen Sharing Sessions
-- Track screen sharing within calls
CREATE TABLE IF NOT EXISTS screen_sharing_sessions (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES call_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER
);

-- 9. Call Notifications
-- In-app notifications for calls
CREATE TABLE IF NOT EXISTS call_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES call_bookings(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES call_sessions(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'booking_confirmed',
        'reminder_1hour',
        'reminder_15min',
        'coach_joined',
        'student_joined',
        'call_started',
        'call_ended',
        'booking_cancelled',
        'call_missed'
    )),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_notifications_user ON call_notifications(user_id, created_at DESC);
CREATE INDEX idx_call_notifications_read ON call_notifications(is_read);

-- Update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coach_availability_modtime
    BEFORE UPDATE ON coach_availability
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_call_bookings_modtime
    BEFORE UPDATE ON call_bookings
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_call_sessions_modtime
    BEFORE UPDATE ON call_sessions
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_call_recordings_modtime
    BEFORE UPDATE ON call_recordings
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add recording consent to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS call_recording_consent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS call_recording_consent_date TIMESTAMP;

-- Comments for documentation
COMMENT ON TABLE coach_availability IS 'Weekly availability schedule for professional coaches';
COMMENT ON TABLE coach_blocked_slots IS 'Blocked dates/times when coaches are unavailable';
COMMENT ON TABLE call_bookings IS 'Scheduled call bookings between students and coaches';
COMMENT ON TABLE call_sessions IS 'Active and historical call sessions with WebRTC details';
COMMENT ON TABLE call_recordings IS 'Video/audio recordings of calls stored on VPS';
COMMENT ON TABLE call_chat_messages IS 'In-call text chat messages';
COMMENT ON TABLE call_quality_metrics IS 'Real-time call quality monitoring data';
COMMENT ON TABLE screen_sharing_sessions IS 'Screen sharing activity tracking';
COMMENT ON TABLE call_notifications IS 'In-app notifications for call events';
