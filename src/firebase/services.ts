import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, runTransaction, getFirestore, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, getBlob } from 'firebase/storage';
import { db, storage } from './config';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Interview, Anomaly } from './types';
import { InterviewStatus } from './types';

// Initialize Firebase Functions
const functions = getFunctions();
const scheduleInterviewTransition = httpsCallable(functions, 'scheduleInterviewTransition');

// Collections
const interviewsCollection = collection(db, 'interviews');
const cheatingCollection = collection(db, 'cheating');

// Function to generate a random 6-digit code
const generateRandomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to get video chunks from storage
const getVideoChunks = async (folderPath: string): Promise<string[]> => {
  try {
    console.log(`Listing chunks in: ${folderPath}`);
    const folderRef = ref(storage, folderPath);
    
    // List all chunks in the folder
    const listResult = await listAll(folderRef);
    console.log(`Found ${listResult.items.length} items in folder`);
    
    if (listResult.items.length === 0) {
      throw new Error('No video chunks found');
    }
    
    // Find initialization segment and media segments
    const initSegmentItem = listResult.items.find(item => item.name === 'init.mp4');
    const mediaSegmentItems = listResult.items.filter(item => item.name.endsWith('.m4s'));
    
    // Sort media chunks by name to ensure correct order
    const sortedMediaItems = [...mediaSegmentItems].sort((a, b) => {
      // Extract the numbers from names like "chunk001.m4s"
      const aMatch = a.name.match(/chunk(\d+)/);
      const bMatch = b.name.match(/chunk(\d+)/);
      
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1], 10);
        const bNum = parseInt(bMatch[1], 10);
        return aNum - bNum;
      }
      
      // Fallback to string comparison if pattern doesn't match
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    console.log('Found segments:', 
      `init: ${initSegmentItem ? 'yes' : 'no'}, ` +
      `media: ${sortedMediaItems.map(item => item.name).join(', ')}`);

    // Get download URLs for init segment and media chunks
    const urls: string[] = [];
    
    // Add initialization segment first if it exists
    if (initSegmentItem) {
      const initUrl = await getDownloadURL(initSegmentItem);
      urls.push(initUrl);
    }
    
    // Add all media segments in order
    const mediaUrls = await Promise.all(
      sortedMediaItems.map(async (item) => {
        const url = await getDownloadURL(item);
        return url;
      })
    );
    
    urls.push(...mediaUrls);
    
    console.log(`Got ${urls.length} segment URLs (init + media chunks)`);
    return urls;
  } catch (error) {
    console.error('Error in getVideoChunks:', error);
    throw error;
  }
};

export const interviewService = {
  // Get all interviews
  getAllInterviews: async (): Promise<Interview[]> => {
    const snapshot = await getDocs(interviewsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
  },

  // Get interviews by interviewer ID
  getInterviewsByInterviewer: async (interviewerId: string): Promise<Interview[]> => {
    const q = query(interviewsCollection, where('interviewerId', '==', interviewerId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
  },

  // Get interview by ID
  getInterviewById: async (id: string): Promise<Interview | null> => {
    const docRef = doc(db, 'interviews', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Interview;
    }
    return null;
  },

  // Create new interview
  createInterview: async (interview: Omit<Interview, 'id' | 'status' | 'accessCode'>): Promise<{ id: string; accessCode: string }> => {
    const code = generateRandomCode();
    const interviewId = `${interview.intervieweeEmail}:${code}`;
    
    const interviewData = {
      ...interview,
      id: interviewId,
      status: InterviewStatus.NotCompleted,
      accessCode: code,
    };

    await setDoc(doc(interviewsCollection, interviewId), interviewData);
    return { id: interviewId, accessCode: code };
  },

  // Get interview by email and code
  getInterviewByAccess: async (email: string, code: string): Promise<Interview | null> => {
    const interviewId = `${email}:${code}`;
    const docRef = doc(interviewsCollection, interviewId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Interview;
    }
    return null;
  },

  // Update interview
  updateInterview: async (id: string, interview: Partial<Interview>): Promise<void> => {
    const docRef = doc(db, 'interviews', id);
    await updateDoc(docRef, interview);
  },

  // Create a new document with a specific ID
  createNewDocument: async (id: string, data: any): Promise<void> => {
    const docRef = doc(db, 'interviews', id);
    await setDoc(docRef, data);
  },

  // Delete interview
  deleteInterview: async (id: string): Promise<void> => {
    const docRef = doc(db, 'interviews', id);
    await deleteDoc(docRef);
  },

  // Upload video file
  uploadVideo: async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },
  
  // Get merged screen recording from chunks
  getMergedScreenRecording: async (emailCode: string): Promise<string[]> => {
    try {
      // Replace special characters in email with underscores
      const sanitizedEmailCode = emailCode.replace(/[@.]/g, '_');
      const folderPath = `streams/screen/${sanitizedEmailCode}`;
      console.log(`Fetching screen recordings from: ${folderPath}`);
      
      // Get all segment URLs (init + chunks) 
      const segmentUrls = await getVideoChunks(folderPath);
      
      if (segmentUrls.length === 0) {
        console.log('No screen recording segments found');
        throw new Error('No screen recording segments found');
      }
      
      console.log(`Returning ${segmentUrls.length} screen segment URLs`);
      return segmentUrls;
      
    } catch (error) {
      console.error('Error retrieving screen video segments:', error);
      throw error;
    }
  },
  
  // Get merged webcam recording from chunks
  getMergedWebcamRecording: async (emailCode: string): Promise<string[]> => {
    try {
      // Replace special characters in email with underscores
      const sanitizedEmailCode = emailCode.replace(/[@.]/g, '_');
      const folderPath = `streams/camera/${sanitizedEmailCode}`;
      console.log(`Fetching webcam recordings from: ${folderPath}`);
      
      // Get all segment URLs (init + chunks)
      const segmentUrls = await getVideoChunks(folderPath);
      
      if (segmentUrls.length === 0) {
        console.log('No webcam recording segments found');
        throw new Error('No webcam recording segments found');
      }
      
      console.log(`Returning ${segmentUrls.length} webcam segment URLs`);
      return segmentUrls;
      
    } catch (error) {
      console.error('Error retrieving webcam video segments:', error);
      throw error;
    }
  },
  
  // Get anomalies for an interview (real-time or one-time)
  getAnomalies: (interviewId: string, isLive: boolean, callback: (anomalies: Anomaly[]) => void) => {
    console.log(`Setting up anomaly detection for interview: ${interviewId}, isLive: ${isLive}`);
    
    // Create a query against the cheating collection
    const q = query(cheatingCollection, where("interviewId", "==", interviewId));
    
    if (isLive) {
      console.log('Setting up real-time anomaly listener');
      // For live interviews, set up a real-time listener
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log(`Real-time anomaly update: ${snapshot.docs.length} anomalies found`);
        
        const anomalies: Anomaly[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            time: data.timestamp || 0, // Use timestamp as the time for the anomaly
            type: data.type || 'Unknown',
            description: data.description || '',
            severity: data.severity || 'medium',
            metadata: data // Include all original data
          } as Anomaly;
        });
        
        // Sort anomalies by time in reverse order (newest first)
        anomalies.sort((a, b) => b.time - a.time);
        
        // Call the callback with the updated anomalies
        callback(anomalies);
      }, (error) => {
        console.error('Error in real-time anomaly listener:', error);
      });
      
      // Return the unsubscribe function for cleanup
      return unsubscribe;
    } else {
      console.log('Performing one-time fetch of anomalies');
      // For completed interviews, just do a one-time fetch
      getDocs(q)
        .then((snapshot) => {
          console.log(`One-time anomaly fetch: ${snapshot.docs.length} anomalies found`);
          
          const anomalies: Anomaly[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              time: data.timestamp || 0,
              type: data.type || 'Unknown',
              description: data.description || '',
              severity: data.severity || 'medium',
              metadata: data
            } as Anomaly;
          });
          
          // Sort anomalies by time in reverse order (newest first)
          anomalies.sort((a, b) => b.time - a.time);
          
          // Call the callback with the fetched anomalies
          callback(anomalies);
        })
        .catch((error) => {
          console.error('Error fetching anomalies:', error);
        });
      
      // Return a no-op function for consistency
      return () => {};
    }
  },

  // Add function to delete an anomaly
  deleteAnomaly: async (anomalyId: string, interviewId: string): Promise<void> => {
    try {
      // Delete the anomaly
      const docRef = doc(db, 'cheating', anomalyId);
      await deleteDoc(docRef);

      // Get all remaining anomalies for this interview
      const q = query(cheatingCollection, where("interviewId", "==", interviewId));
      const snapshot = await getDocs(q);
      
      // Check if there are any remaining cheating or suspicious anomalies
      const hasCheating = snapshot.docs.some(doc => doc.data().severity === 'cheating');
      const hasSuspicious = snapshot.docs.some(doc => doc.data().severity === 'suspicious');

      // Update the interview document
      const interviewRef = doc(db, 'interviews', interviewId);
      await updateDoc(interviewRef, {
        cheating: hasCheating,
        suspiciousActivity: hasSuspicious
      });
    } catch (error) {
      console.error('Error deleting anomaly:', error);
      throw error;
    }
  },

  // Schedule a new interview with specific date and time
  scheduleInterview: async (interview: Omit<Interview, 'id' | 'status' | 'accessCode'>, scheduledDateTime: Date): Promise<{ id: string; accessCode: string }> => {
    try {
      // Generate a random access code
      const code = generateRandomCode();
      const interviewId = `${interview.intervieweeEmail}:${code}`;
      
      // Convert the scheduled date/time to a Firestore timestamp
      const scheduledTimestamp = Timestamp.fromDate(scheduledDateTime);
      
      // Calculate the "go live" time (5 minutes before the scheduled time)
      const goLiveDate = new Date(scheduledDateTime);
      goLiveDate.setMinutes(goLiveDate.getMinutes() - 5);
      const goLiveTimestamp = Timestamp.fromDate(goLiveDate);
      
      // Create the interview data with scheduling information
      const interviewData = {
        ...interview,
        id: interviewId,
        status: InterviewStatus.NotCompleted,
        accessCode: code,
        scheduledDateTime: scheduledTimestamp,
        goLiveDateTime: goLiveTimestamp
      };

      // Save the interview to Firestore
      await setDoc(doc(interviewsCollection, interviewId), interviewData);
      
      // Call the Firebase Function to schedule the status transition
      await scheduleInterviewTransition({
        interviewId: interviewId,
        scheduledTime: scheduledDateTime.getTime(),
        goLiveTime: goLiveDate.getTime(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Include local timezone info
      });
      
      console.log(`Interview scheduled for ${scheduledDateTime.toLocaleString()}, will go live at ${goLiveDate.toLocaleString()}`);
      
      return { id: interviewId, accessCode: code };
    } catch (error) {
      console.error('Error scheduling interview:', error);
      throw error;
    }
  }
};

// Make sure it's also exported as default
export default interviewService;