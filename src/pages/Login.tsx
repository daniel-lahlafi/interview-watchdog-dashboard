
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Link as LinkIcon } from 'lucide-react';
import logo from '../assets/logo.png';
import PasswordResetBox from '../components/PasswordResetBox';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordlessSent, setPasswordlessSent] = useState(false);
  const [signInMode, setSignInMode] = useState<'password' | 'passwordless'>('password');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn, sendSignInLink, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signInMode === 'passwordless') {
      await handlePasswordlessSignIn();
    } else {
      await handlePasswordSignIn();
    }
  };

  const handlePasswordSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordlessSignIn = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await sendSignInLink(email);
      setPasswordlessSent(true);
    } catch (err) {
      setError('Failed to send sign-in link. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // Show password reset box if user clicked forgot password
  if (showForgotPassword) {
    return <PasswordResetBox onBack={() => setShowForgotPassword(false)} />;
  }

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
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Sign-in mode toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setSignInMode('password')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              signInMode === 'password'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Lock className="inline-block w-4 h-4 mr-2" />
            Password
          </button>
          <button
            type="button"
            onClick={() => setSignInMode('passwordless')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              signInMode === 'passwordless'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon className="inline-block w-4 h-4 mr-2" />
            Magic Link
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}


          {passwordlessSent && (
            <div className="bg-green-50 dark:bg-green-900 border-l-4 border-green-400 dark:border-green-600 p-4 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-200">
                Sign-in link sent! Please check your email and click the link to sign in.
              </p>
            </div>
          )}

          <div className="space-y-4">
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
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {signInMode === 'password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {signInMode === 'password' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {signInMode === 'passwordless' ? 'Sending link...' : 'Signing in...'}
                </div>
              ) : (
                signInMode === 'passwordless' ? 'Send Magic Link' : 'Sign in'
              )}
            </button>
          </div>

          {/* <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              New user?{' '}
              <Link 
                to="/onboarding" 
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Start onboarding
              </Link>
            </p>
          </div> */}
        </form>
      </div>
    </div>
  );
}

export default Login;
