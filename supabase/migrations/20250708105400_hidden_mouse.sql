/*
  # Fix Anonymous Evaluation Submission

  1. Database Changes
    - Update RLS policies to properly allow anonymous users to submit evaluations
    - Ensure the policy correctly checks for public speeches with share tokens
    - Fix any issues with the evaluation insertion process

  2. Security
    - Maintain security by only allowing evaluations on public speeches
    - Ensure anonymous users can only evaluate speeches that are explicitly shared
*/

-- First, let's check and fix the speeches table RLS policy for anonymous access
DROP POLICY IF EXISTS "Anyone can read public speeches via share token" ON speeches;

CREATE POLICY "Anyone can read public speeches via share token"
  ON speeches
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND share_token IS NOT NULL);

-- Drop and recreate the evaluations policy with better logic
DROP POLICY IF EXISTS "Anyone can create evaluations for public speeches" ON evaluations;

-- Create a more permissive policy for anonymous evaluation creation
CREATE POLICY "Anyone can create evaluations for public speeches"
  ON evaluations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM speeches 
      WHERE speeches.id = speech_id 
      AND speeches.is_public = true 
      AND speeches.share_token IS NOT NULL
    )
  );

-- Also ensure the evaluation_skill_scores table allows anonymous inserts
DROP POLICY IF EXISTS "Anyone can create skill scores for public speech evaluations" ON evaluation_skill_scores;

CREATE POLICY "Anyone can create skill scores for public speech evaluations"
  ON evaluation_skill_scores
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evaluations e
      JOIN speeches s ON e.speech_id = s.id
      WHERE e.id = evaluation_id
      AND s.is_public = true 
      AND s.share_token IS NOT NULL
    )
  );

-- Ensure speech_skills can be read by anonymous users for public speeches
DROP POLICY IF EXISTS "Anyone can read speech skills for public speeches" ON speech_skills;

CREATE POLICY "Anyone can read speech skills for public speeches"
  ON speech_skills
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM speeches 
      WHERE speeches.id = speech_id 
      AND speeches.is_public = true 
      AND speeches.share_token IS NOT NULL
    )
  );

-- Ensure skills can be read by anonymous users
DROP POLICY IF EXISTS "Anyone can read skills" ON skills;

CREATE POLICY "Anyone can read skills"
  ON skills
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Grant necessary permissions to anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.speeches TO anon;
GRANT SELECT ON public.skills TO anon;
GRANT SELECT ON public.speech_skills TO anon;
GRANT INSERT ON public.evaluations TO anon;
GRANT INSERT ON public.evaluation_skill_scores TO anon;

-- Grant sequence usage for ID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;