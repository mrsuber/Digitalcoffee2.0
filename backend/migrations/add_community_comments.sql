-- Community Comments Migration
-- Adds support for comments and nested replies on community posts

-- Community comments table (supports nested replies)
CREATE TABLE IF NOT EXISTS community_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments count to community_posts
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX idx_community_comments_post ON community_comments(post_id, created_at DESC);
CREATE INDEX idx_community_comments_parent ON community_comments(parent_comment_id);
CREATE INDEX idx_community_comments_user ON community_comments(user_id);

-- Insert some sample comments
INSERT INTO community_comments (post_id, user_id, content, created_at) VALUES
(1, 1, 'This is so inspiring! Keep it up! 💪', NOW() - INTERVAL '1 day'),
(1, 1, 'I''m on day 4 and it''s getting easier every day!', NOW() - INTERVAL '1 day'),
(2, 1, 'Which frequency do you use? I''ve been trying different ones.', NOW() - INTERVAL '4 days'),
(3, 1, 'Thank you for sharing this. I needed to hear it today! 🙏', NOW() - INTERVAL '6 days'),
(4, 1, 'That''s amazing! What helped you stay consistent?', NOW() - INTERVAL '9 days');

-- Insert a sample reply (nested comment)
INSERT INTO community_comments (post_id, user_id, parent_comment_id, content, created_at) VALUES
(1, 1, 1, 'Thank you! We''re all in this together 🌟', NOW() - INTERVAL '20 hours');

-- Update comments count for posts with comments
UPDATE community_posts SET comments_count = (
    SELECT COUNT(*) FROM community_comments WHERE post_id = community_posts.id
) WHERE id IN (SELECT DISTINCT post_id FROM community_comments);
