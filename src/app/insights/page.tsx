'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import InsightCard from '@/components/InsightCard';

// Define interfaces
interface Insight {
  _id: string;
  insight: string;
  insightType: string;
  status: string;
  createdAt: string;
  priority: number;
}

export default function InsightsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch all insights
  useEffect(() => {
    async function fetchInsights() {
      try {
        setIsLoading(true);
        // Build query string based on filters
        let queryParams = new URLSearchParams();
        if (statusFilter !== 'all') {
          queryParams.append('status', statusFilter);
        }
        if (typeFilter !== 'all') {
          queryParams.append('type', typeFilter);
        }
        queryParams.append('limit', '50');
        
        const response = await fetch(`/api/insights?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch insights');
        }
        
        const data = await response.json();
        setInsights(data.data || []);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setError('Failed to load insights. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchInsights();
  }, [statusFilter, typeFilter]);

  // Generate new insights
  const handleGenerateInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First capture new screen activity
      const captureResponse = await fetch('/api/screen-activity', {
        method: 'POST',
      });
      
      if (!captureResponse.ok) {
        throw new Error('Failed to capture screen activity');
      }
      
      // Then generate insights from it
      const insightResponse = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: typeFilter !== 'all' ? typeFilter : 'recommendation',
        }),
      });
      
      if (!insightResponse.ok) {
        throw new Error('Failed to generate insights');
      }
      
      // Refresh the insights list with the current filters
      let queryParams = new URLSearchParams();
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        queryParams.append('type', typeFilter);
      }
      queryParams.append('limit', '50');
      
      const refreshResponse = await fetch(`/api/insights?${queryParams.toString()}`);
      
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh insights');
      }
      
      const data = await refreshResponse.json();
      setInsights(data.data || []);
    } catch (error) {
      console.error('Error generating insights:', error);
      setError('Failed to generate insights. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update insight status
  const handleStatusChange = async (id: string, newStatus: string) => {
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
      
      // Update the insights list to reflect the change
      setInsights(prevInsights => 
        prevInsights.map(insight => 
          insight._id === id ? { ...insight, status: newStatus } : insight
        )
      );
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
            
            <div className="flex space-x-2">
              <div className="flex items-center space-x-2">
                <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status:
                </label>
                <select
                  id="statusFilter"
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="all">All</option>
                  <option value="new">New</option>
                  <option value="viewed">Viewed</option>
                  <option value="implemented">Implemented</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label htmlFor="typeFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type:
                </label>
                <select
                  id="typeFilter"
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="all">All</option>
                  <option value="productivity">Productivity</option>
                  <option value="automation">Automation</option>
                  <option value="recommendation">Recommendation</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
              
              <button
                onClick={handleGenerateInsights}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Generate New Insights'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {statusFilter !== 'all' ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} ` : ''}
                {typeFilter !== 'all' ? `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} ` : ''}
                Insights
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                AI-generated insights based on your screen activity.
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
              ) : insights.length > 0 ? (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <InsightCard
                      key={insight._id}
                      id={insight._id}
                      insight={insight.insight}
                      type={insight.insightType}
                      status={insight.status}
                      timestamp={insight.createdAt}
                      priority={insight.priority}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No insights found matching your filters. Try adjusting your filters or generate new insights.
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