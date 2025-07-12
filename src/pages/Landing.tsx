import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, AlertCircle } from 'lucide-react';
import { signInWithGoogle, signInWithLinkedIn } from '../lib/supabase';
import { useAuthContext } from '../components/AuthProvider';
import EnvChecker from '../components/EnvChecker';

const Landing: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, error: authError } = useAuthContext();

  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

  // Redirect authenticated users
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) return;
    
    if (user && isSupabaseConfigured) {
      console.log('User authenticated, profile:', profile);
      if (profile) {
        // For new users (no onboarding completed), go to onboarding
        // For existing users, always go to speeches
        if (!profile.onboarding_completed) {
          console.log('Redirecting to onboarding');
          navigate('/onboarding', { replace: true });
        } else {
          console.log('Redirecting to speeches');
          navigate('/speeches', { replace: true });
        }
      } else {
        // Profile is still loading or doesn't exist yet
        console.log('User exists but profile is loading...');
      }
    }
  }, [user, profile, navigate, isSupabaseConfigured, authLoading]);

  // Show auth errors
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleGoogleAuth = async () => {
    if (!isSupabaseConfigured) {
      setError('Authentication is not configured. Please set up Supabase environment variables.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting Google authentication...');
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google auth error:', error);
        setError(error.message || 'Failed to sign in with Google');
        setLoading(false);
        return;
      }
      // If successful, the auth state change will handle navigation
      // Don't set loading to false here as the redirect will happen
    } catch (err) {
      console.error('Unexpected error during Google auth:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleLinkedInAuth = async () => {
    if (!isSupabaseConfigured) {
      setError('Authentication is not configured. Please set up Supabase environment variables.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting LinkedIn authentication...');
      const { error } = await signInWithLinkedIn();
      if (error) {
        console.error('LinkedIn auth error:', error);
        setError(error.message || 'Failed to sign in with LinkedIn');
        setLoading(false);
        return;
      }
      // If successful, the auth state change will handle navigation
      // Don't set loading to false here as the redirect will happen
    } catch (err) {
      console.error('Unexpected error during LinkedIn auth:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    // Allow users to explore the app in demo mode
    navigate('/speeches');
  };

  // Show loading if auth is still being determined
  if (authLoading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      {/* Environment Check Section */}
      {!isSupabaseConfigured && (
        <div className="max-w-4xl mx-auto mb-8 pt-8">
          <EnvChecker />
        </div>
      )}
      
      <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full">
        {/* Logo and Brand */}
        <div className="text-center mb-6 md:mb-8">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mic className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Evaluate me!
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Master the art of public speaking with AI-powered feedback
          </p>
        </div>

        {/* Configuration Warning */}
        {!isSupabaseConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Demo Mode</h4>
                <p className="text-sm text-yellow-700">
                  Authentication is not configured. You can explore the app in demo mode, but data won't be saved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
              {isSignUp ? 'Start Your Speaking Journey' : 'Welcome Back'}
            </h2>
            <p className="text-slate-600 text-sm md:text-base">
              {isSignUp 
                ? 'Join thousands of speakers improving their skills daily' 
                : 'Continue your speaking development journey'
              }
            </p>
          </div>

          <div className="space-y-4">
            {isSupabaseConfigured ? (
              <>
                {/* Google Auth */}
                <button
                  onClick={handleGoogleAuth}
                  disabled={loading || authLoading}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || authLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="font-medium text-slate-700 group-hover:text-slate-800 text-sm md:text-base">
                    {loading || authLoading ? 'Signing in...' : (isSignUp ? 'Sign up with Google' : 'Sign in with Google')}
                  </span>
                </button>

                {/* LinkedIn Auth */}
                <button
                  onClick={handleLinkedInAuth}
                  disabled={loading || authLoading}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-[#0077B5] hover:bg-[#006399] text-white rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || authLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  )}
                  <span className="font-medium text-sm md:text-base">
                    {loading || authLoading ? 'Signing in...' : (isSignUp ? 'Sign up with LinkedIn' : 'Sign in with LinkedIn')}
                  </span>
                </button>
              </>
            ) : (
              /* Demo Mode Button */
              <button
                onClick={handleDemoMode}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
              >
                <Mic className="w-5 h-5" />
                <span className="font-medium text-sm md:text-base">
                  Explore Demo
                </span>
              </button>
            )}
          </div>

          {isSupabaseConfigured && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          )}

          {isSignUp && isSupabaseConfigured && (
            <div className="mt-4 text-xs text-slate-500 text-center">
              By signing up, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
            </div>
          )}
        </div>

        {/* Simple Footer */}
        <div className="text-center mt-6 md:mt-8 text-slate-500 text-sm">
          <p>&copy; 2024 Evaluate me! All rights reserved.</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Landing;