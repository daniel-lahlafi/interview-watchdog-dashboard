
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Mail, CheckCircle, ArrowRight, SkipForward, Target, BarChart3, Users, Eye, AlertTriangle, FileText, Clock, Zap } from 'lucide-react';
import logo from '../assets/logo.png';
import { generatePlaceholderImage } from '../utils/placeholderImages';
import { useOnboarding } from '../contexts/OnboardingContext';

interface TutorialSlide {
  id: number;
  title: string;
  description: string;
  image: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
}

const tutorialSlides: TutorialSlide[] = [
  {
    id: 1,
    title: "Welcome to Interview Watchdog",
    description: "Your comprehensive platform for managing and monitoring interview sessions with real-time analytics and cheating detection capabilities.",
    image: generatePlaceholderImage(600, 400, "Dashboard Overview"),
    features: [
      "Real-time interview monitoring and analytics",
      "Advanced cheating detection algorithms",
      "Secure video streaming and recording",
      "Comprehensive interview management"
    ],
    icon: <Zap className="h-8 w-8" />,
    color: "from-blue-500 to-purple-600"
  },
  {
    id: 2,
    title: "Dashboard Overview",
    description: "Your central command center where you can view all interview statistics, monitor suspicious activity, and track performance metrics at a glance.",
    image: generatePlaceholderImage(600, 400, "Dashboard Analytics"),
    features: [
      "Real-time interview statistics",
      "Suspicious activity alerts",
      "Performance trend analysis",
      "Quick access to all interviews"
    ],
    icon: <BarChart3 className="h-8 w-8" />,
    color: "from-green-500 to-teal-600"
  },
  {
    id: 3,
    title: "Create Your First Interview",
    description: "Set up interviews with detailed scheduling, participant management, and custom parameters. Generate access codes and meeting links for seamless candidate experience.",
    image: generatePlaceholderImage(600, 400, "Create Interview Form"),
    features: [
      "Flexible scheduling with timezone support",
      "Automatic access code generation",
      "Meeting link integration (Zoom, Google Meet)",
      "Custom interview duration settings"
    ],
    icon: <Target className="h-8 w-8" />,
    color: "from-orange-500 to-red-600"
  },
  {
    id: 4,
    title: "Interview Management",
    description: "View and manage all your interviews in one place. Filter by status, search candidates, and access detailed information for each session.",
    image: generatePlaceholderImage(600, 400, "Interview List"),
    features: [
      "Comprehensive interview listing",
      "Advanced filtering and search",
      "Status tracking (Live, Completed, Suspicious)",
      "Quick actions and bulk operations"
    ],
    icon: <Users className="h-8 w-8" />,
    color: "from-indigo-500 to-blue-600"
  },
  {
    id: 5,
    title: "Real-time Monitoring",
    description: "Monitor live interviews with synchronized video streams, real-time anomaly detection, and instant alerts for suspicious behavior.",
    image: generatePlaceholderImage(600, 400, "Live Monitoring"),
    features: [
      "Synchronized multi-camera streaming",
      "Real-time cheating detection",
      "Instant anomaly alerts",
      "Live session controls"
    ],
    icon: <Eye className="h-8 w-8" />,
    color: "from-purple-500 to-pink-600"
  },
  {
    id: 6,
    title: "Cheating Detection & Analytics",
    description: "Advanced AI-powered detection identifies suspicious activities like looking away from screen, multiple faces, or unusual behavior patterns.",
    image: generatePlaceholderImage(600, 400, "Cheating Detection"),
    features: [
      "AI-powered behavior analysis",
      "Real-time anomaly detection",
      "Detailed cheating reports",
      "Customizable detection thresholds"
    ],
    icon: <AlertTriangle className="h-8 w-8" />,
    color: "from-red-500 to-orange-600"
  },
  {
    id: 7,
    title: "Interview Details & Review",
    description: "Access comprehensive interview details, review recordings, analyze anomalies, and add notes for future reference.",
    image: generatePlaceholderImage(600, 400, "Interview Details"),
    features: [
      "Complete interview playback",
      "Anomaly timeline and analysis",
      "Interviewer notes and comments",
      "Export capabilities for reports"
    ],
    icon: <FileText className="h-8 w-8" />,
    color: "from-teal-500 to-green-600"
  },
  {
    id: 8,
    title: "You're All Set!",
    description: "You now have everything you need to start conducting secure, monitored interviews. Create your first interview and experience the power of Interview Watchdog.",
    image: generatePlaceholderImage(600, 400, "Success"),
    features: [
      "Ready to create your first interview",
      "Full access to all monitoring features",
      "24/7 support available",
      "Regular updates and improvements"
    ],
    icon: <CheckCircle className="h-8 w-8" />,
    color: "from-emerald-500 to-green-600"
  }
];

function OnboardingTutorial() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setTutorialCompleted } = useOnboarding();

  // Handle URL parameter for slide navigation
  useEffect(() => {
    const slideParam = searchParams.get('slide');
    if (slideParam) {
      const slideIndex = parseInt(slideParam) - 1; // Convert to 0-based index
      if (slideIndex >= 0 && slideIndex < tutorialSlides.length) {
        setCurrentSlide(slideIndex);
      }
    }
  }, [searchParams]);

  // Update URL when slide changes
  const updateUrl = (slideIndex: number) => {
    setSearchParams({ slide: (slideIndex + 1).toString() });
  };

  const nextSlide = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        const newSlide = currentSlide + 1;
        setCurrentSlide(newSlide);
        updateUrl(newSlide);
        setIsAnimating(false);
      }, 300);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        const newSlide = currentSlide - 1;
        setCurrentSlide(newSlide);
        updateUrl(newSlide);
        setIsAnimating(false);
      }, 300);
    }
  };

  const goToSlide = (index: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      updateUrl(index);
      setIsAnimating(false);
    }, 300);
  };

  const handleComplete = () => {
    setTutorialCompleted(true);
    navigate('/');
  };

  const handleSkip = () => {
    setTutorialCompleted(true);
    navigate('/');
  };

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSlide < tutorialSlides.length - 1) {
        nextSlide();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide]);

  const currentSlideData = tutorialSlides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={logo} alt="Logo" className="h-8 w-auto mr-3" />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">Interview Watchdog</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentSlide + 1} of {tutorialSlides.length}
              </span>
              <button
                onClick={handleSkip}
                className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <SkipForward className="h-4 w-4" />
                <span>Skip Tutorial</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${currentSlideData.color} text-white shadow-lg`}>
                    {currentSlideData.icon}
                  </div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                    {currentSlideData.title}
                  </h1>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {currentSlideData.description}
                </p>
              </div>

              <div className="space-y-3">
                {currentSlideData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {currentSlide === tutorialSlides.length - 1 && (
                <div className="space-y-4 mt-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                          Ready to get started?
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-200 mt-1">
                          Click "Create Your First Interview" to begin setting up your first monitored interview session.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                          Need help or have suggestions?
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                          Email us at{' '}
                          <a 
                            href="mailto:support@interviewwatchdog.com" 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                          >
                            support@interviewwatchdog.com
                          </a>
                          {' '}for assistance or feature requests!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Image Carousel */}
          <div className="relative">
            <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={currentSlideData.image}
                    alt={currentSlideData.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to generated placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = generatePlaceholderImage(600, 400, currentSlideData.title);
                    }}
                  />
                </div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 dark:bg-gray-800 dark:bg-opacity-90 rounded-full p-4 shadow-lg">
                    <Play className="h-8 w-8 text-blue-600 dark:text-blue-400 ml-1" />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-700 bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              onClick={nextSlide}
              disabled={currentSlide === tutorialSlides.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-700 bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 flex items-center justify-between">
          {/* Dots */}
          <div className="flex space-x-2">
            {tutorialSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSlide 
                    ? 'bg-blue-600 scale-125' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            {currentSlide < tutorialSlides.length - 1 ? (
              <button
                onClick={nextSlide}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Target className="h-4 w-4" />
                <span>Create Your First Interview</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingTutorial;
