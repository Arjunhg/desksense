'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ActivityCard from '@/components/ActivityCard';

// Define interface for activity data
interface ActivityItem {
  _id: string;
  type: string;
  content: any;
  appName: string;
  windowName: string;
  browserUrl: string;
  timestamp: string;
  frameData: string;
}

export default function ActivityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(15); // Minutes to look back

  // Fetch screen activities
  useEffect(() => {
    async function fetchActivities() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/screen-activity?minutes=${timeRange}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch screen activities');
        }
        
        const data = await response.json();
        setActivities(data.data || []);
      } catch (error) {
        console.error('Error fetching screen activities:', error);
        setError('Failed to load screen activities. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchActivities();
  }, [timeRange]);

  // Function to handle refreshing the activity data
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/screen-activity?minutes=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch screen activities');
      }
      
      const data = await response.json();
      setActivities(data.data || []);
      setError(null);
    } catch (error) {
      console.error('Error refreshing screen activities:', error);
      setError('Failed to refresh screen activities. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle saving the activity data
  const handleSaveActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/screen-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes: timeRange }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save screen activities');
      }
      
      const data = await response.json();
      alert(`Successfully saved ${data.count} activity records`);
      
      // Refresh the activities list
      await handleRefresh();
    } catch (error) {
      console.error('Error saving screen activities:', error);
      setError('Failed to save screen activities. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Screen Activity</h1>
            <div className="flex space-x-2">
              <select
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value, 10))}
                disabled={isLoading}
              >
                <option value="5">Last 5 minutes</option>
                <option value="15">Last 15 minutes</option>
                <option value="30">Last 30 minutes</option>
                <option value="60">Last hour</option>
                <option value="360">Last 6 hours</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Refresh
              </button>
              <button
                onClick={handleSaveActivities}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Save Activities
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Recent Screen Activities
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Captured screen and audio data from the last {timeRange} minutes.
              </p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <ActivityCard
                      key={activity._id}
                      type={activity.type}
                      content={activity.content}
                      appName={activity.appName}
                      windowName={activity.windowName}
                      browserUrl={activity.browserUrl}
                      timestamp={activity.timestamp}
                      frameData={activity.frameData}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No activities found. Try adjusting the time range or refreshing.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}