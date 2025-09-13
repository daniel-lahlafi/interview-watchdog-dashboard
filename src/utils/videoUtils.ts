/**
 * VideoUtils - Utilities for handling video processing in the browser
 */

/**
 * Creates a MediaSource object and sets up the source buffers for merging video chunks
 * @param videoElement - The HTML video element to attach the media source to
 * @param mimeType - The MIME type of the video, usually 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'
 * @returns An object with functions to append buffer and end the stream
 */
export function createMediaSource(videoElement: HTMLVideoElement, mimeType: string = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"') {
  // Create a MediaSource instance
  const mediaSource = new MediaSource();
  const sourceURL = URL.createObjectURL(mediaSource);
  
  // Set the video source to our MediaSource object
  videoElement.src = sourceURL;
  
  // Track if we've completed initialization and are ready to append buffers
  let sourceBuffer: SourceBuffer | null = null;
  let isReady = false;
  let queue: ArrayBuffer[] = [];
  let isAppendingBuffer = false;
  
  // Process the queue of buffers
  const processQueue = () => {
    if (!sourceBuffer || !isReady || queue.length === 0 || isAppendingBuffer) {
      return;
    }
    
    isAppendingBuffer = true;
    const buffer = queue.shift();
    if (buffer) {
      try {
        sourceBuffer.appendBuffer(buffer);
      } catch (error) {
        console.error('Error appending buffer:', error);
        isAppendingBuffer = false;
        processQueue(); // Try the next buffer
      }
    } else {
      isAppendingBuffer = false;
    }
  };

  // Set up the MediaSource when it opens
  mediaSource.addEventListener('sourceopen', () => {
    console.log('MediaSource opened');
    
    try {
      // Create a SourceBuffer for our video type
      sourceBuffer = mediaSource.addSourceBuffer(mimeType);
      
      // Handle update end event (when buffers are done being appended)
      sourceBuffer.addEventListener('updateend', () => {
        isAppendingBuffer = false;
        processQueue();
      });
      
      // Handle errors during buffer updates
      sourceBuffer.addEventListener('error', (e) => {
        console.error('SourceBuffer error:', e);
        isAppendingBuffer = false;
      });
      
      isReady = true;
      processQueue(); // Process any queued buffers
    } catch (error) {
      console.error('Error setting up MediaSource:', error);
    }
  });

  // Create an object that exposes the source buffer
  const result = {
    /**
     * Appends a video chunk to the MediaSource
     * @param buffer - ArrayBuffer containing the video chunk data
     */
    appendBuffer: (buffer: ArrayBuffer) => {
      // Add buffer to queue
      queue.push(buffer);
      processQueue();
    },
    
    /**
     * Ends the MediaSource stream when all chunks have been added
     */
    endOfStream: () => {
      if (mediaSource.readyState === 'open') {
        // Check if all queued buffers have been processed
        const checkAndEndStream = () => {
          if (queue.length === 0 && !isAppendingBuffer) {
            try {
              mediaSource.endOfStream();
              console.log('MediaSource stream ended');
            } catch (error) {
              console.error('Error ending MediaSource stream:', error);
            }
          } else {
            // Check again after a short delay
            setTimeout(checkAndEndStream, 100);
          }
        };
        
        checkAndEndStream();
      }
    },
    
    /**
     * Returns the number of buffers remaining in the queue
     */
    getRemainingBuffers: () => queue.length,
    
    /**
     * Cleans up resources associated with the MediaSource
     */
    cleanup: () => {
      if (mediaSource.readyState === 'open') {
        try {
          mediaSource.endOfStream();
        } catch (error) {
          console.error('Error ending MediaSource during cleanup:', error);
        }
      }
      URL.revokeObjectURL(sourceURL);
      queue = [];
    },
    
    /**
     * Direct access to the SourceBuffer for event handling
     */
    get _sourceBuffer() {
      return sourceBuffer;
    },
    
    /**
     * Direct access to the MediaSource
     */
    get _mediaSource() {
      return mediaSource;
    },
    
    /**
     * Checks if the MediaSource is ready to receive buffers
     */
    get isReady() {
      return isReady && !!sourceBuffer;
    }
  };

  return result;
}

/**
 * Fetches a video chunk as an ArrayBuffer
 * @param url - URL of the video chunk
 * @param onProgress - Optional callback for reporting download progress
 * @returns Promise resolving to an ArrayBuffer containing the video data
 */
export async function fetchVideoChunk(url: string, onProgress?: (progress: number) => void): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    
    // Set up progress handling
    if (onProgress) {
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`HTTP error ${xhr.status}: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error while fetching video chunk'));
    };
    
    xhr.ontimeout = () => {
      reject(new Error('Timeout while fetching video chunk'));
    };
    
    // Set a reasonable timeout (10 seconds)
    xhr.timeout = 10000;
    
    xhr.send();
  });
}

/**
 * Detects the most likely MIME type for a video file based on URL or file extension
 * @param videoUrl - URL of a video file
 * @returns The MIME type string to use with MediaSource
 */
export function detectVideoMimeType(videoUrl: string): string {
  // Default to MP4 with H.264 video and AAC audio codecs
  const defaultMimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  
  // Try to detect from URL
  if (!videoUrl) return defaultMimeType;
  
  const url = videoUrl.toLowerCase();
  
  if (url.endsWith('.mp4')) {
    return 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  } else if (url.endsWith('.webm')) {
    return 'video/webm; codecs="vp8,opus"';
  } else if (url.endsWith('.ogg') || url.endsWith('.ogv')) {
    return 'video/ogg; codecs="theora,vorbis"';
  } else if (url.includes('mp4')) {
    return 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  } else if (url.includes('webm')) {
    return 'video/webm; codecs="vp8,opus"';
  }
  
  // Check if the browser supports various MIME types
  if (MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) {
    return 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  } else if (MediaSource.isTypeSupported('video/webm; codecs="vp8,opus"')) {
    return 'video/webm; codecs="vp8,opus"';
  }
  
  return defaultMimeType;
}

/**
 * Merges multiple video chunks into a single video using MediaSource
 * @param videoElement - The HTML video element to play the merged video
 * @param chunkUrls - Array of URLs pointing to video chunks
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Promise that resolves when all chunks have been loaded and merged
 */
export async function mergeVideoChunks(
  videoElement: HTMLVideoElement,
  chunkUrls: string[],
  onProgress?: (progress: number) => void
): Promise<void> {
  if (!chunkUrls.length) {
    throw new Error('No video chunks provided');
  }
  
  // Set a more reasonable global timeout (60 seconds)
  const GLOBAL_TIMEOUT = 60000;
  
  return new Promise((resolve, reject) => {
    let globalTimeoutId: NodeJS.Timeout | null = null;
    
    console.log(`Starting to merge ${chunkUrls.length} video chunks`);
    
    // Simplified approach used as a fallback
    const useFallbackApproach = () => {
      console.log('Using fallback approach: playing only first chunk');
      if (chunkUrls.length > 0) {
        videoElement.src = chunkUrls[0];
        
        const handleCanPlay = () => {
          console.log('First chunk loaded successfully');
          if (onProgress) onProgress(100);
          videoElement.removeEventListener('canplay', handleCanPlay);
          resolve();
        };
        
        const handleError = () => {
          console.error('Error loading first chunk');
          videoElement.removeEventListener('error', handleError);
          reject(new Error('Failed to load even the first chunk'));
        };
        
        videoElement.addEventListener('canplay', handleCanPlay, { once: true });
        videoElement.addEventListener('error', handleError, { once: true });
      } else {
        reject(new Error('No video chunks available'));
      }
    };
    
    // Setup global timeout to prevent hanging
    globalTimeoutId = setTimeout(() => {
      console.warn(`Merging timed out after ${GLOBAL_TIMEOUT}ms, using fallback approach`);
      useFallbackApproach();
    }, GLOBAL_TIMEOUT);
    
    // Try to use MediaSource API first
    try {
      // Check if MediaSource is supported
      if (!window.MediaSource) {
        console.warn('MediaSource API not supported, using fallback approach');
        clearTimeout(globalTimeoutId);
        useFallbackApproach();
        return;
      }
      
      const mediaSource = new MediaSource();
      const sourceUrl = URL.createObjectURL(mediaSource);
      videoElement.src = sourceUrl;
      
      mediaSource.addEventListener('sourceopen', async () => {
        console.log('MediaSource opened, starting to append chunks');
        try {
          if (onProgress) onProgress(5);
          
          // Determine MIME type based on the first chunk
          const firstChunkUrl = chunkUrls[0];
          let mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
          if (firstChunkUrl.includes('.webm')) {
            mimeType = 'video/webm; codecs="vp8,opus"';
          }
          
          // Check if type is supported
          if (!MediaSource.isTypeSupported(mimeType)) {
            console.warn(`MIME type ${mimeType} not supported, trying fallback`);
            throw new Error('Unsupported MIME type');
          }
          
          console.log(`Using MIME type: ${mimeType}`);
          const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
          
          // Flag to track if we're in the middle of a buffer append operation
          let isAppending = false;
          
          // Create a queue of chunks to append
          const chunkQueue: ArrayBuffer[] = [];
          
          // Process the next chunk in the queue
          const processNextChunk = async () => {
            if (isAppending || chunkQueue.length === 0) {
              return;
            }
            
            isAppending = true;
            try {
              const chunk = chunkQueue.shift();
              if (chunk) {
                sourceBuffer.appendBuffer(chunk);
              }
            } catch (e) {
              console.error('Error appending buffer:', e);
              isAppending = false;
              processNextChunk();
            }
          };
          
          // Handle buffer update end events
          sourceBuffer.addEventListener('updateend', () => {
            isAppending = false;
            
            // Process the next chunk if available
            if (chunkQueue.length > 0) {
              processNextChunk();
            } 
            // End the stream when we're done with all chunks
            else if (mediaSource.readyState === 'open' && chunksLoaded === chunkUrls.length) {
              try {
                mediaSource.endOfStream();
                console.log('All chunks appended, ended MediaSource stream');
                
                // Clear the global timeout since we succeeded
                if (globalTimeoutId) {
                  clearTimeout(globalTimeoutId);
                  globalTimeoutId = null;
                }
                
                if (onProgress) onProgress(100);
                resolve();
              } catch (e) {
                console.error('Error ending stream:', e);
                useFallbackApproach();
              }
            }
          });
          
          // Track how many chunks have been loaded and processed
          let chunksLoaded = 0;
          
          // Fetch each chunk and add it to the queue
          for (let i = 0; i < chunkUrls.length; i++) {
            try {
              // Update progress based on which chunk we're loading
              const chunkProgress = 5 + ((i / chunkUrls.length) * 90);
              if (onProgress) onProgress(Math.round(chunkProgress));
              
              console.log(`Fetching chunk ${i + 1}/${chunkUrls.length}: ${chunkUrls[i]}`);
              const response = await fetch(chunkUrls[i]);
              if (!response.ok) {
                throw new Error(`Failed to fetch chunk ${i + 1}: ${response.status} ${response.statusText}`);
              }
              
              const buffer = await response.arrayBuffer();
              console.log(`Chunk ${i + 1} fetched, size: ${buffer.byteLength} bytes`);
              
              // Add to queue and start processing if this is the first chunk
              chunkQueue.push(buffer);
              chunksLoaded++;
              
              if (!isAppending) {
                processNextChunk();
              }
            } catch (error) {
              console.error(`Error fetching chunk ${i + 1}:`, error);
              // Continue with other chunks even if one fails
            }
          }
          
          // If no chunks were loaded successfully, use the fallback
          if (chunksLoaded === 0) {
            throw new Error('Failed to load any chunks');
          }
          
        } catch (error) {
          console.error('Error in sourceopen handler:', error);
          if (globalTimeoutId) {
            clearTimeout(globalTimeoutId);
            globalTimeoutId = null;
          }
          useFallbackApproach();
        }
      }, { once: true });
      
      // Handle MediaSource errors
      mediaSource.addEventListener('error', (e) => {
        console.error('MediaSource error:', e);
        if (globalTimeoutId) {
          clearTimeout(globalTimeoutId);
          globalTimeoutId = null;
        }
        useFallbackApproach();
      }, { once: true });
      
    } catch (error) {
      console.error('Error setting up MediaSource:', error);
      if (globalTimeoutId) {
        clearTimeout(globalTimeoutId);
        globalTimeoutId = null;
      }
      useFallbackApproach();
    }
  });
}

/**
 * Fallback method to play just the first chunk if full merging fails
 * @param videoElement - The HTML video element to play the video
 * @param chunkUrls - Array of URLs pointing to video chunks
 * @returns Promise that resolves when the first chunk is loaded
 */
export function playFirstChunk(videoElement: HTMLVideoElement, chunkUrls: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!chunkUrls.length) {
      reject(new Error('No video chunks available'));
      return;
    }
    
    videoElement.src = chunkUrls[0];
    videoElement.onloadedmetadata = () => {
      resolve();
    };
    videoElement.onerror = (error) => {
      reject(new Error(`Error loading first chunk: ${error}`));
    };
  });
}

/**
 * Sequential chunk player that plays chunks one after another without merging
 */
export class SequentialChunkPlayer {
  private videoElement: HTMLVideoElement;
  private chunkUrls: string[];
  private currentChunkIndex: number = 0;
  private isPlaying: boolean = false;
  private onProgress?: (progress: number) => void;
  private onChunkChange?: (index: number, total: number) => void;
  
  constructor(
    videoElement: HTMLVideoElement,
    chunkUrls: string[],
    options?: {
      onProgress?: (progress: number) => void;
      onChunkChange?: (index: number, total: number) => void;
    }
  ) {
    this.videoElement = videoElement;
    this.chunkUrls = chunkUrls.slice(); // Make a copy of the array
    this.onProgress = options?.onProgress;
    this.onChunkChange = options?.onChunkChange;
    
    // Sort chunks to ensure correct order
    this.sortChunks();
    
    if (this.chunkUrls.length === 0) {
      console.warn('No video chunks provided to SequentialChunkPlayer');
      return;
    }
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load the first chunk
    this.loadChunk(0);
  }
  
  private sortChunks() {
    // Sort the chunks by their numerical order
    this.chunkUrls.sort((a, b) => {
      // Extract chunk numbers from URLs
      const aMatch = a.match(/chunk(\d+)/);
      const bMatch = b.match(/chunk(\d+)/);
      
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1], 10);
        const bNum = parseInt(bMatch[1], 10);
        return aNum - bNum;
      }
      
      // Fallback to string comparison
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }
  
  private setupEventListeners() {
    // Handle video ended event to play the next chunk
    const handleEnded = () => {
      console.log(`Chunk ${this.currentChunkIndex + 1}/${this.chunkUrls.length} ended`);
      if (this.currentChunkIndex < this.chunkUrls.length - 1) {
        this.loadChunk(this.currentChunkIndex + 1);
      } else {
        console.log('All chunks played');
        this.isPlaying = false;
      }
    };
    
    // Handle time updates to calculate overall progress
    const handleTimeUpdate = () => {
      if (this.onProgress) {
        const currentChunkDuration = this.videoElement.duration || 0;
        const currentChunkTime = this.videoElement.currentTime || 0;
        
        // Calculate overall progress based on chunks played and current position
        const progress = Math.min(100, Math.round(
          ((this.currentChunkIndex + (currentChunkTime / currentChunkDuration)) / this.chunkUrls.length) * 100
        ));
        
        this.onProgress(progress);
      }
    };
    
    // Handle play/pause events to track playing state
    const handlePlay = () => {
      this.isPlaying = true;
    };
    
    const handlePause = () => {
      this.isPlaying = false;
    };
    
    // Add event listeners
    this.videoElement.addEventListener('ended', handleEnded);
    this.videoElement.addEventListener('timeupdate', handleTimeUpdate);
    this.videoElement.addEventListener('play', handlePlay);
    this.videoElement.addEventListener('pause', handlePause);
    
    // Store cleanup function
    this.cleanup = () => {
      this.videoElement.removeEventListener('ended', handleEnded);
      this.videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      this.videoElement.removeEventListener('play', handlePlay);
      this.videoElement.removeEventListener('pause', handlePause);
    };
  }
  
  private loadChunk(index: number) {
    if (index < 0 || index >= this.chunkUrls.length) {
      console.error(`Invalid chunk index: ${index}`);
      return;
    }
    
    const wasPlaying = this.isPlaying;
    this.isPlaying = false;
    
    console.log(`Loading chunk ${index + 1}/${this.chunkUrls.length}: ${this.chunkUrls[index]}`);
    
    // Set the new source
    this.videoElement.src = this.chunkUrls[index];
    this.currentChunkIndex = index;
    
    // Notify about chunk change
    if (this.onChunkChange) {
      this.onChunkChange(index, this.chunkUrls.length);
    }
    
    // When the chunk is loaded, start playing if the previous chunk was playing
    const handleCanPlay = () => {
      this.videoElement.removeEventListener('canplay', handleCanPlay);
      if (wasPlaying) {
        this.play();
      }
    };
    
    this.videoElement.addEventListener('canplay', handleCanPlay, { once: true });
  }
  
  /**
   * Plays the current chunk
   */
  public play() {
    this.videoElement.play()
      .then(() => this.isPlaying = true)
      .catch(err => console.error('Error playing video:', err));
  }
  
  /**
   * Pauses the current chunk
   */
  public pause() {
    this.videoElement.pause();
    this.isPlaying = false;
  }
  
  /**
   * Jumps to a specific chunk and position
   * @param chunkIndex - Index of the chunk to play
   * @param time - Time position within the chunk (optional)
   */
  public seekToChunk(chunkIndex: number, time: number = 0) {
    if (chunkIndex !== this.currentChunkIndex) {
      this.loadChunk(chunkIndex);
      
      // Set time after load if needed
      if (time > 0) {
        const handleCanPlay = () => {
          this.videoElement.removeEventListener('canplay', handleCanPlay);
          this.videoElement.currentTime = time;
        };
        
        this.videoElement.addEventListener('canplay', handleCanPlay, { once: true });
      }
    } else if (time >= 0) {
      // Just seek within current chunk
      this.videoElement.currentTime = time;
    }
  }
  
  /**
   * Gets the total number of chunks
   */
  public getTotalChunks(): number {
    return this.chunkUrls.length;
  }
  
  /**
   * Gets the current chunk index (0-based)
   */
  public getCurrentChunkIndex(): number {
    return this.currentChunkIndex;
  }
  
  /**
   * Checks if all chunks have been played
   */
  public isComplete(): boolean {
    return this.currentChunkIndex === this.chunkUrls.length - 1 && 
           this.videoElement.ended;
  }
  
  /**
   * Cleans up event listeners
   */
  public cleanup: () => void = () => {};
}

/**
 * Creates sequential players for screen and webcam recordings
 * @param screenVideo - The screen recording video element
 * @param webcamVideo - The webcam recording video element
 * @param screenChunks - Array of screen recording chunk URLs
 * @param webcamChunks - Array of webcam recording chunk URLs
 * @param options - Optional callbacks for progress and chunk changes
 * @returns Object containing both players and synchronization methods
 */
export function createSequentialPlayers(
  screenVideo: HTMLVideoElement,
  webcamVideo: HTMLVideoElement,
  screenChunks: string[],
  webcamChunks: string[],
  options?: {
    onScreenProgress?: (progress: number) => void;
    onWebcamProgress?: (progress: number) => void;
    onChunkChange?: (type: 'screen' | 'webcam', index: number, total: number) => void;
  }
) {
  // Create players
  const screenPlayer = new SequentialChunkPlayer(screenVideo, screenChunks, {
    onProgress: options?.onScreenProgress,
    onChunkChange: (index, total) => {
      if (options?.onChunkChange) {
        options.onChunkChange('screen', index, total);
      }
    }
  });
  
  const webcamPlayer = new SequentialChunkPlayer(webcamVideo, webcamChunks, {
    onProgress: options?.onWebcamProgress,
    onChunkChange: (index, total) => {
      if (options?.onChunkChange) {
        options.onChunkChange('webcam', index, total);
      }
    }
  });
  
  // Sync play/pause states
  const syncPlayState = () => {
    const handleScreenPlay = () => {
      if (webcamVideo.paused) {
        webcamVideo.play().catch(e => console.error('Error playing webcam video:', e));
      }
    };
    
    const handleWebcamPlay = () => {
      if (screenVideo.paused) {
        screenVideo.play().catch(e => console.error('Error playing screen video:', e));
      }
    };
    
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
    
    screenVideo.addEventListener('play', handleScreenPlay);
    webcamVideo.addEventListener('play', handleWebcamPlay);
    screenVideo.addEventListener('pause', handleScreenPause);
    webcamVideo.addEventListener('pause', handleWebcamPause);
    
    return () => {
      screenVideo.removeEventListener('play', handleScreenPlay);
      webcamVideo.removeEventListener('play', handleWebcamPlay);
      screenVideo.removeEventListener('pause', handleScreenPause);
      webcamVideo.removeEventListener('pause', handleWebcamPause);
    };
  };
  
  // Set up synchronization
  const syncCleanup = syncPlayState();
  
  return {
    screenPlayer,
    webcamPlayer,
    
    // Play both videos
    play: () => {
      screenPlayer.play();
      webcamPlayer.play();
    },
    
    // Pause both videos
    pause: () => {
      screenPlayer.pause();
      webcamPlayer.pause();
    },
    
    // Clean up everything
    cleanup: () => {
      screenPlayer.cleanup();
      webcamPlayer.cleanup();
      syncCleanup();
    }
  };
} 