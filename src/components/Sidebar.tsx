// Sidebar.tsx
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, FileText, Settings, LogOut } from 'lucide-react'

const navItems = [
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
        <div className="px-4 py-6 flex items-center space-x-2">
          <span className="text-lg font-semibold">Interview Watchdog</span>
        </div>
        <div className="flex-1 px-2 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md
                  ${active
                    ? 'bg-blue-50 text-blue-700'
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
