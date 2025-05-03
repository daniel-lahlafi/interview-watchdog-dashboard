// src/pages/InterviewDetails.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, PlayCircle, PauseCircle, SkipBack, SkipForward, RefreshCw, Info, Radio } from 'lucide-react'
import interviewService from '../firebase/services'
import type { Interview, Anomaly } from '../firebase/types'
import { useAuth } from '../contexts/AuthContext'
import { InterviewStatus, getEffectiveInterviewStatus, isInterviewLive } from '../firebase/types'
import SequentialVideoPlayer, { SequentialVideoPlayerHandle } from '../components/SequentialVideoPlayer'

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
  const [allInterviews, setAllInterviews] = useState<Interview[]>([])

  // State for videos
  const [screenVideoUrls, setScreenVideoUrls] = useState<string[]>([])
  const [webcamVideoUrls, setWebcamVideoUrls] = useState<string[]>([])
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [currentChunk, setCurrentChunk] = useState({ screen: 0, webcam: 0 })
  const [totalChunks, setTotalChunks] = useState({ screen: 0, webcam: 0 })
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [totalVideoDuration, setTotalVideoDuration] = useState(0)
  
  // State for anomalies
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [newAnomalyAlert, setNewAnomalyAlert] = useState<boolean>(false)
  
  // Refs
  const timelineRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const screenPlayerRef = useRef<SequentialVideoPlayerHandle>(null)
  const webcamPlayerRef = useRef<SequentialVideoPlayerHandle>(null)

  // Add state to track hover on seekbar
  const [isSeekbarHovered, setIsSeekbarHovered] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);
  
  // Callbacks - define all callbacks before effects that use them
  const updatePlayState = useCallback(() => {
    // Check if either video is currently playing
    const screenIsPlaying = screenPlayerRef.current?.videoElement && 
                          !screenPlayerRef.current.videoElement.paused
    const webcamIsPlaying = webcamPlayerRef.current?.videoElement && 
                          !webcamPlayerRef.current.videoElement.paused
    
    // If either video is playing, consider the state as playing
    const newIsPlaying = Boolean(screenIsPlaying || webcamIsPlaying)
    
    // Only update if the state has changed
    if (newIsPlaying !== isPlaying) {
      console.log(`Updating play state to: ${newIsPlaying}`)
      setIsPlaying(newIsPlaying)
    }
  }, [isPlaying])

  const handleDurationChange = useCallback((duration: number) => {
    console.log(`Total video duration updated: ${duration.toFixed(2)}s`)
    setTotalVideoDuration(duration)
  }, [])

  const handleVideoTimeUpdate = useCallback((time: number) => {
    // Only update if the time difference is significant to avoid small oscillations
    if (Math.abs(time - currentTime) > 0.5) {
      setCurrentTime(time)
    }
  }, [currentTime])

  // Function to handle mouse move over the seekbar
  const handleSeekbarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const { left, width } = timelineRef.current.getBoundingClientRect();
      const mouseX = e.clientX - left;
      const boundedMouseX = Math.max(0, Math.min(mouseX, width));
      setHoverPosition(boundedMouseX / width);
    }
  };

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
          
          // Check if the interview is completed
          if (interviewData && interviewData.status !== InterviewStatus.NotCompleted) {
            setLoadingVideo(true)
            console.log('Interview is completed, loading videos')
            
            try {
              // Fetch all chunks for both videos
              const screenPromise = interviewService.getMergedScreenRecording(interviewData.id)
                .catch(e => {
                  console.error('Failed to fetch screen recording:', e)
                  return [] as string[]
                })
                
              const webcamPromise = interviewService.getMergedWebcamRecording(interviewData.id)
                .catch(e => {
                  console.error('Failed to fetch webcam recording:', e)
                  return [] as string[]
                })
              
              const [screenUrls, webcamUrls] = await Promise.all([screenPromise, webcamPromise])
              
              console.log('Videos fetched:', { 
                screenUrls: screenUrls.length > 0 ? screenUrls.length : 0, 
                webcamUrls: webcamUrls.length > 0 ? webcamUrls.length : 0 
              })
              
              if (screenUrls.length === 0 && webcamUrls.length === 0) {
                setVideoError('Could not load any video recordings. Try refreshing the page.')
              } else {
                if (screenUrls.length === 0) {
                  setVideoError('Screen recording could not be loaded.')
                } else if (webcamUrls.length === 0) {
                  setVideoError('Webcam recording could not be loaded.')
                }
                
                setScreenVideoUrls(screenUrls)
                setWebcamVideoUrls(webcamUrls)
              }
            } catch (videoErr) {
              console.error('Error loading videos:', videoErr)
              setVideoError('Failed to load video recordings. Please try refreshing.')
            } finally {
              setLoadingVideo(false)
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current)
                loadingTimeoutRef.current = null
              }
            }
          }
        }
        
        console.log(`Fetching interviews for user ID: ${user?.uid}`)
        const interviews = await interviewService.getInterviewsByInterviewer(user?.uid ?? '')
        setAllInterviews(interviews)
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
  
  // 2. Animation frame effect for playback tracking
  useEffect(() => {
    const updateTimeline = () => {
      // Get the current time from either video
      if (screenPlayerRef.current) {
        setCurrentTime(screenPlayerRef.current.currentTime)
      } else if (webcamPlayerRef.current) {
        setCurrentTime(webcamPlayerRef.current.currentTime)
      }

      // Only continue the animation frame if we're playing
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateTimeline)
      }
    }

    // Start or stop the animation frame based on playing state
    if (isPlaying) {
      console.log('Starting playback tracking')
      animationRef.current = requestAnimationFrame(updateTimeline)
    } else if (animationRef.current) {
      console.log('Stopping playback tracking')
      cancelAnimationFrame(animationRef.current)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  // 3. Video event listeners effect
  useEffect(() => {
    // Flag to track if we're in the middle of a chunk transition
    let isTransitioning = false
    
    // Create a debounced update function to avoid rapid state changes
    let updateTimeout: NodeJS.Timeout | null = null
    const debouncedUpdatePlayState = () => {
      if (updateTimeout) clearTimeout(updateTimeout)
      updateTimeout = setTimeout(() => {
        if (!isTransitioning) {
          updatePlayState()
        }
      }, 100)
    }
    
    const handleVideoPlay = () => {
      console.log('Video play event detected')
      setIsPlaying(true)
    }

    const handleVideoPause = () => {
      console.log('Video pause event detected')
      // Don't immediately update play state, wait to see if it's just a transition
      debouncedUpdatePlayState()
    }
    
    const handleVideoEnded = () => {
      // Set the transition flag to prevent unwanted state updates
      isTransitioning = true
      console.log('Video ended event detected - transitioning to next chunk')
      
      // Reset the transition flag after a delay
      setTimeout(() => {
        isTransitioning = false
      }, 1000) // Longer timeout to cover the entire transition
    }
    
    const handleChunkChange = () => {
      // Mark that we're in a transition
      isTransitioning = true
      console.log('Chunk changing, maintaining play state')
      
      // Reset the transition flag after a delay
      setTimeout(() => {
        isTransitioning = false
      }, 1000)
    }

    // Set up event listeners on both videos
    const screenVideo = screenPlayerRef.current?.videoElement
    const webcamVideo = webcamPlayerRef.current?.videoElement

    if (screenVideo) {
      screenVideo.addEventListener('play', handleVideoPlay)
      screenVideo.addEventListener('pause', handleVideoPause)
      screenVideo.addEventListener('ended', handleVideoEnded)
      screenVideo.addEventListener('seeking', handleChunkChange)
    }

    if (webcamVideo) {
      webcamVideo.addEventListener('play', handleVideoPlay)
      webcamVideo.addEventListener('pause', handleVideoPause)
      webcamVideo.addEventListener('ended', handleVideoEnded)
      webcamVideo.addEventListener('seeking', handleChunkChange)
    }

    return () => {
      if (updateTimeout) clearTimeout(updateTimeout)
      
      if (screenVideo) {
        screenVideo.removeEventListener('play', handleVideoPlay)
        screenVideo.removeEventListener('pause', handleVideoPause)
        screenVideo.removeEventListener('ended', handleVideoEnded)
        screenVideo.removeEventListener('seeking', handleChunkChange)
      }

      if (webcamVideo) {
        webcamVideo.removeEventListener('play', handleVideoPlay)
        webcamVideo.removeEventListener('pause', handleVideoPause)
        webcamVideo.removeEventListener('ended', handleVideoEnded)
        webcamVideo.removeEventListener('seeking', handleChunkChange)
      }
    }
  }, [updatePlayState])

  // 4. Periodic sync effect
  useEffect(() => {
    const checkInterval = setInterval(() => {
      updatePlayState()
    }, 500)
    
    return () => {
      clearInterval(checkInterval)
    }
  }, [updatePlayState])

  // 5. Video time sync effect
  useEffect(() => {
    const syncVideosTime = () => {
      const screenVideo = screenPlayerRef.current?.videoElement
      const webcamVideo = webcamPlayerRef.current?.videoElement
      
      if (!screenVideo || !webcamVideo) return
      
      // Only sync if the difference is significant (more than 0.3 seconds)
      const timeDifference = Math.abs(screenVideo.currentTime - webcamVideo.currentTime)
      if (timeDifference > 0.3) {
        // Don't sync during seeking operations to avoid loops
        if (!screenVideo.seeking && !webcamVideo.seeking) {
          // Use screen video as the primary source of truth
          console.log(`Syncing video times (diff: ${timeDifference.toFixed(2)}s)`)
          webcamVideo.currentTime = screenVideo.currentTime
        }
      }
    }
    
    // Run the sync function periodically
    const syncInterval = setInterval(syncVideosTime, 2000)
    
    return () => {
      clearInterval(syncInterval)
    }
  }, [])

  // New effect for anomaly detection
  useEffect(() => {
    // Skip if no interview loaded yet
    if (!interview || !id) return;
    
    // Initialize anomalies from the interview if available
    if (interview.anomalies && interview.anomalies.length > 0) {
      setAnomalies(interview.anomalies);
    }
    
    console.log(`Setting up anomaly detection for interview ${id}, status: ${interview.status}`);
    
    // Check if this is a live interview
    const isLive = interview.status === InterviewStatus.Live;
    
    // Callback function to handle anomaly updates
    const handleAnomalyUpdate = (updatedAnomalies: Anomaly[]) => {
      console.log(`Received ${updatedAnomalies.length} anomalies`);
      
      // Check if there are any new anomalies
      if (updatedAnomalies.length > anomalies.length) {
        // Show notification for new anomalies
        setNewAnomalyAlert(true);
        
        // Hide the notification after a few seconds
        setTimeout(() => {
          setNewAnomalyAlert(false);
        }, 5000);
      }
      
      // Update anomalies state
      setAnomalies(updatedAnomalies);
    };
    
    // Set up anomaly detection listener
    const unsubscribe = interviewService.getAnomalies(id, isLive, handleAnomalyUpdate);
    
    // Clean up listener when component unmounts or interview changes
    return () => {
      unsubscribe();
    };
  }, [id, interview]);

  // Event handlers
  const refreshPage = () => {
    window.location.reload()
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    
    const { left, width } = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - left
    
    // Limit click position to within the timeline bounds
    const boundedClickX = Math.max(0, Math.min(clickX, width))
    const pct = boundedClickX / width
    
    // Calculate the new time position
    const newTime = pct * durationInSeconds

    console.log(`Seeking to position: ${newTime.toFixed(2)}s (${(pct * 100).toFixed(2)}% of ${durationInSeconds.toFixed(2)}s)`)
    
    setCurrentTime(newTime)
    setVideoTime(newTime)
  }

  const setVideoTime = (time: number) => {
    // First seek the screen recording
    if (screenPlayerRef.current) {
      screenPlayerRef.current.seekToTime(time)
      
      // Also explicitly seek the webcam to maintain sync
      // (Don't rely solely on the sync mechanism)
      if (webcamPlayerRef.current) {
        webcamPlayerRef.current.seekToTime(time)
        console.log('Seeking both videos to:', time.toFixed(2))
      } else {
        console.log('Only screen video present, seeking to:', time.toFixed(2))
      }
    } 
    // If no screen recording, seek webcam directly
    else if (webcamPlayerRef.current) {
      console.log('Only webcam video present, seeking to:', time.toFixed(2))
      webcamPlayerRef.current.seekToTime(time)
    }
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      // Pause both players
      if (screenPlayerRef.current) screenPlayerRef.current.pause()
      if (webcamPlayerRef.current) webcamPlayerRef.current.pause()
      setIsPlaying(false)
    } else {
      // Play both players
      if (screenPlayerRef.current) screenPlayerRef.current.play()
      if (webcamPlayerRef.current) webcamPlayerRef.current.play()
      setIsPlaying(true)
    }
  }

  const jumpBackward = () => {
    const newTime = Math.max(0, currentTime - 10)
    setCurrentTime(newTime)
    setVideoTime(newTime)
  }

  const jumpForward = () => {
    const newTime = Math.min(durationInSeconds, currentTime + 10)
    setCurrentTime(newTime)
    setVideoTime(newTime)
  }

  // Computed values
  const durationInSeconds = totalVideoDuration > 0 
    ? totalVideoDuration 
    : (interview && interview.duration 
      ? parseInt(interview.duration.split(':')[0], 10) * 60 + parseInt(interview.duration.split(':')[1], 10)
      : 0)
  
  // Calculate the current progress percentage safely
  const calculateProgressPercentage = () => {
    if (!durationInSeconds || durationInSeconds <= 0) return 0;
    // Ensure the percentage never exceeds 100%
    return Math.min(100, (currentTime / durationInSeconds) * 100);
  }

  // Safely calculate any time position as a percentage
  const timeToPercentage = (time: number) => {
    if (!durationInSeconds || durationInSeconds <= 0) return 0;
    return Math.min(100, (time / durationInSeconds) * 100);
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Function to get destructured values safely from the interview
  const getInterviewDetails = () => {
    if (!interview) return {
      candidate: '',
      position: '',
      date: '',
      duration: '',
    };
    
    const {
      candidate,
      position,
      date,
      duration,
    } = interview;
    
    return { candidate, position, date, duration };
  };

  // Extract values from interview
  const { candidate, position, date, duration } = getInterviewDetails();

  // Add a live badge at the top of the page if it's currently live
  const effectiveStatus = interview ? getEffectiveInterviewStatus(interview) : InterviewStatus.NotCompleted;

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
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white overflow-auto">
        <h2 className="px-4 py-3 font-semibold text-gray-800">
          All Interviews
        </h2>
        <ul>
          {allInterviews.map((iv) => (
            <li
              key={iv.id}
              onClick={() => navigate(`/interviews/${iv.id}`)}
              className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                iv.id === interview.id
                  ? "bg-gray-100"
                  : ""
              }`}
            >
              <Eye className="h-4 w-4 text-gray-600 mr-2" />
              <span className="text-sm text-gray-700">
                {iv.candidate}
              </span>
            </li>
          ))}
        </ul>
      </aside>

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
          <p className="text-sm text-gray-500">
            {position} • {date}
          </p>
          </div>
          
          <button 
            onClick={refreshPage}
            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
            title="Refresh page"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </header>

        {effectiveStatus === InterviewStatus.Live && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <Radio className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-blue-700 text-sm font-medium">
                This interview is currently live
              </p>
              <p className="text-blue-600 text-xs">
                Started at {interview.startTime} ({interview.timezone}) and runs for {interview.duration} minutes
              </p>
            </div>
          </div>
        )}

        {interview.status === InterviewStatus.NotCompleted ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Interview details will appear here when the interview has started</p>
            
            {/* Display scheduling information if available */}
            {interview.startDate && interview.startTime && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h3 className="font-medium text-blue-800">Scheduled Interview</h3>
                <p className="text-blue-600">
                  This interview is scheduled for {interview.startDate} at {interview.startTime}
                  {interview.timezone && ` (${interview.timezone} - ${getTimezoneAbbreviation(interview.timezone)})`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
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
                </div>
              </div>
            )}

            {/* Timeline controls */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-medium">Playback Controls</h2>
                <span className="text-sm text-gray-500">
                  {formatTime(currentTime)} / {totalVideoDuration > 0 ? formatTime(totalVideoDuration) : duration}
                </span>
              </div>
              
              <div
                ref={timelineRef}
                className="relative h-8 bg-gray-100 rounded-full cursor-pointer mb-4 shadow-inner overflow-hidden group"
                onClick={handleTimelineClick}
                onMouseEnter={() => setIsSeekbarHovered(true)}
                onMouseLeave={() => setIsSeekbarHovered(false)}
                onMouseMove={handleSeekbarMouseMove}
              >
                {/* Background track */}
                <div className="absolute h-full w-full bg-gray-200"></div>
                
                {/* Progress bar - played section */}
                <div
                  className="absolute h-full bg-gradient-to-r from-blue-300 to-blue-400 rounded-l-full transition-all duration-100"
                  style={{
                    width: `${calculateProgressPercentage()}%`,
                  }}
                />
                
                {/* Hover indicator */}
                {isSeekbarHovered && (
                  <>
                    {/* Hover position line */}
                    <div 
                      className="absolute h-full w-px bg-gray-700 z-10"
                      style={{ left: `${hoverPosition * 100}%` }}
                    />
                    {/* Hover time tooltip */}
                    <div 
                      className="absolute -top-8 py-1 px-2 bg-gray-800 text-white text-xs rounded transform -translate-x-1/2 opacity-90 z-40 font-medium"
                      style={{ left: `${hoverPosition * 100}%` }}
                    >
                      {formatTime(hoverPosition * durationInSeconds)}
                    </div>
                  </>
                )}
                
                {/* Progress indicator line */}
                <div 
                  className="absolute h-full w-1 bg-white shadow-md z-30 transition-all duration-100"
                  style={{
                    left: `${calculateProgressPercentage()}%`,
                  }}
                />
                
                {/* Anomaly markers */}
                {anomalies.map((a, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 z-20"
                    style={{
                      left: `${timeToPercentage(a.time)}%`,
                    }}
                    title={`${a.type} @ ${formatTime(a.time)}`}
                  >
                    <div className="h-6 w-1 bg-yellow-500 rounded-full shadow-md"></div>
                    <AlertTriangle className="h-4 w-4 text-yellow-500 -ml-1.5 -mt-5" />
                  </div>
                ))}
                
                {/* Time markers */}
                <div className="absolute top-0 left-0 w-full h-full flex justify-between pointer-events-none">
                  {durationInSeconds > 0 && [0, 0.25, 0.5, 0.75, 1].map((percentage) => (
                    <div 
                      key={percentage}
                      className="h-2 w-px bg-gray-300 absolute top-3"
                      style={{ left: `${percentage * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Time labels */}
              <div className="flex justify-between text-xs text-gray-500 px-1 -mt-2 mb-4">
                {durationInSeconds > 0 && [0, 0.25, 0.5, 0.75, 1].map((percentage) => (
                  <span key={percentage}>
                    {formatTime(percentage * durationInSeconds)}
                  </span>
                ))}
              </div>
              
              {/* Control buttons */}
              <div className="flex justify-center items-center gap-4">
                <button 
                  onClick={jumpBackward}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Jump back 10 seconds"
                >
                  <SkipBack className="h-6 w-6 text-gray-700" />
                </button>
                <button 
                  onClick={togglePlayPause}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <PauseCircle className="h-8 w-8 text-blue-600" />
                  ) : (
                    <PlayCircle className="h-8 w-8 text-blue-600" />
                  )}
                </button>
                <button 
                  onClick={jumpForward}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Jump forward 10 seconds"
                >
                  <SkipForward className="h-6 w-6 text-gray-700" />
                </button>
              </div>
            </div>
            
            {/* Videos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-lg font-medium mb-4">
                  Screen Recording
                  {screenVideoUrls.length > 1 && (
                    <span className="ml-2 text-sm text-gray-500">
                      (Chunk {currentChunk.screen + 1}/{totalChunks.screen})
                    </span>
                  )}
                </h2>
                {loadingVideo ? (
                  <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
                    <p className="text-white">Loading video...</p>
                  </div>
                ) : screenVideoUrls.length === 0 ? (
                  <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No screen recording available</p>
                  </div>
                ) : (
                  <SequentialVideoPlayer
                    ref={screenPlayerRef}
                    videoUrls={screenVideoUrls}
                    className="w-full aspect-video bg-black rounded-lg"
                    onTimeUpdate={handleVideoTimeUpdate}
                    onChunkChange={(index, total) => {
                      setCurrentChunk(prev => ({ ...prev, screen: index }));
                      setTotalChunks(prev => ({ ...prev, screen: total }));
                      
                      // When screen video changes chunks, make sure webcam is in sync
                      if (webcamPlayerRef.current && screenPlayerRef.current) {
                        const currentTime = screenPlayerRef.current.currentTime;
                        webcamPlayerRef.current.seekToTime(currentTime);
                      }
                    }}
                    onDurationChange={handleDurationChange}
                  />
                )}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="text-lg font-medium mb-4">
                  Webcam Recording
                  {webcamVideoUrls.length > 1 && (
                    <span className="ml-2 text-sm text-gray-500">
                      (Chunk {currentChunk.webcam + 1}/{totalChunks.webcam})
                    </span>
                  )}
                </h2>
                {loadingVideo ? (
                  <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center">
                    <p className="text-white">Loading video...</p>
                  </div>
                ) : webcamVideoUrls.length === 0 ? (
                  <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No webcam recording available</p>
                  </div>
                ) : (
                  <SequentialVideoPlayer
                    ref={webcamPlayerRef}
                    videoUrls={webcamVideoUrls}
                    className="w-full aspect-video bg-black rounded-lg"
                    onTimeUpdate={handleVideoTimeUpdate}
                    onChunkChange={(index, total) => {
                      setCurrentChunk(prev => ({ ...prev, webcam: index }));
                      setTotalChunks(prev => ({ ...prev, webcam: total }));
                      
                      // When webcam video changes chunks, make sure screen is in sync
                      if (screenPlayerRef.current && webcamPlayerRef.current) {
                        const currentTime = webcamPlayerRef.current.currentTime;
                        screenPlayerRef.current.seekToTime(currentTime);
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Anomalies list */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-medium mb-4">
                Anomalies 
                {anomalies.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    {anomalies.length}
                  </span>
                )}
              </h2>
              {anomalies.length === 0 ? (
                <p className="text-gray-500">
                  {interview?.status === InterviewStatus.Live 
                    ? "No anomalies detected yet. Monitoring in real-time." 
                    : "No anomalies detected during this interview."}
                </p>
              ) : (
                <div className="space-y-2">
                  {anomalies.map((a, i) => (
                    <div
                      key={a.id || i}
                      className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => {
                        setCurrentTime(a.time);
                        setVideoTime(a.time);
                      }}
                    >
                      <AlertTriangle className={`h-4 w-4 ${
                        a.severity === 'high' ? 'text-red-500' : 
                        a.severity === 'medium' ? 'text-yellow-500' : 'text-orange-400'
                      }`} />
                      <span className="font-medium">{a.type}</span>
                      <span className="text-gray-400">
                        at {formatTime(a.time)}
                      </span>
                      {a.description && (
                        <span className="text-gray-600 ml-2">- {a.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chunk information */}
            {(totalChunks.screen > 1 || totalChunks.webcam > 1) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-blue-700 text-sm font-medium">Video chunks playing sequentially</p>
                  <div className="text-blue-600 text-xs mt-1">
                    {totalChunks.screen > 1 && (
                      <p>Screen recording: Playing chunk {currentChunk.screen + 1} of {totalChunks.screen}</p>
                    )}
                    {totalChunks.webcam > 1 && (
                      <p>Webcam recording: Playing chunk {currentChunk.webcam + 1} of {totalChunks.webcam}</p>
                    )}
                    <p className="mt-1">Each chunk will automatically play when the previous one finishes.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default InterviewDetails
