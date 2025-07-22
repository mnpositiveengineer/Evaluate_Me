import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, getProfile, createProfile } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Track profile creation attempts to prevent infinite loops
  const [profileCreationAttempted, setProfileCreationAttempted] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('Supabase not configured, running in demo mode');
      setError('Supabase configuration missing. Please set up your environment variables.');
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError('Failed to initialize authentication');
        setIsInitialized(true);
        setLoading(false);
        return;
      }

      console.log('Initial session:', session?.user?.email || 'No session', 'User ID:', session?.user?.id || 'No ID');
      setUser(session?.user ?? null);
      
      if (session?.user && session.user.id) {
        loadProfile(session.user);
      } else {
        setIsInitialized(true);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'No user', 'User ID:', session?.user?.id || 'No ID');
        
        setUser(session?.user ?? null);
        
        if (session?.user && session.user.id) {
          // Only load profile if we don't already have one for this user
          if (!profile || profile.id !== session.user.id) {
            await loadProfile(session.user);
          } else {
            // User is the same and profile exists, just mark as initialized
            setIsInitialized(true);
            setLoading(false);
          }
        } else {
          setProfile(null);
          setProfileCreationAttempted(new Set()); // Reset on sign out
          setIsInitialized(true);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (authUser: User) => {
    // Validate user object
    if (!authUser || !authUser.id) {
      console.error('Invalid user object provided to loadProfile:', authUser);
      setError('Invalid user session. Please try signing in again.');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading profile for user:', authUser.id);
      setLoading(true);
      setError(null);
      
      console.log('About to call getProfile...');
      
      // Remove the artificial delay - it's not needed and slows things down
      console.log('Fetching profile directly...');
      
      // Try to get existing profile with shorter timeout
      try {
        const profileData = await getProfile(authUser.id);
        console.log('Profile loaded successfully:', profileData);
        setProfile(profileData);
        setIsInitialized(true);
        setError(null);
      } catch (profileFetchError) {
        console.error('Profile fetch failed:', profileFetchError);
        throw profileFetchError; // Let the outer catch handle this
      }
    } catch (error: any) {
      console.log('Profile not found, attempting to create new profile:', error);
      
      // If we're getting connectivity issues, provide a fallback
      if (error.message?.includes('timeout') || error.message?.includes('connection')) {
        console.log('Connectivity issues detected, setting up temporary profile...');
        const tempProfile: Profile = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || 
                     authUser.user_metadata?.name || 
                     authUser.email?.split('@')[0] || 
                     'User',
          onboarding_completed: false,
          wants_all_skills: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(tempProfile);
        setError('Running in offline mode. Some features may be limited.');
        setIsInitialized(true);
        setLoading(false);
        return;
      }
      
      // Check if we've already attempted to create a profile for this user
      if (profileCreationAttempted.has(authUser.id)) {
        console.log('Profile creation already attempted for this user, skipping...');
        
        // Wait a bit and try one more time with shorter timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          console.log('Retrying profile fetch after creation attempt...');
          const profileData = await getProfile(authUser.id);
          console.log('Profile found on retry:', profileData);
          setProfile(profileData);
          setError(null);
          setIsInitialized(true);
          setLoading(false);
          return;
        } catch (retryError) {
          console.error('Profile still not found after retry:', retryError);
        }
        
        setError('Failed to load user profile. Please try refreshing the page.');
        setIsInitialized(true);
        setLoading(false);
        return;
      }
      
      // Mark that we're attempting to create a profile for this user
      setProfileCreationAttempted(prev => new Set(prev).add(authUser.id));
      
      // If profile doesn't exist, create one
      try {
        console.log('Creating new profile for user:', authUser.email);
        
        // Extract name from user metadata or email
        const fullName = authUser.user_metadata?.full_name || 
                         authUser.user_metadata?.name || 
                         authUser.email?.split('@')[0] || 
                         'User';
        
        const profileData = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: fullName,
          onboarding_completed: false,
          wants_all_skills: false
        };
        
        console.log('Creating profile with data:', profileData);
        
        const newProfile = await createProfile(profileData);
        console.log('Profile created successfully:', newProfile);
        setProfile(newProfile);
        setIsInitialized(true);
        setError(null);
      } catch (insertError: any) {
        console.error('Failed to create profile:', insertError);
        
        // If profile creation also fails due to connectivity, use temp profile
        if (insertError.message?.includes('timeout') || insertError.message?.includes('connection')) {
          console.log('Profile creation failed due to connectivity, using temporary profile...');
          const tempProfile: Profile = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || 
                       authUser.user_metadata?.name || 
                       authUser.email?.split('@')[0] || 
                       'User',
            onboarding_completed: false,
            wants_all_skills: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setProfile(tempProfile);
          setError('Running in offline mode. Profile will sync when connection is restored.');
        } else {
          setError('Failed to create user profile. Please try refreshing the page.');
        }
        setIsInitialized(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = () => {
    if (user) {
      // Reset the creation attempt tracking when manually refreshing
      setProfileCreationAttempted(new Set());
      loadProfile(user);
    }
  };

  return {
    user,
    profile,
    loading,
    isInitialized,
    error,
    refreshProfile
  };
};