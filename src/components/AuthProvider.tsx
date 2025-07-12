import React, { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isInitialized: boolean;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};