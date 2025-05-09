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
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
    if (seekTime && seekTime !== lastSeekTimeRef.current) {
      lastSeekTimeRef.current = seekTime;
      const seconds = timeToSeconds(seekTime);
      setCurrentTime(seconds);
      onTimeUpdate?.(seconds);
    }
  }, [seekTime, onTimeUpdate]);

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    onTimeUpdate?.(time);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const percentage = clickPosition / rect.width;
      const newTime = percentage * 3600; // Assuming 1 hour max duration for live streams
      
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
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
      const newTime = percentage * 3600; // Assuming 1 hour max duration for live streams
      
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
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
  }, [isDragging]);

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
        <div className="aspect-video relative" ref={cameraContainerRef}>
          <LiveStreamPlayer
            sessionId={sessionId}
            streamType="camera"
            pollIntervalMs={2000}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
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
          <LiveStreamPlayer
            sessionId={sessionId}
            streamType="screen"
            pollIntervalMs={2000}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeUpdate={handleTimeUpdate}
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
            style={{ width: `${(currentTime / 3600) * 100}%` }}
          />
          <div
            className="absolute w-4 h-4 bg-blue-600 rounded-full -top-1 cursor-grab active:cursor-grabbing transform -translate-x-1/2 hover:scale-110 transition-transform"
            style={{ left: `${(currentTime / 3600) * 100}%` }}
            onMouseDown={handleMouseDown}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span>60:00</span>
        </div>
      </div>
    </div>
  );
};

export default SynchronizedStreams; 