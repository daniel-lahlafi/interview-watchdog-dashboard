import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import interviewService from '../firebase/services'
import { InterviewStatus } from '../firebase/types'
import { useNavigate } from 'react-router-dom'
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
import { AlertTriangle, CheckCircle, Ban, Clock, Calendar } from 'lucide-react'

type TimePeriod = 'day' | 'week' | 'all'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => {
    const saved = localStorage.getItem('dashboardTimePeriod')
    return (saved as TimePeriod) || 'week'
  })
  const [stats, setStats] = useState({
    totalInterviews: 0,
    cleanInterviews: 0,
    suspiciousInterviews: 0,
    cheatingInterviews: 0,
    notCompletedInterviews: 0,
    completedInterviews: 0,
    weeklyData: [] as { date: string; suspicious: number; cheating: number }[],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem('dashboardTimePeriod', timePeriod)
  }, [timePeriod])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        if (!user?.uid) {
          throw new Error('User not authenticated')
        }
        
        const userInterviews = await interviewService.getInterviewsByInterviewer(user.uid)
        
        // Filter interviews based on time period
        const filteredInterviews = filterInterviewsByTimePeriod(userInterviews, timePeriod)

        const cleanCount = filteredInterviews.filter(
          interview => interview.status === InterviewStatus.Completed
        ).length

        const suspiciousCount = filteredInterviews.filter(
          interview => interview.status === InterviewStatus.SuspiciousActivity
        ).length

        const cheatingCount = filteredInterviews.filter(
          interview => interview.status === InterviewStatus.Cheating
        ).length

        const notCompletedCount = filteredInterviews.filter(
          interview => interview.status === InterviewStatus.NotCompleted
        ).length

        const completedCount = cleanCount + suspiciousCount + cheatingCount

        const chartData = generateTimePeriodData(filteredInterviews, timePeriod)

        setStats({
          totalInterviews: filteredInterviews.length,
          cleanInterviews: cleanCount,
          suspiciousInterviews: suspiciousCount,
          cheatingInterviews: cheatingCount,
          notCompletedInterviews: notCompletedCount,
          completedInterviews: completedCount,
          weeklyData: chartData,
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
  }, [user, timePeriod])

  const getInterviewDateTime = (interview: any) => {
    const { startDate, startTime, timezone } = interview
    const dateTimeStr = `${startDate}T${startTime}`
    return new Date(dateTimeStr)
  }

  const filterInterviewsByTimePeriod = (interviews: any[], period: TimePeriod) => {
    if (period === 'all') return interviews

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    const endOfWeek = new Date(startOfDay)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    return interviews.filter(interview => {
      const interviewDateTime = getInterviewDateTime(interview)
      
      if (period === 'day') {
        return interviewDateTime >= startOfDay && interviewDateTime < endOfDay
      } else if (period === 'week') {
        return interviewDateTime >= startOfDay && interviewDateTime < endOfWeek
      }
      return true
    })
  }

  const generateTimePeriodData = (interviews: any[], period: TimePeriod) => {
    if (period === 'all') {
      // For "all" view, show last 7 days regardless of interview dates
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      return last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        suspicious: interviews.filter(interview => {
          const interviewDate = getInterviewDateTime(interview)
          return interviewDate.toISOString().split('T')[0] === date && 
                 interview.status === InterviewStatus.SuspiciousActivity
        }).length,
        cheating: interviews.filter(interview => {
          const interviewDate = getInterviewDateTime(interview)
          return interviewDate.toISOString().split('T')[0] === date && 
                 interview.status === InterviewStatus.Cheating
        }).length,
      }))
    }

    const days = period === 'day' ? 1 : 7
    const timePoints = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    return timePoints.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { 
        weekday: 'short',
        ...(period === 'day' && { hour: 'numeric' })
      }),
      suspicious: interviews.filter(interview => {
        const interviewDate = getInterviewDateTime(interview)
        return interviewDate.toISOString().split('T')[0] === date && 
               interview.status === InterviewStatus.SuspiciousActivity
      }).length,
      cheating: interviews.filter(interview => {
        const interviewDate = getInterviewDateTime(interview)
        return interviewDate.toISOString().split('T')[0] === date && 
               interview.status === InterviewStatus.Cheating
      }).length,
    }))
  }

  const handleCardClick = (status: InterviewStatus | 'all') => {
    navigate('/interviews', { state: { filter: status } })
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

      <div className="flex justify-end mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setTimePeriod('day')}
            className={`px-4 py-2 rounded-md ${
              timePeriod === 'day'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setTimePeriod('week')}
            className={`px-4 py-2 rounded-md ${
              timePeriod === 'week'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimePeriod('all')}
            className={`px-4 py-2 rounded-md ${
              timePeriod === 'all'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div 
          className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick('all')}
        >
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Total Interviews
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalInterviews}
          </p>
        </div>

        <div 
          className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick(InterviewStatus.NotCompleted)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Pending Interviews
            </h3>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {stats.notCompletedInterviews}
          </p>
        </div>

        <div 
          className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick(InterviewStatus.Completed)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Completed Interviews
            </h3>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {stats.completedInterviews}
          </p>
        </div>

        <div 
          className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick(InterviewStatus.SuspiciousActivity)}
        >
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

        <div 
          className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleCardClick(InterviewStatus.Cheating)}
        >
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Suspicious & Cheating Activity {timePeriod === 'day' ? 'Today' : timePeriod === 'week' ? 'This Week' : 'All Time'}
          </h3>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
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
