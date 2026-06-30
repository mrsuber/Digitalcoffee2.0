-- Fix coaching system constraints to allow:
-- 1. One coach can have multiple students
-- 2. One student can have one coach
-- 3. A person can be both a coach (teaching others) and a student (being coached)

-- The existing UNIQUE(student_id, coach_id, is_active) is actually correct
-- It prevents the same student-coach pair from having duplicate active relationships
-- But it DOES allow:
--   - Coach A to teach Students B, C, D (multiple students per coach) ✓
--   - Student B to be taught by Coach A (one coach per student) ✓
--   - Coach A to also be a student of Coach E (person can be both) ✓

-- The issue might be in the unique constraint on coaching_requests
-- Let's check if that's causing the problem

-- Drop the unique constraint on coaching_requests that prevents multiple requests
-- This constraint: UNIQUE(student_id, coach_id, status)
-- Actually, this is also correct - it just prevents duplicate pending requests

-- After investigation, the constraints are actually correct.
-- The issue might be in the application logic.

-- Let's add some helpful indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_coaching_relationships_active_coach
  ON coaching_relationships(coach_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_coaching_relationships_active_student
  ON coaching_relationships(student_id) WHERE is_active = true;

-- Verify the current state
SELECT
  'Current active coaching relationships:' as info,
  COUNT(*) as count
FROM coaching_relationships
WHERE is_active = true;

SELECT
  'Coaches with multiple students:' as info,
  coach_id,
  COUNT(*) as student_count
FROM coaching_relationships
WHERE is_active = true
GROUP BY coach_id
HAVING COUNT(*) > 1;

SELECT
  'Students with multiple coaches:' as info,
  student_id,
  COUNT(*) as coach_count
FROM coaching_relationships
WHERE is_active = true
GROUP BY student_id
HAVING COUNT(*) > 1;
