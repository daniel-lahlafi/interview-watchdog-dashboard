import React, { useEffect, useRef, useState } from 'react';
import LiveStreamPlayer from './LiveStreamPlayer';

interface SynchronizedStreamsProps {
  sessionId: string;
  seekTime?: string; // MM:SS format
  onTimeUpdate?: (time: number) => void;
}

export const SynchronizedStreams: React.FC<SynchronizedStreamsProps> = ({ 
  sessionId, 
  seekTime,
  onTimeUpdate 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0); // Default to 1 hour
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Use refs instead of state to track real-time values
  const cameraTimeRef = useRef<number>(0);
  const screenTimeRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Update isPlayingRef whenever isPlaying state changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    console.log("isPlaying state changed to:", isPlaying);
  }, [isPlaying]);
  
  // Effect to update duration when videos are loaded
  useEffect(() => {
    const updateDuration = () => {
      if (cameraVideoRef.current && cameraVideoRef.current.duration && screenVideoRef.current && screenVideoRef.current.duration) {
        const cameraDuration = cameraVideoRef.current.duration;
        const screenDuration = screenVideoRef.current.duration;
        const maxDuration = Math.max(cameraDuration, screenDuration);
        if (cameraDuration !== Infinity && cameraDuration > 0 && screenDuration !== Infinity && screenDuration > 0) {
          setDuration(maxDuration);
        }
      }
    };
    
    const cameraVideo = cameraVideoRef.current;
    if (cameraVideo) {
      cameraVideo.addEventListener('loadedmetadata', updateDuration);
      cameraVideo.addEventListener('durationchange', updateDuration);
    }
    
    return () => {
      if (cameraVideo) {
        cameraVideo.removeEventListener('loadedmetadata', updateDuration);
        cameraVideo.removeEventListener('durationchange', updateDuration);
      }
    };
  }, []);
  
  // Combined time update handler for both videos
  const handleTimeUpdate = (time: number, source: 'camera' | 'screen') => {
    console.log("handleTimeUpdate", time, source, isDragging);
    if (isDragging) {
      return;
    }

    // Update the appropriate time based on source
    if (source === 'camera') {
      cameraTimeRef.current = time;
    } else {
      screenTimeRef.current = time;
    }
    
    // Get the current values from refs
    const currentCameraTime = cameraTimeRef.current;
    const currentScreenTime = screenTimeRef.current;
    const currentIsPlaying = isPlayingRef.current;
    
    // Update the current time display with the max of both times
    const maxTime = Math.max(currentCameraTime, currentScreenTime);
    setCurrentTime(maxTime);
    
    // Update the parent component
    onTimeUpdate?.(maxTime);
    
    // Only check sync if both videos have valid times and are playing
    if (currentIsPlaying && currentCameraTime > 0 && currentScreenTime > 0 && !isDragging) {
      // Calculate time difference between videos
      const timeDiff = Math.abs(currentCameraTime - currentScreenTime);
      
      // Only sync if videos are out of sync by more than 2 seconds
      // AND we haven't synced in the last 2 seconds (to avoid too frequent syncs)
      const now = Date.now();
      if (timeDiff > 2 && now - lastSyncTimeRef.current > 2000) {
        // Update last sync time
        lastSyncTimeRef.current = now;
        
        const maxTime = Math.max(currentCameraTime, currentScreenTime);
        console.log(`Syncing videos: Camera ${currentCameraTime}, Screen ${currentScreenTime}, Gap ${timeDiff}s, Target ${maxTime}`);
        
        // Only seek the videos if we have refs to them
        if (cameraVideoRef.current && screenVideoRef.current) {
          // Set both videos to the max time
          cameraVideoRef.current.currentTime = maxTime;
          screenVideoRef.current.currentTime = maxTime;
          
          // Update our stored times
          cameraTimeRef.current = maxTime;
          screenTimeRef.current = maxTime;
          
          // Update the UI time
          setCurrentTime(maxTime);
          
          // Update the parent component
          onTimeUpdate?.(maxTime);
        }
      }
    }
  };
  
  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleLiveStreamTimeUpdate = (time: number) => {
    if (cameraVideoRef.current && screenVideoRef.current) {
      cameraVideoRef.current.currentTime = time;
      screenVideoRef.current.currentTime = time;
      cameraTimeRef.current = time;
      screenTimeRef.current = time;
      setCurrentTime(time);
    }
  };
  
  // Timeline click handler
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickPosition / rect.width));
    const newTime = percentage * duration;
    
    console.log(`Timeline clicked: ${percentage * 100}%, time: ${newTime}s`);
    
    if (cameraVideoRef.current && screenVideoRef.current) {
      cameraVideoRef.current.currentTime = newTime;
      screenVideoRef.current.currentTime = newTime;
      cameraTimeRef.current = newTime;
      screenTimeRef.current = newTime;
      setCurrentTime(newTime);
      // onTimeUpdate?.(newTime);
    }
  };
  
  // Mouse down handler for timeline dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };
  
  // Mouse move handler for timeline dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const movePosition = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percentage = movePosition / rect.width;
    const newTime = percentage * duration;
    
    // Only seek the camera video - sync function will handle the screen video
    if (cameraVideoRef.current && screenVideoRef.current) {
      cameraVideoRef.current.currentTime = newTime;
      screenVideoRef.current.currentTime = newTime;
      cameraTimeRef.current = newTime;
      screenTimeRef.current = newTime;
      setCurrentTime(newTime);
      // onTimeUpdate?.(newTime);
    }
  };
  
  // Mouse up handler for timeline dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Effect to handle mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);
  
  const handlePlayPause = () => {
    const newPlayState = !isPlaying;
    setIsPlaying(newPlayState);
    isPlayingRef.current = newPlayState; // Update ref immediately
    console.log("Play button clicked, isPlaying set to:", newPlayState);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
        <div className="text-yellow-600 text-lg font-medium mb-2">
          <svg className="inline-block w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          Stream Error
        </div>
        <p className="text-yellow-700 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="aspect-video">
          <LiveStreamPlayer
            sessionId={sessionId}
            streamType="camera"
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeUpdate={(time) => handleTimeUpdate(time, 'camera')}
            videoRef={cameraVideoRef}
            onPlayPause={handlePlayPause}
            duration={duration}
            onLiveStreamTimeUpdate={handleLiveStreamTimeUpdate}
          />
        </div>
        
        <div className="aspect-video">
          <LiveStreamPlayer
            sessionId={sessionId}
            streamType="screen"
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeUpdate={(time) => handleTimeUpdate(time, 'screen')}
            videoRef={screenVideoRef}
            onPlayPause={handlePlayPause}
            duration={duration}
            onLiveStreamTimeUpdate={handleLiveStreamTimeUpdate}
          />
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={handlePlayPause}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            )}
          </button>
          
          <div className="flex-1">
            <div
              ref={timelineRef}
              className="h-2 bg-gray-200 rounded-full cursor-pointer relative"
              onClick={handleTimelineClick}
            >
              <div
                className="absolute h-full bg-blue-600 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              <div
                className="absolute w-4 h-4 bg-blue-600 rounded-full -top-1 cursor-grab active:cursor-grabbing transform -translate-x-1/2 hover:scale-110 transition-transform"
                style={{ left: `${(currentTime / duration) * 100}%` }}
                onMouseDown={handleMouseDown}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynchronizedStreams; 