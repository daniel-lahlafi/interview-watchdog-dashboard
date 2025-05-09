import { DateTime } from "luxon";
import { Interview } from "../firebase/types";

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
      const startDateTime = DateTime.fromISO(`${interview.startDate}T${interview.startTime}`, {
        zone: interview.timezone,
      });
  
  
      const endDateTime = startDateTime.plus({ minutes: Number(interview.duration) });
  
      const currentTime = DateTime.now().setZone(interview.timezone);
  
      // Check if current time is between start and end times
      const isLive = currentTime >= startDateTime && currentTime <= endDateTime;
      
      console.log('Interview live status check:', {
        interviewId: interview.id,
        currentTime: currentTime.toISO(),
        startTime: startDateTime.toISO(),
        endTime: endDateTime.toISO(),
        isLive
      });
      
      return isLive;
    } catch (error) {
      console.error('Error determining if interview is live:', error);
      return false;
    }
  }

export function isInterviewExpired(interview: Interview): boolean {
    if (!interview.startDate || !interview.startTime || !interview.timezone || !interview.duration) {
        return false;
    }

    try {
      const startDateTime = DateTime.fromISO(`${interview.startDate}T${interview.startTime}`, {
        zone: interview.timezone,
      });
  
      const endDateTime = startDateTime.plus({ minutes: Number(interview.duration) });
  
      const currentTime = DateTime.now().setZone(interview.timezone);
  
      // Check if current time is between start and end times
      const isExpired = currentTime >= endDateTime;
      
      console.log('Interview Expired status check:', {
        interviewId: interview.id,
        currentTime: currentTime.toISO(),
        startTime: startDateTime.toISO(),
        endTime: endDateTime.toISO(),
        isExpired
      });
      
      return isExpired;
    } catch (error) {
      console.error('Error determining if interview is expired:', error);
      return false;
    }
} 