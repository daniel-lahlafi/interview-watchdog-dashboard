import React, { useState } from 'react'
import { ChevronDown, Eye, AlertTriangle, Ban, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Mock data for interviews
const mockInterviews = [
  {
    id: 1,
    candidate: "John Smith",
    position: "Senior React Developer",
    date: "2024-03-15",
    duration: "45 minutes",
    hasAnomalies: true,
    confirmedCheating: false,
  },
  {
    id: 2,
    candidate: "Sarah Johnson",
    position: "Full Stack Engineer",
    date: "2024-03-14",
    duration: "60 minutes",
    hasAnomalies: true,
    confirmedCheating: true,
  },
  {
    id: 3,
    candidate: "Michael Brown",
    position: "Frontend Developer",
    date: "2024-03-14",
    duration: "50 minutes",
    hasAnomalies: false,
    confirmedCheating: false,
  }
]

function Interviews() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d')
  const navigate = useNavigate()

  const goToDetail = (id: number) => {
    navigate(`/interviews/${id}`)
  }

  // helper to derive label, color and icon
  const getStatusProps = (interview: typeof mockInterviews[0]) => {
    if (interview.confirmedCheating) {
      return {
        label: 'Confirmed cheating',
        bg: 'bg-red-100 text-red-800',
        Icon: Ban
      }
    } else if (interview.hasAnomalies) {
      return {
        label: 'Potential cheating',
        bg: 'bg-yellow-100 text-yellow-800',
        Icon: AlertTriangle
      }
    } else {
      return {
        label: 'No cheating detected',
        bg: 'bg-green-100 text-green-800',
        Icon: CheckCircle
      }
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Interviews</h1>
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
      </header>

      <main className="p-8">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockInterviews.map((interview) => {
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
                          {interview.position}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {interview.date}
                        </div>
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
        </div>
      </main>
    </div>
  )
}

export default Interviews
