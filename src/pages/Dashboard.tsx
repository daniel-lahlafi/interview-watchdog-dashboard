
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import interviewService from '../firebase/services';
import { getEffectiveInterviewStatus, InterviewStatus } from '../firebase/types';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { AlertTriangle, CheckCircle, Ban, Clock, Calendar } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

type TimePeriod = 'day' | 'week' | 'all';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => {
    const saved = localStorage.getItem('dashboardTimePeriod');
    return (saved as TimePeriod) || 'week';
  });
  const [stats, setStats] = useState({
    totalInterviews: 0,
    cleanInterviews: 0,
    suspiciousInterviews: 0,
    cheatingInterviews: 0,
    notCompletedInterviews: 0,
    completedInterviews: 0,
    weeklyData: [] as { date: string; suspicious: number; cheating: number }[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('dashboardTimePeriod', timePeriod);
  }, [timePeriod]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (!user?.uid) {
          throw new Error('User not authenticated');
        }
        
        const userInterviews = await interviewService.getInterviewsByInterviewer(user.uid);
        
        const filteredInterviews = filterInterviewsByTimePeriod(userInterviews, timePeriod);

        const cleanCount = filteredInterviews.filter(
          interview => getEffectiveInterviewStatus(interview) === InterviewStatus.Completed
        ).length;

        const suspiciousCount = filteredInterviews.filter(
          interview => getEffectiveInterviewStatus(interview) === InterviewStatus.SuspiciousActivity
        ).length;

        const cheatingCount = filteredInterviews.filter(
          interview => getEffectiveInterviewStatus(interview) === InterviewStatus.Cheating
        ).length;

        const notCompletedCount = filteredInterviews.filter(
          interview => getEffectiveInterviewStatus(interview) === InterviewStatus.NotCompleted
        ).length;

        const completedCount = cleanCount + suspiciousCount + cheatingCount;

        const chartData = generateTimePeriodData(filteredInterviews, timePeriod);

        setStats({
          totalInterviews: filteredInterviews.length,
          cleanInterviews: cleanCount,
          suspiciousInterviews: suspiciousCount,
          cheatingInterviews: cheatingCount,
          notCompletedInterviews: notCompletedCount,
          completedInterviews: completedCount,
          weeklyData: chartData,
        });
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, timePeriod]);

  const getInterviewDateTime = (interview: any) => {
    const { startDate, startTime, timezone } = interview;
    const dateTimeStr = `${startDate}T${startTime}:00`;
    const date = new Date(dateTimeStr);
    return date;
  };

  const filterInterviewsByTimePeriod = (interviews: any[], period: TimePeriod) => {
    if (period === 'all') return interviews;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const endOfWeek = new Date(startOfDay);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return interviews.filter(interview => {
      const interviewDateTime = getInterviewDateTime(interview);
      
      if (period === 'day') {
        const interviewDate = new Date(interviewDateTime.getFullYear(), interviewDateTime.getMonth(), interviewDateTime.getDate());
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return interviewDate.getTime() === today.getTime();
      } else if (period === 'week') {
        const sevenDaysAgo = new Date(startOfDay);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return interviewDateTime >= sevenDaysAgo && interviewDateTime < endOfWeek;
      }
      return true;
    });
  };

  const generateTimePeriodData = (interviews: any[], period: TimePeriod) => {
    if (period === 'all') {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      return last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        suspicious: interviews.filter(interview => {
          const interviewDate = getInterviewDateTime(interview);
          return interviewDate.toISOString().split('T')[0] === date && 
                 getEffectiveInterviewStatus(interview) === InterviewStatus.SuspiciousActivity;
        }).length,
        cheating: interviews.filter(interview => {
          const interviewDate = getInterviewDateTime(interview);
          return interviewDate.toISOString().split('T')[0] === date && 
                 getEffectiveInterviewStatus(interview) === InterviewStatus.Cheating;
        }).length,
      }));
    }

    const days = period === 'day' ? 1 : 7;
    const timePoints = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return timePoints.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { 
        weekday: 'short',
        ...(period === 'day' && { hour: 'numeric' })
      }),
      suspicious: interviews.filter(interview => {
        const interviewDate = getInterviewDateTime(interview);
        return interviewDate.toISOString().split('T')[0] === date && 
               getEffectiveInterviewStatus(interview) === InterviewStatus.SuspiciousActivity;
      }).length,
      cheating: interviews.filter(interview => {
        const interviewDate = getInterviewDateTime(interview);
        return interviewDate.toISOString().split('T')[0] === date && 
               getEffectiveInterviewStatus(interview) === InterviewStatus.Cheating;
      }).length,
    }));
  };

  const handleCardClick = (filter: string) => {
    navigate(`/interviews${filter ? `?status=${filter}` : ''}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-8 bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setTimePeriod('day')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  timePeriod === 'day'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimePeriod('week')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  timePeriod === 'week'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimePeriod('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  timePeriod === 'all'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            onClick={() => handleCardClick(InterviewStatus.Completed)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Completed Interviews</h3>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.completedInterviews}</p>
          </div>
          <div
            onClick={() => handleCardClick(InterviewStatus.SuspiciousActivity)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Suspicious Activity</h3>
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.suspiciousInterviews}</p>
          </div>
          <div
            onClick={() => handleCardClick(InterviewStatus.Cheating)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cheating Detected</h3>
              <Ban className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.cheatingInterviews}</p>
          </div>
          <div
            onClick={() => handleCardClick(InterviewStatus.NotCompleted)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Not Completed</h3>
              <Clock className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.notCompletedInterviews}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Suspicious & Cheating Activity {timePeriod === 'day' ? 'Today' : timePeriod === 'week' ? 'This Week' : 'All Time'}
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#4A5568' : '#E2E8F0'} />
                <XAxis dataKey="date" tick={{ fill: theme === 'dark' ? '#A0AEC0' : '#4A5568' }} />
                <YAxis tick={{ fill: theme === 'dark' ? '#A0AEC0' : '#4A5568' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#2D3748' : '#FFFFFF',
                    borderColor: theme === 'dark' ? '#4A5568' : '#E2E8F0',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000'
                  }}
                  labelStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }}
                />
                <Legend wrapperStyle={{ color: theme === 'dark' ? '#FFFFFF' : '#000000' }} />
                <Bar dataKey="suspicious" name="Suspicious" fill="#EAB308" />
                <Bar dataKey="cheating" name="Cheating" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
