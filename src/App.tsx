// App.tsx
import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Interviews from './pages/Interviews'
import InterviewDetails from './pages/InterviewDetails'
import Settings from './pages/Settings'
import CreateInterview from './pages/CreateInterview'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Simple version component that only returns the version text
function DesktopVersionRoute() {
  useEffect(() => {
    // Clear any existing content
    document.body.innerHTML = '';
    
    // Set plain styling to avoid any React formatting
    document.body.style.cssText = 'white-space: pre; font-family: monospace; padding: 0; margin: 0;';
    
    // Add plain text version number
    document.body.appendChild(document.createTextNode('1.0.0'));
    
    // Clear the title
    document.title = '';
  }, []);
  
  return null;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

// Layout component with sidebar
function AppLayout() {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public route for desktop version - special handling */}
          <Route path="/desktop-version" element={<DesktopVersionRoute />} />
          
          {/* Login route - needs auth but no sidebar */}
          <Route path="/login" element={<Login />} />
          
          {/* Routes with sidebar layout */}
          <Route element={<AppLayout />}>
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
          </Route>
          
          {/* Catch-all route */}
          <Route 
            path="*" 
            element={<AuthRedirect />} 
          />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

// Component to handle redirects based on authentication status
function AuthRedirect() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return user ? <Navigate to="/" /> : <Navigate to="/login" />
}

export default App
