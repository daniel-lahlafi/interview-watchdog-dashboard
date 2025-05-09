import React, { useEffect, useRef, useState } from "react";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";

interface LiveStreamPlayerProps {
  sessionId: string;
  streamType: "camera" | "screen";
  pollIntervalMs?: number; // How often to poll for new chunks
  isPlaying?: boolean;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
}

interface StorageItem {
  name: string;
  url: string;
}

const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
  sessionId,
  streamType,
  pollIntervalMs = 2000,
  isPlaying = false,
  currentTime = 0,
  onTimeUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const [appendedChunks, setAppendedChunks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<{ url: string; timestamp: number }[]>([]);

  const getChunkUrls = async (): Promise<string[]> => {
    try {
      const storage = getStorage();
      const streamPath = `streams/${streamType}/${sessionId}`;
      const streamRef = ref(storage, streamPath);
      
      const listResult = await listAll(streamRef);
      const m4sFiles = listResult.items
        .filter(item => item.name.endsWith(".m4s"))
        .map(item => ({
          name: item.name,
          ref: item
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const urls = await Promise.all(
        m4sFiles.map(async (item) => {
          const url = await getDownloadURL(item.ref);
          // Extract timestamp from filename (assuming format like chunk_1234567890.m4s)
          const timestamp = parseInt(item.name.match(/\d+/)?.[0] || "0", 10);
          return { url, timestamp };
        })
      );

      setChunks(urls);
      return urls.map(item => item.url);
    } catch (err) {
      console.error("Error fetching chunk URLs:", err);
      setError("Failed to fetch video chunks. Please try again.");
      return [];
    }
  };

  // Effect to handle play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
          setError("Failed to play video");
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Effect to handle seeking
  useEffect(() => {
    if (videoRef.current && currentTime > 0) {
      // Find the closest chunk to the requested time
      const targetChunk = chunks.find(chunk => chunk.timestamp >= currentTime * 1000);
      if (targetChunk) {
        // Clear existing chunks and start from the target chunk
        setAppendedChunks(new Set());
        sourceBufferRef.current?.abort();
        sourceBufferRef.current?.remove(0, Infinity);
        
        // Start appending chunks from the target time
        const startIndex = chunks.findIndex(chunk => chunk === targetChunk);
        const remainingChunks = chunks.slice(startIndex);
        
        remainingChunks.forEach(async (chunk) => {
          if (!appendedChunks.has(chunk.url)) {
            const res = await fetch(chunk.url);
            if (!res.ok) return;
            const buffer = await res.arrayBuffer();

            await new Promise<void>((resolve) => {
              const sb = sourceBufferRef.current;
              if (!sb) return resolve();
              const handleUpdateEnd = () => {
                sb.removeEventListener("updateend", handleUpdateEnd);
                resolve();
              };
              sb.addEventListener("updateend", handleUpdateEnd);
              sb.appendBuffer(buffer);
            });

            setAppendedChunks(prev => new Set(prev).add(chunk.url));
          }
        });
      }
    }
  }, [currentTime, chunks]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !("MediaSource" in window)) {
      setError("Your browser doesn't support MediaSource API");
      return;
    }

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;
    video.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener("sourceopen", async () => {
      try {
        const mime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        const sourceBuffer = mediaSource.addSourceBuffer(mime);
        sourceBufferRef.current = sourceBuffer;

        // Load init segment
        const storage = getStorage();
        const initRef = ref(storage, `streams/${streamType}/${sessionId}/init.mp4`);
        const initUrl = await getDownloadURL(initRef);
        const initRes = await fetch(initUrl);
        if (!initRes.ok) {
          throw new Error("Failed to load initialization segment");
        }
        const initBuffer = await initRes.arrayBuffer();
        sourceBuffer.appendBuffer(initBuffer);
        setIsLoading(false);
        console.log("init segment loaded");

        // Poll for chunks
        const interval = setInterval(async () => {
          const urls = await getChunkUrls();
          for (const url of urls) {
            console.log("appending chunk", url);
            if (!appendedChunks.has(url)) {
              const res = await fetch(url);
              if (!res.ok) continue;
              const buffer = await res.arrayBuffer();
              console.log("buffer", buffer);
              await new Promise<void>((resolve) => {
                const sb = sourceBufferRef.current;
                if (!sb) return resolve();
                const handleUpdateEnd = () => {
                  sb.removeEventListener("updateend", handleUpdateEnd);
                  resolve();
                };
                sb.addEventListener("updateend", handleUpdateEnd);
                sb.appendBuffer(buffer);
              });

              setAppendedChunks(prev => new Set(prev).add(url));
            }
          }
        }, pollIntervalMs);

        return () => clearInterval(interval);
      } catch (err) {
        console.error("Error in sourceopen handler:", err);
        setError("Failed to initialize video stream");
      }
    });

    // Add timeupdate listener
    const handleTimeUpdate = () => {
      if (video.currentTime && onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
    };
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      if (mediaSourceRef.current) {
        URL.revokeObjectURL(video.src);
      }
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [sessionId, streamType, pollIntervalMs, onTimeUpdate]);

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
    <div className="w-full max-w-2xl mx-auto p-4 bg-black rounded-xl shadow-xl">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-white">Loading stream...</div>
        </div>
      )}
      <video
        ref={videoRef}
        controls={false}
        autoPlay={false}
        className="w-full rounded-lg"
        style={{ backgroundColor: "#000" }}
      />
    </div>
  );
};

export default LiveStreamPlayer; 