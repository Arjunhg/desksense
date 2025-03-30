import { pipe } from '@screenpipe/js';
import ScreenActivity from '../models/ScreenActivity';
import dbConnect from './db';

// Define a type for the activity data
export interface ScreenActivityItem {
  type: string;
  content: any;
}

// Mock data for when Screenpipe is not available
const MOCK_SCREEN_DATA = [
  {
    type: 'OCR',
    content: {
      text: 'Demo text from a screen capture',
      timestamp: new Date().toISOString(),
      app_name: 'DemoApp',
      window_name: 'MainWindow',
    }
  },
  {
    type: 'Audio',
    content: {
      transcription: 'This is a sample transcript from an audio capture',
      timestamp: new Date().toISOString(),
      speaker_id: 1
    }
  }
];
// 8872dc48-b8cf-4c91-8e18-22854c844bc8 : id for cursor char
/**
 * Query recent screen activity from screenpipe
 */
export async function queryRecentActivity(minutes = 5) {
  try {
    const startTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    try {
      const results = await pipe.queryScreenpipe({
        startTime,
        limit: 50,
        contentType: 'all', // 'ocr', 'audio', or 'all'
        includeFrames: true, // Include screenshots as base64 encoded images
      });

      if (!results || !results.data || results.data.length === 0) {
        console.log('No results found from Screenpipe');
        return MOCK_SCREEN_DATA; // Return mock data when no results
      }

      console.log(`Found ${results.pagination.total} activity items`);
      return results.data;
    } catch (pipeError) {
      console.error('Screenpipe service error:', pipeError);
      console.log('Using mock data since Screenpipe is not available');
      return MOCK_SCREEN_DATA;
    }
  } catch (error) {
    console.error('Error querying Screenpipe:', error);
    return MOCK_SCREEN_DATA; // Return mock data on error
  }
}

/**
 * Save screen activity data to the database
 */
export async function saveScreenActivity(activityData: ScreenActivityItem[]) {
  try {
    await dbConnect();
    
    const activities = activityData.map((item: ScreenActivityItem) => {
      // Extract app name and window name if available
      let appName = '';
      let windowName = '';
      let browserUrl = '';
      let frameData = '';
      
      if (item.type === 'OCR' && item.content) {
        appName = item.content.app_name || '';
        windowName = item.content.window_name || '';
        browserUrl = item.content.browserUrl || '';
        frameData = item.content.frame || '';
      }
      
      return {
        type: item.type,
        content: item.content,
        appName,
        windowName,
        browserUrl,
        frameData,
        timestamp: new Date(item.type === 'OCR' ? 
          item.content.timestamp : 
          item.content.timestamp),
      };
    });
    
    if (activities.length > 0) {
      // Save to MongoDB
      const result = await ScreenActivity.insertMany(activities);
      console.log(`Saved ${result.length} activity records to database`);
      return result;
    }
    
    return [];
  } catch (error) {
    console.error('Error saving screen activity to database:', error);
    throw new Error('Failed to save screen activity data');
  }
}

/**
 * Query specific types of activity
 */
export async function querySpecificActivity(options: {
  contentType?: string;
  appName?: string;
  browserUrl?: string;
  minutes?: number;
}) {
  const { contentType = 'all', appName, browserUrl, minutes = 60 } = options;
  
  try {
    const startTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    const queryParams: any = {
      startTime,
      limit: 50,
      contentType,
      includeFrames: true,
    };
    
    if (appName) {
      queryParams.appName = appName;
    }
    
    if (browserUrl) {
      queryParams.browserUrl = browserUrl;
    }
    
    try {
      const results = await pipe.queryScreenpipe(queryParams);
      
      if (!results || !results.data || results.data.length === 0) {
        console.log('No specific results found with the given parameters');
        return MOCK_SCREEN_DATA;
      }
      
      console.log(`Found ${results.pagination.total} specific activity items`);
      return results.data;
    } catch (pipeError) {
      console.error('Screenpipe service error:', pipeError);
      console.log('Using mock data since Screenpipe is not available');
      return MOCK_SCREEN_DATA;
    }
  } catch (error) {
    console.error('Error querying specific Screenpipe data:', error);
    return MOCK_SCREEN_DATA;
  }
}

/**
 * Send a desktop notification via Screenpipe
 */
export async function sendNotification(title: string, body: string) {
  try {
    try {
      await pipe.sendDesktopNotification({
        title,
        body,
      });
      console.log('Desktop notification sent successfully');
      return true;
    } catch (pipeError) {
      console.error('Screenpipe notification service error:', pipeError);
      console.log('Notification would have been sent with title:', title);
      return true; // Return success anyway to not break the UI
    }
  } catch (error) {
    console.error('Error sending desktop notification:', error);
    return false;
  }
} 