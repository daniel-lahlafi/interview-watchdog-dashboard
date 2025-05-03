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

/**
 * Determines if an interview is currently live based on its scheduled date, time, and duration
 * An interview is considered live if the current time falls within the scheduled period
 */
export function isInterviewLive(interview: Interview): boolean {
  // Return false if we don't have the required scheduling information
  if (!interview.startDate || !interview.startTime || !interview.timezone || !interview.duration) {
    return false;
  }

  try {
    // Get the current time in the interview's timezone
    const now = new Date();
    const currentTimeInInterviewTimezone = new Date(
      now.toLocaleString('en-US', { timeZone: interview.timezone })
    );

    // Parse the scheduled start time
    const [startHours, startMinutes] = interview.startTime.split(':').map(Number);
    
    // Create a Date object for the scheduled start time
    const scheduledStartDate = new Date(interview.startDate);
    scheduledStartDate.setHours(startHours, startMinutes, 0, 0);
    
    // Convert the scheduled date to the interview's timezone
    const scheduledStartInTimezone = new Date(
      scheduledStartDate.toLocaleString('en-US', { timeZone: interview.timezone })
    );
    
    // Calculate the end time based on duration (in minutes)
    const durationMinutes = parseInt(interview.duration, 10);
    const scheduledEndInTimezone = new Date(scheduledStartInTimezone);
    scheduledEndInTimezone.setMinutes(scheduledEndInTimezone.getMinutes() + durationMinutes);
    
    // Check if current time is between start and end times
    return (
      currentTimeInInterviewTimezone >= scheduledStartInTimezone &&
      currentTimeInInterviewTimezone <= scheduledEndInTimezone
    );
  } catch (error) {
    console.error('Error determining if interview is live:', error);
    return false;
  }
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
  
  // Otherwise, return the stored status
  return interview.status;
} 