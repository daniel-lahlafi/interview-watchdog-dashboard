import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { auth } from './config';
import { interviewService } from './services';

export const authService = {
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set the password status to true for users who sign up with a password
      await interviewService.setPasswordStatus(userCredential.user.uid, true);
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  },

  // Send passwordless sign-in link
  sendSignInLink: async (email: string) => {
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/auth/finish-signin',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save the email to localStorage for later use
      window.localStorage.setItem('emailForSignIn', email);
    } catch (error) {
      throw error;
    }
  },

  // Check if the current URL is a sign-in link
  isSignInLink: () => {
    return isSignInWithEmailLink(auth, window.location.href);
  },

  // Complete sign-in with email link
  signInWithLink: async (email: string) => {
    try {
      const result = await signInWithEmailLink(auth, email, window.location.href);
      // Clear the email from localStorage
      window.localStorage.removeItem('emailForSignIn');
      // Check if user already has a password set, if not, set it to false
      const hasPasswordSet = await interviewService.isPasswordSet(result.user.uid);
      if (!hasPasswordSet) {
        await interviewService.setPasswordStatus(result.user.uid, false);
      }
      
      return result.user;
    } catch (error) {
      throw error;
    }
  },

  // Check if user has a password set
  hasPassword: async (user: User): Promise<boolean> => {
    try {
      if (!user.uid) {
        return false;
      }
      return await interviewService.isPasswordSet(user.uid);
    } catch (error) {
      console.error('Error checking password status:', error);
      // Default to false for safety
      return false;
    }
  },

  // Set password status for user
  setPasswordStatus: async (uid: string, isPasswordSet: boolean): Promise<void> => {
    try {
      await interviewService.setPasswordStatus(uid, isPasswordSet);
    } catch (error) {
      console.error('Error setting password status:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
}; 