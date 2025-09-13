
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Mail, CheckCircle, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';
import { generatePlaceholderImage } from '../utils/placeholderImages';
import { useOnboarding } from '../contexts/OnboardingContext';

interface TutorialSlide {
  id: number;
  title: string;
  description: string;
  image: string;
  features: string[];
}

const tutorialSlides: TutorialSlide[] = [
  {
    id: 1,
    title: "Welcome to Interview Watchdog",
    description: "Your comprehensive platform for managing and monitoring interview sessions with real-time analytics and insights.",
    image: generatePlaceholderImage(600, 400, "Dashboard Overview"),
    features: [
      "Real-time interview monitoring",
      "Advanced analytics dashboard",
      "Secure video streaming"
    ]
  },
  {
    id: 2,
    title: "Create Your First Interview",
    description: "Start by creating a new interview session. Set up your parameters and invite participants with just a few clicks.",
    image: generatePlaceholderImage(600, 400, "Create Interview"),
    features: [
      "Quick interview setup",
      "Participant management",
      "Custom interview parameters"
    ]
  },
  {
    id: 3,
    title: "Monitor Live Sessions",
    description: "Watch interviews in real-time with our advanced monitoring tools. Get insights and analytics as the session progresses.",
    image: generatePlaceholderImage(600, 400, "Live Monitoring"),
    features: [
      "Live video streaming",
      "Real-time analytics",
      "Session recording"
    ]
  },
  {
    id: 4,
    title: "Review and Analyze",
    description: "Access detailed reports and analytics after each interview. Review performance metrics and generate insights.",
    image: generatePlaceholderImage(600, 400, "Reports & Analytics"),
    features: [
      "Detailed performance reports",
      "Analytics dashboard",
      "Export capabilities"
    ]
  }
];

function OnboardingTutorial() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { setTutorialCompleted } = useOnboarding();

  const nextSlide = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const goToSlide = (index: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 300);
  };

  const handleComplete = () => {
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
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                  {currentSlideData.title}
                </h1>
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
                <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mt-6">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                        Missing a feature?
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                        Email us at{' '}
                        <a 
                          href="mailto:features@interviewwatchdog.com" 
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                        >
                          features@interviewwatchdog.com
                        </a>
                        {' '}and we'll consider adding it!
                      </p>
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
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <span>Get Started</span>
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
