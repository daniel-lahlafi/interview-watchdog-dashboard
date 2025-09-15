import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Zap, 
  BarChart3, 
  Users, 
  Eye, 
  AlertTriangle, 
  Target,
  ArrowRight,
  CheckCircle,
  X
} from 'lucide-react';
import logo from '../assets/logo.png';

interface WelcomeScreenProps {
  onComplete: (dontShowAgain?: boolean) => void;
}

const features = [
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Real-time Analytics",
    description: "Monitor interview performance with live statistics and insights",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: "Live Monitoring",
    description: "Watch interviews in real-time with synchronized video streams",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: "Cheating Detection",
    description: "AI-powered detection of suspicious behavior and anomalies",
    color: "from-red-500 to-orange-500"
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Interview Management",
    description: "Organize and manage all your interview sessions efficiently",
    color: "from-green-500 to-emerald-500"
  }
];

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const navigate = useNavigate();

  const handleStartTutorial = () => {
    onComplete(dontShowAgain); // Pass checkbox state
    navigate('/onboarding/tutorial');
  };

  const handleSkip = () => {
    onComplete(dontShowAgain); // Pass checkbox state
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-center text-white">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Interview Watchdog" className="h-16 w-auto" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to Interview Watchdog</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Your comprehensive platform for managing and monitoring interview sessions with real-time analytics and cheating detection.
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {!showFeatures ? (
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Let's get you started!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    We'll show you around the platform so you can make the most of your interview monitoring capabilities.
                  </p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={handleStartTutorial}
                    className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 border border-blue-200 dark:border-blue-700 rounded-xl hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-800 dark:hover:to-cyan-800 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-blue-500 text-white rounded-full group-hover:scale-110 transition-transform duration-200">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Interactive Tutorial
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Learn about all features with our step-by-step guide
                    </p>
                  </button>

                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span>Don't show tutorial again</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setShowFeatures(true)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      Learn more about features
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <button
                      onClick={handleSkip}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Key Features
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Discover what makes Interview Watchdog powerful
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 bg-gradient-to-r ${feature.color} text-white rounded-lg`}>
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span>Don't show tutorial again</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => setShowFeatures(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleStartTutorial}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Start Tutorial</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
