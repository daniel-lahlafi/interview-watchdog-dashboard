import { Interview, InterviewStatus } from '../firebase/types';

// Helper function to generate random 5-digit access code
const generateRandomAccessCode = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Helper function to create mock interviews
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
): Interview => ({
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

// Generate dates for the past 30 days
const getDateNDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

const getTimeNHoursAgo = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toTimeString().split(' ')[0].substring(0, 5);
};

// Mock interviews data
export const mockInterviews: Interview[] = [
  // Today's interviews
  createMockInterview(
    'mock-today-1', 'Sarah Mitchell', 'Senior Frontend Developer', 
    new Date().toISOString().split('T')[0], '09:00', '55', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-today-2', 'David Rodriguez', 'Full Stack Engineer', 
    new Date().toISOString().split('T')[0], '14:30', '0', 
    InterviewStatus.NotCompleted
  ),
  createMockInterview(
    'mock-today-3', 'Jennifer Adams', 'Backend Developer', 
    new Date().toISOString().split('T')[0], '16:00', '0', 
    InterviewStatus.Expired
  ),
  createMockInterview(
    'mock-today-4', 'Michael Chen', 'DevOps Engineer', 
    new Date().toISOString().split('T')[0], '10:30', '60', 
    InterviewStatus.Completed, true, false, [
      { type: 'tab_switching', count: 15, severity: 'high' },
      { type: 'copy_paste', count: 8, severity: 'medium' }
    ]
  ),
  createMockInterview(
    'mock-today-5', 'Emily Johnson', 'Product Manager', 
    new Date().toISOString().split('T')[0], '11:15', '45', 
    InterviewStatus.Completed, false, true, [
      { type: 'unusual_mouse_movement', count: 3, severity: 'low' }
    ]
  ),

  // Yesterday's interviews
  createMockInterview(
    'mock-yesterday-1', 'Alex Thompson', 'UI/UX Designer', 
    getDateNDaysAgo(1), '09:30', '50', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-yesterday-2', 'Lisa Wang', 'Data Scientist', 
    getDateNDaysAgo(1), '14:00', '75', 
    InterviewStatus.Completed, true, false, [
      { type: 'tab_switching', count: 25, severity: 'high' },
      { type: 'copy_paste', count: 12, severity: 'high' },
      { type: 'unusual_mouse_movement', count: 8, severity: 'medium' }
    ]
  ),
  createMockInterview(
    'mock-yesterday-3', 'Robert Brown', 'QA Engineer', 
    getDateNDaysAgo(1), '16:30', '0', 
    InterviewStatus.NotCompleted
  ),
  createMockInterview(
    'mock-yesterday-4', 'Maria Garcia', 'Mobile Developer', 
    getDateNDaysAgo(1), '10:00', '65', 
    InterviewStatus.Completed, false, true, [
      { type: 'unusual_mouse_movement', count: 5, severity: 'medium' }
    ]
  ),

  // 2 days ago
  createMockInterview(
    'mock-2days-1', 'James Wilson', 'Cloud Architect', 
    getDateNDaysAgo(2), '09:00', '80', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-2days-2', 'Anna Davis', 'Security Engineer', 
    getDateNDaysAgo(2), '13:30', '70', 
    InterviewStatus.Completed, true, false, [
      { type: 'tab_switching', count: 18, severity: 'high' },
      { type: 'copy_paste', count: 6, severity: 'medium' }
    ]
  ),
  createMockInterview(
    'mock-2days-3', 'Kevin Lee', 'System Administrator', 
    getDateNDaysAgo(2), '15:00', '0', 
    InterviewStatus.Expired
  ),

  // 3 days ago
  createMockInterview(
    'mock-3days-1', 'Rachel Green', 'Frontend Developer', 
    getDateNDaysAgo(3), '10:30', '55', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-3days-2', 'Tom Anderson', 'Backend Developer', 
    getDateNDaysAgo(3), '14:00', '60', 
    InterviewStatus.Completed, false, true, [
      { type: 'unusual_mouse_movement', count: 4, severity: 'low' }
    ]
  ),
  createMockInterview(
    'mock-3days-3', 'Sophie Taylor', 'Full Stack Developer', 
    getDateNDaysAgo(3), '16:00', '0', 
    InterviewStatus.NotCompleted
  ),

  // 4 days ago
  createMockInterview(
    'mock-4days-1', 'Daniel Kim', 'Machine Learning Engineer', 
    getDateNDaysAgo(4), '09:30', '90', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-4days-2', 'Jessica White', 'DevOps Engineer', 
    getDateNDaysAgo(4), '13:00', '75', 
    InterviewStatus.Completed, true, false, [
      { type: 'tab_switching', count: 22, severity: 'high' },
      { type: 'copy_paste', count: 10, severity: 'high' }
    ]
  ),

  // 5 days ago
  createMockInterview(
    'mock-5days-1', 'Chris Martin', 'Software Engineer', 
    getDateNDaysAgo(5), '10:00', '65', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-5days-2', 'Amanda Clark', 'Product Designer', 
    getDateNDaysAgo(5), '14:30', '50', 
    InterviewStatus.Completed, false, true, [
      { type: 'unusual_mouse_movement', count: 6, severity: 'medium' }
    ]
  ),

  // 6 days ago
  createMockInterview(
    'mock-6days-1', 'Ryan Murphy', 'Database Administrator', 
    getDateNDaysAgo(6), '09:00', '70', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-6days-2', 'Laura Smith', 'QA Engineer', 
    getDateNDaysAgo(6), '15:00', '0', 
    InterviewStatus.Expired
  ),

  // 7 days ago
  createMockInterview(
    'mock-7days-1', 'Mark Johnson', 'Senior Developer', 
    getDateNDaysAgo(7), '11:00', '80', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-7days-2', 'Nina Patel', 'Frontend Developer', 
    getDateNDaysAgo(7), '13:30', '55', 
    InterviewStatus.Completed, true, false, [
      { type: 'tab_switching', count: 20, severity: 'high' },
      { type: 'copy_paste', count: 7, severity: 'medium' }
    ]
  ),

  // Additional interviews for more variety
  createMockInterview(
    'mock-8days-1', 'Steve Rogers', 'Team Lead', 
    getDateNDaysAgo(8), '10:00', '90', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-9days-1', 'Natasha Romanoff', 'Security Specialist', 
    getDateNDaysAgo(9), '14:00', '85', 
    InterviewStatus.Completed, false, true, [
      { type: 'unusual_mouse_movement', count: 7, severity: 'medium' }
    ]
  ),
  createMockInterview(
    'mock-10days-1', 'Tony Stark', 'Senior Architect', 
    getDateNDaysAgo(10), '09:30', '95', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-11days-1', 'Bruce Banner', 'Data Engineer', 
    getDateNDaysAgo(11), '15:30', '0', 
    InterviewStatus.Expired
  ),
  createMockInterview(
    'mock-12days-1', 'Thor Odinson', 'Cloud Engineer', 
    getDateNDaysAgo(12), '11:30', '75', 
    InterviewStatus.Completed, true, false, [
      { type: 'tab_switching', count: 16, severity: 'high' },
      { type: 'copy_paste', count: 9, severity: 'high' }
    ]
  ),
  createMockInterview(
    'mock-13days-1', 'Clint Barton', 'Mobile Developer', 
    getDateNDaysAgo(13), '13:00', '60', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-14days-1', 'Wanda Maximoff', 'Frontend Developer', 
    getDateNDaysAgo(14), '10:30', '0', 
    InterviewStatus.NotCompleted
  ),
  createMockInterview(
    'mock-15days-1', 'Vision', 'AI Engineer', 
    getDateNDaysAgo(15), '14:30', '85', 
    InterviewStatus.Completed, false, true, [
      { type: 'unusual_mouse_movement', count: 5, severity: 'low' }
    ]
  ),

  // More recent interviews for better distribution
  createMockInterview(
    'mock-recent-1', 'Peter Parker', 'Junior Developer', 
    getDateNDaysAgo(1), '11:00', '45', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-recent-2', 'Gwen Stacy', 'UI Designer', 
    getDateNDaysAgo(2), '15:30', '50', 
    InterviewStatus.Completed, true, false, [
      { type: 'tab_switching', count: 14, severity: 'high' },
      { type: 'copy_paste', count: 5, severity: 'medium' }
    ]
  ),
  createMockInterview(
    'mock-recent-3', 'Miles Morales', 'React Developer', 
    getDateNDaysAgo(3), '09:15', '55', 
    InterviewStatus.Completed
  ),
  createMockInterview(
    'mock-recent-4', 'Kamala Khan', 'Full Stack Developer', 
    getDateNDaysAgo(4), '16:00', '0', 
    InterviewStatus.NotCompleted
  ),
  createMockInterview(
    'mock-recent-5', 'Riri Williams', 'Mobile Developer', 
    getDateNDaysAgo(5), '12:30', '65', 
    InterviewStatus.Completed, false, true, [
      { type: 'unusual_mouse_movement', count: 3, severity: 'low' }
    ]
  )
];

// Function to generate mock data for different time periods
export const generateMockInterviewsData = (timeframe: '7d' | '30d' | '90d') => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let startDate: Date;
  if (timeframe === '7d') {
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
  } else if (timeframe === '30d') {
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
  } else { // 90d
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 90);
  }

  return mockInterviews.filter(interview => {
    const interviewDate = new Date(interview.startDate);
    return interviewDate >= startDate && interviewDate <= today;
  });
};
