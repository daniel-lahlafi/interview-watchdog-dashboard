import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.png';

interface PasswordResetBoxProps {
  onBack: () => void;
}

export default function PasswordResetBox({ onBack }: PasswordResetBoxProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      await resetPassword(email);
      setResetSent(true);
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(error.message || 'Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src={logo}
              alt="Interview Watchdog Logo"
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {resetSent && (
            <div className="bg-green-50 dark:bg-green-900 border-l-4 border-green-400 dark:border-green-600 p-4 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 dark:text-green-300 mr-2" />
                <p className="text-sm text-green-700 dark:text-green-200">
                  Password reset email sent! Please check your inbox and follow the instructions to reset your password.
                </p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={resetSent}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </button>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || resetSent}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending reset email...
                </div>
              ) : resetSent ? (
                'Email Sent!'
              ) : (
                'Send Reset Email'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

