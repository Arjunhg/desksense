import { useState } from 'react';

interface InsightCardProps {
  id: string;
  insight: string;
  type: string;
  status: string;
  timestamp: string;
  priority: number;
  onStatusChange?: (id: string, newStatus: string) => Promise<void>;
}

export default function InsightCard({
  id,
  insight,
  type,
  status,
  timestamp,
  priority,
  onStatusChange,
}: InsightCardProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isLoading, setIsLoading] = useState(false);

  // Format the timestamp for display
  const formattedTime = new Date(timestamp).toLocaleString();

  // Determine the card's background color based on priority and type
  const getPriorityClass = () => {
    if (priority === 2) return 'border-red-500 bg-red-50 dark:bg-red-900/20'; // Critical
    if (priority === 1) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'; // Important
    return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'; // Normal
  };

  // Get icon based on insight type
  const getTypeIcon = () => {
    switch (type) {
      case 'productivity':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'automation':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'reminder':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default: // recommendation
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange) return;
    
    setIsLoading(true);
    try {
      await onStatusChange(id, newStatus);
      setCurrentStatus(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`border-l-4 rounded-md shadow-sm p-4 mb-4 ${getPriorityClass()}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-2">
          {getTypeIcon()}
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {type.charAt(0).toUpperCase() + type.slice(1)} Insight
          </h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{formattedTime}</span>
      </div>
      
      <div className="mt-2">
        <p className="text-gray-700 dark:text-gray-300">{insight}</p>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div>
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${currentStatus === 'new' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}
            ${currentStatus === 'viewed' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}
            ${currentStatus === 'implemented' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}
            ${currentStatus === 'dismissed' && 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
          `}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>
        
        {onStatusChange && (
          <div className="flex space-x-2">
            {currentStatus !== 'implemented' && (
              <button
                disabled={isLoading}
                onClick={() => handleStatusChange('implemented')}
                className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Implement
              </button>
            )}
            {currentStatus !== 'dismissed' && (
              <button
                disabled={isLoading}
                onClick={() => handleStatusChange('dismissed')}
                className="px-2 py-1 text-xs font-medium text-white bg-gray-600 rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 