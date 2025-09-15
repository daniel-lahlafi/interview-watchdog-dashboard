import React, { createContext, useContext, useState } from 'react';

interface OnboardingState {
  email: string;
  isEmailVerified: boolean;
  hasCompletedTutorial: boolean;
  hasCompletedInteractiveTour: boolean;
  showInteractiveTour: boolean;
  hasSeenWelcome: boolean;
  dontShowTutorialAgain: boolean;
}

interface OnboardingContextType {
  onboardingState: OnboardingState;
  setEmail: (email: string) => void;
  setEmailVerified: (verified: boolean) => void;
  setTutorialCompleted: (completed: boolean) => void;
  setInteractiveTourCompleted: (completed: boolean) => void;
  setShowInteractiveTour: (show: boolean) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  setDontShowTutorialAgain: (dontShow: boolean) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  // Load initial state from localStorage
  const getInitialState = (): OnboardingState => {
    try {
      const saved = localStorage.getItem('onboardingState');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          email: '',
          isEmailVerified: false,
          hasCompletedTutorial: parsed.hasCompletedTutorial || false,
          hasCompletedInteractiveTour: false,
          showInteractiveTour: false,
          hasSeenWelcome: parsed.hasSeenWelcome || false,
          dontShowTutorialAgain: parsed.dontShowTutorialAgain || false,
        };
      }
    } catch (error) {
      console.warn('Failed to load onboarding state from localStorage:', error);
    }
    
    return {
      email: '',
      isEmailVerified: false,
      hasCompletedTutorial: false,
      hasCompletedInteractiveTour: false,
      showInteractiveTour: false,
      hasSeenWelcome: false,
      dontShowTutorialAgain: false,
    };
  };

  const [onboardingState, setOnboardingState] = useState<OnboardingState>(getInitialState);

  // Save state to localStorage
  const saveToLocalStorage = (state: OnboardingState) => {
    try {
      const stateToSave = {
        hasCompletedTutorial: state.hasCompletedTutorial,
        hasSeenWelcome: state.hasSeenWelcome,
        dontShowTutorialAgain: state.dontShowTutorialAgain,
      };
      localStorage.setItem('onboardingState', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save onboarding state to localStorage:', error);
    }
  };

  const setEmail = (email: string) => {
    setOnboardingState(prev => ({ ...prev, email }));
  };

  const setEmailVerified = (verified: boolean) => {
    setOnboardingState(prev => ({ ...prev, isEmailVerified: verified }));
  };

  const setTutorialCompleted = (completed: boolean) => {
    setOnboardingState(prev => {
      const newState = { ...prev, hasCompletedTutorial: completed };
      saveToLocalStorage(newState);
      return newState;
    });
  };

  const setInteractiveTourCompleted = (completed: boolean) => {
    setOnboardingState(prev => ({ ...prev, hasCompletedInteractiveTour: completed }));
  };

  const setShowInteractiveTour = (show: boolean) => {
    setOnboardingState(prev => ({ ...prev, showInteractiveTour: show }));
  };

  const setHasSeenWelcome = (seen: boolean) => {
    setOnboardingState(prev => {
      const newState = { ...prev, hasSeenWelcome: seen };
      saveToLocalStorage(newState);
      return newState;
    });
  };

  const setDontShowTutorialAgain = (dontShow: boolean) => {
    setOnboardingState(prev => {
      const newState = { ...prev, dontShowTutorialAgain: dontShow };
      saveToLocalStorage(newState);
      return newState;
    });
  };

  const resetOnboarding = () => {
    const newState = {
      email: '',
      isEmailVerified: false,
      hasCompletedTutorial: false,
      hasCompletedInteractiveTour: false,
      showInteractiveTour: false,
      hasSeenWelcome: false,
      dontShowTutorialAgain: false,
    };
    setOnboardingState(newState);
    saveToLocalStorage(newState);
  };

  const value = {
    onboardingState,
    setEmail,
    setEmailVerified,
    setTutorialCompleted,
    setInteractiveTourCompleted,
    setShowInteractiveTour,
    setHasSeenWelcome,
    setDontShowTutorialAgain,
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