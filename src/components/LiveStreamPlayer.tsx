import React, { useEffect, useRef, useState } from "react";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Hls, { ErrorData, HlsConfig, Events as HlsEvents } from "hls.js";

const POLL_INTERVAL_MS = 5_000;          // how often we re-query Firebase
const MAX_POLL_ATTEMPTS = 0;             // 0 = unlimited – change if you want a hard cap

interface LiveStreamPlayerProps {
  sessionId: string;
  streamType: "camera" | "screen";
  isPlaying?: boolean;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  onPlayPause?: () => void;
  duration?: number;
  onLiveStreamTimeUpdate?: (time: number) => void;
}

const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = (props) => {
  const {
    sessionId,
    streamType,
    isPlaying = false,
    currentTime = 0,
    onTimeUpdate,
    videoRef: externalVideoRef,
    onPlayPause,
    duration = 0,
    onLiveStreamTimeUpdate,
  } = props;

  /** ---------- refs & state ---------- */
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;

  const hlsRef = useRef<Hls | null>(null);
  const resolvedPlaylistURL = useRef<string | null>(null);

  const pollTimer = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Timeline click handler
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickPosition / rect.width));
    const newTime = percentage * duration;
    
    if (videoRef.current) {
      onLiveStreamTimeUpdate?.(newTime);
    }
  };

  // Mouse down handler for timeline dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };
  
  // Mouse move handler for timeline dragging
  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const movePosition = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percentage = movePosition / rect.width;
    const newTime = percentage * duration;
    
    if (videoRef.current) {
      onLiveStreamTimeUpdate?.(newTime);
    }
  };
  
  // Mouse up handler for timeline dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle play/pause toggle
  const handlePlayPauseToggle = () => {
    onPlayPause?.();
  };

  // Handle fullscreen toggle
  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  // Show controls on mouse move and hide after timeout
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  /* ------------------------------------------------------------------ */
  /*                 1.  POLL CLOUD-STORAGE UNTIL FILE EXISTS           */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let attempt = 0;
    const storage = getStorage();

    const poll = async () => {
      try {
        const playlistRef = ref(storage, `streams/${streamType}/${sessionId}/playlist.m3u8`);
        const url = await getDownloadURL(playlistRef);
        resolvedPlaylistURL.current = url;
        setError(null);
        setIsLoading(false);
        bootstrapHls();             // we finally have a real URL – go!
      } catch (e: any) {
        // Expected while the file doesn't exist yet
        if (e?.code === "storage/object-not-found") {
          scheduleNextPoll();
        } else {
          // Something else (permissions, quota, etc.)
          console.error("[LiveStreamPlayer] Firebase error:", e);
          setError("Could not access stream.");
        }
      }
    };

    const scheduleNextPoll = () => {
      if (MAX_POLL_ATTEMPTS && attempt >= MAX_POLL_ATTEMPTS) {
        setError("Stream did not start in time.");
        return;
      }
      setRetryCount(++attempt);
      pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    // Start first poll immediately
    poll();

    return () => {
      pollTimer.current && clearTimeout(pollTimer.current);
      pollTimer.current = null;
    };
  }, [sessionId, streamType]);

  /* ------------------------------------------------------------------ */
  /*                     2.  CREATE / RE-CREATE hls.js                   */
  /* ------------------------------------------------------------------ */
  const bootstrapHls = () => {
    if (!videoRef.current || !resolvedPlaylistURL.current) return;

    // Clean up old instance
    hlsRef.current?.destroy();
    hlsRef.current = null;

    const cfg: Partial<HlsConfig> = {
      enableWorker: true,
      lowLatencyMode: true,

      /* Let hls.js keep hammering the manifest/fragments forever */
      manifestLoadingMaxRetry: 9999,
      levelLoadingMaxRetry: 9999,
      fragLoadingMaxRetry: 9999,

      manifestLoadingRetryDelay: 1_000,
      levelLoadingRetryDelay: 1_000,
      fragLoadingRetryDelay: 1_000,
    };

    const hls = new Hls(cfg);
    hlsRef.current = hls;

    /* Attach event listeners */
    hls.on(HlsEvents.LEVEL_LOADED, (_, data) => {
      const live = !!data?.details?.live;
      setIsLiveStream(live);
      console.log("Level loaded", data);
      console.log("isLiveStream", isLiveStream);
      console.log("isPlaying", isPlaying);
      if (live) {
        videoRef.current!.muted = true;
        videoRef.current?.play().catch(err => {
          console.error("Error playing video:", err);
        });
      }
    });

    hls.on(HlsEvents.ERROR, (_evt, data: ErrorData) => {
      if (!data.fatal) return;

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        console.warn("[hls] NETWORK_ERROR, retrying…");
        hls.startLoad();
        return;
      }
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        console.warn("[hls] MEDIA_ERROR, attempting recovery…");
        hls.recoverMediaError();
        return;
      }

      console.error("[hls] Fatal error:", data);
      setTimeout(bootstrapHls, 3_000);
    });

    /* Kick everything off */
    hls.attachMedia(videoRef.current);
    hls.loadSource(resolvedPlaylistURL.current);
    initializedRef.current = true;
  };

  /* ------------------------------------------------------------------ */
  /*                     3.  EXTERNAL PLAY/PAUSE SYNC                    */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {/* ignored: handled elsewhere */});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Effect to handle mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  // Add timeupdate listener
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime && onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
    };
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [onTimeUpdate]);

  if (error) {
    return (
      <div className="relative w-full h-full overflow-hidden rounded-xl shadow-md bg-gray-900">
        <div className="flex flex-col items-center justify-center h-full p-6">
          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20 mb-3">
            <svg className="w-10 h-10 text-blue-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-blue-100 text-center font-medium">Stream Waiting</p>
          </div>
          <p className="text-gray-300 text-center">{error} {retryCount > 0 && `(Retry attempt: ${retryCount})`}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-xl shadow-md bg-gray-900"
      onMouseMove={handleMouseMove}
    >
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-10">
          <div className="w-12 h-12 rounded-full border-4 border-gray-300 border-t-blue-500 animate-spin mb-3"></div>
          <div className="text-white font-medium">Loading stream...</div>
        </div>
      )}
      <video
        ref={videoRef}
        controls={false}
        autoPlay={false}
        className="w-full h-full object-contain rounded-lg"
        style={{ backgroundColor: "#121212" }}
      />
      
      {/* Custom video controls overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-3 bg-black/60 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPauseToggle}
              className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              )}
            </button>
            <span className="text-white text-sm">{formatTime(currentTime)}</span>
            {isLiveStream && (
              <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">LIVE</span>
            )}
          </div>
          
          <button
            onClick={handleFullscreen}
            className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title="Toggle fullscreen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path>
            </svg>
          </button>
        </div>
        
        <div 
          ref={timelineRef}
          className="h-2 bg-gray-600 rounded-full cursor-pointer relative"
          onClick={handleTimelineClick}
        >
          <div
            className="absolute h-full bg-blue-600 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div
            className="absolute w-4 h-4 bg-blue-600 rounded-full -top-1 transform -translate-x-1/2 hover:scale-110 transition-transform cursor-grab active:cursor-grabbing"
            style={{ left: `${(currentTime / duration) * 100}%` }}
            onMouseDown={handleMouseDown}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPlayer; 