
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import interviewService from '../firebase/services';
import { AlertTriangle, Plus, X, User, Calendar, Link, Target, Clock, MapPin } from 'lucide-react';
import { InterviewStatus } from '../firebase/types';

// Generate timezone options
export const DEFAULT_TIMEZONES: string[] = [
  'America/New_York', // EST/EDT
  'America/Chicago',  // CST/CDT
  'America/Denver',   // MST/MDT
  'America/Los_Angeles', // PST/PDT
  'America/Anchorage', // AKST/AKDT
  'Pacific/Honolulu',  // HST
  'Europe/London',     // GMT/BST
  'Europe/Paris',      // CET/CEST
  'Asia/Tokyo',        // JST
  'Australia/Sydney',  // AEST/AEDT
];



// Helper function to get timezone abbreviation
const getTimezoneAbbreviation = (timezone: string): string => {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { timeZone: timezone, timeZoneName: 'short' };
  const timeString = date.toLocaleString('en-US', options);
  const abbreviation = timeString.split(' ').pop() || '';
  return abbreviation;
};

// Helper to get timezone offset difference
const getTimezoneDifference = (timezone: string, localTimezone: string): string => {
  try {
    // We'll calculate the offset difference for the current time
    const now = new Date();
    
    // The most reliable way to get the timezone offset is to use the Intl API directly
    // We create a formatter with the required timezone and extract the offset information
    
    // Get the GMT offset for both timezones
    function getOffsetForTimezone(tz: string): number {
      try {
        // Format the current date in the target timezone and include the timezone name
        const formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz,
          timeZoneName: 'longOffset',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        });
        
        // Get the formatted string which will include the GMT offset
        const formatted = formatter.format(now);
        
        // Extract the offset string using a regex - looking for GMT+XX:XX or GMT-XX:XX
        const match = formatted.match(/GMT([+-])(\d{1,2}):(\d{2})/);
        
        if (!match) {
          return 0; // Default to 0 if pattern not found
        }
        
        // Convert the matched groups to hours and minutes
        const sign = match[1] === '-' ? -1 : 1;
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3], 10);
        
        // Return the offset in hours (as a decimal)
        return sign * (hours + minutes/60);
      } catch (e) {
        console.error(`Error calculating offset for ${tz}:`, e);
        return 0;
      }
    }
    
    // Get offsets for both timezones
    const localOffset = getOffsetForTimezone(localTimezone);
    const targetOffset = getOffsetForTimezone(timezone);
    
    // Calculate the difference
    const diffHours = targetOffset - localOffset;
    
    // Format the output
    if (Math.abs(diffHours) < 0.1) {
      return 'Same as local time';
    }
    
    // Handle fractional hours (like India which is UTC+5:30)
    if (diffHours % 1 !== 0) {
      const roundedHours = Math.floor(diffHours);
      const minutes = Math.abs(Math.round((diffHours % 1) * 60));
      
      const sign = diffHours > 0 ? '+' : '';
      if (minutes === 0) {
        return `${sign}${roundedHours} hours from local time`;
      } else {
        return `${sign}${roundedHours}:${minutes.toString().padStart(2, '0')} hours from local time`;
      }
    } else {
      const sign = diffHours > 0 ? '+' : '';
      return `${sign}${diffHours} hours from local time`;
    }
  } catch (error) {
    console.error('Error calculating timezone difference:', error);
    return ''; // Return empty string on error
  }
};

// Helper function to validate URL
const isValidUrl = (url: string): boolean => {
  if (!url) return true; // Empty URLs are valid (optional fields)
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Helper function to convert Zoom meeting links to the proper format
const convertZoomLink = (url: string): string => {
  try {
    // Check if it's a Zoom meeting link
    if (!url.includes('zoom.us/j/')) {
      return url; // Return original if not a Zoom link
    }

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const meetingId = pathParts[pathParts.length - 1];
    console.log('meetingId', meetingId);
    
    // Extract password from query parameters
    const password = urlObj.searchParams.get('pwd');
    
    if (meetingId && password) {
      // Construct the new Zoom link format
      return `https://app.zoom.us/wc/${meetingId}/join?fromPWA=1&pwd=${password}`;
    }
    
    return url; // Return original if we can't extract the required parts
  } catch (error) {
    console.error('Error converting Zoom link:', error);
    return url; // Return original on error
  }
};

export default function CreateInterview() {
  const { user } = useAuth();
  const { interviewsLeft, loading: userLoading, refreshInterviewCount } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>(['']);
  const [timezoneInfo, setTimezoneInfo] = useState<{ [key: string]: { abbr: string, diff: string } }>({});
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezones = DEFAULT_TIMEZONES.includes(userTimezone) 
    ? DEFAULT_TIMEZONES 
    : [...DEFAULT_TIMEZONES, userTimezone];
  
  const [formData, setFormData] = useState({
    candidate: '',
    position: '',
    startDate: '',
    startTime: '',
    timezone: userTimezone,
    duration: '60',
    durationHours: '1',
    durationMinutes: '0',
    intervieweeEmail: '',
    meetingLink: '',
  });

  // Generate timezone information once on component mount
  useEffect(() => {
    const info: { [key: string]: { abbr: string, diff: string } } = {};
    
    timezones.forEach(tz => {
      info[tz] = {
        abbr: getTimezoneAbbreviation(tz),
        diff: getTimezoneDifference(tz, userTimezone)
      };
    });
    
    setTimezoneInfo(info);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Convert hours and minutes to total minutes
      const hours = parseInt(newData.durationHours) || 0;
      const minutes = parseInt(newData.durationMinutes) || 0;
      const totalMinutes = hours * 60 + minutes;
      
      return { ...newData, duration: totalMinutes.toString() };
    });
    
    // Clear validation errors for duration fields
    if (validationErrors.duration || validationErrors.durationHours || validationErrors.durationMinutes) {
      setValidationErrors(prev => ({ 
        ...prev, 
        duration: '', 
        durationHours: '', 
        durationMinutes: '' 
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
    
    // Clear validation error for this link
    const linkKey = `link-${index}`;
    if (validationErrors[linkKey]) {
      setValidationErrors(prev => ({ ...prev, [linkKey]: '' }));
    }
  };

  const addLink = () => {
    setLinks([...links, '']);
  };

  const removeLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
  };



  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Required field validation
    if (!formData.candidate.trim()) {
      errors.candidate = 'Candidate name is required';
    }
    if (!formData.position.trim()) {
      errors.position = 'Position is required';
    }
    if (!formData.intervieweeEmail.trim()) {
      errors.intervieweeEmail = 'Interviewee email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.intervieweeEmail)) {
      errors.intervieweeEmail = 'Please enter a valid email address';
    }
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }
    // Validate duration fields
    const hours = parseInt(formData.durationHours) || 0;
    const minutes = parseInt(formData.durationMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;
    
    if (!formData.durationHours || formData.durationHours.trim() === '') {
      errors.durationHours = 'Hours is required';
    } else if (isNaN(hours) || hours < 0 || hours > 8) {
      errors.durationHours = 'Hours must be between 0 and 8';
    }
    
    if (!formData.durationMinutes || formData.durationMinutes.trim() === '') {
      errors.durationMinutes = 'Minutes is required';
    } else if (isNaN(minutes) || minutes < 0 || minutes > 59) {
      errors.durationMinutes = 'Minutes must be between 0 and 59';
    }
    
    if (totalMinutes < 1 || totalMinutes > 480) {
      errors.duration = 'Total duration must be between 1 and 480 minutes';
    }

    // URL validation
    if (formData.meetingLink && !isValidUrl(formData.meetingLink)) {
      errors.meetingLink = 'Please enter a valid URL';
    }

    // Validate interview links
    links.forEach((link, index) => {
      if (index === 0 && !link.trim()) {
        errors[`link-${index}`] = 'At least one interview link is required';
      } else if (link.trim() && !isValidUrl(link)) {
        errors[`link-${index}`] = 'Please enter a valid URL';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateForm()) {
      return;
    }

    // Check if user has interviews left
    if (interviewsLeft <= 0) {
      setError('You have no interviews left. Please contact support to get more interviews.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Filter out empty links
      const validLinks = links.filter(link => link.trim() !== '');

      // Convert meeting link if it's a Zoom link
      const convertedMeetingLink = formData.meetingLink ? convertZoomLink(formData.meetingLink) : '';

      // Create interview in Firestore
      const interviewData = {
        interviewerId: user.uid,
        candidate: formData.candidate,
        position: formData.position,
        startDate: formData.startDate,
        startTime: formData.startTime,
        timezone: formData.timezone,
        duration: formData.duration,
        status: InterviewStatus.NotCompleted,
        intervieweeEmail: formData.intervieweeEmail,
        links: validLinks,
        meetingLink: convertedMeetingLink,
      };

      const interviewId = (await interviewService.createInterview(interviewData)).id;
      
      // Decrement the user's interview count
      if (user.email) {
        await refreshInterviewCount();
      }
      
      navigate(`/interviews/${interviewId}`);
    } catch (err) {
      setError('Failed to create interview. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTimezoneTime = () => {
    try {
      return new Date().toLocaleString('en-US', {
        timeZone: formData.timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

      return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto p-4 sm:p-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <Target className="h-6 w-6" />
                  Create New Interview
                </h1>
                {!userLoading && (
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium">Interviews Left:</span>
                    <span className="bg-red-500 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {interviewsLeft}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Interviews Left Warning */}
            {!userLoading && interviewsLeft <= 0 && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">
                  <span className="font-semibold">No interviews left!</span> You have used all your available interviews. Please contact support to get more interviews.
                </p>
              </div>
            )}

            {/* Required Fields Notice */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Note:</span> All fields marked with an asterisk (*) are required.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 👤 Candidate Details Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Candidate Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Candidate Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="candidate"
                      value={formData.candidate}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        validationErrors.candidate 
                          ? 'border-red-300 bg-red-50 dark:bg-red-900' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      placeholder="Enter candidate's full name"
                    />
                    {validationErrors.candidate && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.candidate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        validationErrors.position 
                          ? 'border-red-300 bg-red-50 dark:bg-red-900' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      placeholder="e.g., Senior Software Engineer"
                    />
                    {validationErrors.position && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.position}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Candidate Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="intervieweeEmail"
                      value={formData.intervieweeEmail}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        validationErrors.intervieweeEmail 
                          ? 'border-red-300 bg-red-50 dark:bg-red-900' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      placeholder="candidate@example.com"
                    />
                    {validationErrors.intervieweeEmail && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.intervieweeEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Hours
                        </label>
                        <input
                          type="number"
                          name="durationHours"
                          value={formData.durationHours}
                          onChange={handleDurationChange}
                          min="0"
                          max="8"
                          placeholder="0"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                            validationErrors.durationHours 
                              ? 'border-red-300 bg-red-50 dark:bg-red-900' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        />
                        {validationErrors.durationHours && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.durationHours}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Minutes
                        </label>
                        <input
                          type="number"
                          name="durationMinutes"
                          value={formData.durationMinutes}
                          onChange={handleDurationChange}
                          min="0"
                          max="59"
                          placeholder="0"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                            validationErrors.durationMinutes 
                              ? 'border-red-300 bg-red-50 dark:bg-red-900' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        />
                        {validationErrors.durationMinutes && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.durationMinutes}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Total: {formData.duration} minutes ({Math.floor(parseInt(formData.duration) / 60)}h {parseInt(formData.duration) % 60}m)
                    </p>
                    {validationErrors.duration && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.duration}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 🗓️ Schedule Interview Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Schedule Interview</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.showPicker()}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        validationErrors.startDate 
                          ? 'border-red-300 bg-red-50 dark:bg-red-900' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    />
                    {validationErrors.startDate && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.startDate}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.showPicker()}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        validationErrors.startTime 
                          ? 'border-red-300 bg-red-50 dark:bg-red-900' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    />
                    {validationErrors.startTime && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.startTime}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timezone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleInputChange}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {timezones.map((tz: string) => (
                          <option key={tz} value={tz}>
                            {tz} ({timezoneInfo[tz]?.abbr || ''}) - {timezoneInfo[tz]?.diff || ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        <span className="font-semibold">🕒 Current time in {formData.timezone}:</span> {getCurrentTimezoneTime()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🔗 Links Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Link className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Interview Links</h2>
                </div>

                {/* Meeting Link */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    name="meetingLink"
                    value={formData.meetingLink}
                    onChange={handleInputChange}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      validationErrors.meetingLink 
                        ? 'border-red-300 bg-red-50 dark:bg-red-900' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Add a Zoom, Google Meet, or other video conferencing link
                  </p>
                  {validationErrors.meetingLink && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.meetingLink}</p>
                  )}
                </div>

                {/* Interview Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interview Links <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add URLs that will open when the interview starts.</p>
                  
                  {links.map((link, index) => (
                    <div key={index} className="flex gap-3 mb-3">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => handleLinkChange(index, e.target.value)}
                        placeholder={index === 0 ? "https://example.com/interview" : "https://example.com"}
                        className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          validationErrors[`link-${index}`] 
                            ? 'border-red-300 bg-red-50 dark:bg-red-900' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      />
                      {links.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="p-3 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {validationErrors['link-0'] && (
                    <p className="text-red-500 text-sm mb-3">{validationErrors['link-0']}</p>
                  )}
                  
                  <button
                    type="button"
                    onClick={addLink}
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Link
                  </button>
                </div>
              </div>

              {/* Sticky Submit Button */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 -mx-6 -mb-6">
                <button
                  type="submit"
                  disabled={loading || userLoading || interviewsLeft <= 0}
                  className={`w-full py-4 px-6 text-white rounded-lg font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3 ${
                    interviewsLeft > 0
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-500'
                      : 'bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 focus:ring-black'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : interviewsLeft <= 0 ? (
                    'No Interviews Left'
                  ) : (
                    <>
                      Create Interview
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
