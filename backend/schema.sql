-- Digital Coffee Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mood types enum
CREATE TYPE mood_type AS ENUM ('clear', 'tired', 'anxious', 'foggy', 'inspired');

-- Focus levels enum
CREATE TYPE focus_level AS ENUM ('low', 'medium', 'high');

-- Mind modes enum
CREATE TYPE mind_mode AS ENUM ('hyper-focus', 'calm-down', 'infinite-inspiration');

-- Brainwave types enum
CREATE TYPE brainwave_type AS ENUM ('alpha', 'beta', 'theta', 'delta', 'gamma');

-- Daily mood check-ins
CREATE TABLE IF NOT EXISTS mood_checkins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mood mood_type NOT NULL,
    focus_level focus_level NOT NULL,
    daily_goal TEXT,
    emoji_rating INTEGER CHECK (emoji_rating >= 1 AND emoji_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mind modes / courses
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    mode mind_mode NOT NULL,
    duration_days INTEGER DEFAULT 3,
    image_url VARCHAR(500),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course sessions (individual sessions within a course)
CREATE TABLE IF NOT EXISTS course_sessions (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activities JSONB DEFAULT '[]', -- Array of activity objects
    duration_minutes INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User enrolled courses
CREATE TABLE IF NOT EXISTS user_courses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    current_day INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, course_id, is_active)
);

-- Audio content (guided talks, binaural beats, etc.)
CREATE TABLE IF NOT EXISTS audio_content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'binaural', 'guided-talk', 'affirmation', 'breathing'
    brainwave_type brainwave_type,
    frequency_hz DECIMAL(5,2),
    duration_seconds INTEGER NOT NULL,
    audio_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User listening sessions
CREATE TABLE IF NOT EXISTS listening_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    audio_content_id INTEGER REFERENCES audio_content(id) ON DELETE CASCADE,
    course_session_id INTEGER REFERENCES course_sessions(id) ON DELETE SET NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_listened_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false
);

-- User progress and stats
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sessions_completed INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    average_brainwave_hz DECIMAL(5,2),
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    focus_percentage INTEGER CHECK (focus_percentage >= 0 AND focus_percentage <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Mind journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood mood_type,
    tags JSONB DEFAULT '[]',
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_mood_checkins_user_date ON mood_checkins(user_id, created_at DESC);
CREATE INDEX idx_user_courses_user ON user_courses(user_id, is_active);
CREATE INDEX idx_listening_sessions_user ON listening_sessions(user_id, started_at DESC);
CREATE INDEX idx_user_progress_user_date ON user_progress(user_id, date DESC);
CREATE INDEX idx_journal_entries_user ON journal_entries(user_id, created_at DESC);

-- Insert default courses
INSERT INTO courses (title, description, mode, duration_days, is_default) VALUES
('Quick Focus Boost', 'Short, intense sessions to help you lock into deep work mode.', 'hyper-focus', 3, true),
('Calm Mind Reset', 'Relaxation and breathing exercises to reset your mental state.', 'calm-down', 3, true),
('Inspiration Journey', 'Long-form talks and affirmations to expand your mindset.', 'infinite-inspiration', 5, true);

-- Insert sample course sessions for Quick Focus Boost
INSERT INTO course_sessions (course_id, day_number, title, description, duration_minutes, order_index, activities) VALUES
(1, 1, 'Desensitize your noise', '10 min breathing + alpha waves', 15, 1, '[{"type": "breathing", "duration": 600}, {"type": "binaural", "brainwave": "alpha", "duration": 300}]'),
(1, 2, 'Rewire your focus', '15 min guided talk + 5 min focus-sprint', 20, 2, '[{"type": "guided-talk", "duration": 900}, {"type": "focus-sprint", "duration": 300}]'),
(1, 3, 'Lock-in your mission', '10 min talk + 20 min deep work with sound', 30, 3, '[{"type": "guided-talk", "duration": 600}, {"type": "deep-work", "duration": 1200}]');

-- Insert sample course sessions for Calm Mind Reset
INSERT INTO course_sessions (course_id, day_number, title, description, duration_minutes, order_index, activities) VALUES
(2, 1, 'Release the tension', 'Relaxation breathing and body scan', 15, 1, '[{"type": "breathing", "duration": 600}, {"type": "body-scan", "duration": 300}]'),
(2, 2, 'Find your center', 'Guided meditation with theta waves', 20, 2, '[{"type": "guided-meditation", "duration": 900}, {"type": "binaural", "brainwave": "theta", "duration": 300}]'),
(2, 3, 'Deep calm state', 'Extended relaxation session', 25, 3, '[{"type": "guided-meditation", "duration": 1500}]');

-- Insert sample course sessions for Inspiration Journey
INSERT INTO course_sessions (course_id, day_number, title, description, duration_minutes, order_index, activities) VALUES
(3, 1, 'Open your mind', 'Introduction to mental expansion', 20, 1, '[{"type": "guided-talk", "duration": 1200}]'),
(3, 2, 'Break limitations', 'Affirmations and mindset shifts', 25, 2, '[{"type": "affirmation", "duration": 900}, {"type": "guided-talk", "duration": 600}]'),
(3, 3, 'Visualize success', 'Guided visualization exercise', 30, 3, '[{"type": "visualization", "duration": 1800}]'),
(3, 4, 'Rewire beliefs', 'Deep dive into subconscious programming', 35, 4, '[{"type": "guided-talk", "duration": 2100}]'),
(3, 5, 'Infinite potential', 'Final integration and commitment', 40, 5, '[{"type": "guided-talk", "duration": 1500}, {"type": "affirmation", "duration": 900}]');

-- Insert sample audio content
INSERT INTO audio_content (title, description, type, brainwave_type, frequency_hz, duration_seconds, audio_url, thumbnail_url) VALUES
('Alpha Focus - 8.6 Hz', 'Ideal for relaxation and focus', 'binaural', 'alpha', 8.60, 1800, '/audio/alpha-8.6hz.mp3', '/images/alpha-wave.jpg'),
('Theta Deep Meditation', 'Deep relaxation and meditation state', 'binaural', 'theta', 6.00, 1800, '/audio/theta-6hz.mp3', '/images/theta-wave.jpg'),
('Beta Alert Focus', 'Active thinking and concentration', 'binaural', 'beta', 18.00, 1800, '/audio/beta-18hz.mp3', '/images/beta-wave.jpg'),
('Control Your Thoughts', 'Learn to master your inner dialogue', 'guided-talk', NULL, NULL, 900, '/audio/control-thoughts.mp3', '/images/mind-control.jpg'),
('Rewire Your Mind', 'Neuroplasticity and mental reprogramming', 'guided-talk', NULL, NULL, 1200, '/audio/rewire-mind.mp3', '/images/rewire.jpg'),
('Box Breathing Guide', 'Classic 4-4-4-4 breathing technique', 'breathing', NULL, NULL, 600, '/audio/box-breathing.mp3', '/images/breathing.jpg');
