import { NextRequest, NextResponse } from 'next/server';
import { queryRecentActivity, saveScreenActivity } from '@/lib/screenpipe';

// GET endpoint to fetch recent screen activity
export async function GET(request: NextRequest) {
  try {
    // Parse the URL to get any query parameters
    const searchParams = request.nextUrl.searchParams;
    const minutes = parseInt(searchParams.get('minutes') || '5', 10);
    
    // Query recent screen activity
    const activityData = await queryRecentActivity(minutes);
    
    return NextResponse.json({
      success: true,
      data: activityData,
      count: activityData.length,
      timestamp: new Date().toISOString(),
      source: activityData.length <= 2 ? 'mock' : 'live', // Indicate if using mock data
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
    // Parse the URL to get any query parameters
    const searchParams = request.nextUrl.searchParams;
    const minutes = parseInt(searchParams.get('minutes') || '5', 10);
    
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