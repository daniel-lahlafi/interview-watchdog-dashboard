
// App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Interviews from './pages/Interviews'
import InterviewDetails from './pages/InterviewDetails'
import Settings from './pages/Settings'
import CreateInterview from './pages/CreateInterview'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import OnboardingTutorial from './pages/OnboardingTutorial'
import FinishSignIn from './pages/FinishSignIn'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { OnboardingProvider } from './contexts/OnboardingContext'
import { UserProvider } from './contexts/UserContext'
import { ThemeProvider } from './contexts/ThemeContext' // Import ThemeProvider
import OnboardingManager from './components/OnboardingManager'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, hasPassword } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  // If user doesn't have a password set, redirect to password setup
  if (hasPassword === false) {
    return <Navigate to="/auth/finish-signin" />
  }

  return <>{children}</>
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <OnboardingProvider>
            <ThemeProvider> {/* Add ThemeProvider */}
              <OnboardingManager>
                <AppContent />
              </OnboardingManager>
            </ThemeProvider>
          </OnboardingProvider>
        </UserProvider>
      </AuthProvider>
    </Router>
  )
}

function AppContent() {
  const location = useLocation();
  
  // Define public routes that should not show the sidebar
  const publicRoutes = ['/login', '/onboarding', '/onboarding/tutorial', '/auth/finish-signin'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  
  if (isPublicRoute) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/tutorial" element={<OnboardingTutorial />} />
          <Route path="/auth/finish-signin" element={<FinishSignIn />} />
        </Routes>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/interviews"
            element={
              <PrivateRoute>
                <Interviews />
              </PrivateRoute>
            }
          />
          <Route
            path="/interviews/:id"
            element={
              <PrivateRoute>
                <InterviewDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-interview"
            element={
              <PrivateRoute>
                <CreateInterview />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          {/* Catch-all route to redirect to login if unauthenticated or dashboard if authenticated */}
          <Route 
            path="*" 
            element={
              <AuthRedirect />
            } 
          />
        </Routes>
      </div>
    </div>
  );
}

// Component to handle redirects based on authentication status
function AuthRedirect() {
  const { user, loading, hasPassword } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }

  // If user doesn't have a password set, redirect to password setup
  if (hasPassword === false) {
    return <Navigate to="/auth/finish-signin" />
  }
  
  return <Navigate to="/" />
}

export default App
