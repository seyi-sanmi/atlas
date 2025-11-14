'use client';

import { useState } from 'react';

export default function TestLumaPage() {
  const [eventUrl, setEventUrl] = useState('');
  const [calendarResult, setCalendarResult] = useState<any>(null);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testCalendars = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-luma-calendar');
      const data = await response.json();
      setCalendarResult(data);
    } catch (error) {
      setCalendarResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testLookup = async () => {
    if (!eventUrl) {
      alert('Please enter an event URL');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/test-luma-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventUrl }),
      });
      const data = await response.json();
      setLookupResult(data);
    } catch (error) {
      setLookupResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Luma API Test Page</h1>
        
        <div className="space-y-8">
          {/* Calendar Test */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Calendar Events</h2>
            <button
              onClick={testCalendars}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              {loading ? 'Testing...' : 'Test Calendar Events'}
            </button>
            {calendarResult && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(calendarResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Lookup Test */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Event Lookup</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={eventUrl}
                onChange={(e) => setEventUrl(e.target.value)}
                placeholder="Enter Luma event URL (e.g., https://lu.ma/event-slug)"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white"
              />
              <button
                onClick={testLookup}
                disabled={loading || !eventUrl}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
              >
                {loading ? 'Testing...' : 'Test Lookup'}
              </button>
            </div>
            {lookupResult && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(lookupResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 