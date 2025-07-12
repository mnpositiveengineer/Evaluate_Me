/*
  # Create RLS policies for evaluations and evaluation_skill_scores tables

  1. New Tables
    - No new tables created

  2. Security
    - Remove existing policies for evaluations and evaluation_skill_scores tables
    - Add comprehensive policies for authenticated and anonymous users
    - Policies handle own evaluations vs public speech evaluations

  3. Changes
    - Authenticated users can manage their own evaluations freely
    - Authenticated users can create/read evaluations for public speeches with share tokens
    - Anonymous users can create/read evaluations for public speeches with share tokens
    - Similar policies applied to evaluation_skill_scores table
*/

-- Drop existing policies for evaluations table
DROP POLICY IF EXISTS "Users can manage own evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can read evaluations for own speeches" ON evaluations;
DROP POLICY IF EXISTS "Anonymous users can create evaluations for public speeches" ON evaluations;
DROP POLICY IF EXISTS "Authenticated users can create evaluations for public speeches" ON evaluations;

-- Drop existing policies for evaluation_skill_scores table
DROP POLICY IF EXISTS "Anonymous users can create skill scores for public evaluations" ON evaluation_skill_scores;
DROP POLICY IF EXISTS "Authenticated users can create skill scores for public evaluati" ON evaluation_skill_scores;
DROP POLICY IF EXISTS "Users can read skill scores for evaluations of own speeches" ON evaluation_skill_scores;

-- Enable RLS on both tables (if not already enabled)
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_skill_scores ENABLE ROW LEVEL SECURITY;

-- Policies for evaluations table

-- 1. Authenticated users can insert and select their own evaluations
CREATE POLICY "Authenticated users can manage own evaluations"
  ON evaluations
  FOR ALL
  TO authenticated
  USING (evaluator_user_id = auth.uid())
  WITH CHECK (evaluator_user_id = auth.uid());

-- 2. Authenticated users can insert and select evaluations for public speeches with share tokens
CREATE POLICY "Authenticated users can manage evaluations for public speeches"
  ON evaluations
  FOR ALL
  TO authenticated
  USING (
    speech_id IN (
      SELECT id FROM speeches 
      WHERE is_public = true AND share_token IS NOT NULL
    )
  )
  WITH CHECK (
    speech_id IN (
      SELECT id FROM speeches 
      WHERE is_public = true AND share_token IS NOT NULL
    )
  );

-- 3. Anonymous users can insert and select evaluations for public speeches with share tokens
CREATE POLICY "Anonymous users can manage evaluations for public speeches"
  ON evaluations
  FOR ALL
  TO anon
  USING (
    speech_id IN (
      SELECT id FROM speeches 
      WHERE is_public = true AND share_token IS NOT NULL
    )
  )
  WITH CHECK (
    speech_id IN (
      SELECT id FROM speeches 
      WHERE is_public = true AND share_token IS NOT NULL
    )
  );

-- Policies for evaluation_skill_scores table

-- 1. Authenticated users can insert and select skill scores for their own evaluations
CREATE POLICY "Authenticated users can manage own evaluation skill scores"
  ON evaluation_skill_scores
  FOR ALL
  TO authenticated
  USING (
    evaluation_id IN (
      SELECT id FROM evaluations 
      WHERE evaluator_user_id = auth.uid()
    )
  )
  WITH CHECK (
    evaluation_id IN (
      SELECT id FROM evaluations 
      WHERE evaluator_user_id = auth.uid()
    )
  );

-- 2. Authenticated users can insert and select skill scores for evaluations of public speeches
CREATE POLICY "Authenticated users can manage skill scores for public speech evaluations"
  ON evaluation_skill_scores
  FOR ALL
  TO authenticated
  USING (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN speeches s ON e.speech_id = s.id
      WHERE s.is_public = true AND s.share_token IS NOT NULL
    )
  )
  WITH CHECK (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN speeches s ON e.speech_id = s.id
      WHERE s.is_public = true AND s.share_token IS NOT NULL
    )
  );

-- 3. Anonymous users can insert and select skill scores for evaluations of public speeches
CREATE POLICY "Anonymous users can manage skill scores for public speech evaluations"
  ON evaluation_skill_scores
  FOR ALL
  TO anon
  USING (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN speeches s ON e.speech_id = s.id
      WHERE s.is_public = true AND s.share_token IS NOT NULL
    )
  )
  WITH CHECK (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN speeches s ON e.speech_id = s.id
      WHERE s.is_public = true AND s.share_token IS NOT NULL
    )
  );