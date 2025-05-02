// Sidebar.tsx
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, Settings, LogOut } from 'lucide-react'
import logo from '../assets/logo.png'

const navItems = [
  { to: '/create-interview', icon: <FileText className="h-5 w-5" />, label: 'Create Interview' },
  { to: '/', icon: <Home className="h-5 w-5" />, label: 'Dashboard' },
  { to: '/interviews', icon: <FileText className="h-5 w-5" />, label: 'Interviews' },
  { to: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
]

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <nav className="
      w-full bg-white border-b border-gray-200
      md:w-64 md:flex-shrink-0 md:border-r md:border-b-0
    ">
      {/* Mobile: horizontal */}
      <div className="flex justify-around md:hidden">
        {navItems.map(item => {
          const active = pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                flex flex-col items-center py-2 text-xs font-medium
                ${active ? 'text-blue-700' : 'text-gray-600 hover:text-gray-800'}
              `}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Desktop: vertical */}
      <div className="hidden md:flex md:flex-col h-full">
        <div className="px-4 py-6 flex items-center space-x-3">
          <img src={logo} alt="Interview Watchdog Logo" className="h-8 w-8" />
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Interview Watchdog
          </span>
        </div>
        <div className="flex-1 px-2 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.to
            const isCreateInterview = item.to === '/create-interview'
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md
                  ${isCreateInterview 
                    ? 'bg-black text-white hover:bg-gray-900 shadow-md' 
                    : active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'}
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="px-2 pb-4">
          <Link
            to="/logout"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Link>
        </div>
      </div>
    </nav>
  )
}
