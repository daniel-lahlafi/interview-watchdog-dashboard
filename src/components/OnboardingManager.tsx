import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useOnboarding } from '../contexts/OnboardingContext';
import WelcomeScreen from './WelcomeScreen';

interface OnboardingManagerProps {
  children: React.ReactNode;
}

export default function OnboardingManager({ children }: OnboardingManagerProps) {
  const { onboardingState, setTutorialCompleted, setHasSeenWelcome, setDontShowTutorialAgain } = useOnboarding();
  const [showWelcome, setShowWelcome] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Don't show welcome screen if user is on tutorial page
    const isOnTutorialPage = location.pathname === '/onboarding/tutorial';
    
    // Don't show welcome screen if user has opted out
    if (onboardingState.dontShowTutorialAgain) {
      setShowWelcome(false);
      return;
    }
    
    // Check if this is a first-time user (no tutorial completed), hasn't seen welcome, and not on tutorial page
    if (!onboardingState.hasCompletedTutorial && !onboardingState.hasSeenWelcome && !showWelcome && !isOnTutorialPage) {
      setShowWelcome(true);
      return;
    }
    
    // Hide welcome screen if user navigates to tutorial page
    if (isOnTutorialPage && showWelcome) {
      setShowWelcome(false);
    }
  }, [onboardingState.hasCompletedTutorial, onboardingState.hasSeenWelcome, onboardingState.dontShowTutorialAgain, showWelcome, location.pathname]);



  const handleWelcomeComplete = (dontShowAgain?: boolean) => {
    setShowWelcome(false);
    setHasSeenWelcome(true);
    
    // Set the "don't show tutorial again" preference
    if (dontShowAgain !== undefined) {
      setDontShowTutorialAgain(dontShowAgain);
    }
    
    // Mark tutorial as completed so the flow continues properly
    setTutorialCompleted(true);
  };

  return (
    <>
      {children}
      {showWelcome && (
        <WelcomeScreen onComplete={handleWelcomeComplete} />
      )}
    </>
  );
}
