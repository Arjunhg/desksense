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
 * Send a request to Nebius AI Studio API with retry logic
 */
export async function sendToNebiusAI(request: NebiusAIRequest): Promise<NebiusAIResponse> {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  
  async function attemptRequest(): Promise<NebiusAIResponse> {
    try {
      if (!process.env.NEBIUS_API_KEY || !process.env.NEBIUS_API_ENDPOINT) {
        console.warn('Nebius API configuration is missing, using mock response');
        return {
          result: MOCK_INSIGHTS.recommendation,
          metadata: { source: 'mock', reason: 'missing_api_config' }
        };
      }

      const { data, options = {} } = request;
      const { maxTokens = 2000, temperature = 0.7, model = 'meta-llama/Meta-Llama-3.1-70B-Instruct' } = options;

      try {
        console.log(`Attempting Nebius API request (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
        
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
            timeout: 30000, // 30 second timeout
          }
        );

        if (!response.data) {
          throw new Error('Empty response from Nebius API');
        }

        console.log('Nebius API request successful');
        return {
          result: response.data.choices[0].message.content,
          metadata: response.data
        };
      } catch (apiError: any) {
        // More granular error handling based on Nebius API error responses
        let errorMessage = 'Unknown API error';
        let errorType = 'api_error';
        
        if (apiError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const status = apiError.response.status;
          const errorData = apiError.response.data;
          
          console.error('Nebius API Error:', {
            status,
            data: errorData,
            headers: apiError.response.headers
          });
          
          if (status === 401) {
            errorType = 'authentication_error';
            errorMessage = 'Authentication failed. Please check your API key.';
          } else if (status === 429) {
            errorType = 'rate_limit_exceeded';
            errorMessage = 'Rate limit exceeded. Please try again later.';
          } else if (status === 400) {
            errorType = 'invalid_request';
            errorMessage = errorData.error?.message || 'Invalid request parameters';
          } else if (status >= 500) {
            errorType = 'server_error';
            errorMessage = 'Nebius API server error. Please try again later.';
          }
        } else if (apiError.request) {
          // The request was made but no response was received
          errorType = 'network_error';
          errorMessage = 'Network error. No response received from Nebius API.';
          console.error('Network Error:', apiError.request);
          
          // For network errors, we can retry
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying after network error (attempt ${retryCount}/${MAX_RETRIES})...`);
            // Wait with exponential backoff: 1s, 2s, 4s...
            await new Promise(r => setTimeout(r, 1000 * (2 ** (retryCount - 1))));
            return attemptRequest();
          }
        } else {
          // Something happened in setting up the request that triggered an Error
          errorType = 'request_setup_error';
          errorMessage = apiError.message || 'Error setting up the request';
          console.error('Request Setup Error:', apiError);
        }
        
        console.error(`Nebius API Error (${errorType}): ${errorMessage}`);
        
        if (retryCount >= MAX_RETRIES) {
          console.log('Maximum retry attempts reached, using mock insight response');
        } else {
          console.log('Using mock insight response due to API error');
        }
        
        // Return a mock response with error details
        return {
          result: MOCK_INSIGHTS.recommendation,
          metadata: { 
            source: 'mock', 
            error: errorMessage,
            errorType,
            timestamp: new Date().toISOString(),
            retryAttempts: retryCount
          }
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error calling Nebius AI Studio API:', errorMessage);
      
      // Return a mock response on any error
      return {
        result: MOCK_INSIGHTS.recommendation,
        metadata: { 
          source: 'mock', 
          error: errorMessage,
          timestamp: new Date().toISOString() 
        }
      };
    }
  }
  
  // Initial attempt
  return attemptRequest();
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