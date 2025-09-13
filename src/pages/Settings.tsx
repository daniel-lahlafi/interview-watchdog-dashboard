
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
  Minus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { initializeUserData, updateUserInterviewCount } from '../utils/userInitializer';
import { useTheme } from '../contexts/ThemeContext';

function Settings() {
  const { user } = useAuth();
  const { interviewsLeft, loading: userLoading, refreshInterviewCount } = useUser();
  const { theme, toggleTheme } = useTheme();
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(false);

  // Dashboard auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<'5s' | '15s' | '30s' | '60s'>('15s');

  // Data retention
  const [dataRetention, setDataRetention] = useState<'7d' | '30d' | '90d'>('30d');

  // User management
  const [initializing, setInitializing] = useState(false);
  const [updating, setUpdating] = useState(false);

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

  const handleUpdateInterviewCount = async (newCount: number) => {
    if (!user?.email) return;
    
    setUpdating(true);
    try {
      await updateUserInterviewCount(user.email, newCount);
      await refreshInterviewCount();
    } catch (error) {
      console.error('Error updating interview count:', error);
    } finally {
      setUpdating(false);
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
                <button
                  onClick={() => handleUpdateInterviewCount(interviewsLeft - 1)}
                  disabled={updating || interviewsLeft <= 0}
                  className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleUpdateInterviewCount(interviewsLeft + 1)}
                  disabled={updating}
                  className="p-2 text-gray-500 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleInitializeUser}
                disabled={initializing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {initializing ? 'Initializing...' : 'Initialize User (10 interviews)'}
              </button>
              
              <button
                onClick={() => handleUpdateInterviewCount(10)}
                disabled={updating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {updating ? 'Updating...' : 'Reset to 10'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
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
      </section>

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
        <div className="flex items-center gap-4">
          <span className="text-gray-700 dark:text-gray-300">Retention Period:</span>
          <div className="relative inline-block">
            <select
              value={dataRetention}
              onChange={(e) =>
                setDataRetention(e.target.value as any)
              }
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
            >
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Settings;
