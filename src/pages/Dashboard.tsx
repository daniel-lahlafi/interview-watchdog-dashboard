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
      confirmed:  164,
      chartData: Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        interviews: Math.floor(Math.random() * 30) + 15,
        anomalies: Math.floor(Math.random() * 7) + 3,    // 3–9 anomalies/day
        confirmed: Math.floor(Math.random() * 5) + 2     // 2–6 confirmed/day
      }))
    },
    '90d': {
      interviews: 1893,
      anomalies: 550,
      confirmed: 467,
      chartData: Array.from({ length: 90 }, (_, i) => ({
        date: `Day ${i + 1}`,
        interviews: Math.floor(Math.random() * 30) + 15,
        anomalies: Math.floor(Math.random() * 9) + 4,    // 4–12 anomalies/day
        confirmed: Math.floor(Math.random() * 6) + 3     // 3–8 confirmed/day
      }))
    }
  }

  const currentStats = stats[timeframe]

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Dashboard Overview
          </h1>
          <div className="relative">
            <select
              value={timeframe}
              onChange={(e) =>
                setTimeframe(e.target.value as '7d' | '30d' | '90d')
              }
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Top-level stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Interviews
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentStats.interviews}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Anomalies Detected
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentStats.anomalies}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 rounded-full p-3">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Confirmed Cheating
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentStats.confirmed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 mt-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Interview Activity
            </h2>
            <div className="h-[400px]">
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

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Anomalies & Confirmed Cases
            </h2>
            <div className="h-[400px]">
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
