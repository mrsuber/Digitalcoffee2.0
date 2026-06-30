-- Add call_type column to call_sessions table to support instant calls
-- Instant calls are initiated immediately by coaches without prior booking

ALTER TABLE call_sessions
ADD COLUMN IF NOT EXISTS call_type VARCHAR(20) DEFAULT 'scheduled'
CHECK (call_type IN ('scheduled', 'instant'));

-- Update existing sessions to 'scheduled'
UPDATE call_sessions SET call_type = 'scheduled' WHERE call_type IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_call_sessions_type ON call_sessions(call_type);

-- Add index for pending instant calls query
CREATE INDEX IF NOT EXISTS idx_call_sessions_pending ON call_sessions(student_id, call_type, status, created_at);

-- Add comment
COMMENT ON COLUMN call_sessions.call_type IS 'Type of call: scheduled (pre-booked) or instant (direct call)';
