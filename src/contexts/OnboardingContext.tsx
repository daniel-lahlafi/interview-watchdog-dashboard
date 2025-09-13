import React, { createContext, useContext, useState } from 'react';

interface OnboardingState {
  email: string;
  isEmailVerified: boolean;
  hasCompletedTutorial: boolean;
}

interface OnboardingContextType {
  onboardingState: OnboardingState;
  setEmail: (email: string) => void;
  setEmailVerified: (verified: boolean) => void;
  setTutorialCompleted: (completed: boolean) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    email: '',
    isEmailVerified: false,
    hasCompletedTutorial: false,
  });

  const setEmail = (email: string) => {
    setOnboardingState(prev => ({ ...prev, email }));
  };

  const setEmailVerified = (verified: boolean) => {
    setOnboardingState(prev => ({ ...prev, isEmailVerified: verified }));
  };

  const setTutorialCompleted = (completed: boolean) => {
    setOnboardingState(prev => ({ ...prev, hasCompletedTutorial: completed }));
  };

  const resetOnboarding = () => {
    setOnboardingState({
      email: '',
      isEmailVerified: false,
      hasCompletedTutorial: false,
    });
  };

  const value = {
    onboardingState,
    setEmail,
    setEmailVerified,
    setTutorialCompleted,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
} 