// src/pages/InterviewDetails.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, PlayCircle, PauseCircle, SkipBack, SkipForward, RefreshCw, Info, Radio, Edit, X, Check, Clock, Plus } from 'lucide-react'
import interviewService from '../firebase/services'
import type { Interview, Anomaly } from '../firebase/types'
import { useAuth } from '../contexts/AuthContext'
import { InterviewStatus, getEffectiveInterviewStatus } from '../firebase/types'
import { isInterviewLive } from '../utils/statusChecks'
import { SynchronizedStreams, SynchronizedStreamsRef } from '../components/SynchronizedStreams'
import { DEFAULT_TIMEZONES } from './CreateInterview'
import { DateTime } from 'luxon'
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore'
import { db } from '../firebase/config'

// Helper function to get timezone abbreviation
const getTimezoneAbbreviation = (timezone: string): string => {
  if (!timezone) return '';
  try {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: timezone, timeZoneName: 'short' };
    const timeString = date.toLocaleString('en-US', options);
    const abbreviation = timeString.split(' ').pop() || '';
    return abbreviation;
  } catch (error) {
    return '';
  }
};

function InterviewDetails() {
  // React Router hooks
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // State for interview data
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for videos
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalVideoDuration, setTotalVideoDuration] = useState(0)
  
  // Create refs for the synchronized streams component
  const synchronizedStreamsRef = useRef<SynchronizedStreamsRef>(null)
  
  // State for anomalies
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [newAnomalyAlert, setNewAnomalyAlert] = useState<boolean>(false)
  
  // Add a new state variable to track new anomalies
  const [newAnomaliesCount, setNewAnomaliesCount] = useState(0);
  const [newAnomalyIds, setNewAnomalyIds] = useState<Set<string>>(new Set());
  
  // Add a new state variable for sound notification preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  
  // Add a new state variable for the delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  
  // Add state variables for the copy animation
  const [accessCodeCopied, setAccessCodeCopied] = useState(false);
  const [accessCodeCopied2, setAccessCodeCopied2] = useState(false); // For the second button in not completed view
  const [emailCopied, setEmailCopied] = useState(false); // For the email copy animation
  const [emailCopied2, setEmailCopied2] = useState(false); // For the second email copy button in not completed view
  
  // Refs
  const timelineRef = useRef<HTMLDivElement>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add state variables for edit modal
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    intervieweeEmail: '',
    startDate: '',
    startTime: '',
    timezone: '',
    duration: '',
    meetingLink: '',
  });
  
  // Add a separate state for links as an array
  const [editLinks, setEditLinks] = useState<string[]>(['']);
  
  // New state variable for edit form error and success
  const [editError, setEditError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  // Function to seek to a specific time
  const seekToTime = (timeString: string) => {
    if (!timeString) return
    
    // Parse MM:SS format to seconds
    const [minutes, seconds] = timeString.split(':').map(Number)
    const totalSeconds = minutes * 60 + seconds
    
    // Set current time directly
    setCurrentTime(totalSeconds)
    
    // Use the ref to call seeking method if available
    if (synchronizedStreamsRef.current) {
      synchronizedStreamsRef.current.seekToTime(totalSeconds)
    } else {
      // Fallback to handleVideoTimeUpdate if ref method is not available
      handleVideoTimeUpdate(totalSeconds)
    }
  }

  const handleVideoTimeUpdate = useCallback((time: number) => {
    // Only update if the time difference is significant to avoid small oscillations
    if (Math.abs(time - currentTime) > 0.5) {
      setCurrentTime(time)
    }
  }, [currentTime])

  // Effects - in a consistent order
  // 1. Data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setVideoError(null)
        
        // Set a loading timeout to prevent infinite loading
        loadingTimeoutRef.current = setTimeout(() => {
          if (loadingVideo) {
            setLoadingVideo(false)
            setVideoError('Video loading timed out. You can try refreshing the page.')
            console.error('Video loading timed out after 30 seconds')
          }
        }, 30000)
        
        if (id) {
          console.log(`Fetching interview data for ID: ${id}`)
          const interviewData = await interviewService.getInterviewById(id)
          setInterview(interviewData)
        }
        
      } catch (err) {
        console.error('Failed to fetch interview data:', err)
        setError('Failed to fetch interview data')
      } finally {
        setLoading(false)
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current)
          loadingTimeoutRef.current = null
        }
      }
    }

    fetchData()

    // Clean up timeouts when component unmounts
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [id, user?.uid])

  // New effect for anomaly detection
  useEffect(() => {
    if (!interview || !id) return;
    
    // Get the effective status to determine if interview is live
    const effectiveStatus = getEffectiveInterviewStatus(interview);
    const isLive = effectiveStatus === InterviewStatus.Live;
    
    console.log(`Setting up real-time anomaly detection for interview ${id}`);
    
    // Set up real-time listener for anomalies directly using Firebase
    const q = query(collection(db, 'cheating'), where("interviewId", "==", id));
    console.log("q", q);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("snapshot", snapshot);
      const updatedAnomalies: Anomaly[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          time: data.timestamp || 0,
          type: data.type || 'Unknown',
          details: data.details || '',
          severity: data.severity || 'medium',
          metadata: data
        } as Anomaly;
      });
      
      // Sort anomalies in reverse chronological order (newest first)
      updatedAnomalies.sort((a, b) => b.time - a.time);
      
      // Check if there are any new anomalies
      if (updatedAnomalies.length > anomalies.length) {
        const newCount = updatedAnomalies.length - anomalies.length;
        setNewAnomaliesCount(prev => prev + newCount);
        
        // Track which anomalies are new
        const newIds = new Set(newAnomalyIds);
        updatedAnomalies.slice(-newCount).forEach(anomaly => {
          if (anomaly.id) {
            newIds.add(anomaly.id);
          }
        });
        setNewAnomalyIds(newIds);
        setNewAnomalyAlert(true);
        
        // Play sound if enabled
        if (soundEnabled) {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            
            oscillator.start(0);
            oscillator.stop(audioContext.currentTime + 0.2);
          } catch (error) {
            console.log('Error playing alert sound:', error);
          }
        }
        
        // Hide notification after delay
        setTimeout(() => setNewAnomalyAlert(false), 8000);
      }
      
      setAnomalies(updatedAnomalies);
    }, (error) => {
      console.error('Error in real-time anomaly listener:', error);
    });
    
    return () => unsubscribe();
  }, [id, interview?.status]); // Only re-run when interview ID or status changes

  // Add real-time listener for interview status changes
  useEffect(() => {
    if (!id) return;

    // Set up real-time listener for the interview document
    const interviewRef = doc(db, 'interviews', id);
    const unsubscribe = onSnapshot(interviewRef, (doc) => {
      if (doc.exists()) {
        const interviewData = doc.data() as Interview;

        // If the interview status changes to completed, refresh the page
        if (interview && interview.status !== interviewData.status && interviewData.status === InterviewStatus.Completed) {
          console.log('Interview completed, refreshing page...');
          window.location.reload();
        }
        
        setInterview(interviewData);
      }
    }, (error) => {
      console.error('Error in interview listener:', error);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [id]);

  // Event handlers
  const refreshPage = () => {
    window.location.reload()
  }

  // Function to get destructured values safely from the interview
  const getInterviewDetails = () => {
    if (!interview) return {
      candidate: '',
      position: '',
      startDate: '',
      duration: '',
    };
    
    const {
      candidate,
      position,
      startDate,
      duration,
    } = interview;
    
    return { candidate, position, startDate, duration };
  };

  // Extract values from interview
  const { candidate, position, startDate, duration } = getInterviewDetails();

  // Add a live badge at the top of the page if it's currently live
  const effectiveStatus = interview ? getEffectiveInterviewStatus(interview) : InterviewStatus.NotCompleted;
  // Add a delete interview handler
  const handleDeleteInterview = async () => {
    if (!interview || !interview.id) return;
    
    try {
      setLoading(true);
      await interviewService.deleteInterview(interview.id);
      
      // Navigate back to interviews list after successful deletion
      navigate('/interviews');
    } catch (error) {
      console.error('Error deleting interview:', error);
      setError('Failed to delete interview. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  // Handle opening the edit modal
  const handleOpenEditModal = () => {
    if (interview) {
      setEditFormData({
        intervieweeEmail: interview.intervieweeEmail || '',
        startDate: interview.startDate || '',
        startTime: interview.startTime || '',
        timezone: interview.timezone || '',
        duration: interview.duration?.toString() || '',
        meetingLink: (interview as any).meetingLink || '',
      });
      
      // Initialize editLinks from interview
      const interviewLinks = (interview as any).links;
      if (Array.isArray(interviewLinks) && interviewLinks.length > 0) {
        setEditLinks(interviewLinks);
      } else {
        setEditLinks(['']); // Start with one empty link
      }
      
      setShowEditModal(true);
    }
  };
  
  // Handle edit form input changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Functions to handle links in the edit modal
  const handleEditLinkChange = (index: number, value: string) => {
    const newLinks = [...editLinks];
    newLinks[index] = value;
    setEditLinks(newLinks);
  };

  const addEditLink = () => {
    setEditLinks([...editLinks, '']);
  };

  const removeEditLink = (index: number) => {
    const newLinks = editLinks.filter((_, i) => i !== index);
    setEditLinks(newLinks);
  };
  
  // Handle saving interview updates
  const handleSaveInterview = async () => {
    if (!interview || !interview.id) return;
    
    try {
      setLoading(true);
      setEditError(null);
      setUpdateSuccess(false);
      
      // Check if email is changing - important because document ID includes the email
      const isEmailChanging = interview.intervieweeEmail !== editFormData.intervieweeEmail;
      
      // Extract the access code from the old ID (format is email:code)
      const accessCode = interview.accessCode;
      
      // Filter out empty links
      const validLinks = editLinks.filter(link => link.trim() !== '');
      
      // Prepare updated interview data
      const updatedData = {
        intervieweeEmail: editFormData.intervieweeEmail,
        startDate: editFormData.startDate,
        startTime: editFormData.startTime,
        timezone: editFormData.timezone,
        duration: editFormData.duration,
        meetingLink: editFormData.meetingLink,
        links: validLinks,
      };
      
      if (isEmailChanging) {
        // Generate new ID based on new email and existing code
        const newId = `${editFormData.intervieweeEmail}:${accessCode}`;
        
        // Create a complete interview object to move to the new document
        const completeUpdatedInterview = {
          ...interview,
          ...updatedData,
          id: newId
        };
        
        // Create a copy without the id property for Firestore (id is in the document path)
        const { id, ...interviewWithoutId } = completeUpdatedInterview;
        
        // Create a new document with the updated ID
        await interviewService.createNewDocument(newId, interviewWithoutId);
        
        // Delete the old document
        await interviewService.deleteInterview(interview.id);
        
        // Update local state with the new interview ID
        setInterview({ ...completeUpdatedInterview, id: newId } as any);
        
        // Also update the URL to reflect the new ID without reloading the page
        window.history.replaceState(null, '', `/interviews/${newId}`);
      } else {
        // If email is not changing, just update the existing document
        await interviewService.updateInterview(interview.id, updatedData);
        
        // Update local state
        setInterview({ ...interview, ...updatedData } as any);
      }
      
      // Show success message
      setUpdateSuccess(true);
      
      // Close the modal after a short delay
      setTimeout(() => {
        setShowEditModal(false);
        setUpdateSuccess(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating interview:', error);
      setEditError('Failed to update interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // guard: loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  // guard: error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={refreshPage}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Page
        </button>
      </div>
    )
  }

  // guard: no such interview
  if (!interview) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Interview not found.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Detail pane */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
        <header className="mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                {candidate}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                effectiveStatus === InterviewStatus.NotCompleted ? 'bg-gray-100 text-gray-600' :
                effectiveStatus === InterviewStatus.Completed ? 'bg-green-100 text-green-600' :
                effectiveStatus === InterviewStatus.SuspiciousActivity ? 'bg-yellow-100 text-yellow-600' :
                effectiveStatus === InterviewStatus.Live ? 'bg-blue-100 text-blue-600' :
                'bg-red-100 text-red-600'
              }`}>
                {effectiveStatus === InterviewStatus.Live && <Radio className="inline-block mr-1 h-3 w-3 animate-pulse" />}
                {effectiveStatus}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {position} • {startDate}
            </p>
            <div className="flex items-center mt-2">
              <div className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-md inline-flex items-center relative">
                <span className="font-medium mr-1">Access Code:</span> {interview.accessCode}
                <button 
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    navigator.clipboard.writeText(interview.accessCode);
                    // Show "Copied" animation instead of alert
                    setAccessCodeCopied(true);
                    setTimeout(() => setAccessCodeCopied(false), 1500);
                  }}
                  title="Copy access code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-copy">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                  </svg>
                </button>
                
                {/* Copied animation */}
                {accessCodeCopied && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg transition-opacity duration-1500 opacity-100 -translate-y-full -mt-1 z-10">
                    Copied!
                  </div>
                )}
              </div>
              <div className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-md ml-2 relative inline-flex items-center">
                <span className="font-medium mr-1">Email: </span> {interview.intervieweeEmail}
                <button 
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    navigator.clipboard.writeText(interview.intervieweeEmail);
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 1500);
                  }}
                  title="Copy email"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-copy">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                  </svg>
                </button>
                
                {/* Copied animation */}
                {emailCopied && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg transition-opacity duration-1500 opacity-100 whitespace-nowrap -translate-y-full -mt-1 z-10">
                    Copied!
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleOpenEditModal}
              className="px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-1"
              title="Edit interview"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded flex items-center gap-1"
              title="Delete interview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete
            </button>
            
            <button 
              onClick={refreshPage}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
              title="Refresh page"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </header>

        {/* Add a live badge at the top of the page if it's currently live */}
        {effectiveStatus === InterviewStatus.Live && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <Radio className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-blue-700 text-sm font-medium">
                This interview is currently live
              </p>
              <p className="text-blue-600 text-xs">
                Started at {interview.startTime} ({interview.timezone}) and runs for {interview.duration} minutes until {interview.startTime ? DateTime.fromFormat(interview.startTime, 'HH:mm', { zone: interview.timezone }).plus({ minutes: parseInt(interview.duration) }).toFormat('HH:mm') : 'N/A'} ({interview.timezone})
              </p>
            </div>
          </div>
        )}

        {/* Add an expired notification if the interview has expired */}
        {effectiveStatus === InterviewStatus.Expired && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <Clock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-orange-700 text-sm font-medium">
                This interview has expired
              </p>
              <p className="text-orange-600 text-xs">
                Was scheduled for {interview.startDate} at {interview.startTime} ({interview.timezone}) with duration of {interview.duration} minutes
              </p>
            </div>
          </div>
        )}

        {interview.status === InterviewStatus.NotCompleted && effectiveStatus !== InterviewStatus.Live ? (
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="mt-4 bg-gray-50 p-4 inline-block rounded-lg">
                <h3 className="font-medium text-gray-800">Interview Access Information</h3>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
                  <div className="text-sm flex items-center relative">
                    <span className="font-medium">Access Code:</span> 
                    <span className="mx-2 font-mono bg-gray-100 px-2 py-1 rounded">{interview.accessCode}</span>
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        navigator.clipboard.writeText(interview.accessCode);
                        // Show "Copied" animation instead of alert
                        setAccessCodeCopied2(true);
                        setTimeout(() => setAccessCodeCopied2(false), 1500);
                      }}
                      title="Copy access code"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-copy">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                      </svg>
                    </button>
                    
                    {/* Copied animation */}
                    {accessCodeCopied2 && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg transition-opacity duration-1500 opacity-100 -translate-y-full -mt-1 z-10">
                        Copied!
                      </div>
                    )}
                  </div>
                  <div className="text-sm relative inline-flex items-center">
                    <span className="font-medium">Email:</span>
                    <span className="mx-2 font-mono bg-gray-100 px-2 py-1 rounded">{interview.intervieweeEmail}</span>

                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        navigator.clipboard.writeText(interview.intervieweeEmail);
                        setEmailCopied2(true);
                        setTimeout(() => setEmailCopied2(false), 1500);
                      }}
                      title="Copy email"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-copy">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                      </svg>
                    </button>
                    
                    {/* Copied animation */}
                    {emailCopied2 && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg transition-opacity duration-1500 opacity-100 whitespace-nowrap -translate-y-full -mt-1 z-10">
                        Copied!
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  The interviewee will need both the access code and their email to join the interview
                </p>
              </div>
              
              {/* Display scheduling information if available */}
              {!isInterviewLive(interview) && interview.startDate && interview.startTime && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h3 className="font-medium text-blue-800">Scheduled Interview</h3>
                  <p className="text-blue-600">
                    This interview is scheduled for {interview.startDate} at {interview.startTime}
                    {interview.timezone && ` (${interview.timezone} - ${getTimezoneAbbreviation(interview.timezone)})`}
                  </p>
                </div>
              )}
            </div>
            
            {/* Anomalies list for scheduled interviews */}
            <div id="anomalies-section" className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-medium mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  Anomalies 
                  {anomalies.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {anomalies.length}
                    </span>
                  )}
                </span>
                
                {/* Only use effectiveStatus as a readonly value, do not compare */}
                {/* Show real-time monitoring message for any interview with anomalies */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={() => setSoundEnabled(prev => !prev)}
                      className="h-3 w-3"
                    />
                    <span className="whitespace-nowrap">Sound Alerts</span>
                  </label>
                  
                  {anomalies.length > 0 && (
                    <span className="flex items-center text-sm text-blue-600">
                      <Radio className="h-3 w-3 mr-1 animate-pulse" />
                      Real-time monitoring
                      {newAnomaliesCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full animate-pulse">
                          +{newAnomaliesCount} new
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </h2>
              
              {anomalies.length === 0 ? (
                <p className="text-gray-500">
                  {newAnomaliesCount > 0
                    ? "No anomalies detected yet. Monitoring in real-time." 
                    : "No anomalies detected for this interview yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {anomalies.map((a, i) => (
                    <div
                      key={a.id || i}
                      className={`flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded cursor-pointer ${
                        a.id && newAnomalyIds.has(a.id) 
                          ? (a.severity as string) === 'warning'
                            ? 'bg-yellow-50 border-l-2 border-yellow-500' 
                            : 'bg-red-50 border-l-2 border-red-500'
                          : ''
                      }`}
                      onClick={() => {
                        // Remove from new anomalies when clicked
                        if (a.id && newAnomalyIds.has(a.id)) {
                          const updatedNewIds = new Set(newAnomalyIds);
                          updatedNewIds.delete(a.id);
                          setNewAnomalyIds(updatedNewIds);
                        }
                        
                        // If we have a timeElapsedFormatted, seek to that time
                        if (a.metadata?.timeElapsedFormatted) {
                          seekToTime(a.metadata.timeElapsedFormatted);
                        }
                      }}
                    >
                      <AlertTriangle className={`h-4 w-4 ${
                        a.id && newAnomalyIds.has(a.id) ? 'text-red-500 animate-pulse' :
                        a.severity === 'high' ? 'text-red-500' : 
                        a.severity === 'medium' ? 'text-yellow-500' : 'text-orange-400'
                      }`} />
                      <span className="font-medium">
                        {a.details}
                        {a.id && newAnomalyIds.has(a.id) && (
                          <span className="ml-2 text-xs font-semibold text-red-600">NEW</span>
                        )}
                      </span>
                      {a.metadata?.timeElapsedFormatted && (
                        <span className="text-gray-400">
                          at {a.metadata?.timeElapsedFormatted }
                        </span>
                      )}
                      {a.metadata?.description && (
                        <span className="text-gray-600 ml-2">- {a.metadata.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Add SynchronizedStreams component for live interviews */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Live Stream</h2>
              <SynchronizedStreams 
                sessionId={interview.id}
                onTimeUpdate={handleVideoTimeUpdate}
                ref={synchronizedStreamsRef}
              />
            </div>

            {videoError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-700 text-sm font-medium">{videoError}</p>
                </div>
              </div>
            )}

            {/* New Anomaly Alert */}
            {newAnomalyAlert && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2 animate-pulse">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-700 text-sm font-medium">
                    New suspicious activity detected! Check the anomalies section.
                  </p>
                  {effectiveStatus === InterviewStatus.NotCompleted && (
                    <p className="text-red-600 text-xs mt-1">
                      Real-time monitoring is active - scroll down to see the latest anomalies
                    </p>
                  )}
                  <div className="mt-2">
                    <button 
                      onClick={() => {
                        // Scroll to the anomalies section
                        document.getElementById('anomalies-section')?.scrollIntoView({ behavior: 'smooth' });
                        setNewAnomalyAlert(false);
                      }}
                      className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded"
                    >
                      View Anomalies
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Anomalies list */}
            <div id="anomalies-section" className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  Anomalies 
                  {anomalies.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {anomalies.length}
                    </span>
                  )}
                </span>
                
                {/* Only use effectiveStatus as a readonly value, do not compare */}
                {/* Show real-time monitoring message for any interview with anomalies */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={() => setSoundEnabled(prev => !prev)}
                      className="h-3 w-3"
                    />
                    <span className="whitespace-nowrap">Sound Alerts</span>
                  </label>
                  
                  {anomalies.length > 0 && (
                    <span className="flex items-center text-sm text-blue-600">
                      <Radio className="h-3 w-3 mr-1 animate-pulse" />
                      Real-time monitoring
                      {newAnomaliesCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full animate-pulse">
                          +{newAnomaliesCount} new
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </h2>
              
              {anomalies.length === 0 ? (
                <p className="text-gray-500">
                  {newAnomaliesCount > 0
                    ? "No anomalies detected yet. Monitoring in real-time." 
                    : "No anomalies detected for this interview yet."}
                </p>
              ) : (
                <div className="space-y-2">
                  {anomalies.map((a, i) => (
                    <div
                      key={a.id || i}
                      className={`flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded cursor-pointer ${
                        a.id && newAnomalyIds.has(a.id) 
                          ? (a.severity as string) === 'warning'
                            ? 'bg-yellow-50 border-l-2 border-yellow-500' 
                            : 'bg-red-50 border-l-2 border-red-500'
                          : ''
                      }`}
                      onClick={() => {
                        // Remove from new anomalies when clicked
                        if (a.id && newAnomalyIds.has(a.id)) {
                          const updatedNewIds = new Set(newAnomalyIds);
                          updatedNewIds.delete(a.id);
                          setNewAnomalyIds(updatedNewIds);
                        }
                        
                        // If we have a timeElapsedFormatted, seek to that time
                        if (a.metadata?.timeElapsedFormatted) {
                          seekToTime(a.metadata.timeElapsedFormatted);
                        }
                      }}
                    >
                      <AlertTriangle className={`h-4 w-4 ${
                        a.id && newAnomalyIds.has(a.id) ? 'text-red-500 animate-pulse' :
                        a.severity === 'high' ? 'text-red-500' : 
                        a.severity === 'medium' ? 'text-yellow-500' : 'text-orange-400'
                      }`} />
                      <span className="font-medium">
                        {a.details}
                        {a.id && newAnomalyIds.has(a.id) && (
                          <span className="ml-2 text-xs font-semibold text-red-600">NEW</span>
                        )}
                      </span>
                      {a.metadata?.timeElapsedFormatted && (
                        <span className="text-gray-400">
                          at {a.metadata?.timeElapsedFormatted }
                        </span>
                      )}
                      {a.metadata?.description && (
                        <span className="text-gray-600 ml-2">- {a.metadata.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </>
        )}
      </main>

      {/* Edit Interview Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Interview</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {editError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                {editError}
              </div>
            )}
            
            {updateSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200 flex items-center">
                <Check className="h-4 w-4 mr-2" />
                Interview updated successfully!
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interviewee Email
                </label>
                <input
                  type="email"
                  name="intervieweeEmail"
                  value={editFormData.intervieweeEmail}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={editFormData.startDate}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={editFormData.startTime}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={editFormData.timezone}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {DEFAULT_TIMEZONES.map((tz: string) => (
                    <option key={tz} value={tz}>
                      {tz} ({getTimezoneAbbreviation(tz)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={editFormData.duration}
                  onChange={handleEditInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link
                </label>
                <input
                  type="url"
                  name="meetingLink"
                  value={editFormData.meetingLink}
                  onChange={handleEditInputChange}
                  placeholder="https://zoom.us/j/123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Links Section - Using the same design as CreateInterview */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Interview Links</h3>
                <p className="text-sm text-gray-500">Add URLs that will open when the interview starts.</p>
                
                {editLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => handleEditLinkChange(index, e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {editLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEditLink(index)}
                        className="p-2 text-gray-500 hover:text-red-500 rounded-md hover:bg-gray-100"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addEditLink}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Link
                </button>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInterview}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Interview</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this interview for <span className="font-medium">{interview.candidate}</span>? 
              This action cannot be undone and all data including recordings and anomaly reports will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInterview}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete Interview
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewDetails
