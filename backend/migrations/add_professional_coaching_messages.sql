-- Create professional coaching messages table
CREATE TABLE IF NOT EXISTS professional_coaching_messages (
  id SERIAL PRIMARY KEY,
  relationship_id INTEGER REFERENCES professional_coaching_relationships(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prof_coaching_messages_relationship
  ON professional_coaching_messages(relationship_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prof_coaching_messages_unread
  ON professional_coaching_messages(receiver_id, is_read);

-- Grant permissions
GRANT ALL PRIVILEGES ON professional_coaching_messages TO digitalcoffee_user;
GRANT USAGE, SELECT ON SEQUENCE professional_coaching_messages_id_seq TO digitalcoffee_user;
