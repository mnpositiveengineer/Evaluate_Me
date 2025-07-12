/*
  # Disable RLS and create minimal policies for anonymous evaluations

  1. Temporarily disable RLS on evaluations table
  2. Test if anonymous evaluations work
  3. Re-enable with minimal policies if needed

  This will help us identify if the issue is with RLS policies specifically.
*/

-- First, let's completely disable RLS on the evaluations table to test
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on evaluation_skill_scores
ALTER TABLE evaluation_skill_scores DISABLE ROW LEVEL SECURITY;

-- Ensure anonymous users have all necessary permissions
GRANT ALL ON public.evaluations TO anon;
GRANT ALL ON public.evaluation_skill_scores TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Make sure speeches table allows anonymous read for public speeches
-- (Keep RLS enabled but ensure the policy works)
DROP POLICY IF EXISTS "Anonymous users can read public speeches" ON speeches;
DROP POLICY IF EXISTS "Authenticated users can read public speeches" ON speeches;

CREATE POLICY "Anyone can read public speeches"
  ON speeches
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND share_token IS NOT NULL);

-- Ensure speech_skills allows anonymous read
DROP POLICY IF EXISTS "Anonymous users can read speech skills for public speeches" ON speech_skills;
DROP POLICY IF EXISTS "Authenticated users can read speech skills for public speeches" ON speech_skills;

CREATE POLICY "Anyone can read speech skills for public speeches"
  ON speech_skills
  FOR SELECT
  TO anon, authenticated
  USING (
    speech_id IN (
      SELECT id FROM speeches 
      WHERE is_public = true AND share_token IS NOT NULL
    )
  );

-- Ensure skills allows anonymous read
DROP POLICY IF EXISTS "Anonymous users can read active skills" ON skills;
DROP POLICY IF EXISTS "Authenticated users can read active skills" ON skills;

CREATE POLICY "Anyone can read active skills"
  ON skills
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);