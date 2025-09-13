
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import logo from '../assets/logo.png';
import { useOnboarding } from '../contexts/OnboardingContext';

function Onboarding() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { setEmail: setContextEmail, setEmailVerified } = useOnboarding();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call to check subscription and send verification code
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll assume the email is valid
      // In a real app, you'd check against your subscription database
      setSuccess('Verification code sent to your email!');
      setStep('verification');
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call to verify code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll assume the code is valid
      // In a real app, you'd verify the code against your backend
      setSuccess('Email verified successfully!');
      
      // Update onboarding context
      setContextEmail(email);
      setEmailVerified(true);
      
      // Navigate to tutorial after a short delay
      setTimeout(() => {
        navigate('/onboarding/tutorial');
      }, 1000);
    } catch (err) {
      setError('Invalid verification code. Please try again.');
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
            Welcome to Interview Watchdog
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {step === 'email' 
              ? 'Enter the email address you used to subscribe'
              : 'Enter the verification code sent to your email'
            }
          </p>
        </div>

        {step === 'email' ? (
          <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300 mr-2" />
                  <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your subscription email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Sending code...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Send Verification Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerificationSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300 mr-2" />
                  <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900 border-l-4 border-green-400 dark:border-green-600 p-4 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 dark:text-green-300 mr-2" />
                  <p className="text-sm text-green-700 dark:text-green-200">{success}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  id="verification-code"
                  name="verification-code"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Verifying...
                  </div>
                ) : (
                  'Verify Code'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
