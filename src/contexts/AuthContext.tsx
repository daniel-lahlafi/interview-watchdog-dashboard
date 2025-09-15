import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasPassword: boolean | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendSignInLink: (email: string) => Promise<void>;
  isSignInLink: () => boolean;
  signInWithLink: (email: string) => Promise<User>;
  checkPasswordStatus: () => Promise<void>;
  setPasswordStatus: (uid: string, isPasswordSet: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  const checkPasswordStatus = async () => {
    if (!user) {
      setHasPassword(null);
      return;
    }

    try {
      const hasPasswordSet = await authService.hasPassword(user);
      setHasPassword(hasPasswordSet);
    } catch (error) {
      console.error('Error checking password status:', error);
      setHasPassword(false); // Default to false for safety
    }
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      
      // Check password status when user changes
      if (user) {
        checkPasswordStatus();
      } else {
        setHasPassword(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    hasPassword,
    signIn: authService.signIn,
    signUp: authService.signUp,
    signOut: authService.signOut,
    resetPassword: authService.resetPassword,
    sendSignInLink: authService.sendSignInLink,
    isSignInLink: authService.isSignInLink,
    signInWithLink: authService.signInWithLink,
    checkPasswordStatus,
    setPasswordStatus: authService.setPasswordStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 