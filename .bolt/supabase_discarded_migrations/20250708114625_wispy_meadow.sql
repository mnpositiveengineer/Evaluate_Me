/*
  # Re-enable RLS with minimal policies
  
  Only run this AFTER confirming that anonymous evaluations work 
  with RLS disabled from the previous migration.
*/

-- Re-enable RLS on evaluations table
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Create the most permissive policy possible for evaluations
CREATE POLICY "Allow all operations on evaluations"
  ON evaluations
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS on evaluation_skill_scores
ALTER TABLE evaluation_skill_scores ENABLE ROW LEVEL SECURITY;

-- Create the most permissive policy for evaluation_skill_scores
CREATE POLICY "Allow all operations on evaluation_skill_scores"
  ON evaluation_skill_scores
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);