-- Community Posts Migration
-- Creates tables for social community feature where users can share experiences

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood mood_type,
    session_minutes INTEGER,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community post likes table
CREATE TABLE IF NOT EXISTS community_post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_user ON community_posts(user_id);
CREATE INDEX idx_community_post_likes_post ON community_post_likes(post_id);
CREATE INDEX idx_community_post_likes_user ON community_post_likes(user_id);

-- Insert some sample community posts
INSERT INTO community_posts (user_id, content, mood, session_minutes, likes_count, created_at) VALUES
(1, 'Just completed my first week of meditation! Feeling more focused and calm than ever. The journey is worth it! 🧘‍♂️', 'clear', 20, 15, NOW() - INTERVAL '2 days'),
(1, 'Day 3 of the Hyper-Focus course. The binaural beats really help me get into the zone. Highly recommend! 🎧', 'inspired', 15, 23, NOW() - INTERVAL '5 days'),
(1, 'Had a tough day, but 10 minutes of calm breathing made all the difference. Remember, progress over perfection! 💙', 'anxious', 10, 31, NOW() - INTERVAL '7 days'),
(1, 'Reached a 14-day streak today! Never thought I could be this consistent. The community support keeps me going! 🔥', 'inspired', 25, 42, NOW() - INTERVAL '10 days'),
(1, 'Alpha waves during work sessions have been a game changer. My productivity has doubled this month! 🚀', 'clear', 30, 28, NOW() - INTERVAL '12 days');
