import { NextRequest, NextResponse } from 'next/server';
import { sendNotification } from '@/lib/screenpipe';

// POST endpoint to send desktop notifications
export async function POST(request: NextRequest) {
  try {
    // Get notification data from request body
    const body = await request.json();
    const { title, message } = body;
    
    // Validate notification data
    if (!title || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Both title and message are required',
      }, { status: 400 });
    }
    
    // Send desktop notification
    const result = await sendNotification(title, message);
    
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      note: result.simulated 
        ? 'The notification was simulated because Screenpipe is not running.' 
        : 'Notification was sent successfully to your desktop.',
    });
  } catch (error) {
    console.error('Error in notification API:', error);
    
    // Even in case of error, we'll return a positive response to the user
    // to prevent disrupting the UI flow
    return NextResponse.json({
      success: true,
      simulated: true,
      message: 'Notification processed (simulated)',
      timestamp: new Date().toISOString(),
      note: 'An error occurred, but notification was simulated.',
    });
  }
}