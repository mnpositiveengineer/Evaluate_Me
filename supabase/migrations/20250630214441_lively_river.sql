/*
  # SpeakElevate Database Schema

  1. New Tables
    - `profiles` - User profile information and settings
    - `skills` - Master list of available speaking skills
    - `user_skills` - User's selected skills with progress tracking
    - `speeches` - User's uploaded speeches and practice sessions
    - `speech_skills` - Skills being practiced in each speech
    - `evaluations` - Feedback and evaluations from others
    - `evaluation_skill_scores` - Individual skill ratings within evaluations
    - `achievements` - User achievements and badges
    - `user_achievements` - Junction table for user achievements

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public evaluation access via speech sharing

  3. Features
    - User profile management with onboarding preferences
    - Skill tracking and progress monitoring
    - Speech upload and management
    - Anonymous evaluation system
    - Achievement and gamification system
    - Comprehensive feedback and analytics
*/

-- Create custom types
CREATE TYPE skill_difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE skill_category AS ENUM (
  'Core Speaking',
  'Content & Structure', 
  'Audience Connection',
  'Confidence & Mindset',
  'Persuasion & Influence',
  'Leadership',
  'Professional Speaking',
  'Adaptability',
  'Advanced Techniques'
);
CREATE TYPE speech_status AS ENUM ('draft', 'practicing', 'delivered', 'archived');
CREATE TYPE evaluation_type AS ENUM ('self', 'peer', 'anonymous', 'written');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  bio text DEFAULT '',
  onboarding_completed boolean DEFAULT false,
  wants_all_skills boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Skills master table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  category skill_category NOT NULL,
  difficulty skill_difficulty NOT NULL,
  icon text DEFAULT '🎯',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User selected skills with progress
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  current_level numeric(3,1) DEFAULT 0 CHECK (current_level >= 0 AND current_level <= 10),
  target_level numeric(3,1) DEFAULT 8 CHECK (target_level >= 0 AND target_level <= 10),
  has_evaluations boolean DEFAULT false,
  evaluation_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Speeches table
CREATE TABLE IF NOT EXISTS speeches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  video_url text,
  duration_seconds integer,
  status speech_status DEFAULT 'draft',
  is_public boolean DEFAULT false,
  share_token text UNIQUE,
  upload_date timestamptz DEFAULT now(),
  delivered_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Skills being practiced in each speech
CREATE TABLE IF NOT EXISTS speech_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speech_id uuid REFERENCES speeches(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(speech_id, skill_id)
);

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speech_id uuid REFERENCES speeches(id) ON DELETE CASCADE,
  evaluator_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  evaluator_name text NOT NULL,
  evaluator_email text,
  evaluation_type evaluation_type DEFAULT 'anonymous',
  overall_score numeric(3,1) CHECK (overall_score >= 1 AND overall_score <= 5),
  what_went_well text DEFAULT '',
  what_could_be_improved text DEFAULT '',
  recommendations text DEFAULT '',
  is_helpful boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  is_anonymous boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Individual skill scores within evaluations
CREATE TABLE IF NOT EXISTS evaluation_skill_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid REFERENCES evaluations(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  score integer CHECK (score >= 1 AND score <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(evaluation_id, skill_id)
);

-- Achievements system
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text DEFAULT '🏆',
  category text DEFAULT 'general',
  points integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE speeches ENABLE ROW LEVEL SECURITY;
ALTER TABLE speech_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_skill_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Skills policies (read-only for users)
CREATE POLICY "Anyone can read skills"
  ON skills
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- User skills policies
CREATE POLICY "Users can manage own skills"
  ON user_skills
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Speeches policies
CREATE POLICY "Users can manage own speeches"
  ON speeches
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read public speeches via share token"
  ON speeches
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND share_token IS NOT NULL);

-- Speech skills policies
CREATE POLICY "Users can manage speech skills for own speeches"
  ON speech_skills
  FOR ALL
  TO authenticated
  USING (
    speech_id IN (
      SELECT id FROM speeches WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    speech_id IN (
      SELECT id FROM speeches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read speech skills for public speeches"
  ON speech_skills
  FOR SELECT
  TO anon, authenticated
  USING (
    speech_id IN (
      SELECT id FROM speeches WHERE is_public = true
    )
  );

-- Evaluations policies
CREATE POLICY "Users can read evaluations for own speeches"
  ON evaluations
  FOR SELECT
  TO authenticated
  USING (
    speech_id IN (
      SELECT id FROM speeches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create evaluations for public speeches"
  ON evaluations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    speech_id IN (
      SELECT id FROM speeches WHERE is_public = true
    )
  );

CREATE POLICY "Users can manage own evaluations"
  ON evaluations
  FOR ALL
  TO authenticated
  USING (evaluator_user_id = auth.uid())
  WITH CHECK (evaluator_user_id = auth.uid());

-- Evaluation skill scores policies
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

CREATE POLICY "Anyone can create skill scores for public speech evaluations"
  ON evaluation_skill_scores
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    evaluation_id IN (
      SELECT e.id FROM evaluations e
      JOIN speeches s ON e.speech_id = s.id
      WHERE s.is_public = true
    )
  );

-- Achievements policies (read-only)
CREATE POLICY "Anyone can read achievements"
  ON achievements
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- User achievements policies
CREATE POLICY "Users can read own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert user achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_speeches_updated_at
  BEFORE UPDATE ON speeches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate share tokens
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to update speech status when evaluation is received
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

CREATE TRIGGER trigger_update_speech_status
  AFTER INSERT ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_speech_status_on_evaluation();

-- Function to update user skill evaluation counts
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

CREATE TRIGGER trigger_update_skill_evaluation_counts
  AFTER INSERT ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_evaluation_counts();