/*
  # Fix Evaluation RLS Policy for Anonymous Users

  1. Database Changes
    - Update RLS policy to allow anonymous users to create evaluations
    - Ensure the policy checks that the speech is public and has a share token

  2. Security
    - Maintain security by only allowing evaluations on public speeches
    - Keep existing policies for authenticated users
*/

-- Drop the existing policy that's too restrictive
DROP POLICY IF EXISTS "Anyone can create evaluations for public speeches" ON evaluations;

-- Create a new policy that properly allows anonymous users to create evaluations
CREATE POLICY "Anyone can create evaluations for public speeches"
  ON evaluations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    speech_id IN (
      SELECT id FROM speeches 
      WHERE is_public = true AND share_token IS NOT NULL
    )
  );

-- Also ensure the evaluation_skill_scores table allows anonymous inserts
DROP POLICY IF EXISTS "Anyone can create skill scores for public speech evaluations" ON evaluation_skill_scores;

CREATE POLICY "Anyone can create skill scores for public speech evaluations"
  ON evaluation_skill_scores
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN speeches s ON e.speech_id = s.id
      WHERE s.is_public = true AND s.share_token IS NOT NULL
    )
  );