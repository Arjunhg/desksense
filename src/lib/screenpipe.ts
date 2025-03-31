import { pipe } from '@screenpipe/js';
import ScreenActivity from '../models/ScreenActivity';
import dbConnect from './db';

// Polyfill for 'self' in Node.js environment to fix SDK compatibility issues
if (typeof self === 'undefined' && typeof global !== 'undefined') {
  (global as any).self = global;
}

// Define a type for the activity data based on Screenpipe SDK documentation
export interface ScreenActivityItem {
  type: string;
  content: {
    text?: string;
    timestamp: string;
    app_name?: string;
    window_name?: string;
    browserUrl?: string;
    frame?: string;
    transcription?: string;
    speaker_id?: number;
    element_type?: string;
  };
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

/**
 * Query recent screen activity from screenpipe
 */
export async function queryRecentActivity(minutes = 5) {
  try {
    const startTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    try {
      console.log(`Querying Screenpipe for activity in the last ${minutes} minutes...`);
      
      // Set a timeout in case Screenpipe is hanging
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.log('Screenpipe query timed out after 15 seconds');
          resolve(null);
        }, 15000); // Increased timeout to give Screenpipe more time
      });
      
      // Create the actual query with better error handling for browser APIs
      const queryPromise = pipe.queryScreenpipe({
        startTime,
        limit: 50,
        contentType: 'ocr', // Focus on OCR data which is less resource-intensive
        includeFrames: false, // Disable frames to avoid MP4 processing completely
      }).catch(error => {
        // Handle specific browser API errors
        if (error.message && (
          error.message.includes('self is not defined') || 
          error.message.includes('window is not defined') ||
          error.message.includes('document is not defined')
        )) {
          console.error('Browser API compatibility error in Screenpipe SDK:', error.message);
          console.log('This is a known issue when running Screenpipe in Node.js environment');
          return null;
        }
        throw error; // Re-throw other errors
      });
      
      // Race the query against the timeout
      const results = await Promise.race([queryPromise, timeoutPromise]);
      
      if (!results) {
        console.log('Screenpipe query timed out, using mock data');
        return MOCK_SCREEN_DATA;
      }
      
      if (!results.data || results.data.length === 0) {
        console.log('No results found from Screenpipe');
        return MOCK_SCREEN_DATA; // Return mock data when no results
      }

      console.log(`Found ${results.pagination.total} activity items`);
      
      // Deduplicate the results before returning
      const uniqueResults = await deduplicateScreenData(results.data);
      console.log(`Returned ${uniqueResults.length} unique items after deduplication`);
      
      return uniqueResults;
    } catch (pipeError) {
      console.error('Screenpipe service error:', pipeError);
      
      // Check for specific error patterns with more detailed handling
      const errorMessage = pipeError instanceof Error ? pipeError.message : String(pipeError);
      
      if (errorMessage.includes('self is not defined') || 
          errorMessage.includes('window is not defined') ||
          errorMessage.includes('document is not defined')) {
        console.log('Browser compatibility issue with Screenpipe SDK');
        console.log('Solution: Ensure Screenpipe is running the latest version compatible with Node.js');
      } else if (errorMessage.includes('ffmpeg') || errorMessage.includes('mp4') || errorMessage.includes('moov atom')) {
        console.log('Detected issues with video file processing in Screenpipe');
        console.log('Solution: Delete files in C:\\Users\\[username]\\.screenpipe\\data\\*.mp4');
      } else if (errorMessage.includes('ECONNRESET') || errorMessage.includes('ECONNREFUSED')) {
        console.log('Connection to Screenpipe was reset or refused');
        console.log('Solution: Restart Screenpipe with the command: screenpipe');
      }
      
      console.log('Using mock data since Screenpipe is not available');
      return MOCK_SCREEN_DATA;
    }
  } catch (error) {
    console.error('Error querying Screenpipe:', error);
    return MOCK_SCREEN_DATA; // Return mock data on error
  }
}

/**
 * Simple deduplication function for screen data
 * Uses a basic text similarity check to avoid duplicates
 */
async function deduplicateScreenData(screenData: ScreenActivityItem[]): Promise<ScreenActivityItem[]> {
  if (!screenData.length) return screenData;
  
  const uniqueData: ScreenActivityItem[] = [];
  const seenContent = new Set<string>();
  
  for (const item of screenData) {
    // Extract text content depending on type
    let textContent = '';
    
    if (item.type === 'OCR' && item.content.text) {
      textContent = item.content.text;
    } else if (item.type === 'Audio' && item.content.transcription) {
      textContent = item.content.transcription;
    } else if (item.content.text) {
      textContent = item.content.text;
    }
    
    // Create a simplified version for comparison (lowercase, trimmed)
    const simplifiedContent = textContent.toLowerCase().trim();
    
    // Skip very short content or content we've seen before
    if (simplifiedContent.length < 10 || seenContent.has(simplifiedContent)) {
      continue;
    }
    
    // For similar but not identical content
    let isDuplicate = false;
    for (const existing of seenContent) {
      // Simple similarity check (if one string contains most of the other)
      if (simpleSimilarityCheck(existing, simplifiedContent)) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seenContent.add(simplifiedContent);
      uniqueData.push(item);
    }
  }
  
  return uniqueData;
}

/**
 * Simple function to check if two strings are similar
 * Returns true if they share a significant amount of content
 */
function simpleSimilarityCheck(a: string, b: string): boolean {
  // If either string contains 80% of the other, consider them similar
  const shorterLength = Math.min(a.length, b.length);
  const longerString = a.length > b.length ? a : b;
  const shorterString = a.length > b.length ? b : a;
  
  // For very short strings, require exact match
  if (shorterLength < 20) return a === b;
  
  // For longer strings, check if one contains most of the other
  return longerString.includes(shorterString) || 
         shorterString.split(' ').filter(word => word.length > 4)
                             .some(word => longerString.includes(word));
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
        timestamp: new Date(item.content.timestamp),
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
 * Query specific types of activity with enhanced options
 * Based on Screenpipe SDK documentation
 */
export async function querySpecificActivity(options: {
  contentType?: string;
  appName?: string;
  browserUrl?: string;
  minutes?: number;
  windowName?: string;
  speakerIds?: number[];
  minLength?: number;
  maxLength?: number;
  offset?: number;
  limit?: number;
}) {
  const { 
    contentType = 'all', 
    appName, 
    browserUrl, 
    minutes = 60,
    windowName,
    speakerIds,
    minLength,
    maxLength,
    offset = 0,
    limit = 50
  } = options;
  
  try {
    const startTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    const queryParams: any = {
      startTime,
      limit,
      offset,
      contentType,
      includeFrames: false, // Change to false to avoid MP4 processing issues
    };
    
    // Add optional parameters if they exist
    if (appName) queryParams.appName = appName;
    if (browserUrl) queryParams.browserUrl = browserUrl;
    if (windowName) queryParams.windowName = windowName;
    if (speakerIds) queryParams.speakerIds = speakerIds;
    if (minLength) queryParams.minLength = minLength;
    if (maxLength) queryParams.maxLength = maxLength;
    
    try {
      const results = await pipe.queryScreenpipe(queryParams);
      
      if (!results || !results.data || results.data.length === 0) {
        console.log('No specific results found with the given parameters');
        return MOCK_SCREEN_DATA;
      }
      
      console.log(`Found ${results.pagination.total} specific activity items`);
      
      // Deduplicate results if there are more than a few
      if (results.data.length > 3) {
        const uniqueResults = await deduplicateScreenData(results.data);
        return uniqueResults;
      }
      
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
    // First check if Screenpipe is available
    const isAvailable = await isScreenpipeAvailable();
    
    if (!isAvailable) {
      console.log('Screenpipe is not available, simulating notification:', title);
      return { 
        success: true, 
        simulated: true,
        message: 'Notification simulated because Screenpipe is not running'
      };
    }
    
    try {
      await pipe.sendDesktopNotification({
        title,
        body,
      });
      console.log('Desktop notification sent successfully');
      return { 
        success: true, 
        simulated: false,
        message: 'Notification sent successfully'
      };
    } catch (pipeError) {
      console.error('Screenpipe notification service error:', pipeError);
      
      // Log more details about the error
      const errorMessage = pipeError instanceof Error ? pipeError.message : String(pipeError);
      if (errorMessage.includes('ECONNREFUSED')) {
        console.log('Connection to Screenpipe was refused. Make sure Screenpipe is running.');
      }
      
      console.log('Notification would have been sent with title:', title);
      return { 
        success: true, 
        simulated: true,
        message: 'Notification simulated due to Screenpipe error'
      };
    }
  } catch (error) {
    console.error('Error sending desktop notification:', error);
    return { 
      success: false, 
      simulated: true,
      message: 'Error occurred, notification could not be sent'
    };
  }
}

/**
 * Check if Screenpipe is available and running
 * @returns true if Screenpipe is available, false otherwise
 */
export async function isScreenpipeAvailable(): Promise<boolean> {
  try {
    // Set a short timeout to avoid hanging
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(false);
      }, 3000);
    });
    
    // Use a minimal query to check if Screenpipe is responding
    const healthCheckPromise = pipe.queryScreenpipe({
      limit: 1,
      includeFrames: false,
    })
    .then(() => true)
    .catch(() => false);
    
    // Race the health check against the timeout
    return await Promise.race([healthCheckPromise, timeoutPromise]);
  } catch (error) {
    console.warn('Screenpipe health check failed:', error);
    return false;
  }
}