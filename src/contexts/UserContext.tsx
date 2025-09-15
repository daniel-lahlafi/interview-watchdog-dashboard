import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import interviewService from '../firebase/services';

interface UserContextType {
  interviewsLeft: number;
  dataRetention: number;
  loading: boolean;
  refreshInterviewCount: () => Promise<void>;
  updateDataRetention: (dataRetention: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [interviewsLeft, setInterviewsLeft] = useState(0);
  const [dataRetention, setDataRetention] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    if (!user?.uid) {
      setInterviewsLeft(0);
      setDataRetention(30);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const count = await interviewService.getUserInterviewCount(user.uid);
      setInterviewsLeft(count);
      
      // Fetch user data to get data retention setting
      const userData = await interviewService.getUserByUid(user.uid);
      if (userData?.dataRetention) {
        setDataRetention(parseInt(userData.dataRetention) || 30);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setInterviewsLeft(0);
      setDataRetention(30);
    } finally {
      setLoading(false);
    }
  };

  const refreshInterviewCount = async () => {
    await fetchUserData();
  };

  const updateDataRetention = async (newDataRetention: number) => {
    if (!user?.uid) return;
    
    try {
      await interviewService.updateDataRetention(user.uid, newDataRetention.toString());
      setDataRetention(newDataRetention);
    } catch (error) {
      console.error('Error updating data retention:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user?.uid]);

  const value = {
    interviewsLeft,
    dataRetention,
    loading,
    refreshInterviewCount,
    updateDataRetention,
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