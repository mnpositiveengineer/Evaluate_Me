/*
  # Remove delivered_date functionality

  1. Changes
    - Drop delivered_date column from speeches table
    - Update trigger function to not reference delivered_date
    - Keep the status update functionality but remove date tracking

  2. Security
    - Maintain existing RLS policies
    - Keep other trigger functionality intact
*/

-- Drop the delivered_date column if it exists
ALTER TABLE speeches DROP COLUMN IF EXISTS delivered_date;

-- Update the trigger function to remove delivered_date references
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

-- Ensure the trigger still exists (recreate if needed)
DROP TRIGGER IF EXISTS trigger_update_speech_status ON evaluations;
CREATE TRIGGER trigger_update_speech_status
  AFTER INSERT ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_speech_status_on_evaluation();