import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import interviewService from '../firebase/services'
import { InterviewStatus } from '../firebase/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { AlertTriangle, CheckCircle, Ban, Clock } from 'lucide-react'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalInterviews: 0,
    cleanInterviews: 0,
    suspiciousInterviews: 0,
    cheatingInterviews: 0,
    notCompletedInterviews: 0,
    weeklyData: [] as { date: string; suspicious: number; cheating: number }[],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        if (!user?.uid) {
          throw new Error('User not authenticated')
        }
        
        // Fetch interviews for the current user as interviewer
        const userInterviews = await interviewService.getInterviewsByInterviewer(user.uid)

        // Calculate statistics
        const cleanCount = userInterviews.filter(
          interview => interview.status === InterviewStatus.Completed
        ).length

        const suspiciousCount = userInterviews.filter(
          interview => interview.status === InterviewStatus.SuspiciousActivity
        ).length

        const cheatingCount = userInterviews.filter(
          interview => interview.status === InterviewStatus.Cheating
        ).length

        const notCompletedCount = userInterviews.filter(
          interview => interview.status === InterviewStatus.NotCompleted
        ).length

        // Generate weekly data
        const weeklyData = generateWeeklyData(userInterviews)

        setStats({
          totalInterviews: userInterviews.length,
          cleanInterviews: cleanCount,
          suspiciousInterviews: suspiciousCount,
          cheatingInterviews: cheatingCount,
          notCompletedInterviews: notCompletedCount,
          weeklyData,
        })
      } catch (err) {
        setError('Failed to fetch dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const generateWeeklyData = (interviews: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      suspicious: interviews.filter(interview => 
        interview.date.split('T')[0] === date && 
        interview.status === InterviewStatus.SuspiciousActivity
      ).length,
      cheating: interviews.filter(interview => 
        interview.date.split('T')[0] === date && 
        interview.status === InterviewStatus.Cheating
      ).length,
    }))
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome back, {user?.email}
        </h1>
        <p className="text-gray-500">Here's your interview monitoring dashboard</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Pending Interviews
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.notCompletedInterviews}
          </p>
        </div>


        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Clean Interviews
            </h3>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {stats.cleanInterviews}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Suspicious Interviews
            </h3>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {stats.suspiciousInterviews}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Cheating Interviews
            </h3>
            <Ban className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {stats.cheatingInterviews}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Suspicious & Cheating Activity This Week
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="suspicious" name="Suspicious" fill="#EAB308" />
              <Bar dataKey="cheating" name="Cheating" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
