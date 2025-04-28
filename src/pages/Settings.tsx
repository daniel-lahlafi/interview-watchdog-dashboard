import React, { useState } from 'react'
import {
  ChevronDown,
  Sun,
  Moon,
  Bell,
  RefreshCw,
  Trash2
} from 'lucide-react'

function Settings() {
  // General
  const [darkMode, setDarkMode] = useState(false)

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [desktopNotifications, setDesktopNotifications] = useState(false)

  // Dashboard auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<'5s' | '15s' | '30s' | '60s'>('15s')

  // Data retention
  const [dataRetention, setDataRetention] = useState<'7d' | '30d' | '90d'>('30d')

  // helper for rendering a toggle switch
  const Toggle = ({
    enabled,
    onChange,
    label
  }: {
    enabled: boolean
    onChange: (v: boolean) => void
    label: string
  }) => (
    <label className="flex items-center justify-between w-full">
      <span className="text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`
          relative inline-flex items-center h-6 rounded-full w-11
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${enabled ? 'bg-blue-600' : 'bg-gray-300'}
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
  )

  return (
    <div className="p-8 space-y-8 max-w-2xl mx-auto">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </header>



      {/* Notifications */}
      <section className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
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
      <section className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
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
            <span className="text-gray-700">Interval:</span>
            <div className="relative inline-block">
              <select
                value={refreshInterval}
                onChange={(e) =>
                  setRefreshInterval(e.target.value as any)
                }
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      <section className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Data Management
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">Retention Period:</span>
          <div className="relative inline-block">
            <select
              value={dataRetention}
              onChange={(e) =>
                setDataRetention(e.target.value as any)
              }
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
  )
}

export default Settings
