// src/pages/InterviewDetails.tsx

import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, PlayCircle, PauseCircle, SkipBack, SkipForward, RefreshCw, Info } from 'lucide-react'
import { interviewService } from '../firebase/services'
import type { Interview } from '../firebase/types'
import { useAuth } from '../contexts/AuthContext'
import { InterviewStatus } from '../firebase/types'
import SequentialVideoPlayer, { SequentialVideoPlayerHandle } from '../components/SequentialVideoPlayer'

function InterviewDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allInterviews, setAllInterviews] = useState<Interview[]>([])
  const [screenVideoUrls, setScreenVideoUrls] = useState<string[]>([])
  const [webcamVideoUrls, setWebcamVideoUrls] = useState<string[]>([])
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [currentChunk, setCurrentChunk] = useState({ screen: 0, webcam: 0 })
  const [totalChunks, setTotalChunks] = useState({ screen: 0, webcam: 0 })
  
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Initialize refs for direct access to video elements
  const screenPlayerRef = useRef<SequentialVideoPlayerHandle>(null);
  const webcamPlayerRef = useRef<SequentialVideoPlayerHandle>(null);

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
                  return [] as string[];
                });
                
              const webcamPromise = interviewService.getMergedWebcamRecording(interviewData.id)
                .catch(e => {
                  console.error('Failed to fetch webcam recording:', e)
                  return [] as string[];
                });
              
              const [screenUrls, webcamUrls] = await Promise.all([screenPromise, webcamPromise]);
              
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
  
  // Handle video playback loop
  useEffect(() => {
    const updateTimeline = () => {
      if (screenPlayerRef.current) {
        setCurrentTime(screenPlayerRef.current.currentTime)
      } else if (webcamPlayerRef.current) {
        setCurrentTime(webcamPlayerRef.current.currentTime)
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateTimeline)
      }
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateTimeline)
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  // Ensure videos stay in sync
  useEffect(() => {
    const handleVideoPlay = () => {
      setIsPlaying(true);
    };

    const handleVideoPause = () => {
      setIsPlaying(false);
    };
    
    const handleVideoEnded = () => {
      // The sequential player will handle moving to the next chunk
      // We don't need to set isPlaying to false here
    };

    // Use a ref to store the current video elements to avoid dependency issues
    const screenVideo = screenPlayerRef.current?.videoElement;
    const webcamVideo = webcamPlayerRef.current?.videoElement;

    if (screenVideo) {
      screenVideo.addEventListener('play', handleVideoPlay);
      screenVideo.addEventListener('pause', handleVideoPause);
      screenVideo.addEventListener('ended', handleVideoEnded);
    }

    if (webcamVideo) {
      webcamVideo.addEventListener('play', handleVideoPlay);
      webcamVideo.addEventListener('pause', handleVideoPause);
      webcamVideo.addEventListener('ended', handleVideoEnded);
    }

    return () => {
      if (screenVideo) {
        screenVideo.removeEventListener('play', handleVideoPlay);
        screenVideo.removeEventListener('pause', handleVideoPause);
        screenVideo.removeEventListener('ended', handleVideoEnded);
      }

      if (webcamVideo) {
        webcamVideo.removeEventListener('play', handleVideoPlay);
        webcamVideo.removeEventListener('pause', handleVideoPause);
        webcamVideo.removeEventListener('ended', handleVideoEnded);
      }
    };
  // Remove dependencies that change on every render
  }, []);

  // Sync playback between videos
  useEffect(() => {
    const syncVideos = () => {
      const screenVideo = screenPlayerRef.current?.videoElement;
      const webcamVideo = webcamPlayerRef.current?.videoElement;
      
      if (!screenVideo || !webcamVideo) return;
      
      // Sync play events
      const handleScreenPlay = () => {
        if (webcamVideo.paused) {
          webcamVideo.play().catch(e => console.error('Error syncing webcam play:', e));
        }
      };
      
      const handleWebcamPlay = () => {
        if (screenVideo.paused) {
          screenVideo.play().catch(e => console.error('Error syncing screen play:', e));
        }
      };
      
      // Sync pause events
      const handleScreenPause = () => {
        if (!webcamVideo.paused) {
          webcamVideo.pause();
        }
      };
      
      const handleWebcamPause = () => {
        if (!screenVideo.paused) {
          screenVideo.pause();
        }
      };
      
      // Add event listeners
      screenVideo.addEventListener('play', handleScreenPlay);
      webcamVideo.addEventListener('play', handleWebcamPlay);
      screenVideo.addEventListener('pause', handleScreenPause);
      webcamVideo.addEventListener('pause', handleWebcamPause);
      
      // Cleanup function
      return () => {
        screenVideo.removeEventListener('play', handleScreenPlay);
        webcamVideo.removeEventListener('play', handleWebcamPlay);
        screenVideo.removeEventListener('pause', handleScreenPause);
        webcamVideo.removeEventListener('pause', handleWebcamPause);
      };
    };
    
    // Check players every 500ms until both are available
    const intervalId = setInterval(() => {
      if (screenPlayerRef.current?.videoElement && webcamPlayerRef.current?.videoElement) {
        clearInterval(intervalId);
        const cleanup = syncVideos();
        return () => {
          if (cleanup) cleanup();
        };
      }
    }, 500);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const refreshPage = () => {
    window.location.reload();
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

  const {
    candidate,
    position,
    date,
    duration,
    anomalies = [],
  } = interview

  const durationInSeconds =
    parseInt(duration.split(':')[0], 10) * 60 +
    parseInt(duration.split(':')[1], 10)

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`
  }

  const handleTimelineClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!timelineRef.current) return;
    
    const { left, width } = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - left
    const pct = clickX / width
    const newTime = pct * durationInSeconds

    setCurrentTime(newTime)
    setVideoTime(newTime)
  }

  const setVideoTime = (time: number) => {
    if (screenPlayerRef.current) screenPlayerRef.current.seekToTime(time);
    if (webcamPlayerRef.current) webcamPlayerRef.current.seekToTime(time);
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      // Pause both players
      if (screenPlayerRef.current) screenPlayerRef.current.pause();
      if (webcamPlayerRef.current) webcamPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      // Play both players
      if (screenPlayerRef.current) screenPlayerRef.current.play();
      if (webcamPlayerRef.current) webcamPlayerRef.current.play();
      setIsPlaying(true);
    }
  }

  const jumpBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    if (screenPlayerRef.current) screenPlayerRef.current.seekToTime(newTime);
    if (webcamPlayerRef.current) webcamPlayerRef.current.seekToTime(newTime);
  }

  const jumpForward = () => {
    const newTime = Math.min(durationInSeconds, currentTime + 10);
    setCurrentTime(newTime);
    if (screenPlayerRef.current) screenPlayerRef.current.seekToTime(newTime);
    if (webcamPlayerRef.current) webcamPlayerRef.current.seekToTime(newTime);
  }

  const handleVideoTimeUpdate = (time: number) => {
    // Only update if the time difference is significant to avoid small oscillations
    if (Math.abs(time - currentTime) > 0.5) {
      setCurrentTime(time);
    }
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
                interview.status === InterviewStatus.NotCompleted ? 'bg-gray-100 text-gray-600' :
                interview.status === InterviewStatus.Completed ? 'bg-green-100 text-green-600' :
                interview.status === InterviewStatus.SuspiciousActivity ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                {interview.status}
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

        {interview.status === InterviewStatus.NotCompleted ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Interview details will appear here when the interview has started</p>
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
            
            {/* Timeline controls */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-medium">Playback Controls</h2>
                <span className="text-sm text-gray-500">
                  {formatTime(currentTime)} / {duration}
                </span>
              </div>
              
              <div 
                ref={timelineRef}
                className="relative h-6 bg-gray-100 rounded-full cursor-pointer mb-4"
                onClick={handleTimelineClick}
              >
                {/* Progress bar */}
                <div
                  className="absolute h-full bg-blue-100 rounded-l-full"
                  style={{
                    width: `${(currentTime / durationInSeconds) * 100}%`,
                  }}
                />
                {/* Current position indicator */}
                <div 
                  className="absolute h-6 w-6 bg-blue-500 rounded-full -ml-3 top-0"
                  style={{
                    left: `${(currentTime / durationInSeconds) * 100}%`,
                  }}
                />
                {/* Anomaly markers */}
                {anomalies.map((a, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 z-10"
                    style={{
                      left: `${(a.time / durationInSeconds) * 100}%`,
                    }}
                    title={`${a.type} @ ${formatTime(a.time)}`}
                  >
                    <AlertTriangle className="h-4 w-4 text-yellow-500 -ml-2" />
                  </div>
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
                    }}
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
                    }}
                  />
                )}
              </div>
            </div>

            {/* Anomalies list */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-medium mb-4">Anomalies</h2>
              {anomalies.length === 0 ? (
                <p className="text-gray-500">No anomalies detected during this interview.</p>
              ) : (
                <div className="space-y-2">
                  {anomalies.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => {
                        setCurrentTime(a.time);
                        setVideoTime(a.time);
                      }}
                    >
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
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
