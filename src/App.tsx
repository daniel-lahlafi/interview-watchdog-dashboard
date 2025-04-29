// App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Interviews from './pages/Interviews'
import InterviewDetails from './pages/InterviewDetails'
import Settings from './pages/Settings'
import CreateInterview from './pages/CreateInterview'

function App() {
  return (
    <Router>
      <div className="flex flex-col md:flex-row h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/interviews/:id" element={<InterviewDetails />} />
            <Route
              path="/settings"
              element={<Settings/>}
            />
            <Route path="/create-interview" element={<CreateInterview />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
