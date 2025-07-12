/*
  # Fix Profile Creation Issues

  1. Database Changes
    - Fix RLS policies for profile creation
    - Add automatic profile creation trigger
    - Ensure proper permissions

  2. Security
    - Update RLS policies to handle profile creation properly
    - Add trigger to automatically create profiles on user signup
*/

-- Drop existing foreign key constraint that might be causing issues
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Recreate the foreign key constraint with proper cascade behavior
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop and recreate RLS policies for profiles with better logic
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create improved RLS policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a function to handle profile creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, onboarding_completed, wants_all_skills)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    false,
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions for existing tables only
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.skills TO authenticated;
GRANT ALL ON public.user_skills TO authenticated;
GRANT ALL ON public.speeches TO authenticated;
GRANT ALL ON public.speech_skills TO authenticated;
GRANT ALL ON public.evaluations TO authenticated;
GRANT ALL ON public.evaluation_skill_scores TO authenticated;

-- Grant permissions on tables that exist (check if they exist first)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
    GRANT ALL ON public.achievements TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_achievements') THEN
    GRANT ALL ON public.user_achievements TO authenticated;
  END IF;
END $$;