'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import InsightCard from '@/components/InsightCard';

// Define interface for insight data
interface Insight {
  _id: string;
  insight: string;
  insightType: string;
  status: string;
  createdAt: string;
  priority: number;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [latestInsights, setLatestInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch latest insights
  useEffect(() => {
    async function fetchInsights() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/insights?limit=5&status=new');
        
        if (!response.ok) {
          throw new Error('Failed to fetch insights');
        }
        
        const data = await response.json();
        setLatestInsights(data.data || []);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setError('Failed to load insights. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchInsights();
  }, []);

  // Generate new insights
  const handleGenerateInsights = async () => {
    try {
      setIsLoading(true);
      
      // First capture new screen activity
      const captureResponse = await fetch('/api/screen-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY || 'test-api-key-12345'}`
        },
      });
      
      if (!captureResponse.ok) {
        const errorData = await captureResponse.json();
        throw new Error(errorData.message || 'Failed to capture screen activity');
      }
      
      // Then generate insights from it
      const insightResponse = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY || 'test-api-key-12345'}`
        },
      });
      
      if (!insightResponse.ok) {
        const errorData = await insightResponse.json();
        throw new Error(errorData.message || 'Failed to generate insights');
      }
      
      // Refresh the insights list
      const refreshResponse = await fetch('/api/insights?limit=5&status=new');
      
      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        throw new Error(errorData.message || 'Failed to refresh insights');
      }
      
      const data = await refreshResponse.json();
      setLatestInsights(data.data || []);
      setError(null);
    } catch (error) {
      console.error('Error generating insights:', error);
      setError(`Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update insight status
  const handleInsightStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/insights', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insightId: id,
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update insight status');
      }
      
      // Refresh insights
      const refreshResponse = await fetch('/api/insights?limit=5&status=new');
      const data = await refreshResponse.json();
      setLatestInsights(data.data || []);
    } catch (error) {
      console.error('Error updating insight status:', error);
      setError('Failed to update insight status. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <button
              onClick={handleGenerateInsights}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Generate New Insights'}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Latest Insights
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Recent insights based on your screen activity.
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
              ) : latestInsights.length > 0 ? (
                <div className="space-y-4">
                  {latestInsights.map((insight) => (
                    <InsightCard
                      key={insight._id}
                      id={insight._id}
                      insight={insight.insight}
                      type={insight.insightType}
                      status={insight.status}
                      timestamp={insight.createdAt}
                      priority={insight.priority}
                      onStatusChange={handleInsightStatusChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No insights available. Generate new insights to see them here.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                What is DeskSense?
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Learn more about DeskSense and how it works.
              </p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
              <div className="prose dark:prose-invert max-w-none">
                <p>
                  DeskSense provides ambient intelligence for your desktop, combining
                  Screenpipe's screen capture capabilities with Nebius AI's processing power.
                </p>
                <h3>Features:</h3>
                <ul>
                  <li><strong>Ambient Intelligence:</strong> Continuously monitors your screen, audio, and interactions.</li>
                  <li><strong>Proactive Insights:</strong> Analyzes your work habits and generates helpful suggestions.</li>
                  <li><strong>Smart Automation:</strong> Detects patterns in your workflow to automate routine tasks.</li>
                  <li><strong>Adaptive Learning:</strong> Learns your preferences over time for better suggestions.</li>
                </ul>
                <p>
                  To get started, click the "Generate New Insights" button above to analyze
                  your recent screen activity and receive personalized insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
