import Image from 'next/image';

interface ActivityCardProps {
  type: string;
  content: any;
  appName?: string;
  windowName?: string;
  browserUrl?: string;
  timestamp: string;
  frameData?: string;
}

export default function ActivityCard({
  type,
  content,
  appName,
  windowName,
  browserUrl,
  timestamp,
  frameData,
}: ActivityCardProps) {
  // Format the timestamp for display
  const formattedTime = new Date(timestamp).toLocaleString();

  // Get icon based on activity type
  const getTypeIcon = () => {
    switch (type) {
      case 'OCR':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'Audio':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case 'UI':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
    }
  };

  // Get the content to display based on activity type
  const getContent = () => {
    if (type === 'OCR') {
      return (
        <div>
          <p className="text-gray-700 dark:text-gray-300">{content.text}</p>
          {frameData && (
            <div className="mt-2">
              <div className="relative h-32 w-full overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                <img
                  src={`data:image/png;base64,${frameData}`}
                  alt="Screenshot"
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
      );
    } else if (type === 'Audio') {
      return (
        <div>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">Speaker {content.speaker_id || 'Unknown'}:</span> {content.transcription}
          </p>
        </div>
      );
    } else if (type === 'UI') {
      return (
        <div>
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-medium">UI Element:</span> {content.element_type || 'Unknown'}
          </p>
          {content.text && (
            <p className="text-gray-700 dark:text-gray-300 mt-1">{content.text}</p>
          )}
        </div>
      );
    }
    
    return (
      <div>
        <p className="text-gray-700 dark:text-gray-300">Unknown content type</p>
      </div>
    );
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-4 mb-4 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-2">
          {getTypeIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {type} Activity
            </h3>
            {appName && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                App: {appName}
              </p>
            )}
            {windowName && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Window: {windowName}
              </p>
            )}
            {browserUrl && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                URL: {browserUrl}
              </p>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{formattedTime}</span>
      </div>
      
      <div className="mt-2">
        {getContent()}
      </div>
    </div>
  );
} 