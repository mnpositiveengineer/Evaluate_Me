/*
  # Enable Anonymous Evaluations

  1. Security Changes
    - Drop restrictive RLS policies that block anonymous users
    - Create new policies that allow anonymous evaluation submission
    - Ensure anonymous users can read public speeches and skills
    - Grant necessary permissions to anonymous role

  2. Tables Affected
    - speeches: Allow anonymous read for public speeches
    - skills: Allow anonymous read for active skills
    - speech_skills: Allow anonymous read for public speech skills
    - evaluations: Allow anonymous insert for public speeches
    - evaluation_skill_scores: Allow anonymous insert for public speech evaluations
*/

-- First, ensure we have the right permissions for anonymous users
GRANT USAGE ON SCHEMA public TO anon;

-- Drop ALL existing policies on evaluations table to start fresh
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON evaluations;
DROP POLICY IF EXISTS "enable insert for users based on user_id" ON evaluations;
DROP POLICY IF EXISTS "Anyone can create evaluations for public speeches" ON evaluations;
DROP POLICY IF EXISTS "Users can read evaluations for own speeches" ON evaluations;
DROP POLICY IF EXISTS "Users can manage own evaluations" ON evaluations;

-- Create new comprehensive policies for evaluations
CREATE POLICY "Anonymous users can create evaluations for public speeches"
  ON evaluations
  FOR INSERT
  TO anon
  WITH CHECK (
    speech_id IN (
      SELECT id FROM speeches 
      WHERE is_public = true AND share_token IS NOT NULL
    )
  );

CREATE POLICY "Authenticated users can create evaluations for public speeches"
  ON evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    speech_id IN (
      SELECT id FROM speeches 
      WHERE is_public = true AND share_token IS NOT NULL
    )
  );

CREATE POLICY "Users can read evaluations for own speeches"
  ON evaluations
  FOR SELECT
  TO authenticated
  USING (
    speech_id IN (
      SELECT id FROM speeches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own evaluations"
  ON evaluations
  FOR ALL
  TO authenticated
  USING (evaluator_user_id = auth.uid())
  WITH CHECK (evaluator_user_id = auth.uid());

-- Drop and recreate policies for evaluation_skill_scores
DROP POLICY IF EXISTS "Anyone can create skill scores for public speech evaluations" ON evaluation_skill_scores;
DROP POLICY IF EXISTS "Users can read skill scores for evaluations of own speeches" ON evaluation_skill_scores;

CREATE POLICY "Anonymous users can create skill scores for public evaluations"
  ON evaluation_skill_scores
  FOR INSERT
  TO anon
  WITH CHECK (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN speeches s ON e.speech_id = s.id
      WHERE s.is_public = true AND s.share_token IS NOT NULL
    )
  );

CREATE POLICY "Authenticated users can create skill scores for public evaluations"
  ON evaluation_skill_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN speeches s ON e.speech_id = s.id
      WHERE s.is_public = true AND s.share_token IS NOT NULL
    )
  );

CREATE POLICY "Users can read skill scores for evaluations of own speeches"
  ON evaluation_skill_scores
  FOR SELECT
  TO authenticated
  USING (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN speeches s ON e.speech_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- Ensure speeches table allows anonymous read for public speeches
DROP POLICY IF EXISTS "Anyone can read public speeches via share token" ON speeches;

CREATE POLICY "Anonymous users can read public speeches"
  ON speeches
  FOR SELECT
  TO anon
  USING (is_public = true AND share_token IS NOT NULL);

CREATE POLICY "Authenticated users can read public speeches"
  ON speeches
  FOR SELECT
  TO authenticated
  USING (is_public = true AND share_token IS NOT NULL);

-- Ensure speech_skills allows anonymous read for public speeches
DROP POLICY IF EXISTS "Anyone can read speech skills for public speeches" ON speech_skills;

CREATE POLICY "Anonymous users can read speech skills for public speeches"
  ON speech_skills
  FOR SELECT
  TO anon
  USING (
    speech_id IN (
      SELECT id FROM speeches 
      WHERE is_public = true AND share_token IS NOT NULL
    )
  );

CREATE POLICY "Authenticated users can read speech skills for public speeches"
  ON speech_skills
  FOR SELECT
  TO authenticated
  USING (
    speech_id IN (
      SELECT id FROM speeches 
      WHERE is_public = true AND share_token IS NOT NULL
    )
  );

-- Ensure skills table allows anonymous read
DROP POLICY IF EXISTS "Anyone can read skills" ON skills;

CREATE POLICY "Anonymous users can read active skills"
  ON skills
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated users can read active skills"
  ON skills
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Grant all necessary permissions to anonymous users
GRANT SELECT ON public.speeches TO anon;
GRANT SELECT ON public.skills TO anon;
GRANT SELECT ON public.speech_skills TO anon;
GRANT INSERT ON public.evaluations TO anon;
GRANT INSERT ON public.evaluation_skill_scores TO anon;
GRANT SELECT ON public.evaluations TO anon;
GRANT SELECT ON public.evaluation_skill_scores TO anon;

-- Grant sequence usage for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure the anonymous user can use the gen_random_uuid() function
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO anon;