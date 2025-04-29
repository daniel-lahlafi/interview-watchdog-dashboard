import React, { useState } from 'react';
import { defaultInterviews } from '../mock/Interviews';


export default function CreateInterview() {
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [interviewLink, setInterviewLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send the data to your backend API
    defaultInterviews.push({
        id: defaultInterviews.length + 1,
        candidate: name,
        position: "Frontend Developer",
        date: expiryDate,
        duration: "50 minutes",
        hasAnomalies: false,
        confirmedCheating: false,
    })
    console.log({ name, expiryDate, jobLink, interviewLink });
    
    alert('Interview created!');
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Interview</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Interviewee Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
          <input
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Job Posting Link</label>
          <input
            type="url"
            value={jobLink}
            onChange={e => setJobLink(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Interview Link</label>
          <input
            type="url"
            value={interviewLink}
            onChange={e => setInterviewLink(e.target.value)}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Interview
        </button>
      </form>
    </div>
  );
}