import { NextRequest, NextResponse } from 'next/server';
import { queryRecentActivity } from '@/lib/screenpipe';
import { generateInsightsFromActivity, getInsights, updateInsightStatus } from '@/lib/nebius';

// GET endpoint to fetch AI insights
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const insightType = searchParams.get('type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Fetch insights from the database
    const insights = await getInsights({
      status: status as string | undefined,
      insightType: insightType as string | undefined,
      limit,
      offset,
    });
    
    // Determine if insights are from mock data
    const isMockData = insights.length > 0 && insights[0]._id.toString().startsWith('mock-');
    
    return NextResponse.json({
      success: true,
      data: insights,
      count: insights.length,
      timestamp: new Date().toISOString(),
      source: isMockData ? 'mock' : 'database',
    });
  } catch (error) {
    console.error('Error in get insights API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint to generate new insights
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const minutes = parseInt(searchParams.get('minutes') || '15', 10);
    const insightType = searchParams.get('type') || 'recommendation';
    
    // Query recent screen activity
    const activityData = await queryRecentActivity(minutes);
    
    if (!activityData || activityData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No activity data found to generate insights',
      }, { status: 404 });
    }
    
    // Determine if we're using mock data
    const isMockData = activityData.length <= 2;
    
    // Generate insights from the activity data
    const insight = await generateInsightsFromActivity(
      activityData,
      insightType as string
    );
    
    return NextResponse.json({
      success: true,
      insight,
      activityCount: activityData.length,
      timestamp: new Date().toISOString(),
      source: isMockData ? 'mock' : 'live',
    });
  } catch (error) {
    console.error('Error in generate insights API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate insights',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update insight status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { insightId, status } = body;
    
    if (!insightId || !status) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: insightId and status',
      }, { status: 400 });
    }
    
    // Update the insight status
    const updated = await updateInsightStatus(insightId, status);
    
    if (!updated) {
      return NextResponse.json({
        success: false,
        message: 'Insight not found or update failed',
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Insight status updated to ${status}`,
      timestamp: new Date().toISOString(),
      isMock: insightId.startsWith('mock-'),
    });
  } catch (error) {
    console.error('Error in update insight API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update insight status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 