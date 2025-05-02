import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, runTransaction, getFirestore, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, getBlob } from 'firebase/storage';
import { db, storage } from './config';
import type { Interview, Anomaly } from './types';
import { InterviewStatus } from './types';

// Collections
const interviewsCollection = collection(db, 'interviews');

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
    
    // Sort chunks by name to ensure correct order
    const sortedItems = [...listResult.items].sort((a, b) => {
      // Extract the numbers from names like "chunk001.webm"
      const aMatch = a.name.match(/chunk(\d+)\.webm/);
      const bMatch = b.name.match(/chunk(\d+)\.webm/);
      
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1], 10);
        const bNum = parseInt(bMatch[1], 10);
        return aNum - bNum;
      }
      
      // Fallback to string comparison if pattern doesn't match
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    console.log('Sorted chunks:', sortedItems.map(item => item.name).join(', '));

    // Get download URLs for all chunks
    const chunkUrls = await Promise.all(
      sortedItems.map(async (item) => {
        const url = await getDownloadURL(item);
        return url;
      })
    );
    
    console.log(`Got ${chunkUrls.length} chunk URLs`);
    return chunkUrls;
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
      const folderPath = `recordings/screen/${sanitizedEmailCode}`;
      console.log(`Fetching screen recordings from: ${folderPath}`);
      
      // Get all chunk URLs 
      const chunkUrls = await getVideoChunks(folderPath);
      
      if (chunkUrls.length === 0) {
        console.log('No screen recording chunks found');
        throw new Error('No screen recording chunks found');
      }
      
      console.log(`Returning ${chunkUrls.length} screen chunk URLs`);
      return chunkUrls;
      
    } catch (error) {
      console.error('Error retrieving screen video chunks:', error);
      throw error;
    }
  },
  
  // Get merged webcam recording from chunks
  getMergedWebcamRecording: async (emailCode: string): Promise<string[]> => {
    try {
      // Replace special characters in email with underscores
      const sanitizedEmailCode = emailCode.replace(/[@.]/g, '_');
      const folderPath = `recordings/camera/${sanitizedEmailCode}`;
      console.log(`Fetching webcam recordings from: ${folderPath}`);
      
      // Get all chunk URLs
      const chunkUrls = await getVideoChunks(folderPath);
      
      if (chunkUrls.length === 0) {
        console.log('No webcam recording chunks found');
        throw new Error('No webcam recording chunks found');
      }
      
      console.log(`Returning ${chunkUrls.length} webcam chunk URLs`);
      return chunkUrls;
      
    } catch (error) {
      console.error('Error retrieving webcam video chunks:', error);
      throw error;
    }
  }
}; 