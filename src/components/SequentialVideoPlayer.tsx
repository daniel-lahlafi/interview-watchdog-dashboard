import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

interface SequentialVideoPlayerProps {
  videoUrls: string[];
  className?: string;
  onTimeUpdate?: (time: number) => void;
  syncWithVideo?: HTMLVideoElement | null;
  onChunkChange?: (index: number, total: number) => void;
}

export interface SequentialVideoPlayerHandle {
  play: () => void;
  pause: () => void;
  getCurrentChunk: () => number;
  getTotalChunks: () => number;
  seekToTime: (time: number) => void;
  readonly videoElement: HTMLVideoElement | null;
  readonly currentTime: number;
}

const SequentialVideoPlayer = forwardRef<SequentialVideoPlayerHandle, SequentialVideoPlayerProps>(({
  videoUrls,
  className = '',
  onTimeUpdate,
  syncWithVideo,
  onChunkChange
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const sortedUrlsRef = useRef<string[]>([]);
  
  // Track the current URL to avoid duplicate loads
  const currentUrlRef = useRef<string | null>(null);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    play: () => {
      if (videoRef.current) {
        videoRef.current.play().catch(e => 
          console.error('Error playing video:', e)
        );
      }
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    },
    getCurrentChunk: () => currentChunkIndex,
    getTotalChunks: () => sortedUrlsRef.current.length,
    seekToTime: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    get videoElement() {
      return videoRef.current;
    },
    get currentTime() {
      return videoRef.current?.currentTime || 0;
    }
  }), [currentChunkIndex]);
  
  // Sort chunks to ensure correct order - do this once and store the result
  useEffect(() => {
    if (videoUrls.length === 0) return;
    
    console.log(`Received ${videoUrls.length} video chunks, sorting them`);
    
    const sorted = [...videoUrls].sort((a, b) => {
      const aMatch = a.match(/chunk(\d+)/);
      const bMatch = b.match(/chunk(\d+)/);
      
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1], 10);
        const bNum = parseInt(bMatch[1], 10);
        return aNum - bNum;
      }
      
      return a.localeCompare(b, undefined, { numeric: true });
    });
    
    // Only update if the sorted URLs have changed to avoid unnecessary re-renders
    const hasChanged = sorted.length !== sortedUrlsRef.current.length || 
      sorted.some((url, i) => url !== sortedUrlsRef.current[i]);
      
    if (hasChanged) {
      console.log(`Sorted ${sorted.length} video chunks:`, sorted);
      sortedUrlsRef.current = sorted;
      
      // Reset to first chunk when URLs change
      setCurrentChunkIndex(0);
      
      // Notify parent about available chunks
      if (onChunkChange) {
        onChunkChange(0, sorted.length);
      }
    }
  }, [videoUrls, onChunkChange]);
  
  // Handle moving to the next chunk when current one ends
  const handleVideoEnded = useCallback(() => {
    console.log('Video chunk ended, moving to next chunk');
    
    // Use functional update pattern to avoid dependency on currentChunkIndex
    setCurrentChunkIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < sortedUrlsRef.current.length) {
        console.log(`Moving from chunk ${prevIndex} to ${nextIndex}`);
        return nextIndex;
      } else {
        console.log('Reached end of all chunks');
        return prevIndex; // No change if we're at the end
      }
    });
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Track play/pause state
    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    // Handle time updates
    const handleTimeUpdate = () => {
      if (onTimeUpdate && videoRef.current) {
        onTimeUpdate(videoRef.current.currentTime);
      }
    };
    
    // Add event listeners
    const videoElement = videoRef.current;
    videoElement.addEventListener('ended', handleVideoEnded);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      videoElement.removeEventListener('ended', handleVideoEnded);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [handleVideoEnded, onTimeUpdate]);
  
  // Load and play the current chunk
  useEffect(() => {
    if (!videoRef.current || sortedUrlsRef.current.length === 0 || 
        currentChunkIndex >= sortedUrlsRef.current.length) {
      return;
    }
    
    const currentUrl = sortedUrlsRef.current[currentChunkIndex];
    
    // Skip if we're already showing this URL
    if (currentUrl === currentUrlRef.current) {
      return;
    }
    
    console.log(`Loading chunk ${currentChunkIndex + 1}/${sortedUrlsRef.current.length}: ${currentUrl}`);
    currentUrlRef.current = currentUrl;
    
    const wasPlaying = !videoRef.current.paused;
    videoRef.current.src = currentUrl;
    
    // Notify parent about chunk change
    if (onChunkChange) {
      onChunkChange(currentChunkIndex, sortedUrlsRef.current.length);
    }
    
    // Auto-play the chunk if we were already playing
    if (wasPlaying) {
      // Use a timeout to give the browser a moment to load the new source
      const playTimeout = setTimeout(() => {
        if (videoRef.current) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.error('Error playing chunk after change:', e);
            });
          }
        }
      }, 100);
      
      return () => clearTimeout(playTimeout);
    }
  }, [currentChunkIndex, onChunkChange]);
  
  // Sync with another video if provided
  useEffect(() => {
    if (!syncWithVideo || !videoRef.current) return;
    
    const handleSyncPlay = () => {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(e => console.error('Error syncing play:', e));
      }
    };
    
    const handleSyncPause = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    
    const handleSyncTimeUpdate = () => {
      if (videoRef.current && syncWithVideo && 
          Math.abs(videoRef.current.currentTime - syncWithVideo.currentTime) > 0.5) {
        videoRef.current.currentTime = syncWithVideo.currentTime;
      }
    };
    
    syncWithVideo.addEventListener('play', handleSyncPlay);
    syncWithVideo.addEventListener('pause', handleSyncPause);
    syncWithVideo.addEventListener('timeupdate', handleSyncTimeUpdate);
    
    return () => {
      syncWithVideo.removeEventListener('play', handleSyncPlay);
      syncWithVideo.removeEventListener('pause', handleSyncPause);
      syncWithVideo.removeEventListener('timeupdate', handleSyncTimeUpdate);
    };
  }, [syncWithVideo]);

  return (
    <video
      ref={videoRef}
      className={className}
      playsInline
      controls={false}
      muted={false}
    />
  );
});

export default SequentialVideoPlayer; 