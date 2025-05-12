import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import interviewService from '../firebase/services';
import { AlertTriangle, Plus, X } from 'lucide-react';
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

export default function CreateInterview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>(['']);
  const [timezoneInfo, setTimezoneInfo] = useState<{ [key: string]: { abbr: string, diff: string } }>({});
  
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
  };

  const addLink = () => {
    setLinks([...links, '']);
  };

  const removeLink = (index: number) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Filter out empty links
      const validLinks = links.filter(link => link.trim() !== '');

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
        meetingLink: formData.meetingLink,
      };

      const interviewId = (await interviewService.createInterview(interviewData)).id;
      navigate(`/interviews/${interviewId}`);
    } catch (err) {
      setError('Failed to create interview. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Interview</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Candidate Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="candidate"
              value={formData.candidate}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interviewee Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="intervieweeEmail"
              value={formData.intervieweeEmail}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Interview Scheduling Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Interview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone <span className="text-red-500">*</span>
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timezones.map((tz: string) => (
                  <option key={tz} value={tz}>
                    {tz} ({timezoneInfo[tz]?.abbr || ''}) - {timezoneInfo[tz]?.diff || ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Current time in selected timezone: 
                {' '}{new Date().toLocaleString('en-US', {timeZone: formData.timezone})}
              </p>
            </div>
          </div>
        </div>

        {/* Meeting Link Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meeting Link
          </label>
          <input
            type="url"
            name="meetingLink"
            value={formData.meetingLink}
            onChange={handleInputChange}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Add a Zoom, Google Meet, or other video conferencing link
          </p>
        </div>

        {/* Links Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Interview Links</h3>
          <p className="text-sm text-gray-500">Add URLs that will open when the interview starts.</p>
          
          {links.map((link, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => handleLinkChange(index, e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={index === 0} // Make at least the first link required
              />
              {links.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="p-2 text-gray-500 hover:text-red-500 rounded-md hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addLink}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Another Link
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-black text-white rounded-lg font-semibold text-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? 'Creating...' : 'Create Interview'}
        </button>
      </form>
    </div>
  );
}