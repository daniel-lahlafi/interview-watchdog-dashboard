
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
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
import { AlertTriangle, CheckCircle, Ban, Clock, Calendar, Database, Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { generateMockData } from '../mock/dashboardMockData';

type TimePeriod = 'day' | 'week' | 'month' | 'year';

function Dashboard() {
  const { user } = useAuth();
  const { setShowInteractiveTour } = useOnboarding();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => {
    const saved = localStorage.getItem('dashboardTimePeriod');
    return saved ? (saved as TimePeriod) : 'week';
  });
  const [stats, setStats] = useState({
    totalInterviews: 0,
    cleanInterviews: 0,
    suspiciousInterviews: 0,
    cheatingInterviews: 0,
    notCompletedInterviews: 0,
    completedInterviews: 0,
    expiredInterviews: 0,
    weeklyData: [] as { date: string; completed: number; suspicious: number; cheating: number; expired: number }[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMockData, setLoadingMockData] = useState(false);
  const [mockDataLoaded, setMockDataLoaded] = useState(false);
  const [mockDataButtonHidden, setMockDataButtonHidden] = useState(false);

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

        const expiredCount = filteredInterviews.filter(
          interview => getEffectiveInterviewStatus(interview) === InterviewStatus.Expired
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
          expiredInterviews: expiredCount,
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
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const endOfWeek = new Date(startOfDay);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const startOfMonth = new Date(startOfDay);
    startOfMonth.setDate(startOfDay.getDate() - 28); // 4 weeks ago

    const startOfYear = new Date(startOfDay);
    startOfYear.setMonth(startOfYear.getMonth() - 12); // 12 months ago

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
      } else if (period === 'month') {
        return interviewDateTime >= startOfMonth && interviewDateTime <= now;
      } else if (period === 'year') {
        return interviewDateTime >= startOfYear && interviewDateTime <= now;
      }
      return true;
    });
  };

  const generateTimePeriodData = (interviews: any[], period: TimePeriod) => {
    if (period === 'month') {
      // Generate 4 weeks of data for month view
      const weeks = Array.from({ length: 4 }, (_, i) => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - (i * 7) - 6); // Start from 4 weeks ago
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        return { start: startOfWeek, end: endOfWeek };
      }).reverse();

      return weeks.map((week, index) => {
        const weekNumber = weeks.length - index;
        const weekStart = week.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const weekEnd = week.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return {
          date: `Week ${weekNumber} (${weekStart}-${weekEnd})`,
          completed: interviews.filter(interview => {
            const interviewDate = getInterviewDateTime(interview);
            return interviewDate >= week.start && interviewDate <= week.end && 
                   getEffectiveInterviewStatus(interview) !== InterviewStatus.Live && getEffectiveInterviewStatus(interview) !== InterviewStatus.Expired;
          }).length,
          suspicious: interviews.filter(interview => {
            const interviewDate = getInterviewDateTime(interview);
            return interviewDate >= week.start && interviewDate <= week.end && 
                   getEffectiveInterviewStatus(interview) === InterviewStatus.SuspiciousActivity;
          }).length,
          cheating: interviews.filter(interview => {
            const interviewDate = getInterviewDateTime(interview);
            return interviewDate >= week.start && interviewDate <= week.end && 
                   getEffectiveInterviewStatus(interview) === InterviewStatus.Cheating;
          }).length,
          expired: interviews.filter(interview => {
            const interviewDate = getInterviewDateTime(interview);
            return interviewDate >= week.start && interviewDate <= week.end && 
                   getEffectiveInterviewStatus(interview) === InterviewStatus.Expired;
          }).length,
        };
      });
    }

    if (period === 'year') {
      // Generate 12 months of data for year view
      const months = Array.from({ length: 12 }, (_, i) => {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - (11 - i)); // Start from 12 months ago
        return monthDate;
      });

      return months.map(month => {
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        return {
          date: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          completed: interviews.filter(interview => {
            const interviewDate = getInterviewDateTime(interview);
            return interviewDate >= monthStart && interviewDate <= monthEnd && 
                   getEffectiveInterviewStatus(interview) !== InterviewStatus.Live && getEffectiveInterviewStatus(interview) !== InterviewStatus.Expired;
          }).length,
          suspicious: interviews.filter(interview => {
            const interviewDate = getInterviewDateTime(interview);
            return interviewDate >= monthStart && interviewDate <= monthEnd && 
                   getEffectiveInterviewStatus(interview) === InterviewStatus.SuspiciousActivity;
          }).length,
          cheating: interviews.filter(interview => {
            const interviewDate = getInterviewDateTime(interview);
            return interviewDate >= monthStart && interviewDate <= monthEnd && 
                   getEffectiveInterviewStatus(interview) === InterviewStatus.Cheating;
          }).length,
          expired: interviews.filter(interview => {
            const interviewDate = getInterviewDateTime(interview);
            return interviewDate >= monthStart && interviewDate <= monthEnd && 
                   getEffectiveInterviewStatus(interview) === InterviewStatus.Expired;
          }).length,
        };
      });
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
      completed: interviews.filter(interview => {
        const interviewDate = getInterviewDateTime(interview);
        return interviewDate.toISOString().split('T')[0] === date && 
        getEffectiveInterviewStatus(interview) !== InterviewStatus.Live && getEffectiveInterviewStatus(interview) !== InterviewStatus.Expired;
      }).length,
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
      expired: interviews.filter(interview => {
        const interviewDate = getInterviewDateTime(interview);
        return interviewDate.toISOString().split('T')[0] === date && 
               getEffectiveInterviewStatus(interview) === InterviewStatus.Expired;
      }).length,
    }));
  };

  const handleCardClick = (filter: string) => {
    navigate(`/interviews${filter ? `?status=${filter}` : ''}`);
  };

  const loadMockData = async () => {
    try {
      setLoadingMockData(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockInterviews = generateMockData(timePeriod);
      
      const cleanCount = mockInterviews.filter(
        interview => getEffectiveInterviewStatus(interview) === InterviewStatus.Completed
      ).length;

      const suspiciousCount = mockInterviews.filter(
        interview => getEffectiveInterviewStatus(interview) === InterviewStatus.SuspiciousActivity
      ).length;

      const cheatingCount = mockInterviews.filter(
        interview => getEffectiveInterviewStatus(interview) === InterviewStatus.Cheating
      ).length;

      const notCompletedCount = mockInterviews.filter(
        interview => getEffectiveInterviewStatus(interview) === InterviewStatus.NotCompleted
      ).length;

      const expiredCount = mockInterviews.filter(
        interview => getEffectiveInterviewStatus(interview) === InterviewStatus.Expired
      ).length;

      const completedCount = cleanCount + suspiciousCount + cheatingCount;

      const chartData = generateTimePeriodData(mockInterviews, timePeriod);

      setStats({
        totalInterviews: mockInterviews.length,
        cleanInterviews: cleanCount,
        suspiciousInterviews: suspiciousCount,
        cheatingInterviews: cheatingCount,
        notCompletedInterviews: notCompletedCount,
        completedInterviews: completedCount,
        expiredInterviews: expiredCount,
        weeklyData: chartData,
      });
      
      setMockDataLoaded(true);
      setMockDataButtonHidden(true); // Hide the button after loading
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setMockDataLoaded(false);
      }, 3000);
      
    } catch (err) {
      setError('Failed to load mock data');
      console.error(err);
    } finally {
      setLoadingMockData(false);
    }
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
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
              <div className="flex items-center space-x-2">
                {/* {!mockDataButtonHidden && (
                  <button
                    onClick={loadMockData}
                    disabled={loadingMockData}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 dark:border-blue-700"
                    title="Load mock data for development purposes"
                  >
                    {loadingMockData ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                    <span>{loadingMockData ? 'Loading...' : 'Load Mock Data'}</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">DEV</span>
                  </button>
                )} */}
                {mockDataLoaded && (
                  <div className="flex items-center space-x-1 px-2 py-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <CheckCircle className="h-3 w-3" />
                    <span>Mock data loaded!</span>
                  </div>
                )}
              </div>
            </div>
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
                onClick={() => setTimePeriod('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  timePeriod === 'month'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setTimePeriod('year')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  timePeriod === 'year'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                Year
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Interviews</h3>
              <Clock className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.notCompletedInterviews}</p>
          </div>

          <div
            onClick={() => handleCardClick(InterviewStatus.Expired)}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Expired Interviews</h3>
              <Clock className="h-6 w-6 text-gray-500" />
            </div>
             <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.expiredInterviews}</p>
          </div>
        </div>
        

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Interview Activity Overview {timePeriod === 'day' ? 'Today' : timePeriod === 'week' ? 'This Week' : timePeriod === 'month' ? 'This Month' : 'This Year'}
            </h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-96 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats.weeklyData}
                margin={{ top: 30, right: 40, left: 30, bottom: 30 }}
                barCategoryGap="35%"
                barGap={8}
              >
                <CartesianGrid 
                  strokeDasharray="1 3" 
                  stroke={theme === 'dark' ? '#4B5563' : '#E5E7EB'} 
                  strokeOpacity={0.4}
                  vertical={true}
                  horizontal={true}
                />
                <XAxis 
                  dataKey="date" 
                  tick={{ 
                    fill: theme === 'dark' ? '#D1D5DB' : '#374151',
                    fontSize: 13,
                    fontWeight: 600,
                    textAnchor: 'middle'
                  }}
                  axisLine={{ 
                    stroke: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    strokeWidth: 2
                  }}
                  tickLine={{ 
                    stroke: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    strokeWidth: 2
                  }}
                  interval={0}
                  height={60}
                  tickMargin={12}
                />
                <YAxis 
                  tick={{ 
                    fill: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    fontSize: 12,
                    fontWeight: 500
                  }}
                  axisLine={{ 
                    stroke: theme === 'dark' ? '#4B5563' : '#D1D5DB',
                    strokeWidth: 2
                  }}
                  tickLine={{ 
                    stroke: theme === 'dark' ? '#4B5563' : '#D1D5DB',
                    strokeWidth: 2
                  }}
                  tickCount={6}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: `2px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    borderRadius: '12px',
                    boxShadow: theme === 'dark' 
                      ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
                      : '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    padding: '12px 16px'
                  }}
                  labelStyle={{ 
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontWeight: 700,
                    fontSize: 15,
                    marginBottom: '8px'
                  }}
                  itemStyle={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}
                  separator=": "
                />
                <Legend 
                  wrapperStyle={{ 
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: 15,
                    fontWeight: 600,
                    paddingTop: 25,
                    paddingBottom: 10
                  }} 
                />
                <Bar 
                  dataKey="completed" 
                  name="Completed" 
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  stroke="#059669"
                  strokeWidth={2}
                />
                <Bar 
                  dataKey="suspicious" 
                  name="Suspicious" 
                  fill="#EAB308"
                  radius={[6, 6, 0, 0]}
                  stroke="#D97706"
                  strokeWidth={2}
                />
                <Bar 
                  dataKey="cheating" 
                  name="Cheating" 
                  fill="#EF4444"
                  radius={[6, 6, 0, 0]}
                  stroke="#DC2626"
                  strokeWidth={2}
                />
                <Bar 
                  dataKey="expired" 
                  name="Expired" 
                  fill="#6B7280"
                  radius={[6, 6, 0, 0]}
                  stroke="#4B5563"
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
