import axios from 'axios';
import AIInsight from '../models/AIInsight';
import dbConnect from './db';
import { ScreenActivityItem } from './screenpipe';

// Define types for Nebius API
interface NebiusAIRequest {
  data: any;
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  };
}

interface NebiusAIResponse {
  result: string;
  metadata?: any;
}

// Mock insights for when Nebius API is not available
const MOCK_INSIGHTS = {
  productivity: "You've been using multiple applications frequently. Consider using keyboard shortcuts to switch between them more efficiently.",
  automation: "I noticed you copy and paste text frequently. Consider using a clipboard manager to store multiple items.",
  recommendation: "Based on your recent activity, you might want to take a short break every 30 minutes to reduce eye strain.",
  reminder: "Don't forget to save your work periodically. I noticed you haven't saved in the last 15 minutes."
};

/**
 * Send a request to Nebius AI Studio API
 */
export async function sendToNebiusAI(request: NebiusAIRequest): Promise<NebiusAIResponse> {
  try {
    if (!process.env.NEBIUS_API_KEY || !process.env.NEBIUS_API_ENDPOINT) {
      console.warn('Nebius API configuration is missing, using mock response');
      return {
        result: MOCK_INSIGHTS.recommendation,
        metadata: { source: 'mock' }
      };
    }

    const { data, options = {} } = request;
    const { maxTokens = 2000, temperature = 0.7, model = 'meta-llama/Meta-Llama-3.1-70B-Instruct' } = options;

    try {
      const response = await axios.post(
        `${process.env.NEBIUS_API_ENDPOINT}/v1/chat/completions`,
        {
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant analyzing screen and audio data to provide insights and automate tasks.'
            },
            {
              role: 'user',
              content: JSON.stringify(data)
            }
          ],
          max_tokens: maxTokens,
          temperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.NEBIUS_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data) {
        throw new Error('Empty response from Nebius API');
      }

      return {
        result: response.data.choices[0].message.content,
        metadata: response.data
      };
    } catch (apiError) {
      console.error('Nebius API Error:', apiError);
      console.log('Using mock insight response');
      
      // Return a mock response instead of failing
      return {
        result: MOCK_INSIGHTS.recommendation,
        metadata: { source: 'mock', error: apiError instanceof Error ? apiError.message : String(apiError) }
      };
    }
  } catch (error) {
    console.error('Error calling Nebius AI Studio API:', error);
    
    // Return a mock response on any error
    return {
      result: MOCK_INSIGHTS.recommendation,
      metadata: { source: 'mock', error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

/**
 * Generate insights from screen activity data
 */
export async function generateInsightsFromActivity(
  activityData: ScreenActivityItem[],
  insightType = 'recommendation'
): Promise<string> {
  try {
    // Prepare the prompt for the AI
    const prompt = {
      task: 'analyze_screen_activity',
      activity_data: activityData,
      request: `Analyze this screen activity data and provide ${insightType} insights.`
    };

    // Send to Nebius AI Studio
    const aiResponse = await sendToNebiusAI({
      data: prompt,
      options: {
        temperature: 0.5,
        maxTokens: 500,
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct'
      }
    });

    // If insightType was specified, and we're using mock data,
    // use the appropriate mock insight
    if (aiResponse.metadata?.source === 'mock' && insightType in MOCK_INSIGHTS) {
      aiResponse.result = MOCK_INSIGHTS[insightType as keyof typeof MOCK_INSIGHTS];
    }

    // Save the insight to the database
    try {
      await saveInsight(aiResponse.result, activityData, insightType);
    } catch (dbError) {
      console.error('Failed to save insight to database:', dbError);
      // Continue anyway - we don't want to fail the whole operation
    }

    return aiResponse.result;
  } catch (error) {
    console.error('Error generating insights:', error);
    
    // Return a mock insight on error
    const mockInsight = insightType in MOCK_INSIGHTS 
      ? MOCK_INSIGHTS[insightType as keyof typeof MOCK_INSIGHTS]
      : MOCK_INSIGHTS.recommendation;
      
    return mockInsight;
  }
}

/**
 * Save an AI insight to the database
 */
async function saveInsight(
  insight: string,
  relatedActivities: ScreenActivityItem[],
  insightType: string,
  priority = 0
): Promise<any> {
  try {
    await dbConnect();
    
    // Create new AI insight
    const aiInsight = new AIInsight({
      insight,
      insightType,
      priority,
      relatedActivities: [], // IDs will be added later if needed
      status: 'new',
      metadata: {
        activityCount: relatedActivities.length,
        timestamp: new Date(),
      },
    });
    
    await aiInsight.save();
    console.log('Saved new AI insight to database');
    return aiInsight;
  } catch (error) {
    console.error('Error saving AI insight to database:', error);
    throw error;
  }
}

/**
 * Get AI insights from the database
 */
export async function getInsights(options: {
  status?: string;
  insightType?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<any[]> {
  try {
    await dbConnect();
    
    const { status, insightType, limit = 10, offset = 0 } = options;
    
    const query: any = {};
    if (status) query.status = status;
    if (insightType) query.insightType = insightType;
    
    const insights = await AIInsight.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    
    // If no insights were found in the database, return mock insights
    if (insights.length === 0) {
      console.log('No insights found in database, returning mock insights');
      
      // Create mock insights with different types
      const mockInsightTypes = Object.keys(MOCK_INSIGHTS);
      const mockInsightsData = mockInsightTypes.map((type, index) => ({
        _id: `mock-${index}`,
        insight: MOCK_INSIGHTS[type as keyof typeof MOCK_INSIGHTS],
        insightType: type,
        status: 'new',
        createdAt: new Date().toISOString(),
        priority: Math.floor(Math.random() * 3), // 0, 1, or 2
        metadata: { source: 'mock' }
      }));
      
      // Filter mock insights based on options
      return mockInsightsData.filter(insight => {
        if (status && insight.status !== status) return false;
        if (insightType && insight.insightType !== insightType) return false;
        return true;
      }).slice(0, limit);
    }
    
    return insights;
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    
    // Return mock insights on error
    const mockInsightTypes = Object.keys(MOCK_INSIGHTS);
    return mockInsightTypes.map((type, index) => ({
      _id: `mock-${index}`,
      insight: MOCK_INSIGHTS[type as keyof typeof MOCK_INSIGHTS],
      insightType: type,
      status: 'new',
      createdAt: new Date().toISOString(),
      priority: Math.floor(Math.random() * 3), // 0, 1, or 2
      metadata: { source: 'mock' }
    })).slice(0, options.limit || 10);
  }
}

/**
 * Update insight status
 */
export async function updateInsightStatus(insightId: string, status: string): Promise<boolean> {
  try {
    // If it's a mock insight, just return success
    if (insightId.startsWith('mock-')) {
      console.log(`Mock insight ${insightId} status would be updated to ${status}`);
      return true;
    }
    
    await dbConnect();
    
    const result = await AIInsight.findByIdAndUpdate(insightId, { status });
    return !!result;
  } catch (error) {
    console.error('Error updating insight status:', error);
    return false;
  }
} 