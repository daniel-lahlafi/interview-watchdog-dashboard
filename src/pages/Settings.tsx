
import React, { useState } from 'react';
import {
  ChevronDown,
  Sun,
  Moon,
  Bell,
  RefreshCw,
  Trash2,
  User,
  Plus,
  Minus,
  ExternalLink,
  CreditCard,
  FileText,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { initializeUserData, updateUserInterviewCount } from '../utils/userInitializer';
import { useTheme } from '../contexts/ThemeContext';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

function Settings() {
  const { user } = useAuth();
  const { interviewsLeft, dataRetention, loading: userLoading, refreshInterviewCount, updateDataRetention } = useUser();
  const { theme, toggleTheme } = useTheme();
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(false);

  // Dashboard auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<'5s' | '15s' | '30s' | '60s'>('15s');

  // Data retention update
  const [dataRetentionUpdating, setDataRetentionUpdating] = useState(false);
  const [dataRetentionError, setDataRetentionError] = useState<string | null>(null);

  // User management
  const [initializing, setInitializing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Billing portal
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleInitializeUser = async () => {
    if (!user?.email) return;
    
    setInitializing(true);
    try {
      await initializeUserData(user.email, 10);
      await refreshInterviewCount();
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setInitializing(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    if (!user) {
      setPortalError('Please log in to access billing management');
      return;
    }

    setPortalLoading(true);
    setPortalError(null);

    try {
      const functions = getFunctions();
      const createCustomerPortalSession = httpsCallable(functions, 'createCustomerPortalSession');
      const result = await createCustomerPortalSession({});
      
      const data = result.data as { success: boolean; url: string; customerId: string };
      
      if (data.success && data.url) {
        // Redirect to the Stripe customer portal
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (error: any) {
      console.error('Error creating customer portal session:', error);
      setPortalError(error.message || 'Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email) {
      setPasswordError('No user found');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setPasswordError(null);
      setPasswordSuccess(null);
      setPasswordLoading(true);

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setPasswordSuccess('Password changed successfully!');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(null);
      }, 3000);

    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('New password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/requires-recent-login') {
        setPasswordError('Please sign in again to change your password. Your session has expired.');
      } else if (error.code === 'auth/too-many-requests') {
        setPasswordError('Too many attempts. Please try again later.');
      } else {
        setPasswordError(error.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDataRetentionChange = async (newDataRetention: string) => {
    if (!user?.uid) {
      setDataRetentionError('No user found');
      return;
    }

    try {
      setDataRetentionError(null);
      setDataRetentionUpdating(true);
      
      await updateDataRetention(parseInt(newDataRetention));
    } catch (error: any) {
      console.error('Error updating data retention:', error);
      setDataRetentionError('Failed to update data retention setting. Please try again.');
    } finally {
      setDataRetentionUpdating(false);
    }
  };

  // helper for rendering a toggle switch
  const Toggle = ({
    enabled,
    onChange,
    label
  }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) => (
    <label className="flex items-center justify-between w-full">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`
          relative inline-flex items-center h-6 rounded-full w-11
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
        `}
      >
        <span
          className={`
            transform transition-transform
            inline-block w-5 h-5 bg-white rounded-full
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </label>
  );

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
      </header>

      {/* User Management */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center gap-2">
          <User className="h-5 w-5" />
          User Management
        </h2>
        
        {userLoading ? (
          <div className="text-gray-500 dark:text-gray-400">Loading user data...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Interviews Remaining</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{interviewsLeft}</p>
              </div>
              <div className="flex items-center gap-2">

              </div>
            </div>
          </div>
        )}
      </section>

      {/* Password Change */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </h2>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordError && (
            <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300 mr-2" />
                <p className="text-sm text-red-700 dark:text-red-200">{passwordError}</p>
              </div>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 dark:bg-green-900 border-l-4 border-green-400 dark:border-green-600 p-4 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 dark:text-green-300 mr-2" />
                <p className="text-sm text-green-700 dark:text-green-200">{passwordSuccess}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="current-password"
                  name="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="new-password"
                  name="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="confirm-new-password"
                  name="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Confirm your new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {passwordLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Changing password...
                </div>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Billing Management */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Billing Management
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Manage Your Subscription
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Access your secure billing portal to upgrade, downgrade, or cancel your subscription, 
              update payment methods, and view billing history.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Upgrade, downgrade, or cancel subscription</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Update payment methods</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-blue-700 dark:text-blue-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>View billing history and invoices</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <button
                onClick={handleOpenBillingPortal}
                disabled={portalLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening Portal...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Open Billing Portal
                  </>
                )}
              </button>
              
              {portalError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {portalError}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      {/* <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </h2>
        <div className="space-y-3">
          <Toggle
            label="Email Notifications"
            enabled={emailNotifications}
            onChange={setEmailNotifications}
          />
          <Toggle
            label="Desktop Notifications"
            enabled={desktopNotifications}
            onChange={setDesktopNotifications}
          />
        </div>
      </section> */}

      {/* Dashboard */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Dashboard Auto-Refresh
        </h2>
        <Toggle
          label="Enable Auto-Refresh"
          enabled={autoRefresh}
          onChange={setAutoRefresh}
        />

        {autoRefresh && (
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300">Interval:</span>
            <div className="relative inline-block">
              <select
                value={refreshInterval}
                onChange={(e) =>
                  setRefreshInterval(e.target.value as any)
                }
                className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
              >
                <option value="5s">5 seconds</option>
                <option value="15s">15 seconds</option>
                <option value="30s">30 seconds</option>
                <option value="60s">60 seconds</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
        )}
      </section>

      {/* Data Management */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Data Management
        </h2>
        
        {dataRetentionError && (
          <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300 mr-2" />
              <p className="text-sm text-red-700 dark:text-red-200">{dataRetentionError}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <span className="text-gray-700 dark:text-gray-300">Retention Period:</span>
          <div className="relative inline-block">
            <select
              value={dataRetention}
              onChange={(e) => handleDataRetentionChange(e.target.value)}
              disabled={dataRetentionUpdating}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
          {dataRetentionUpdating && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          )}
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose how long to keep your interview data. Data older than the selected period will be automatically deleted.
        </p>
      </section>
    </div>
  );
}

export default Settings;
