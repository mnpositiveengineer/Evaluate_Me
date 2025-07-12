/*
  # Fix delivered_date column issue

  1. Database Changes
    - Remove delivered_date column references from triggers
    - Update speech status trigger to not use delivered_date
    - Keep the speech status update functionality without the date tracking

  2. Security
    - Maintain existing RLS policies
    - Keep evaluation functionality working
*/

-- Drop the existing trigger that references delivered_date
DROP TRIGGER IF EXISTS trigger_update_speech_status ON evaluations;

-- Update the function to not use delivered_date
CREATE OR REPLACE FUNCTION update_speech_status_on_evaluation()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark speech as delivered when it receives its first evaluation
  UPDATE speeches 
  SET status = 'delivered'
  WHERE id = NEW.speech_id 
    AND status = 'practicing';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_speech_status
  AFTER INSERT ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_speech_status_on_evaluation();

-- Also ensure the speeches table doesn't have delivered_date column
-- (This will only run if the column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'speeches' 
    AND column_name = 'delivered_date'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE speeches DROP COLUMN delivered_date;
  END IF;
END $$;