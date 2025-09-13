
// Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Settings, LogOut, Plus, Users, BarChart3, Sun, Moon, AlertTriangle, X } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';

const navItems = [
  { to: '/create-interview', icon: <Plus className="h-5 w-5" />, label: 'Create Interview' },
  { to: '/', icon: <BarChart3 className="h-5 w-5" />, label: 'Dashboard' },
  { to: '/interviews', icon: <Users className="h-5 w-5" />, label: 'Interviews' },
  { to: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const { interviewsLeft, loading } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await handleLogout();
  };

  return (
    <nav className="
      w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700
      md:w-64 md:flex-shrink-0 md:border-r md:border-b-0
    ">
      {/* Mobile: horizontal */}
      <div className="flex justify-around md:hidden">
        {navItems.map(item => {
          const active = pathname === item.to;
          const isCreateInterview = item.to === '/create-interview';
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                flex flex-col items-center py-3 px-2 text-xs font-medium transition-colors relative
                ${active 
                  ? 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-gray-700 border-b-2 border-blue-700 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              {item.icon}
              <span className="mt-1 text-center">{item.label}</span>
              {isCreateInterview && !loading && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {interviewsLeft}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Desktop: vertical */}
      <div className="hidden md:flex md:flex-col h-full">
        <div className="px-6 py-6 flex items-center space-x-3 border-b border-gray-100 dark:border-gray-700">
          <img src={logo} alt="Interview Watchdog Logo" className="h-8 w-8" />
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
            Interview Watchdog
          </span>
        </div>
        <div className="flex-1 px-3 py-4 space-y-2">
          {navItems.map(item => {
            const active = pathname === item.to;
            const isCreateInterview = item.to === '/create-interview';
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative
                  ${isCreateInterview 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg transform hover:scale-105' 
                    : active
                      ? 'bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-blue-400 border-l-4 border-blue-700 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <div className={`
                  ${isCreateInterview ? 'text-white' : active ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
                `}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
                {isCreateInterview && !loading && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                    {interviewsLeft}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <div className="px-3 pb-6 border-t border-gray-100 dark:border-gray-700 pt-4">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-400 rounded-lg transition-colors mt-2"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Confirm Logout
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to log out?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex space-x-3 p-6">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
