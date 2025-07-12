/*
  # Temporarily disable triggers that might be causing issues

  This is a temporary fix to allow evaluations to be submitted
  while we debug the column issues.
*/

-- Temporarily disable the triggers
DROP TRIGGER IF EXISTS trigger_update_speech_status ON evaluations;
DROP TRIGGER IF EXISTS trigger_update_skill_evaluation_counts ON evaluations;

-- We can re-enable them later once we confirm everything works