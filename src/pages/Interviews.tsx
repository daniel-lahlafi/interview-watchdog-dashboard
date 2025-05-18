import React, { useState, useEffect } from 'react'
import { ChevronDown, Eye, AlertTriangle, Ban, CheckCircle, ChevronUp, ChevronDown as ChevronDownIcon, Clock, Radio } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import interviewService from '../firebase/services'
import type { Interview } from '../firebase/types'
import { InterviewStatus, getEffectiveInterviewStatus } from '../firebase/types'
import { useAuth } from '../contexts/AuthContext'

type SortField = 'date' | 'candidate' | 'position' | 'status'
type SortOrder = 'asc' | 'desc'

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

function Interviews() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d')
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Initialize status filter from URL parameter
  const initialStatus = searchParams.get('status') as InterviewStatus | null
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | 'all'>(initialStatus || 'all')

  // Update URL when status filter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', statusFilter)
    }
    setSearchParams(searchParams)
  }, [statusFilter, searchParams, setSearchParams])

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true)
        const data = await interviewService.getInterviewsByInterviewer(user?.uid ?? '')
        setInterviews(data)
      } catch (err) {
        setError('Failed to fetch interviews')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchInterviews()
  }, [])

  const goToDetail = (id: string) => {
    navigate(`/interviews/${id}`)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // helper to derive label, color and icon
  const getStatusProps = (interview: Interview) => {
    // Use the effective status which considers scheduled time
    const effectiveStatus = getEffectiveInterviewStatus(interview);
    
    switch (effectiveStatus) {
      case InterviewStatus.NotCompleted:
        return {
          label: 'Not Completed',
          bg: 'bg-gray-100 text-gray-800',
          Icon: Clock
        }
      case InterviewStatus.SuspiciousActivity:
        return {
          label: 'Suspicious Activity',
          bg: 'bg-yellow-100 text-yellow-800',
          Icon: AlertTriangle
        }
      case InterviewStatus.Cheating:
        return {
          label: 'Cheating',
          bg: 'bg-red-100 text-red-800',
          Icon: Ban
        }
      case InterviewStatus.Completed:
        return {
          label: 'Completed',
          bg: 'bg-green-100 text-green-800',
          Icon: CheckCircle
        }
      case InterviewStatus.Live:
        return {
          label: 'Live Now',
          bg: 'bg-blue-100 text-blue-800',
          Icon: Radio
        }
      case InterviewStatus.Expired:
        return {
          label: 'Expired',
          bg: 'bg-orange-100 text-orange-800',
          Icon: Clock
        }
      default:
        return {
          label: 'Not Completed',
          bg: 'bg-gray-100 text-gray-800',
          Icon: Clock
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter and sort interviews
  const filteredAndSortedInterviews = interviews
    .filter(interview => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        interview.candidate.toLowerCase().includes(searchLower) ||
        interview.position.toLowerCase().includes(searchLower) ||
        interview.intervieweeEmail?.toLowerCase().includes(searchLower)
      
      const matchesStatus = statusFilter === 'all' || getEffectiveInterviewStatus(interview) === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // First, sort by completion status
      const statusA = getEffectiveInterviewStatus(a);
      const statusB = getEffectiveInterviewStatus(b);
      
      // NotCompleted and Live interviews should come first
      const isIncompleteA = statusA === InterviewStatus.NotCompleted || statusA === InterviewStatus.Live;
      const isIncompleteB = statusB === InterviewStatus.NotCompleted || statusB === InterviewStatus.Live;
      
      if (isIncompleteA && !isIncompleteB) return -1;
      if (!isIncompleteA && isIncompleteB) return 1;
      
      // If both are incomplete or both are complete, sort by scheduled date/time
      if (a.startDate && a.startTime && b.startDate && b.startTime) {
        const dateA = new Date(`${a.startDate}T${a.startTime}`);
        const dateB = new Date(`${b.startDate}T${b.startTime}`);
        return dateA.getTime() - dateB.getTime();
      }
      
      // If one has date/time and the other doesn't, put the one with date/time first
      if (a.startDate && a.startTime) return -1;
      if (b.startDate && b.startTime) return 1;
      
      // If neither has date/time, maintain original order
      return 0;
    })

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentInterviews = filteredAndSortedInterviews.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredAndSortedInterviews.length / itemsPerPage)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading interviews...</p>
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
    <div className="flex-1 overflow-auto">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {statusFilter !== 'all' ? `${getStatusProps({ status: statusFilter } as Interview).label} Interviews` : 'Interviews'}
          </h1>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search interviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InterviewStatus | 'all')}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value={InterviewStatus.NotCompleted}>Not Completed</option>
                <option value={InterviewStatus.Live}>Live Now</option>
                <option value={InterviewStatus.Completed}>Completed</option>
                <option value={InterviewStatus.SuspiciousActivity}>Suspicious Activity</option>
                <option value={InterviewStatus.Cheating}>Cheating</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
            <div className="relative">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      <main className="p-8">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration (Minutes)
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentInterviews.map((interview) => {
                  const { label, bg, Icon } = getStatusProps(interview)
                  return (
                    <tr
                      key={interview.id}
                      onClick={() => goToDetail(interview.id)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bg} flex items-center space-x-1`}>
                          <Icon className="h-4 w-4" />
                          <span>{label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {interview.candidate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {interview.intervieweeEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {interview.accessCode}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {interview.position}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {interview.startDate && interview.startTime ? (
                          <div className="text-sm text-gray-900">
                            {(() => {
                              const { date, time } = formatDateTime(interview.startDate, interview.startTime);
                              return (
                                <>
                                  {date} at {time}
                                  {interview.timezone && (
                                    <div className="text-xs text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {interview.startDate && interview.startTime && interview.duration ? (
                          <div className="text-sm text-gray-900">
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
                                    <div className="text-xs text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {interview.duration}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            goToDetail(interview.id)
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
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
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Interviews
