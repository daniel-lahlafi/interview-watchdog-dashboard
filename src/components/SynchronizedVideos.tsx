import { useEffect, useRef, useState } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import ReactPlayer from 'react-player';

interface SynchronizedVideosProps {
  interviewId: string;
  seekTime?: string; // MM:SS format
  onTimeUpdate?: (time: number) => void;
}

export const SynchronizedVideos: React.FC<SynchronizedVideosProps> = ({ 
  interviewId, 
  seekTime,
  onTimeUpdate 
}) => {
  const [cameraUrl, setCameraUrl] = useState<string>('');
  const [screenUrl, setScreenUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraDuration, setCameraDuration] = useState<number>(0);
  const [screenDuration, setScreenDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const cameraPlayerRef = useRef<ReactPlayer>(null);
  const screenPlayerRef = useRef<ReactPlayer>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const screenContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lastSeekTimeRef = useRef<string | undefined>(undefined);

  // Function to convert MM:SS to seconds
  const timeToSeconds = (timeStr: string): number => {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Effect to handle seeking when seekTime changes
  useEffect(() => {
    if (seekTime && seekTime !== lastSeekTimeRef.current && cameraPlayerRef.current && screenPlayerRef.current) {
      const seconds = timeToSeconds(seekTime);
      lastSeekTimeRef.current = seekTime;
      cameraPlayerRef.current.seekTo(seconds);
      screenPlayerRef.current.seekTo(seconds);
      setCurrentTime(seconds);
      onTimeUpdate?.(seconds);
    }
  }, [seekTime, onTimeUpdate]);

  useEffect(() => {
    const fetchVideoUrls = async () => {
      try {
        setIsLoading(true);
        const storage = getStorage();
        
        const cameraRef = ref(storage, `full-videos/camera/${interviewId}/video.mp4`);
        const screenRef = ref(storage, `full-videos/screen/${interviewId}/video.mp4`);
        
        const [cameraUrl, screenUrl] = await Promise.all([
          getDownloadURL(cameraRef),
          getDownloadURL(screenRef)
        ]);
        
        setCameraUrl(cameraUrl);
        setScreenUrl(screenUrl);
        setError(null);
      } catch (err) {
        setError(`We're still generating videos. Please check back in 5 minutes.`);
        console.error('Error loading videos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoUrls();
  }, [interviewId]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    onTimeUpdate?.(time);
    
    if (cameraPlayerRef.current && screenPlayerRef.current) {
      const cameraTime = cameraPlayerRef.current.getCurrentTime();
      const screenTime = screenPlayerRef.current.getCurrentTime();
      
      // If the difference is more than 1 seconds, resync
      if (Math.abs(cameraTime - screenTime) > 1) {
        console.log('Resyncing videos');
        console.log('Camera time:', cameraTime);
        console.log('Screen time:', screenTime);
        console.log('Time:', time);
        setIsPlaying(false);
        if (cameraTime !== time) {
          cameraPlayerRef.current.seekTo(time);
        }
        if (screenTime !== time) {
          screenPlayerRef.current.seekTo(time);
        }
        setIsPlaying(true);
      }
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const percentage = clickPosition / rect.width;
      const newTime = percentage * Math.min(cameraDuration, screenDuration);
      
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
      if (cameraPlayerRef.current) {
        cameraPlayerRef.current.seekTo(newTime);
      }
      if (screenPlayerRef.current) {
        screenPlayerRef.current.seekTo(newTime);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickPosition = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = clickPosition / rect.width;
      const newTime = percentage * Math.min(cameraDuration, screenDuration);
      
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
      if (cameraPlayerRef.current) {
        cameraPlayerRef.current.seekTo(newTime);
      }
      if (screenPlayerRef.current) {
        screenPlayerRef.current.seekTo(newTime);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, cameraDuration, screenDuration]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFullscreen = (containerRef: React.RefObject<HTMLDivElement>) => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading videos...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
        <div className="text-yellow-600 text-lg font-medium mb-2">
          <svg className="inline-block w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          Processing Videos
        </div>
        <p className="text-yellow-700 text-center">{error}</p>
      </div>
    );
  }

  const totalDuration = Math.min(cameraDuration, screenDuration);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="aspect-video relative" ref={cameraContainerRef}>
          <ReactPlayer
            ref={cameraPlayerRef}
            url={cameraUrl}
            width="100%"
            height="100%"
            playing={isPlaying}
            onProgress={({ playedSeconds }) => handleTimeUpdate(playedSeconds)}
            onDuration={setCameraDuration}
            onSeek={handleTimeUpdate}
            loop={false}
          />
          <button
            onClick={() => handleFullscreen(cameraContainerRef)}
            className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
            title="Toggle fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path>
            </svg>
          </button>
        </div>
        <div className="aspect-video relative" ref={screenContainerRef}>
          <ReactPlayer
            ref={screenPlayerRef}
            url={screenUrl}
            width="100%"
            height="100%"
            playing={isPlaying}
            onProgress={({ playedSeconds }) => handleTimeUpdate(playedSeconds)}
            onDuration={setScreenDuration}
            onSeek={handleTimeUpdate}
            loop={false}
          />
          <button
            onClick={() => handleFullscreen(screenContainerRef)}
            className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
            title="Toggle fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path>
            </svg>
          </button>
        </div>
      </div>
      <div className="flex justify-center">
        <button
          onClick={handlePlayPause}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {isPlaying ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Play
            </>
          )}
        </button>
      </div>
      <div className="px-4">
        <div 
          ref={timelineRef}
          className="h-2 bg-gray-200 rounded-full cursor-pointer relative"
          onClick={handleTimelineClick}
        >
          <div 
            className="absolute h-full bg-blue-600 rounded-full"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          />
          <div
            className="absolute w-4 h-4 bg-blue-600 rounded-full -top-1 cursor-grab active:cursor-grabbing transform -translate-x-1/2 hover:scale-110 transition-transform"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
            onMouseDown={handleMouseDown}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}; 