import { DateTime } from "luxon";
import { isInterviewLive, isInterviewExpired } from "../utils/statusChecks";

export enum InterviewStatus {
  NotCompleted = 'Not Completed',
  SuspiciousActivity = 'Suspicious Activity',
  Cheating = 'Cheating',
  Completed = 'Completed',
  Live = 'Live',
  Expired = 'Expired'
}

export interface Interview {
  id: string;
  interviewerId: string;
  candidate: string;
  position: string;
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

/**
 * Gets the current effective status of an interview, considering scheduled time
 * If an interview is scheduled and the current time is within the scheduled window,
 * it will return Live status regardless of the stored status
 */
export function getEffectiveInterviewStatus(interview: Interview): InterviewStatus {
  // If the interview is scheduled and currently active, it's Live
  if (
    interview.status !== InterviewStatus.Completed && 
    interview.status !== InterviewStatus.Cheating &&
    interview.status !== InterviewStatus.SuspiciousActivity &&
    isInterviewLive(interview)
  ) {
    return InterviewStatus.Live;
  }
  
  // If the interview is scheduled and has expired, it's Expired
  if (
    interview.status !== InterviewStatus.Completed && 
    interview.status !== InterviewStatus.Cheating &&
    interview.status !== InterviewStatus.SuspiciousActivity &&
    isInterviewExpired(interview)
  ) {
    return InterviewStatus.Expired;
  }
  
  // Otherwise, return the stored status
  return interview.status;
} 