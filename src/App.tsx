import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  Ban,
  Home,
  Settings,
  FileText,
  LogOut
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Interviews from './pages/Interviews'
import InterviewDetails from './pages/InterviewDetails'

function Sidebar() {
  const location = useLocation()
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 px-3 py-4 flex flex-col">
      <div className="flex items-center gap-2 px-3 mb-8 flex-col">
      <span className="font-semibold text-lg">Interview Watchdog</span>
      <span className="text-sm text-center">Protecting your technical interviews</span>
      </div>
      
      <nav className="flex-1">
        <div className="space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
              location.pathname === '/' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/interviews"
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
              location.pathname === '/interviews' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-5 w-5" />
            Interviews
          </Link>
          <Link
            to="/settings"
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
              location.pathname === '/settings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </nav>

      <div className="mt-auto">
        <a href="#" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
          <LogOut className="h-5 w-5" />
          Logout
        </a>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/interviews/:id" element={<InterviewDetails />} />
          <Route path="/settings" element={<div className="p-8">Settings Page (Coming Soon)</div>} />
        </Routes>
      </div>
    </Router>
  )
}

export default App