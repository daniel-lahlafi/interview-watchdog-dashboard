import React, { useState } from 'react'
import { Users, AlertTriangle, Ban, ChevronDown } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

function Dashboard() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d')

  // Mock data for stats — increased anomalies & confirmed
  const stats = {
    '7d': {
      interviews: 123,
      anomalies: 45,
      confirmed: 32,
      chartData: [
        { date: 'Mon', interviews: 20, anomalies: 6, confirmed: 3 },
        { date: 'Tue', interviews: 25, anomalies: 7, confirmed: 4 },
        { date: 'Wed', interviews: 22, anomalies: 6, confirmed: 2 },
        { date: 'Thu', interviews: 28, anomalies: 8, confirmed: 3 },
        { date: 'Fri', interviews: 24, anomalies: 7, confirmed: 2 },
        { date: 'Sat', interviews: 18, anomalies: 5, confirmed: 1 },
        { date: 'Sun', interviews: 19, anomalies: 6, confirmed: 1 }
      ]
    },
    '30d': {
      interviews: 642,
      anomalies: 180,
      confirmed: 164,
      chartData: Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        interviews: Math.floor(Math.random() * 30) + 15,
        anomalies: Math.floor(Math.random() * 7) + 3,
        confirmed: Math.floor(Math.random() * 5) + 2
      }))
    },
    '90d': {
      interviews: 1893,
      anomalies: 550,
      confirmed: 467,
      chartData: Array.from({ length: 90 }, (_, i) => ({
        date: `Day ${i + 1}`,
        interviews: Math.floor(Math.random() * 30) + 15,
        anomalies: Math.floor(Math.random() * 9) + 4,
        confirmed: Math.floor(Math.random() * 6) + 3
      }))
    }
  }

  const currentStats = stats[timeframe]

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Dashboard Overview
          </h1>
          <div className="w-full sm:w-auto relative">
            <select
              value={timeframe}
              onChange={e =>
                setTimeframe(e.target.value as '7d' | '30d' | '90d')
              }
              className="w-full sm:w-auto appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 sm:p-8">
        {/* Top-level stats */}
        <div className="flex flex-wrap gap-4 sm:gap-6">
        {[
          {
            icon: <Users className="h-6 w-6 text-blue-600" />,
            label: 'Total Interviews',
            value: currentStats.interviews,
            bg: 'bg-blue-100'
          },
          {
            icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
            label: 'Anomalies Detected',
            value: currentStats.anomalies,
            bg: 'bg-yellow-100'
          },
          {
            icon: <Ban className="h-6 w-6 text-red-600" />,
            label: 'Confirmed Cheating',
            value: currentStats.confirmed,
            bg: 'bg-red-100'
          }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="
              w-full sm:flex-1
              bg-white rounded-xl border border-gray-200
              p-4 sm:p-6
              flex flex-col sm:flex-row items-center gap-4
              min-w-50
            "
          >
            <div className={`${stat.bg} rounded-full p-3 flex-shrink-0`}>
              {stat.icon}
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="text-sm font-medium text-gray-600">
                {stat.label}
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>



        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 gap-6">
          {/* Interview Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Interview Activity
            </h2>
            <div className="h-56 sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentStats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="interviews"
                    fillOpacity={0.1}
                    stroke="#2563eb"
                    fill="#3b82f6"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anomalies & Confirmed */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Anomalies & Confirmed Cases
            </h2>
            <div className="h-56 sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentStats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="anomalies"
                    stroke="#eab308"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="confirmed"
                    stroke="#dc2626"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
