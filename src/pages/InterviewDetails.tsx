import React, { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

function InterviewDetails() {
  const { id } = useParams()
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef1 = useRef<HTMLVideoElement>(null)
  const videoRef2 = useRef<HTMLVideoElement>(null)

  // Mock data for the interview
  const interview = {
    id,
    candidate: "John Smith",
    position: "Senior React Developer",
    date: "2024-03-15",
    duration: "45:00",
    screenVideo: "https://example.com/screen-recording.mp4", // Replace with actual video URL
    webcamVideo: "https://example.com/webcam-recording.mp4", // Replace with actual video URL
    anomalies: [
      { time: 120, type: "Screen Change" },
      { time: 300, type: "Multiple Monitors" },
      { time: 450, type: "Background Voice" }
    ]
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = e.currentTarget
    const rect = timeline.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * parseFloat(interview.duration)
    
    setCurrentTime(newTime)
    if (videoRef1.current) videoRef1.current.currentTime = newTime
    if (videoRef2.current) videoRef2.current.currentTime = newTime
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const durationInSeconds = parseInt(interview.duration.split(':')[0]) * 60 + 
                          parseInt(interview.duration.split(':')[1])

  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Interview Review: {interview.candidate}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {interview.position} • {interview.date}
        </p>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-2 gap-6">
          {/* Screen Recording */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-lg font-medium mb-4">Screen Recording</h2>
            <video
              ref={videoRef1}
              className="w-full aspect-video bg-black rounded-lg"
              controls
              src={interview.screenVideo}
            />
          </div>

          {/* Webcam Recording */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-lg font-medium mb-4">Webcam Recording</h2>
            <video
              ref={videoRef2}
              className="w-full aspect-video bg-black rounded-lg"
              controls
              src={interview.webcamVideo}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium">Timeline</h2>
            <span className="text-sm text-gray-500">{formatTime(currentTime)} / {interview.duration}</span>
          </div>
          
          <div 
            className="relative h-8 bg-gray-100 rounded-full cursor-pointer"
            onClick={handleTimelineClick}
          >
            {/* Progress bar */}
            <div 
              className="absolute h-full bg-blue-100 rounded-l-full"
              style={{ width: `${(currentTime / durationInSeconds) * 100}%` }}
            />
            
            {/* Anomaly markers */}
            {interview.anomalies.map((anomaly, index) => (
              <div
                key={index}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${(anomaly.time / durationInSeconds) * 100}%` }}
                title={`${anomaly.type} at ${formatTime(anomaly.time)}`}
              >
                <AlertTriangle className="h-4 w-4 text-yellow-500 -ml-2" />
              </div>
            ))}
          </div>

          {/* Anomaly list */}
          <div className="mt-4 space-y-2">
            {interview.anomalies.map((anomaly, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>{anomaly.type}</span>
                <span className="text-gray-400">at {formatTime(anomaly.time)}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default InterviewDetails