export enum InterviewStatus {
  NotCompleted = 'Not Completed',
  SuspiciousActivity = 'Suspicious Activity',
  Cheating = 'Cheating',
  Completed = 'Completed',
  Live = 'Live',
  Scheduled = 'Scheduled',
}

export interface Interview {
  id: string;
  interviewerId: string;
  candidate: string;
  position: string;
  date: string;
  duration: string;
  screenVideo?: string;
  webcamVideo?: string;
  anomalies?: Anomaly[];
  status: InterviewStatus;
  accessCode: string;
  intervieweeEmail: string;
  links: string[]; // Array of URLs to open when interview starts
  startDate?: string; // Date when the interview is scheduled to start
  startTime?: string; // Time when the interview is scheduled to start
  timezone?: string; // Timezone for the scheduled interview
  scheduledDateTime?: any; // Firestore Timestamp
  goLiveDateTime?: any; // Firestore Timestamp
}

export interface Anomaly {
  id?: string;
  time: number;
  type: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>; // Additional data from the cheating record
} 