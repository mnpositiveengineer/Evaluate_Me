import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log configuration for debugging
console.log('Supabase configuration:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Missing',
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Missing',
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey
});

// Declare supabase variable that will be assigned conditionally
let supabase: any;

// Better error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey
  });
  
  // Create a mock client for development/demo purposes
  const mockClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) })
    }),
    rpc: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
  };
  
  // Assign mock client if environment variables are missing
  supabase = mockClient;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Export supabase at the top level
export { supabase };

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  onboarding_completed: boolean;
  wants_all_skills: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  current_level: number;
  target_level: number;
  has_evaluations: boolean;
  evaluation_count: number;
  created_at: string;
  updated_at: string;
  skill?: Skill;
}

export interface Speech {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  video_url?: string;
  duration_seconds?: number;
  status: 'draft' | 'practicing' | 'delivered' | 'archived';
  is_public: boolean;
  share_token?: string;
  upload_date: string;
  delivered_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SpeechSkill {
  id: string;
  speech_id: string;
  skill_id: string;
  created_at: string;
  skill?: Skill;
}

export interface Evaluation {
  id: string;
  speech_id: string;
  evaluator_user_id?: string;
  evaluator_name: string;
  evaluator_email?: string;
  evaluation_type: 'self' | 'peer' | 'anonymous' | 'written';
  overall_score?: number;
  what_went_well?: string;
  what_could_be_improved?: string;
  recommendations?: string;
  is_helpful: boolean;
  helpful_count: number;
  is_anonymous: boolean;
  created_at: string;
}

export interface EvaluationSkillScore {
  id: string;
  evaluation_id: string;
  skill_id: string;
  score: number;
  created_at: string;
  skill?: Skill;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

// Helper functions
export const generateShareToken = async (): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('generate_share_token');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating share token:', error);
    return Math.random().toString(36).substring(2, 15);
  }
};

// Authentication helpers
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    return { data, error };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { data: null, error };
  }
};

export const signInWithLinkedIn = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    return { data, error };
  } catch (error) {
    console.error('LinkedIn sign in error:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};

// Profile functions with improved error handling
export const getProfile = async (userId: string): Promise<Profile> => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  console.log('Fetching profile for user ID:', userId);
  
  try {
    console.log('Making Supabase query for profile...');
    
    // Add reasonable timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 10000); // 10 second timeout
    });
    
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
    
    console.log('Supabase query completed. Data:', data, 'Error:', error);
    
    if (error) {
      console.error('Error fetching profile:', error);
      // Check if it's a "no rows" error (profile doesn't exist)
      if (error.code === 'PGRST116' || error.message?.includes('no rows') || error.message?.includes('JSON object requested, multiple (or no) rows returned')) {
        console.log('No profile found for user:', userId);
        throw new Error('Profile not found');
      }
      throw error;
    }
    
    if (!data) {
      console.log('No profile data returned for user:', userId);
      throw new Error('Profile not found');
    }
    
    console.log('Profile fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Profile fetch failed:', error);
    throw error;
  }
};

export const createProfile = async (profileData: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> => {
  if (!profileData.id) {
    throw new Error('User ID is required for profile creation');
  }
  
  console.log('Creating new profile:', profileData);
  
  try {
    // First, check if profile already exists
    try {
      const existingProfile = await getProfile(profileData.id);
      console.log('Profile already exists, returning existing profile:', existingProfile);
      return existingProfile;
    } catch (error) {
      // Profile doesn't exist, continue with creation
      console.log('Profile does not exist, proceeding with creation');
    }

    // Add reasonable timeout for profile creation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile creation timeout')), 15000);
    });
    
    const createPromise = supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    
    const { data, error } = await Promise.race([createPromise, timeoutPromise]) as any;
    
    if (error) {
      console.error('Error creating profile:', error);
      
      // If it's a duplicate key error, try to fetch the existing profile
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        console.log('Duplicate profile detected, fetching existing profile...');
        try {
          const existingProfile = await getProfile(profileData.id);
          console.log('Existing profile fetched successfully:', existingProfile);
          return existingProfile;
        } catch (fetchError) {
          console.error('Failed to fetch existing profile after duplicate error:', fetchError);
          throw new Error('Profile creation failed and could not retrieve existing profile');
        }
      }
      
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to create profile - no data returned');
    }
    
    console.log('Profile created successfully:', data);
    return data;
  } catch (error) {
    console.error('Profile creation failed:', error);
    throw error;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    console.log('Updating profile for user:', userId, 'with updates:', updates);
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    
    console.log('Profile updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Skills functions
export const getAllSkills = async (): Promise<Skill[]> => {
  try {
    console.log('Fetching all skills...');
    
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching skills:', error);
      throw error;
    }
    
    console.log('Skills fetched successfully:', data?.length || 0, 'skills');
    return data || [];
  } catch (error) {
    console.error('Error getting skills:', error);
    return [];
  }
};

export const getUserSkills = async (userId: string): Promise<UserSkill[]> => {
  try {
    console.log('Fetching user skills for user:', userId);
    
    const { data, error } = await supabase
      .from('user_skills')
      .select(`
        *,
        skill:skills(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching user skills:', error);
      throw error;
    }
    
    console.log('User skills fetched successfully:', data?.length || 0, 'skills');
    return data || [];
  } catch (error) {
    console.error('Error getting user skills:', error);
    return [];
  }
};

export const updateUserSkills = async (userId: string, skillIds: string[]) => {
  try {
    console.log('Updating user skills for user:', userId, 'with skills:', skillIds);
    
    // First, get current skills
    const currentSkills = await getUserSkills(userId);
    const currentSkillIds = currentSkills.map(us => us.skill_id);
    
    // Find skills to add and remove
    const skillsToAdd = skillIds.filter(id => !currentSkillIds.includes(id));
    const skillsToRemove = currentSkillIds.filter(id => !skillIds.includes(id));
    
    console.log('Skills to add:', skillsToAdd);
    console.log('Skills to remove:', skillsToRemove);
    
    // Remove skills that don't have evaluations
    if (skillsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', userId)
        .in('skill_id', skillsToRemove)
        .eq('has_evaluations', false);
      
      if (deleteError) {
        console.error('Error removing skills:', deleteError);
        throw deleteError;
      }
      
      console.log('Removed skills successfully');
    }
    
    // Add new skills
    if (skillsToAdd.length > 0) {
      const newUserSkills = skillsToAdd.map(skillId => ({
        user_id: userId,
        skill_id: skillId
      }));
      
      const { error: insertError } = await supabase
        .from('user_skills')
        .insert(newUserSkills);
      
      if (insertError) {
        console.error('Error adding skills:', insertError);
        throw insertError;
      }
      
      console.log('Added skills successfully');
    }
    
    console.log('User skills updated successfully');
  } catch (error) {
    console.error('Error updating user skills:', error);
    throw error;
  }
};

// Check if a skill can be removed (not associated with speeches or evaluations)
export const canRemoveSkill = async (userId: string, skillId: string): Promise<{ canRemove: boolean; reason?: string }> => {
  try {
    // Check if skill has evaluations
    const { data: userSkill, error: userSkillError } = await supabase
      .from('user_skills')
      .select('has_evaluations, evaluation_count')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .single();

    if (userSkillError) {
      console.error('Error checking user skill:', userSkillError);
      return { canRemove: false, reason: 'Unable to verify skill status' };
    }

    if (userSkill.has_evaluations) {
      return { 
        canRemove: false, 
        reason: `This skill has ${userSkill.evaluation_count} evaluation${userSkill.evaluation_count !== 1 ? 's' : ''} and cannot be removed` 
      };
    }

    // Check if skill is associated with any speeches
    const { data: speechSkills, error: speechSkillsError } = await supabase
      .from('speech_skills')
      .select(`
        id,
        speech:speeches!inner(
          id,
          title,
          user_id
        )
      `)
      .eq('skill_id', skillId)
      .eq('speech.user_id', userId);

    if (speechSkillsError) {
      console.error('Error checking speech skills:', speechSkillsError);
      return { canRemove: false, reason: 'Unable to verify speech associations' };
    }

    if (speechSkills && speechSkills.length > 0) {
      const speechCount = speechSkills.length;
      return { 
        canRemove: false, 
        reason: `This skill is associated with ${speechCount} speech${speechCount !== 1 ? 'es' : ''} and cannot be removed` 
      };
    }

    return { canRemove: true };
  } catch (error) {
    console.error('Error checking if skill can be removed:', error);
    return { canRemove: false, reason: 'Unable to verify skill status' };
  }
};

// Remove a single skill with validation
export const removeUserSkill = async (userId: string, skillId: string): Promise<{ success: boolean; message: string }> => {
  try {
    // First check if the skill can be removed
    const { canRemove, reason } = await canRemoveSkill(userId, skillId);
    
    if (!canRemove) {
      return { success: false, message: reason || 'Skill cannot be removed' };
    }

    // Remove the skill
    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    if (error) {
      console.error('Error removing skill:', error);
      return { success: false, message: 'Failed to remove skill. Please try again.' };
    }

    return { success: true, message: 'Skill removed successfully' };
  } catch (error) {
    console.error('Error in removeUserSkill:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};

// Get skill evaluation statistics for a user
export const getUserSkillEvaluationStats = async (userId: string): Promise<{
  skillId: string;
  averageRating: number;
  evaluationCount: number;
}[]> => {
  try {
    const { data, error } = await supabase
      .from('evaluation_skill_scores')
      .select(`
        skill_id,
        score,
        evaluation:evaluations!inner(
          speech:speeches!inner(
            user_id
          )
        )
      `)
      .eq('evaluation.speech.user_id', userId);

    if (error) {
      console.error('Error fetching skill evaluation stats:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by skill_id and calculate averages
    const skillStats = data.reduce((acc, item) => {
      const skillId = item.skill_id;
      if (!acc[skillId]) {
        acc[skillId] = {
          scores: [],
          count: 0
        };
      }
      acc[skillId].scores.push(item.score);
      acc[skillId].count++;
      return acc;
    }, {} as Record<string, { scores: number[]; count: number }>);

    // Calculate averages
    return Object.entries(skillStats).map(([skillId, stats]) => ({
      skillId,
      averageRating: stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length,
      evaluationCount: stats.count
    }));
  } catch (error) {
    console.error('Error getting user skill evaluation stats:', error);
    return [];
  }
};
// Speech functions
export const getUserSpeeches = async (userId: string): Promise<Speech[]> => {
  try {
    const { data, error } = await supabase
      .from('speeches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user speeches:', error);
    return [];
  }
};

export const createSpeech = async (speechData: {
  user_id: string;
  title: string;
  description?: string;
}): Promise<Speech> => {
  try {
    const { data, error } = await supabase
      .from('speeches')
      .insert([speechData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating speech:', error);
    throw error;
  }
};

export const createSpeechSkills = async (speechSkills: {
  speech_id: string;
  skill_id: string;
}[]): Promise<SpeechSkill[]> => {
  try {
    const { data, error } = await supabase
      .from('speech_skills')
      .insert(speechSkills)
      .select(`
        *,
        skill:skills(*)
      `);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error creating speech skills:', error);
    throw error;
  }
};

export const updateSpeech = async (speechId: string, updates: Partial<Speech>) => {
  try {
    const { data, error } = await supabase
      .from('speeches')
      .update(updates)
      .eq('id', speechId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating speech:', error);
    throw error;
  }
};

export const deleteSpeech = async (speechId: string) => {
  try {
    const { error } = await supabase
      .from('speeches')
      .delete()
      .eq('id', speechId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting speech:', error);
    throw error;
  }
};

export const updateSpeechSkills = async (speechId: string, skillIds: string[]) => {
  try {
    // First, delete existing speech skills
    await supabase
      .from('speech_skills')
      .delete()
      .eq('speech_id', speechId);
    
    // Then insert new ones
    if (skillIds.length > 0) {
      const speechSkillsData = skillIds.map(skillId => ({
        speech_id: speechId,
        skill_id: skillId
      }));
      
      await createSpeechSkills(speechSkillsData);
    }
  } catch (error) {
    console.error('Error updating speech skills:', error);
    throw error;
  }
};

export const getSpeechEvaluationCount = async (speechId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('speech_id', speechId);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting evaluation count:', error);
    return 0;
  }
};

export const generateSpeechShareToken = async (speechId: string): Promise<string> => {
  try {
    // Generate a unique share token
    const shareToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    // Update the speech with the share token and make it public
    await supabase
      .from('speeches')
      .update({ 
        share_token: shareToken,
        is_public: true 
      })
      .eq('id', speechId);
    
    return shareToken;
  } catch (error) {
    console.error('Error generating share token:', error);
    throw error;
  }
};

export const getSpeechByShareToken = async (shareToken: string): Promise<Speech | null> => {
  try {
    const { data, error } = await supabase
      .from('speeches')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting speech by share token:', error);
    throw error;
  }
};

export const getSpeechSkills = async (speechId: string): Promise<SpeechSkill[]> => {
  try {
    const { data, error } = await supabase
      .from('speech_skills')
      .select(`
        *,
        skill:skills(*)
      `)
      .eq('speech_id', speechId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting speech skills:', error);
    return [];
  }
};

// Evaluation functions
export const createEvaluation = async (evaluation: {
  speech_id: string;
  evaluator_name: string;
  what_went_well: string;
  what_could_be_improved: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .insert(evaluation)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating evaluation:', error);
    throw error;
  }
};

export const createEvaluationSkillScores = async (scores: Omit<EvaluationSkillScore, 'id' | 'created_at'>[]) => {
  try {
    const { data, error } = await supabase
      .from('evaluation_skill_scores')
      .insert(scores)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating evaluation skill scores:', error);
    throw error;
  }
};

export const getSpeechEvaluations = async (speechId: string): Promise<Evaluation[]> => {
  try {
    const { data, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('speech_id', speechId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting speech evaluations:', error);
    return [];
  }
};