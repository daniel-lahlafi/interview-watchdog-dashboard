export enum InterviewStatus {
  NotCompleted = 'Not Completed',
  SuspiciousActivity = 'Suspicious Activity',
  Cheating = 'Cheating',
  Completed = 'Completed'
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
}

export interface Anomaly {
  time: number;
  type: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high';
} 