-- Add 'pending' status to professional coaching relationships
-- This allows coaches to review and approve student applications

-- Drop existing constraint
ALTER TABLE professional_coaching_relationships
DROP CONSTRAINT IF EXISTS professional_coaching_relationships_status_check;

-- Add new constraint with 'pending' status
ALTER TABLE professional_coaching_relationships
ADD CONSTRAINT professional_coaching_relationships_status_check
CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled'));

-- Update the unique constraint to allow multiple pending requests
-- but only one active relationship per user-coach pair
DROP INDEX IF EXISTS idx_unique_active_relationship;
CREATE UNIQUE INDEX idx_unique_active_relationship
ON professional_coaching_relationships(user_id, coach_id)
WHERE status = 'active';

-- Add index for pending applications
CREATE INDEX IF NOT EXISTS idx_prof_coaching_rel_pending
ON professional_coaching_relationships(coach_id, status, created_at)
WHERE status = 'pending';

-- Update any existing 'active' relationships created in the last hour to 'pending'
-- (in case there were recent test applications)
-- Comment this out if you want to keep existing relationships as active
-- UPDATE professional_coaching_relationships
-- SET status = 'pending'
-- WHERE status = 'active' AND created_at > NOW() - INTERVAL '1 hour';

SELECT 'Successfully added pending status to coaching relationships!' as message;
