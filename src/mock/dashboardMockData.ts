import { InterviewStatus } from '../firebase/types';

// Helper function to generate random 5-digit access code
const generateRandomAccessCode = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Helper function to get date N days ago
const getDateNDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// Helper function to create mock interview with proper structure
const createMockInterview = (
  id: string,
  candidate: string,
  position: string,
  startDate: string,
  startTime: string,
  duration: string,
  status: InterviewStatus,
  cheating: boolean = false,
  suspiciousActivity: boolean = false,
  anomalies: any[] = []
) => ({
  id,
  interviewerId: 'mock-interviewer',
  candidate,
  position,
  startDate,
  startTime,
  timezone: 'UTC',
  duration,
  status,
  accessCode: generateRandomAccessCode(),
  links: [],
  intervieweeEmail: `${candidate.toLowerCase().replace(' ', '.')}@email.com`,
  createdAt: new Date(),
  updatedAt: new Date(),
  cheating,
  suspiciousActivity,
  anomalies
});

// Mock interview data that matches the Firebase interview structure
export const mockInterviews = [
  // Today's interviews
  createMockInterview(
    'mock-today-1',
    'Sarah Mitchell',
    'Senior Frontend Developer',
    new Date().toISOString().split('T')[0],
    '09:00',
    '55',
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-today-2',
    'David Rodriguez',
    'Full Stack Engineer',
    new Date().toISOString().split('T')[0],
    '14:30',
    '0',
    InterviewStatus.NotCompleted
  ),
  createMockInterview(
    'mock-today-3',
    'Jennifer Adams',
    'Backend Developer',
    new Date().toISOString().split('T')[0],
    '16:00',
    '0',
    InterviewStatus.Expired
  ),

  // Yesterday's interviews
  createMockInterview(
    'mock-yesterday-1',
    'Emma Thompson',
    'Backend Developer',
    getDateNDaysAgo(1),
    '10:15',
    '60',
    InterviewStatus.Cheating,
    true,
    true,
    [
      {
        type: 'multiple_faces_detected',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
        confidence: 0.97,
        description: 'Two distinct faces detected in camera view simultaneously'
      },
      {
        type: 'screen_sharing_detected',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
        confidence: 0.94,
        description: 'Screen sharing application detected - TeamViewer active'
      },
      {
        type: 'voice_analysis',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
        confidence: 0.89,
        description: 'Multiple voice patterns detected - likely receiving help'
      }
    ]
  ),
  createMockInterview(
    'mock-yesterday-2',
    'James Wilson',
    'DevOps Engineer',
    getDateNDaysAgo(1),
    '15:45',
    '45',
    InterviewStatus.SuspiciousActivity,
    false,
    true,
    [
      {
        type: 'unusual_eye_movement',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
        confidence: 0.82,
        description: 'Frequent eye movements to off-screen area'
      },
      {
        type: 'background_noise',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        confidence: 0.76,
        description: 'Detected background conversation and keyboard typing'
      }
    ]
  ),
  createMockInterview(
    'mock-yesterday-3',
    'Lisa Chen',
    'Product Manager',
    getDateNDaysAgo(1),
    '13:00',
    '0',
    InterviewStatus.NotCompleted
  ),

  // 2 days ago
  createMockInterview(
    'mock-2days-1',
    'Lisa Chen',
    'Data Scientist',
    getDateNDaysAgo(2),
    '11:00',
    '50',
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-2days-2',
    'Michael Brown',
    'Mobile Developer',
    getDateNDaysAgo(2),
    '16:20',
    '40',
    InterviewStatus.Cheating,
    true,
    true,
    [
      {
        type: 'text_detection',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
        confidence: 0.96,
        description: 'Code visible on secondary monitor - GitHub repository open'
      },
      {
        type: 'unusual_typing_pattern',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
        confidence: 0.91,
        description: 'Typing pattern indicates copy-paste from external source'
      }
    ]
  ),

  // 3 days ago
  createMockInterview(
    'mock-3days-1',
    'Alex Johnson',
    'UI/UX Designer',
    getDateNDaysAgo(3),
    '09:30',
    '55',
    InterviewStatus.SuspiciousActivity,
    false,
    true,
    [
      {
        type: 'screen_sharing_detected',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
        confidence: 0.88,
        description: 'Screen sharing application detected - Zoom screen share active'
      }
    ]
  ),
  createMockInterview(
    'mock-3days-2',
    'Rachel Green',
    'Product Manager',
    getDateNDaysAgo(3),
    '14:00',
    '60',
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-3days-3',
    'Alex Thompson',
    'Mobile Developer',
    getDateNDaysAgo(3),
    '16:30',
    '0',
    InterviewStatus.Expired
  ),

  // 4 days ago
  createMockInterview(
    'mock-4days-1',
    'Kevin Park',
    'Senior Backend Developer',
    getDateNDaysAgo(4),
    '10:45',
    '45',
    InterviewStatus.Cheating,
    true,
    true,
    [
      {
        type: 'multiple_faces_detected',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        confidence: 0.93,
        description: 'Additional person visible in camera view'
      },
      {
        type: 'voice_analysis',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
        confidence: 0.87,
        description: 'Voice pattern suggests person is reading from notes'
      },
      {
        type: 'text_detection',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
        confidence: 0.92,
        description: 'Text visible on phone screen next to laptop'
      }
    ]
  ),
  createMockInterview(
    'mock-4days-2',
    'Sophie Martinez',
    'QA Engineer',
    getDateNDaysAgo(4),
    '15:30',
    '0',
    InterviewStatus.NotCompleted
  ),
  createMockInterview(
    'mock-4days-3',
    'Robert Taylor',
    'DevOps Engineer',
    getDateNDaysAgo(4),
    '17:00',
    '0',
    InterviewStatus.Expired
  ),

  // 5 days ago
  createMockInterview(
    'mock-5days-1',
    'Tom Anderson',
    'Frontend Developer',
    getDateNDaysAgo(5),
    '11:15',
    '50',
    InterviewStatus.SuspiciousActivity,
    false,
    true,
    [
      {
        type: 'unusual_typing_pattern',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
        confidence: 0.79,
        description: 'Typing speed and pattern suggests copy-paste behavior'
      },
      {
        type: 'background_noise',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
        confidence: 0.73,
        description: 'Detected background conversation and paper rustling'
      }
    ]
  ),
  createMockInterview(
    'mock-5days-2',
    'Nina Patel',
    'DevOps Engineer',
    getDateNDaysAgo(5),
    '16:00',
    '55',
    InterviewStatus.Completed
  ),

  // 6 days ago
  createMockInterview(
    'mock-6days-1',
    'Carlos Rodriguez',
    'Full Stack Engineer',
    getDateNDaysAgo(6),
    '09:45',
    '40',
    InterviewStatus.Cheating,
    true,
    true,
    [
      {
        type: 'screen_sharing_detected',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
        confidence: 0.95,
        description: 'Screen sharing detected - Discord screen share active'
      },
      {
        type: 'multiple_faces_detected',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(),
        confidence: 0.91,
        description: 'Multiple faces detected - person appears to be looking at another screen'
      }
    ]
  ),
  createMockInterview(
    'mock-6days-2',
    'Amy Wilson',
    'Data Analyst',
    getDateNDaysAgo(6),
    '14:20',
    '0',
    InterviewStatus.NotCompleted
  ),
  createMockInterview(
    'mock-6days-3',
    'Mark Johnson',
    'Frontend Developer',
    getDateNDaysAgo(6),
    '11:30',
    '0',
    InterviewStatus.Expired
  ),

  // 7 days ago
  createMockInterview(
    'mock-7days-1',
    'Daniel Kim',
    'Senior Mobile Developer',
    getDateNDaysAgo(7),
    '10:30',
    '60',
    InterviewStatus.SuspiciousActivity,
    false,
    true,
    [
      {
        type: 'unusual_eye_movement',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
        confidence: 0.84,
        description: 'Frequent eye movements to off-screen area - likely looking at notes'
      },
      {
        type: 'background_noise',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
        confidence: 0.77,
        description: 'Detected background conversation and typing sounds'
      }
    ]
  ),
  createMockInterview(
    'mock-7days-2',
    'Jessica Taylor',
    'UX Designer',
    getDateNDaysAgo(7),
    '15:45',
    '45',
    InterviewStatus.Completed
  )
];

// Function to generate mock data for different time periods
export const generateMockData = (timePeriod: 'day' | 'week' | 'month' | 'year') => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 7);
  const startOfMonth = new Date(today);
  startOfMonth.setDate(today.getDate() - 28); // 4 weeks ago
  const startOfYear = new Date(today);
  startOfYear.setMonth(today.getMonth() - 12); // 12 months ago

  return mockInterviews.filter(interview => {
    const interviewDate = new Date(interview.startDate);
    
    if (timePeriod === 'day') {
      return interviewDate.toDateString() === today.toDateString();
    } else if (timePeriod === 'week') {
      return interviewDate >= startOfWeek && interviewDate <= today;
    } else if (timePeriod === 'month') {
      return interviewDate >= startOfMonth && interviewDate <= today;
    } else if (timePeriod === 'year') {
      return interviewDate >= startOfYear && interviewDate <= today;
    }
    return true;
  });
};