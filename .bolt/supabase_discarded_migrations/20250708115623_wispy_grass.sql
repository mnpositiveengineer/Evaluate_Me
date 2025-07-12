/*
  # Add missing columns to speeches table

  1. Database Changes
    - Add delivered_date column to speeches table if it doesn't exist
    - Add upload_date column if it doesn't exist (rename created_at if needed)
    - Ensure all expected columns are present

  2. Data Migration
    - Set upload_date to created_at value for existing records
    - Ensure proper defaults are set
*/

-- Add delivered_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'speeches' AND column_name = 'delivered_date'
  ) THEN
    ALTER TABLE speeches ADD COLUMN delivered_date timestamptz;
  END IF;
END $$;

-- Add upload_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'speeches' AND column_name = 'upload_date'
  ) THEN
    ALTER TABLE speeches ADD COLUMN upload_date timestamptz DEFAULT now();
    
    -- Update existing records to use created_at as upload_date
    UPDATE speeches SET upload_date = created_at WHERE upload_date IS NULL;
  END IF;
END $$;

-- Add video_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'speeches' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE speeches ADD COLUMN video_url text;
  END IF;
END $$;

-- Add duration_seconds column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'speeches' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE speeches ADD COLUMN duration_seconds integer;
  END IF;
END $$;

-- Ensure the trigger function exists and works correctly
CREATE OR REPLACE FUNCTION update_speech_status_on_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark speech as delivered when it receives its first evaluation
  UPDATE speeches 
  SET 
    status = 'delivered',
    delivered_date = COALESCE(delivered_date, now())
  WHERE id = NEW.speech_id 
    AND status = 'practicing';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS trigger_update_speech_status ON evaluations;
CREATE TRIGGER trigger_update_speech_status
  AFTER INSERT ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_speech_status_on_evaluation();

-- Also ensure the skill evaluation count function works
CREATE OR REPLACE FUNCTION update_skill_evaluation_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update evaluation counts for skills in the speech
  UPDATE user_skills 
  SET 
    has_evaluations = true,
    evaluation_count = evaluation_count + 1
  WHERE user_id = (
    SELECT user_id FROM speeches WHERE id = NEW.speech_id
  )
  AND skill_id IN (
    SELECT skill_id FROM speech_skills WHERE speech_id = NEW.speech_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_skill_evaluation_counts ON evaluations;
CREATE TRIGGER trigger_update_skill_evaluation_counts
  AFTER INSERT ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_evaluation_counts();