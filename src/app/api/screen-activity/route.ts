import { NextRequest, NextResponse } from 'next/server';
import { queryRecentActivity, saveScreenActivity, isScreenpipeAvailable } from '@/lib/screenpipe';

// Simple in-memory rate limiting
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // max requests per minute
};

const ipRequests = new Map<string, { count: number; resetTime: number }>();

// Helper to check rate limit
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  
  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }
  
  const requestData = ipRequests.get(ip)!;
  
  // Reset if the window has passed
  if (now > requestData.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }
  
  // Increment and check
  requestData.count += 1;
  if (requestData.count > RATE_LIMIT.maxRequests) {
    return false;
  }
  
  return true;
}

// GET endpoint to fetch recent screen activity
export async function GET(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later',
        },
        { status: 429 }
      );
    }
    
    // Parse the URL to get any query parameters
    const searchParams = request.nextUrl.searchParams;
    const minutes = parseInt(searchParams.get('minutes') || '5', 10);
    
    // Validate input
    if (isNaN(minutes) || minutes <= 0 || minutes > 60) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          message: 'Minutes must be a number between 1 and 60',
        },
        { status: 400 }
      );
    }
    
    // First check if Screenpipe is available
    const screenpipeAvailable = await isScreenpipeAvailable();
    
    // Query recent screen activity with more robust error handling
    const activityData = await queryRecentActivity(minutes);
    
    // If Screenpipe is not available, add a more detailed note to the response
    const note = !screenpipeAvailable ? 
      'Screenpipe is not running or is unavailable. Try running the cleanup script in scripts/cleanup-screenpipe.bat' : 
      undefined;
    
    return NextResponse.json({
      success: true,
      data: activityData,
      count: activityData.length,
      timestamp: new Date().toISOString(),
      source: activityData.length <= 2 ? 'mock' : 'live',
      note,
    });
  } catch (error) {
    console.error('Error in screen activity API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch screen activity',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint to capture and save screen activity
export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests, please try again later',
        },
        { status: 429 }
      );
    }
    
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !process.env.API_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header',
        },
        { status: 401 }
      );
    }
    
    // Basic auth check (in production, use a more secure method)
    const token = authHeader.replace('Bearer ', '');
    if (token !== process.env.API_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid API key',
        },
        { status: 401 }
      );
    }
    
    // Parse the URL to get any query parameters
    const searchParams = request.nextUrl.searchParams;
    const minutes = parseInt(searchParams.get('minutes') || '5', 10);
    
    // Validate input
    if (isNaN(minutes) || minutes <= 0 || minutes > 60) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid parameters',
          message: 'Minutes must be a number between 1 and 60',
        },
        { status: 400 }
      );
    }
    
    // Fetch screen activity data
    const activityData = await queryRecentActivity(minutes);
    
    if (!activityData || activityData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No activity data found',
      }, { status: 404 });
    }
    
    try {
      // Save the activity data to the database
      const savedData = await saveScreenActivity(activityData);
      
      return NextResponse.json({
        success: true,
        message: `Saved ${savedData.length} screen activity records`,
        count: savedData.length,
        timestamp: new Date().toISOString(),
        source: activityData.length <= 2 ? 'mock' : 'live', // Indicate if using mock data
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Failed to save to database, but data was retrieved',
        data: activityData, // Return the data anyway
        count: activityData.length,
        source: activityData.length <= 2 ? 'mock' : 'live',
      });
    }
  } catch (error) {
    console.error('Error in save screen activity API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save screen activity',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}