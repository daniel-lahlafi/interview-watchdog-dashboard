import React, { useState } from 'react';
import { X, Search, BookOpen, Play, Mail, MessageCircle, ChevronRight, Target, BarChart3, Users, Eye, AlertTriangle, FileText, Clock, Zap } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const helpSections = [
  {
    id: 'tutorial',
    title: 'Interactive Tutorial',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'from-blue-500 to-cyan-500',
    items: [
      {
        title: 'Welcome & Overview',
        description: 'Introduction to Interview Watchdog platform',
        action: 'tutorial',
        target: '/onboarding/tutorial?slide=1'
      },
      {
        title: 'Dashboard Overview',
        description: 'Understanding your analytics and monitoring dashboard',
        action: 'tutorial',
        target: '/onboarding/tutorial?slide=2'
      },
      {
        title: 'Create Your First Interview',
        description: 'Step-by-step guide to setting up interviews',
        action: 'tutorial',
        target: '/onboarding/tutorial?slide=3'
      },
      {
        title: 'Interview Management',
        description: 'Managing and organizing your interview sessions',
        action: 'tutorial',
        target: '/onboarding/tutorial?slide=4'
      },
      {
        title: 'Real-time Monitoring',
        description: 'Live interview monitoring and video streaming',
        action: 'tutorial',
        target: '/onboarding/tutorial?slide=5'
      },
      {
        title: 'Cheating Detection',
        description: 'AI-powered detection and analytics features',
        action: 'tutorial',
        target: '/onboarding/tutorial?slide=6'
      },
      {
        title: 'Interview Details & Review',
        description: 'Reviewing recordings and analyzing results',
        action: 'tutorial',
        target: '/onboarding/tutorial?slide=7'
      },
      {
        title: 'Getting Started Guide',
        description: 'Final steps to begin using the platform',
        action: 'tutorial',
        target: '/onboarding/tutorial?slide=8'
      }
    ]
  },
  {
    id: 'getting-started',
    title: 'Quick Actions',
    icon: <Zap className="h-5 w-5" />,
    color: 'from-green-500 to-emerald-500',
    items: [
      {
        title: 'Create Your First Interview',
        description: 'Set up and schedule your first interview session',
        action: 'navigate',
        target: '/create-interview'
      },
      {
        title: 'View Dashboard',
        description: 'Access your analytics and monitoring dashboard',
        action: 'navigate',
        target: '/'
      },
      {
        title: 'Manage Interviews',
        description: 'View, edit, and organize all your interview sessions',
        action: 'navigate',
        target: '/interviews'
      }
    ]
  },
  {
    id: 'features',
    title: 'Key Features',
    icon: <Target className="h-5 w-5" />,
    color: 'from-purple-500 to-pink-500',
    items: [
      // {
      //   title: 'Real-time Monitoring',
      //   description: 'Watch live interviews with synchronized video streams',
      //   action: 'info'
      // },
      // {
      //   title: 'Cheating Detection',
      //   description: 'AI-powered detection of suspicious behavior patterns',
      //   action: 'info'
      // },
      // {
      //   title: 'Analytics & Reports',
      //   description: 'Comprehensive insights and performance metrics',
      //   action: 'info'
      // },
      // {
      //   title: 'Interview Scheduling',
      //   description: 'Flexible scheduling with timezone support',
      //   action: 'info'
      // }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'from-orange-500 to-red-500',
    items: [
      // {
      //   title: 'Video Not Loading',
      //   description: 'Common issues with video streaming and solutions',
      //   action: 'info'
      // },
      // {
      //   title: 'Access Code Issues',
      //   description: 'Troubleshooting candidate access problems',
      //   action: 'info'
      // },
      // {
      //   title: 'Detection Not Working',
      //   description: 'Fixing cheating detection and monitoring issues',
      //   action: 'info'
      // }
    ]
  }
];

const quickActions = [
  {
    title: 'View Tutorial',
    description: 'Step-by-step feature guide',
    icon: <BookOpen className="h-5 w-5" />,
    action: 'tutorial'
  },
  {
    title: 'Contact Support',
    description: 'Get help from our support team',
    icon: <MessageCircle className="h-5 w-5" />,
    action: 'support'
  }
];

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredSections = helpSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  const handleAction = (action: string, target?: string) => {
    switch (action) {
      case 'navigate':
        if (target) {
          window.location.href = target;
        }
        break;
      case 'tutorial':
        if (target) {
          window.location.href = target;
        } else {
          window.location.href = '/onboarding/tutorial';
        }
        onClose();
        break;
      case 'support':
        window.location.href = 'mailto:support@interviewwatchdog.com';
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Help Center</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {/* Quick Actions */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleAction(action.action)}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg">
                      {action.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{action.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Help Sections */}
          <div className="p-6">
            {filteredSections.map((section) => (
              <div key={section.id} className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 bg-gradient-to-r ${section.color} text-white rounded-lg`}>
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                </div>
                
                <div className="space-y-3">
                  {section.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => handleAction(item.action, item.target)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        </div>
                        {item.action === 'navigate' && (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        {item.action === 'tutorial' && (
                          <BookOpen className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="p-6 bg-blue-50 dark:bg-blue-900 border-t border-blue-200 dark:border-blue-700">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Still need help?
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-4">
                Our support team is here to help you get the most out of Interview Watchdog.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="mailto:support@interviewwatchdog.com"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email Support</span>
                </a>
                <a
                  href="mailto:features@interviewwatchdog.com"
                  className="inline-flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-800 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Request Feature</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
