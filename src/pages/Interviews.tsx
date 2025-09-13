
import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  Eye, 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  Clock, 
  Radio, 
  Search,
  Filter,
  Calendar,
  MoreVertical,
  CheckSquare,
  Trash2,
  Users,
  FileText,
  Calendar as CalendarIcon,
  Mail,
  CalendarDays,
  Clock as ClockIcon
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import interviewService from '../firebase/services';
import type { Interview } from '../firebase/types';
import { InterviewStatus, getEffectiveInterviewStatus } from '../firebase/types';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';

type SortField = 'date' | 'candidate' | 'position' | 'status';
type SortOrder = 'asc' | 'desc';

// Helper function to get timezone abbreviation
const getTimezoneAbbreviation = (timezone: string): string => {
  if (!timezone) return '';
  try {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: timezone, timeZoneName: 'short' };
    const timeString = date.toLocaleString('en-US', options);
    const abbreviation = timeString.split(' ').pop() || '';
    return abbreviation;
  } catch (error) {
    return '';
  }
};

// Update the calculateEndTime function to use 24-hour format
const calculateEndTime = (startDate: string, startTime: string, duration: string, timezone: string): { date: string, time: string } => {
  if (!startDate || !startTime || !duration) return { date: '', time: '' };
  
  const [hours, minutes] = startTime.split(':').map(Number);
  const durationMinutes = parseInt(duration, 10);
  
  const endDate = new Date(startDate);
  endDate.setHours(hours, minutes + durationMinutes, 0);
  
  return {
    date: endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    time: endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
};

// Add helper function to format date and time consistently
const formatDateTime = (date: string, time: string): { date: string, time: string } => {
  if (!date || !time) return { date: '', time: '' };
  
  const dateObj = new Date(date);
  return {
    date: dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    time: time
  };
};

// Helper function to format duration
const formatDuration = (duration: string): string => {
  if (!duration) return '-';
  const minutes = parseInt(duration, 10);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  return `${minutes} min`;
};

// Helper function to get status properties
const getStatusProps = (interview: Interview) => {
  const effectiveStatus = getEffectiveInterviewStatus(interview);
  
  switch (effectiveStatus) {
    case InterviewStatus.NotCompleted:
      return {
        label: 'Not Completed',
        bg: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-600',
        Icon: Clock
      };
    case InterviewStatus.SuspiciousActivity:
      return {
        label: 'Suspicious Activity',
        bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-700',
        Icon: AlertTriangle
      };
    case InterviewStatus.Cheating:
      return {
        label: 'Cheating',
        bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        border: 'border-red-200 dark:border-red-700',
        Icon: Ban
      };
    case InterviewStatus.Completed:
      return {
        label: 'Completed',
        bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        border: 'border-green-200 dark:border-green-700',
        Icon: CheckCircle
      };
    case InterviewStatus.Live:
      return {
        label: 'Live Now',
        bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-700',
        Icon: Radio
      };
    case InterviewStatus.Expired:
      return {
        label: 'Expired',
        bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-700',
        Icon: Clock
      };
    default:
      return {
        label: 'Not Completed',
        bg: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-600',
        Icon: Clock
      };
  }
};

// Mobile Card Component
const InterviewCard = ({ interview, onView }: { interview: Interview; onView: (id: string) => void }) => {
  const { label, bg, Icon } = getStatusProps(interview);
  const isCheating = getEffectiveInterviewStatus(interview) === InterviewStatus.Cheating;
  const isSuspicious = getEffectiveInterviewStatus(interview) === InterviewStatus.SuspiciousActivity;
  
  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-lg border p-4 mb-4 cursor-pointer transition-all hover:shadow-md
        ${isCheating ? 'border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900' : ''}
        ${isSuspicious ? 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900' : ''}
        ${!isCheating && !isSuspicious ? 'border-gray-200 dark:border-gray-700' : ''}
      `}
      onClick={() => onView(interview.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{interview.candidate}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">{interview.position}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${bg} flex items-center space-x-1`}>
          <Icon className="h-3 w-3" />
          <span>{label}</span>
        </span>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Mail className="h-3 w-3" />
          <span>{interview.intervieweeEmail}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <FileText className="h-3 w-3" />
          <span className="font-mono">{interview.accessCode}</span>
        </div>
        
        {interview.startDate && interview.startTime && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <CalendarDays className="h-3 w-3" />
            <span>
              {(() => {
                const { date, time } = formatDateTime(interview.startDate, interview.startTime);
                return `${date} at ${time}`;
              })()}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <ClockIcon className="h-3 w-3" />
          <span>{formatDuration(interview.duration)}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(interview.id);
          }}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium flex items-center gap-1"
        >
          <Eye className="h-3 w-3" />
          View Details
        </button>
      </div>
    </div>
  );
};

function Interviews() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { interviewsLeft, loading: userLoading } = useUser();
  
  const initialStatus = searchParams.get('status') as InterviewStatus | null;
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | 'all'>(initialStatus || 'all');

  useEffect(() => {
    if (statusFilter === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', statusFilter);
    }
    setSearchParams(searchParams);
  }, [statusFilter, searchParams, setSearchParams]);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const data = await interviewService.getInterviewsByInterviewer(user?.uid ?? '');
        setInterviews(data);
      } catch (err) {
        setError('Failed to fetch interviews');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const goToDetail = (id: string) => {
    navigate(`/interviews/${id}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAndSortedInterviews = interviews
    .filter(interview => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        interview.candidate.toLowerCase().includes(searchLower) ||
        interview.position.toLowerCase().includes(searchLower) ||
        interview.intervieweeEmail?.toLowerCase().includes(searchLower) ||
        interview.accessCode?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === 'all' || getEffectiveInterviewStatus(interview) === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const statusA = getEffectiveInterviewStatus(a);
      const statusB = getEffectiveInterviewStatus(b);
      
      const isIncompleteA = statusA === InterviewStatus.NotCompleted || statusA === InterviewStatus.Live;
      const isIncompleteB = statusB === InterviewStatus.NotCompleted || statusB === InterviewStatus.Live;
      
      if (isIncompleteA && !isIncompleteB) return -1;
      if (!isIncompleteA && isIncompleteB) return 1;
      
      if (a.startDate && a.startTime && b.startDate && b.startTime) {
        const dateA = new Date(`${a.startDate}T${a.startTime}`);
        const dateB = new Date(`${b.startDate}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      }
      
      if (a.startDate && a.startTime) return -1;
      if (b.startDate && b.startTime) return 1;
      
      return 0;
    });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInterviews = filteredAndSortedInterviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedInterviews.length / itemsPerPage);

  const summaryStats = {
    total: filteredAndSortedInterviews.length,
    completed: filteredAndSortedInterviews.filter(i => getEffectiveInterviewStatus(i) === InterviewStatus.Completed).length,
    cheating: filteredAndSortedInterviews.filter(i => getEffectiveInterviewStatus(i) === InterviewStatus.Cheating).length,
    suspicious: filteredAndSortedInterviews.filter(i => getEffectiveInterviewStatus(i) === InterviewStatus.SuspiciousActivity).length,
    expired: filteredAndSortedInterviews.filter(i => getEffectiveInterviewStatus(i) === InterviewStatus.Expired).length,
    live: filteredAndSortedInterviews.filter(i => getEffectiveInterviewStatus(i) === InterviewStatus.Live).length,
    notCompleted: filteredAndSortedInterviews.filter(i => getEffectiveInterviewStatus(i) === InterviewStatus.NotCompleted).length,
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Loading interviews...</p>
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
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 lg:px-8 py-6 sticky top-0 z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
              {statusFilter !== 'all' ? `${getStatusProps({ status: statusFilter } as Interview).label} Interviews` : 'Interviews'}
            </h1>
            {!userLoading && (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-1">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Interviews Left:</span>
                <span className="bg-blue-500 text-white text-sm font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {interviewsLeft}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
              {summaryStats.total} Total
            </span>
            {summaryStats.completed > 0 && (
              <span className="px-2 py-1 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                {summaryStats.completed} Completed
              </span>
            )}
            {summaryStats.cheating > 0 && (
              <span className="px-2 py-1 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full">
                {summaryStats.cheating} Cheating
              </span>
            )}
            {summaryStats.suspicious > 0 && (
              <span className="px-2 py-1 bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full">
                {summaryStats.suspicious} Suspicious
              </span>
            )}
            {summaryStats.expired > 0 && (
              <span className="px-2 py-1 bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full">
                {summaryStats.expired} Expired
              </span>
            )}
            {summaryStats.live > 0 && (
              <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                {summaryStats.live} Live
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, or access code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InterviewStatus | 'all')}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value={InterviewStatus.NotCompleted}>Not Completed</option>
                <option value={InterviewStatus.Live}>Live Now</option>
                <option value={InterviewStatus.Completed}>Completed</option>
                <option value={InterviewStatus.SuspiciousActivity}>Suspicious Activity</option>
                <option value={InterviewStatus.Cheating}>Cheating</option>
                <option value={InterviewStatus.Expired}>Expired</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
            
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 lg:p-8">
        <div className="lg:hidden">
          {currentInterviews.map((interview) => (
            <InterviewCard 
              key={interview.id} 
              interview={interview} 
              onView={goToDetail}
            />
          ))}
        </div>

        <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="hidden xl:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Access Code
                  </th>
                  <th scope="col" className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th scope="col" className="hidden xl:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    End Time
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="relative px-4 lg:px-6 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentInterviews.map((interview, index) => {
                  const { label, bg, Icon } = getStatusProps(interview);
                  const isCheating = getEffectiveInterviewStatus(interview) === InterviewStatus.Cheating;
                  const isSuspicious = getEffectiveInterviewStatus(interview) === InterviewStatus.SuspiciousActivity;
                  
                  return (
                    <tr
                      key={interview.id}
                      onClick={() => goToDetail(interview.id)}
                      className={`
                        hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors
                        ${isCheating ? 'bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 border-l-4 border-l-red-600' : ''}
                        ${isSuspicious ? 'bg-yellow-50 dark:bg-yellow-900 hover:bg-yellow-100 dark:hover:bg-yellow-800 border-l-4 border-l-yellow-500' : ''}
                        ${!isCheating && !isSuspicious && index % 2 === 0 ? 'bg-white dark:bg-gray-800' : ''}
                        ${!isCheating && !isSuspicious && index % 2 === 1 ? 'bg-gray-50 dark:bg-gray-900' : ''}
                      `}
                    >
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bg} flex items-center space-x-1`}>
                          <Icon className="h-3 w-3" />
                          <span>{label}</span>
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {interview.candidate}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 lg:hidden">
                          {interview.intervieweeEmail}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {interview.intervieweeEmail}
                        </div>
                      </td>
                      <td className="hidden xl:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                          {interview.accessCode}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {interview.position}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                        {interview.startDate && interview.startTime ? (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {(() => {
                              const { date, time } = formatDateTime(interview.startDate, interview.startTime);
                              return (
                                <>
                                  {date} at {time}
                                  {interview.timezone && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {interview.timezone} ({getTimezoneAbbreviation(interview.timezone)})
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="hidden xl:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                        {interview.startDate && interview.startTime && interview.duration ? (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {(() => {
                              const { date, time } = calculateEndTime(
                                interview.startDate,
                                interview.startTime,
                                interview.duration,
                                interview.timezone || ''
                              );
                              return (
                                <>
                                  {date} at {time}
                                  {interview.timezone && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {interview.timezone} ({getTimezoneAbbreviation(interview.timezone)})
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDuration(interview.duration)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              goToDetail(interview.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement dropdown menu
                              }}
                              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title="More Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 lg:px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredAndSortedInterviews.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredAndSortedInterviews.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-300'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden mt-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Interviews;
