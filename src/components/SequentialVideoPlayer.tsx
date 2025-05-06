import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

// Define the handle that will be exposed to parent components
export interface SequentialVideoPlayerHandle {
  play: () => void;
  pause: () => void;
  setTime: (time: number) => void;
  getCurrentChunk: () => number;
}

interface SequentialVideoPlayerProps {
  videoUrls: string[];
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onChunkChange?: (chunkIndex: number) => void;
  className?: string;
  autoPlay?: boolean;
}

// Use forwardRef to properly implement refs
const SequentialVideoPlayer = forwardRef<SequentialVideoPlayerHandle, SequentialVideoPlayerProps>(({
  videoUrls,
  onTimeUpdate,
  onDurationChange,
  onChunkChange,
  className = '',
  autoPlay = true
}, ref) => {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [totalDuration, setTotalDuration] = useState(0);
  const [chunkDurations, setChunkDurations] = useState<number[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Load metadata for all video chunks to calculate total duration
  useEffect(() => {
    const loadMetadata = async () => {
      if (!videoUrls || videoUrls.length === 0) return;
      
      const durations: number[] = [];
      let total = 0;
      
      // Create temporary video elements to get durations
      for (const url of videoUrls) {
        try {
          const video = document.createElement('video');
          video.src = url;
          
          // Get duration when metadata is loaded
          const duration = await new Promise<number>((resolve) => {
            video.addEventListener('loadedmetadata', () => {
              resolve(video.duration);
            });
            
            // Set a timeout to avoid hanging
            setTimeout(() => resolve(0), 5000);
          });
          
          durations.push(duration);
          total += duration;
        } catch (error) {
          console.error('Error loading video metadata:', error);
          durations.push(0);
        }
      }
      
      setChunkDurations(durations);
      setTotalDuration(total);
      
      if (onDurationChange) {
        onDurationChange(total);
      }
    };
    
    loadMetadata();
  }, [videoUrls, onDurationChange]);
  
  // Handle time updates
  const handleTimeUpdate = () => {
    if (videoRef.current && onTimeUpdate) {
      // Calculate the global time based on current chunk and current time
      let globalTime = 0;
      
      // Add durations of all previous chunks
      for (let i = 0; i < currentChunk; i++) {
        globalTime += chunkDurations[i] || 0;
      }
      
      // Add the current time of the current chunk
      globalTime += videoRef.current.currentTime;
      
      onTimeUpdate(globalTime);
    }
  };
  
  // Handle video ending
  const handleEnded = () => {
    if (currentChunk < videoUrls.length - 1) {
      // Move to the next chunk
      setCurrentChunk(prev => {
        const next = prev + 1;
        if (onChunkChange) {
          onChunkChange(next);
        }
        return next;
      });
    } else {
      // End of the last chunk
      setIsPlaying(false);
    }
  };
  
  // Update video playback state when isPlaying changes
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentChunk]);
  
  // Set the current time in the video
  const setVideoTime = (time: number) => {
    if (!videoRef.current || chunkDurations.length === 0) return;
    
    // Find which chunk contains the target time
    let accumulatedTime = 0;
    let targetChunk = 0;
    let targetTime = time;
    
    for (let i = 0; i < chunkDurations.length; i++) {
      const chunkEnd = accumulatedTime + chunkDurations[i];
      
      if (time < chunkEnd) {
        targetChunk = i;
        targetTime = time - accumulatedTime;
        break;
      }
      
      accumulatedTime += chunkDurations[i];
    }
    
    // Change to the target chunk if needed
    if (targetChunk !== currentChunk) {
      setCurrentChunk(targetChunk);
      if (onChunkChange) {
        onChunkChange(targetChunk);
      }
    }
    
    // Set the time within the current chunk
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };
  
  // Expose methods to parent using proper useImperativeHandle syntax
  useImperativeHandle(ref, () => ({
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    setTime: setVideoTime,
    getCurrentChunk: () => currentChunk,
  }));
  
  if (videoUrls.length === 0) {
    return <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-64 ${className}`}>
      <p className="text-gray-500">No video available</p>
    </div>;
  }
  
  return (
    <div className={className}>
      <video
        ref={videoRef}
        src={videoUrls[currentChunk]}
        controls
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full rounded-lg"
      />
      
      {videoUrls.length > 1 && (
        <div className="mt-2 text-xs text-gray-500">
          Playing chunk {currentChunk + 1} of {videoUrls.length}
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
SequentialVideoPlayer.displayName = 'SequentialVideoPlayer';

export default SequentialVideoPlayer; 