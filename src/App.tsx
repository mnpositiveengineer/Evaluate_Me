import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { useAuthContext } from './components/AuthProvider';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import SpeechManager from './pages/SpeechManager';
import SpeechPlayer from './pages/SpeechPlayer';
import SpeechEvaluation from './pages/SpeechEvaluation';
import SkillSelection from './pages/SkillSelection';
import SpeechAdd from './pages/SpeechAdd';
import SpeechEdit from './pages/SpeechEdit';
import ErrorBoundary from './components/ErrorBoundary';

// Protected route wrapper that redirects to landing if not authenticated
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuthContext();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Check if Supabase is configured - if not, allow demo mode
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
  
  // If Supabase is not configured, allow access (demo mode)
  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }
  
  // If Supabase is configured but user is not authenticated, redirect to landing
  if (!user) {
    return <Navigate to="/landing" replace />;
  }
  
  return <>{children}</>;
};

// App routes component that uses the auth context
const AppRoutes: React.FC = () => {
  const { user, profile, loading } = useAuthContext();
  
  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
  
  // Show loading while auth is being determined
  if (loading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      {/* Landing page route */}
      <Route path="/landing" element={<Landing />} />
      
      {/* Onboarding route without layout */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <SkillSelection />
        </ProtectedRoute>
      } />
      
      {/* Public evaluation route without layout */}
      <Route path="/evaluate/:id" element={<SpeechEvaluation />} />
      
      {/* Speech upload route */}
      <Route path="/add" element={
        <ProtectedRoute>
          <Layout>
            <SpeechAdd />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Speech edit route */}
      <Route path="/edit-speech/:id" element={
        <ProtectedRoute>
          <Layout>
            <SpeechEdit />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Root route - redirect based on auth status and onboarding */}
      <Route path="/" element={
        // If not configured, show landing
        !isSupabaseConfigured ? (
          <Navigate to="/landing" replace />
        ) : !user ? (
          <Navigate to="/landing" replace />
        ) : (
          // If user is authenticated, check onboarding status
          <ProtectedRoute>
            {!profile ? (
              // Profile is still loading
              <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading profile...</p>
                </div>
              </div>
            ) : (
              <Navigate to="/speeches" replace />
            )}
          </ProtectedRoute>
        )
      } />
      
      {/* Main app routes with layout - all protected */}
      <Route path="/speeches" element={
        <ProtectedRoute>
          {!profile ? (
            // Profile is still loading
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading profile...</p>
              </div>
            </div>
          ) : (
            <Layout>
              <SpeechManager />
            </Layout>
          )}
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          {!profile ? (
            // Profile is still loading
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading profile...</p>
              </div>
            </div>
          ) : (
            <Layout>
              <Profile />
            </Layout>
          )}
        </ProtectedRoute>
      } />
      
      <Route path="/speech/:id" element={
        <ProtectedRoute>
          {!profile ? (
            // Profile is still loading
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading profile...</p>
              </div>
            </div>
          ) : (
            <Layout>
              <SpeechPlayer />
            </Layout>
          )}
        </ProtectedRoute>
      } />
      
      {/* Catch all route - redirect to landing for unauthenticated, speeches for authenticated */}
      <Route path="*" element={
        !isSupabaseConfigured ? (
          <Navigate to="/landing" replace />
        ) : !user ? (
          <Navigate to="/landing" replace />
        ) : (
          <Navigate to="/speeches" replace />
        )
      } />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;