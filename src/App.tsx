// App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Interviews from './pages/Interviews'
import InterviewDetails from './pages/InterviewDetails'
import Settings from './pages/Settings'
import CreateInterview from './pages/CreateInterview'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'

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

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col md:flex-row h-screen bg-gray-50">
          <Sidebar />

          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/login" element={<Login />} />
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
