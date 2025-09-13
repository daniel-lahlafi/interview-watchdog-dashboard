import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import interviewService from '../firebase/services';

interface UserContextType {
  interviewsLeft: number;
  loading: boolean;
  refreshInterviewCount: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [interviewsLeft, setInterviewsLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchInterviewCount = async () => {
    if (!user?.email) {
      setInterviewsLeft(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const count = await interviewService.getUserInterviewCount(user.email);
      setInterviewsLeft(count);
    } catch (error) {
      console.error('Error fetching interview count:', error);
      setInterviewsLeft(0);
    } finally {
      setLoading(false);
    }
  };

  const refreshInterviewCount = async () => {
    await fetchInterviewCount();
  };

  useEffect(() => {
    fetchInterviewCount();
  }, [user?.email]);

  const value = {
    interviewsLeft,
    loading,
    refreshInterviewCount,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 