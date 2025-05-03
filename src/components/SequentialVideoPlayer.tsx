import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

interface SequentialVideoPlayerProps {
  videoUrls: string[];
  className?: string;
  onTimeUpdate?: (time: number) => void;
  syncWithVideo?: HTMLVideoElement | null;
  onChunkChange?: (index: number, total: number) => void;
  onDurationChange?: (duration: number) => void;
}

export interface SequentialVideoPlayerHandle {
  play: () => void;
  pause: () => void;
  getCurrentChunk: () => number;
  getTotalChunks: () => number;
  seekToTime: (time: number) => void;
  getTotalDuration: () => number;
  readonly videoElement: HTMLVideoElement | null;
  readonly currentTime: number;
}

interface ChunkDuration {
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
}

const SequentialVideoPlayer = forwardRef<SequentialVideoPlayerHandle, SequentialVideoPlayerProps>(({
  videoUrls,
  className = '',
  onTimeUpdate,
  syncWithVideo,
  onChunkChange,
  onDurationChange
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const sortedUrlsRef = useRef<string[]>([]);
  
  // Track the current URL to avoid duplicate loads
  const currentUrlRef = useRef<string | null>(null);
  
  // Add a ref for preloading the next chunk
  const preloadVideoRef = useRef<HTMLVideoElement | null>(null);
  const preloadingIndexRef = useRef<number>(-1);
  
  // Store information about chunk durations and total video length
  const chunkDurationsRef = useRef<ChunkDuration[]>([]);
  const totalDurationRef = useRef<number>(0);
  const measuringDurationsRef = useRef<boolean>(false);
  const durationMeasuredChunksRef = useRef<Set<number>>(new Set());
  
  // Keep track of actual playback time across all chunks
  const globalTimeRef = useRef<number>(0);
  const lastChunkTimeRef = useRef<number>(0);
  
  // Special flag to track when a chunk change is due to auto-progressing to next chunk
  const autoProgressingRef = useRef<boolean>(false);
  // Flag to prevent play/pause events during chunk transitions
  const isTransitioningRef = useRef<boolean>(false);
  
  // Create the preload video element on component mount
  useEffect(() => {
    preloadVideoRef.current = document.createElement('video');
    preloadVideoRef.current.preload = 'auto';
    
    return () => {
      if (preloadVideoRef.current) {
        preloadVideoRef.current.src = '';
        preloadVideoRef.current = null;
      }
    };
  }, []);
  
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
      // Find the chunk that contains the requested time
      seekToGlobalTime(time);
    },
    getTotalDuration: () => totalDurationRef.current,
    get videoElement() {
      return videoRef.current;
    },
    get currentTime() {
      // Return the global time position
      return getGlobalCurrentTime();
    }
  }), [currentChunkIndex]);
  
  // Calculate the current global time based on previous chunks and current position
  const getGlobalCurrentTime = useCallback(() => {
    if (!videoRef.current) return 0;
    
    // Calculate sum of durations of all fully played chunks
    let previousChunksDuration = 0;
    for (let i = 0; i < currentChunkIndex; i++) {
      const chunkInfo = chunkDurationsRef.current.find(c => c.index === i);
      if (chunkInfo) {
        previousChunksDuration += chunkInfo.duration;
      }
    }
    
    // Add the current position within this chunk
    return previousChunksDuration + (videoRef.current.currentTime || 0);
  }, [currentChunkIndex]);
  
  // Function to seek to a global time position
  const seekToGlobalTime = useCallback((globalTime: number) => {
    if (chunkDurationsRef.current.length === 0) {
      console.warn('Cannot seek: chunk durations not yet calculated');
      
      // Fallback: use basic positioning based on chunk index
      if (videoRef.current && sortedUrlsRef.current.length > 0) {
        // Estimate chunk duration at 4 seconds
        const estimatedChunkDuration = 1;
        const totalDuration = sortedUrlsRef.current.length * estimatedChunkDuration;
        
        // Calculate which chunk should contain this time
        const targetChunkIndex = Math.min(
          Math.floor(globalTime / estimatedChunkDuration),
          sortedUrlsRef.current.length - 1
        );
        
        // Calculate time within that chunk
        const timeWithinChunk = globalTime - (targetChunkIndex * estimatedChunkDuration);
        
        console.log(`Using fallback seek: chunk ${targetChunkIndex}, time ${timeWithinChunk.toFixed(2)}s`);
        
        // Change to the target chunk if needed
        if (targetChunkIndex !== currentChunkIndex) {
          lastChunkTimeRef.current = timeWithinChunk;
          setCurrentChunkIndex(targetChunkIndex);
        } else {
          // Just seek within current chunk
          videoRef.current.currentTime = timeWithinChunk;
        }
      }
      return;
    }
    
    if (!videoRef.current) return;
    
    console.log(`Seeking to global time: ${globalTime.toFixed(2)}s`);
    
    // Find the chunk that contains the target time
    let targetChunk = 0;
    let timeWithinChunk = globalTime;
    
    // If we have duration info, find the correct chunk
    if (chunkDurationsRef.current.length > 0) {
      for (let i = 0; i < chunkDurationsRef.current.length; i++) {
        const chunk = chunkDurationsRef.current[i];
        
        // Check if this chunk contains our target time
        if (globalTime >= chunk.startTime && globalTime < chunk.endTime) {
          targetChunk = chunk.index;
          timeWithinChunk = globalTime - chunk.startTime;
          break;
        }
        
        // If we're at the last chunk and the time is beyond its end, 
        // place at the end of the last chunk
        if (i === chunkDurationsRef.current.length - 1 && globalTime >= chunk.endTime) {
          targetChunk = chunk.index;
          timeWithinChunk = chunk.duration;
        }
      }
    }
    
    console.log(`Found target chunk: ${targetChunk}, time within chunk: ${timeWithinChunk.toFixed(2)}s`);
    
    // If we need to change chunks
    if (targetChunk !== currentChunkIndex) {
      // Store the time to seek to after the chunk is loaded
      lastChunkTimeRef.current = timeWithinChunk;
      
      // Set current chunk - this will trigger a load of the new chunk
      setCurrentChunkIndex(targetChunk);
    } else {
      // Just seek within the current chunk
      videoRef.current.currentTime = timeWithinChunk;
    }
    
    // Update the global time reference
    globalTimeRef.current = globalTime;
  }, [currentChunkIndex]);
  
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
      
      // Reset duration information
      chunkDurationsRef.current = [];
      totalDurationRef.current = 0;
      durationMeasuredChunksRef.current.clear();
      globalTimeRef.current = 0;
      lastChunkTimeRef.current = 0;
      
      // Notify parent about available chunks
      if (onChunkChange) {
        onChunkChange(0, sorted.length);
      }
      
      // Start measuring durations if we have chunks
      if (sorted.length > 0 && !measuringDurationsRef.current) {
        measuringDurationsRef.current = true;
        measureChunkDurations(sorted);
      }
    }
  }, [videoUrls, onChunkChange]);
  
  // Function to measure all chunk durations for accurate seeking
  const measureChunkDurations = useCallback((urls: string[]) => {
    if (urls.length === 0) return;
    
    console.log('Starting to measure chunk durations');
    
    // Use a fixed default duration for estimates
    const DEFAULT_CHUNK_DURATION = 4;
    
    // If we can't measure durations properly, at least create a basic mapping
    const setupBasicDurations = () => {
      console.log('Using default duration for all chunks');
      const basicDurations: ChunkDuration[] = [];
      let totalTime = 0;
      
      // Create duration entries for each chunk
      for (let i = 0; i < urls.length; i++) {
        basicDurations.push({
          index: i,
          startTime: totalTime,
          endTime: totalTime + DEFAULT_CHUNK_DURATION,
          duration: DEFAULT_CHUNK_DURATION
        });
        totalTime += DEFAULT_CHUNK_DURATION;
      }
      
      // Store the durations
      chunkDurationsRef.current = basicDurations;
      totalDurationRef.current = totalTime;
      
      // Mark all chunks as measured
      for (let i = 0; i < urls.length; i++) {
        durationMeasuredChunksRef.current.add(i);
      }
      
      console.log('Basic duration mapping created:', basicDurations);
      console.log(`Estimated total duration: ${totalTime}s`);
      
      // Notify parent component
      if (onDurationChange) {
        onDurationChange(totalTime);
      }
      
      measuringDurationsRef.current = false;
    };
    
    // Try to measure the first chunk to see if it works
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      // Set up event handlers
      video.onloadedmetadata = async () => {
        if (video.duration && isFinite(video.duration) && video.duration > 0) {
          console.log(`First chunk duration measurement successful: ${video.duration.toFixed(2)}s`);
          
          // Try measuring all chunks properly
          try {
            await measureAllChunks();
          } catch (error) {
            console.error('Failed to measure all chunks:', error);
            setupBasicDurations();
          }
        } else {
          console.warn('Invalid duration for first chunk, using default durations');
          setupBasicDurations();
        }
      };
      
      video.onerror = () => {
        console.warn('Error loading first chunk for measurement, using default durations');
        setupBasicDurations();
      };
      
      // Set a timeout in case metadata never loads
      const timeoutId = setTimeout(() => {
        console.warn('Timeout waiting for first chunk metadata, using default durations');
        video.src = '';
        setupBasicDurations();
      }, 5000);
      
      // Helper function to measure all chunks
      const measureAllChunks = async () => {
        clearTimeout(timeoutId);
        
        const durations: ChunkDuration[] = [];
        let totalTime = 0;
        
        for (let i = 0; i < urls.length; i++) {
          try {
            const chunkDuration = await measureSingleChunk(urls[i]);
            durations.push({
              index: i,
              startTime: totalTime,
              endTime: totalTime + chunkDuration,
              duration: chunkDuration
            });
            durationMeasuredChunksRef.current.add(i);
            totalTime += chunkDuration;
          } catch (error) {
            console.warn(`Failed to measure chunk ${i}, using estimate`);
            // Use average of measured chunks or default
            const avgDuration = durations.length > 0 
              ? durations.reduce((sum, c) => sum + c.duration, 0) / durations.length 
              : DEFAULT_CHUNK_DURATION;
              
            durations.push({
              index: i,
              startTime: totalTime,
              endTime: totalTime + avgDuration,
              duration: avgDuration
            });
            durationMeasuredChunksRef.current.add(i);
            totalTime += avgDuration;
          }
        }
        
        // Store the durations
        chunkDurationsRef.current = durations;
        totalDurationRef.current = totalTime;
        
        console.log('All chunk durations measured or estimated:', durations);
        console.log(`Total video duration: ${totalTime.toFixed(2)}s`);
        
        if (onDurationChange) {
          onDurationChange(totalTime);
        }
        
        measuringDurationsRef.current = false;
      };
      
      // Helper function to measure a single chunk
      const measureSingleChunk = (url: string): Promise<number> => {
        return new Promise((resolve, reject) => {
          const chunkVideo = document.createElement('video');
          chunkVideo.preload = 'metadata';
          
          const timeoutId = setTimeout(() => {
            chunkVideo.src = '';
            reject(new Error('Timeout'));
          }, 5000);
          
          chunkVideo.onloadedmetadata = () => {
            clearTimeout(timeoutId);
            if (chunkVideo.duration && isFinite(chunkVideo.duration) && chunkVideo.duration > 0) {
              resolve(chunkVideo.duration);
            } else {
              reject(new Error('Invalid duration'));
            }
            chunkVideo.src = '';
          };
          
          chunkVideo.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('Loading error'));
            chunkVideo.src = '';
          };
          
          chunkVideo.src = url;
        });
      };
      
      // Start measuring by loading the first chunk
      video.src = urls[0];
    } catch (error) {
      console.error('Error setting up duration measurement:', error);
      setupBasicDurations();
    }
  }, [onDurationChange]);
  
  // Modify preloading to handle very short (1-second) chunks by loading multiple chunks ahead
  const preloadNextChunk = useCallback(() => {
    if (!preloadVideoRef.current || sortedUrlsRef.current.length === 0) return;
    
    // For short 1-second chunks, we need to preload multiple chunks ahead
    const CHUNKS_TO_PRELOAD = 3; // Preload 3 chunks ahead for 1-second chunks
    
    // Determine which chunks to preload
    for (let i = 1; i <= CHUNKS_TO_PRELOAD; i++) {
      const nextIndex = currentChunkIndex + i;
      
      // Only preload if this chunk exists and it's not already being preloaded
      if (nextIndex < sortedUrlsRef.current.length && nextIndex !== preloadingIndexRef.current) {
        const nextUrl = sortedUrlsRef.current[nextIndex];
        console.log(`Preloading next chunk (${nextIndex + 1}/${sortedUrlsRef.current.length}): ${nextUrl}`);
        
        // For the immediate next chunk, use preloadVideoRef
        if (i === 1) {
          preloadVideoRef.current.src = nextUrl;
          preloadingIndexRef.current = nextIndex;
          preloadVideoRef.current.load();
        } else {
          // For additional chunks, create temporary Image objects to prime browser cache
          // This is a lightweight way to get the browser to start loading resources
          const tempLoader = new Image();
          tempLoader.src = nextUrl;
        }
        
        // Only create one preload video element, but try to prime cache for others
        break;
      }
    }
  }, [currentChunkIndex]);
  
  // More aggressively preload for short chunks
  useEffect(() => {
    if (videoRef.current && sortedUrlsRef.current.length > 0) {
      // For 1-second chunks, we should preload regardless of playing state
      
      // Always preload on chunk change
      preloadNextChunk();
      
      // Preload more aggressively while playing
      if (isPlaying) {
        // For very short chunks, preload on metadata load
        const handleLoadedMetadata = () => {
          preloadNextChunk();
        };
        
        // For short 1-second chunks, we need to preload almost immediately
        const handleTimeUpdate = () => {
          if (videoRef.current) {
            const percentPlayed = videoRef.current.currentTime / (videoRef.current.duration || 1);
            // For 1-second chunks, start preloading at 25%
            if (percentPlayed > 0.25) {
              preloadNextChunk();
            }
            
            // When we're really close to the end, preload multiple chunks
            if (percentPlayed > 0.75) {
              // Force loading multiple chunks ahead
              const nextIndex = currentChunkIndex + 1;
              if (nextIndex < sortedUrlsRef.current.length && preloadVideoRef.current) {
                preloadVideoRef.current.load();
              }
            }
          }
        };
        
        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
        
        // Set up interval to ensure preloading happens, even if events don't fire
        // This is important for very short 1-second chunks
        const preloadInterval = setInterval(preloadNextChunk, 250);
        
        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          }
          clearInterval(preloadInterval);
        };
      }
    }
  }, [isPlaying, preloadNextChunk, currentChunkIndex]);
  
  // Optimize the ended handler for very short chunks
  const handleVideoEnded = useCallback(() => {
    console.log('Video chunk ended, auto-progressing to next chunk');
    
    // Immediately preload multiple chunks ahead
    for (let i = 1; i <= 3; i++) {
      const futureIndex = currentChunkIndex + i;
      if (futureIndex < sortedUrlsRef.current.length) {
        // For the immediate next chunk, use preloadVideoRef
        if (i === 1 && preloadVideoRef.current) {
          preloadVideoRef.current.src = sortedUrlsRef.current[futureIndex];
          preloadingIndexRef.current = futureIndex;
          preloadVideoRef.current.load();
        } else {
          // Prime browser cache for further chunks
          const tempLoader = new Image();
          tempLoader.src = sortedUrlsRef.current[futureIndex];
        }
      }
    }
    
    // Set flags for transition
    autoProgressingRef.current = true;
    isTransitioningRef.current = true;
    
    // Force playing state to true for auto-progression
    setIsPlaying(true);
    
    // Use functional update pattern to avoid dependency on currentChunkIndex
    setCurrentChunkIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < sortedUrlsRef.current.length) {
        console.log(`Moving from chunk ${prevIndex} to ${nextIndex} (auto-progress)`);
        
        // For 1-second chunks, immediately try to play the next chunk with minimal delay
        setTimeout(() => {
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(e => {
              console.error('Error auto-playing next chunk:', e);
            });
          }
        }, 10); // Almost immediate for 1-second chunks
        
        return nextIndex;
      } else {
        console.log('Reached end of all chunks');
        isTransitioningRef.current = false;
        autoProgressingRef.current = false;
        return prevIndex;
      }
    });
  }, [currentChunkIndex]);
  
  // Add updateChunkDuration function which was removed in previous edit
  const updateChunkDuration = useCallback(() => {
    if (!videoRef.current || durationMeasuredChunksRef.current.has(currentChunkIndex)) return;
    
    const handleLoadedMetadata = () => {
      const duration = videoRef.current?.duration || 0;
      if (duration === 0 || isNaN(duration) || !isFinite(duration)) {
        console.warn(`Invalid duration for chunk ${currentChunkIndex} during playback, using estimate`);
        // For 1-second chunks, prefer to use 1 second as the estimate
        let estimatedDuration = 1; // Default to 1 second for short chunks
        
        // Try to calculate average from existing chunks
        if (chunkDurationsRef.current.length > 0) {
          const avgDuration = chunkDurationsRef.current.reduce((sum, chunk) => sum + chunk.duration, 0) / 
                             chunkDurationsRef.current.length;
          if (!isNaN(avgDuration) && avgDuration > 0) {
            estimatedDuration = avgDuration;
          }
        }
        
        updateChunkDurationInfo(estimatedDuration, true);
        return;
      }
      
      updateChunkDurationInfo(duration, false);
    };
    
    const updateChunkDurationInfo = (duration: number, isEstimate: boolean) => {
      // Find existing duration info for this chunk
      const existingIndex = chunkDurationsRef.current.findIndex(c => c.index === currentChunkIndex);
      
      if (existingIndex === -1) {
        // Calculate start time based on previous chunks
        let startTime = 0;
        for (let i = 0; i < currentChunkIndex; i++) {
          const chunk = chunkDurationsRef.current.find(c => c.index === i);
          if (chunk) {
            startTime += chunk.duration;
          }
        }
        
        // Add new chunk info
        const newChunk: ChunkDuration = {
          index: currentChunkIndex,
          startTime,
          endTime: startTime + duration,
          duration
        };
        
        chunkDurationsRef.current.push(newChunk);
        
        // Sort by index to ensure order
        chunkDurationsRef.current.sort((a, b) => a.index - b.index);
        
        // Recalculate all start and end times
        let runningTime = 0;
        for (let i = 0; i < chunkDurationsRef.current.length; i++) {
          const chunk = chunkDurationsRef.current[i];
          chunk.startTime = runningTime;
          chunk.endTime = runningTime + chunk.duration;
          runningTime += chunk.duration;
        }
        
        // Update total duration
        totalDurationRef.current = runningTime;
        
        console.log(`${isEstimate ? 'Estimated' : 'Updated'} chunk ${currentChunkIndex} duration: ${duration.toFixed(2)}s, total: ${runningTime.toFixed(2)}s`);
        
        // Notify parent of updated duration
        if (onDurationChange) {
          onDurationChange(runningTime);
        }
      }
      
      // Mark as measured
      durationMeasuredChunksRef.current.add(currentChunkIndex);
    };
    
    // Handle errors for the current video
    const handleError = () => {
      console.warn(`Error getting duration for chunk ${currentChunkIndex} during playback, using estimate`);
      // Use an estimated duration - 1 second for short chunks
      const estimatedDuration = 1;
      updateChunkDurationInfo(estimatedDuration, true);
      
      if (videoRef.current) {
        videoRef.current.removeEventListener('error', handleError);
        videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
    
    // Wait for metadata to be loaded
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('error', handleError);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, [currentChunkIndex, onDurationChange]);

  // Add event listeners effect that was removed
  useEffect(() => {
    if (!videoRef.current) return;
    
    // Track play/pause state
    const handlePlay = () => {
      // Only update playing state if we're not in a transition
      if (!isTransitioningRef.current) {
        setIsPlaying(true);
      }
    };
    
    const handlePause = () => {
      // Only update playing state if we're not in a transition
      if (!isTransitioningRef.current) {
        setIsPlaying(false);
      }
    };
    
    // Handle time updates
    const handleTimeUpdate = () => {
      if (onTimeUpdate && videoRef.current) {
        // Send the global time to the parent component
        onTimeUpdate(getGlobalCurrentTime());
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
  }, [handleVideoEnded, onTimeUpdate, getGlobalCurrentTime]);

  // Optimize chunk loading for 1-second chunks
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
    
    // Determine if we should auto-play this chunk
    const isAutoProgressing = autoProgressingRef.current;
    const shouldPlay = isAutoProgressing || isPlaying;
    
    // Create a flag to track if the video has been played to avoid duplicate plays
    let hasTriggeredPlay = false;
    
    const loadVideo = () => {
      if (!videoRef.current) return; // Null check for videoRef.current
      
      // Use the preloaded data if available
      if (preloadingIndexRef.current === currentChunkIndex && preloadVideoRef.current) {
        console.log('Using preloaded video data');
        videoRef.current.src = currentUrl;
        preloadingIndexRef.current = -1;
      } else {
        videoRef.current.src = currentUrl;
      }
      
      // Set load priority to high for immediate loading
      if ('importance' in videoRef.current) {
        // TypeScript doesn't recognize this property, so we need to use bracket notation
        (videoRef.current as any)['importance'] = 'high';
      }
      
      // Explicitly call load() to ensure the video starts loading
      videoRef.current.load();
      
      // Notify parent about chunk change
      if (onChunkChange) {
        onChunkChange(currentChunkIndex, sortedUrlsRef.current.length);
      }
      
      // For 1-second chunks, use a very short fallback timeout
      if (shouldPlay) {
        const playbackFallbackTimeout = setTimeout(() => {
          if (videoRef.current && !hasTriggeredPlay && shouldPlay) {
            console.log('Fallback: forcing video playback after short timeout');
            hasTriggeredPlay = true;
            videoRef.current.play().catch(e => {
              console.error('Error playing new chunk (fallback):', e);
            });
          }
        }, 100); // Very short timeout for 1-second chunks
        
        return () => clearTimeout(playbackFallbackTimeout);
      }
    };
    
    // Set up retry mechanism for loading - shorter times for 1-second chunks
    let retryCount = 0;
    const maxRetries = 2; // Fewer retries but faster for short chunks
    
    // Handle loading errors with faster retries for short chunks
    const handleLoadError = (e: Event) => {
      console.error(`Error loading chunk ${currentChunkIndex}:`, e);
      
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Quickly retrying chunk load (attempt ${retryCount}/${maxRetries})...`);
        
        // Very short delay before retry for 1-second chunks
        setTimeout(() => {
          if (videoRef.current) {
            loadVideo();
          }
        }, 100); // Much shorter retry delay
      } else {
        console.error(`Failed to load chunk ${currentChunkIndex} after ${maxRetries} attempts`);
        
        // Skip problematic chunks quickly for 1-second chunks
        if (isAutoProgressing && currentChunkIndex + 1 < sortedUrlsRef.current.length) {
          console.log('Skipping problematic chunk, moving to next one');
          autoProgressingRef.current = true;
          isTransitioningRef.current = true;
          setCurrentChunkIndex(currentChunkIndex + 1);
        }
      }
    };
    
    // Load the video
    const cleanup = loadVideo();
    
    // Update chunk duration info
    updateChunkDuration();
    
    // For 1-second chunks, try to play immediately and also set up event listeners
    const playVideoWhenReady = () => {
      console.log('playVideoWhenReady called');
      if (videoRef.current && !hasTriggeredPlay) {
        if (shouldPlay) {
          console.log('Starting playback of new chunk');
          hasTriggeredPlay = true;
          videoRef.current.play().catch(e => {
            console.error('Error playing new chunk:', e);
            // Immediate retry for 1-second chunks
            if (videoRef.current && videoRef.current.paused && shouldPlay) {
              videoRef.current.play().catch(e2 => {
                console.error('Error on immediate retry:', e2);
              });
            }
          });
        }
        
        // Reset flags immediately for 1-second chunks
        autoProgressingRef.current = false;
        isTransitioningRef.current = false;
        
        // Remove event listeners
        removeEventListeners();
      }
    };
    
    const removeEventListeners = () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadeddata', playVideoWhenReady);
        videoRef.current.removeEventListener('canplay', playVideoWhenReady);
        videoRef.current.removeEventListener('canplaythrough', playVideoWhenReady);
        videoRef.current.removeEventListener('error', handleLoadError);
      }
    };
    
    // Handle seeking if needed, then play
    if (lastChunkTimeRef.current > 0) {
      const timeToSeek = lastChunkTimeRef.current;
      console.log(`Seeking within newly loaded chunk to: ${timeToSeek.toFixed(2)}s`);
      
      const handleLoadedMetadata = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = timeToSeek;
          lastChunkTimeRef.current = 0;
          
          // Play immediately after seeking for 1-second chunks
          if (shouldPlay && !hasTriggeredPlay) {
            hasTriggeredPlay = true;
            videoRef.current.play().catch(e => {
              console.error('Error playing after seek:', e);
            });
          }
          
          // Reset flags immediately
          autoProgressingRef.current = false;
          isTransitioningRef.current = false;
          
          removeEventListeners();
        }
      };
      
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    } 
    // No seeking needed, just play as soon as possible
    else {
      // For 1-second chunks, try playing immediately first
      if (shouldPlay) {
        // Immediate play attempt - especially important for short chunks
        setTimeout(() => {
          if (videoRef.current && !hasTriggeredPlay) {
            console.log('Immediate play attempt for short chunk');
            hasTriggeredPlay = true;
            videoRef.current.play().catch(() => {
              // Silent catch - will fall back to event listeners
            });
          }
        }, 0);
      }
      
      // Also set up event listeners as fallbacks
      videoRef.current.addEventListener('loadeddata', playVideoWhenReady);
      videoRef.current.addEventListener('canplay', playVideoWhenReady);
      videoRef.current.addEventListener('canplaythrough', playVideoWhenReady);
    }
    
    // Add error handler
    videoRef.current.addEventListener('error', handleLoadError);
    
    // For 1-second chunks, aggressively preload multiple chunks ahead
    preloadNextChunk();
    
    // Clean up event listeners if component unmounts during loading
    return () => {
      removeEventListeners();
      if (cleanup) cleanup();
    };
  }, [currentChunkIndex, onChunkChange, preloadNextChunk, updateChunkDuration, isPlaying]);
  
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

  // Add a "checkpoint" effect that runs periodically to verify video is playing when it should be
  useEffect(() => {
    // Only check when we expect the video to be playing
    if (!isPlaying || !videoRef.current) return;
    
    // Force play if video should be playing but isn't
    const enforcePlaybackState = () => {
      // If we're marked as playing but the video element is paused, force play
      if (isPlaying && videoRef.current && videoRef.current.paused && 
          !isTransitioningRef.current && !videoRef.current.ended && 
          videoRef.current.readyState >= 3) { // HAVE_FUTURE_DATA or better
        console.log('Checkpoint: Video should be playing but is paused, forcing play');
        videoRef.current.play().catch(e => {
          console.error('Error enforcing playback state:', e);
        });
      }
    };
    
    // Run an immediate check
    enforcePlaybackState();
    
    // Also run periodic checks
    const checkInterval = setInterval(enforcePlaybackState, 1000);
    
    return () => {
      clearInterval(checkInterval);
    };
  }, [isPlaying, currentChunkIndex]);

  return (
    <video
      ref={videoRef}
      className={className}
      playsInline
      controls={false}
      muted={false}
      preload="auto"
    />
  );
});

export default SequentialVideoPlayer; 