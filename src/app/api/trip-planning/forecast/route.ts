import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDestinationInsights } from '@/lib/destination';

interface ForecastRequestBody {
  destination: string;
  startDate: string;
  endDate: string;
  travelStyle: string;
  dailyBudget?: number;
  travelerCount?: number;
}

interface TripSummary {
  overview: string;
  highlights: string[];
}

interface TripBudgetForecast {
  ranges: {
    minimum: number;
    average: number;
    comfortable: number;
  };
  confidence: {
    level: number;
    basedOn: number;
  };
  seasonal: {
    adjustment: number;
    reason: string;
  };
  breakdown: {
    accommodation: number;
    food: number;
    transport: number;
    activities: number;
  };
  notes?: string;
}

interface DestinationOverview {
  name: string;
  country: string;
  averageDailyCost: {
    min: number;
    max: number;
  };
  weather: {
    season: string;
    averageTemp: number;
  };
  visa: {
    type: string;
    requirements: string;
  };
  popularAreas: string[];
}

interface ForecastResult {
  destination: DestinationOverview;
  forecast: TripBudgetForecast;
  summary: TripSummary;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";

function parseDestination(value: string): { name: string; country: string } {
  const [namePart, ...rest] = value.split(',');
  const name = (namePart ?? '').trim();
  const country = rest.join(',').trim() || 'Unknown';
  return { name, country };
}

function sanitizeNumber(
  value: unknown,
  fallback: number,
  options?: { min?: number; max?: number }
): number {
  const parsed = typeof value === 'number' && Number.isFinite(value)
    ? value
    : typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))
      ? Number(value)
      : fallback;

  const withMin = options?.min !== undefined ? Math.max(options.min, parsed) : parsed;
  const withMax = options?.max !== undefined ? Math.min(options.max, withMin) : withMin;

  return Math.round(withMax);
}

function computeFallbackForecast(totalDays: number, dailyBudget?: number): TripBudgetForecast {
  const days = Math.max(totalDays, 3);
  const daily = dailyBudget && dailyBudget > 0 ? dailyBudget : 150;
  const minimum = daily * days * 0.8;
  const average = daily * days;
  const comfortable = daily * days * 1.35;

  const accommodation = average * 0.4;
  const food = average * 0.25;
  const transport = average * 0.2;
  const activities = average * 0.15;

  return {
    ranges: {
      minimum: Math.round(minimum),
      average: Math.round(average),
      comfortable: Math.round(comfortable),
    },
    confidence: {
      level: 65,
      basedOn: 120,
    },
    seasonal: {
      adjustment: 0,
      reason: 'No seasonal adjustment available',
    },
    breakdown: {
      accommodation: Math.round(accommodation),
      food: Math.round(food),
      transport: Math.round(transport),
      activities: Math.round(activities),
    },
    notes: 'Fallback estimate generated without AI assistance.',
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== FORECAST API CALLED ===');
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured!');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const body: ForecastRequestBody = await request.json();
    console.log('Forecast API received request:', {
      destination: body.destination,
      startDate: body.startDate,
      endDate: body.endDate,
      travelStyle: body.travelStyle,
    });
    
    const { destination, startDate, endDate, travelStyle, dailyBudget, travelerCount } = body ?? {};

    if (!destination || !startDate || !endDate || !travelStyle) {
      return NextResponse.json(
        { error: 'destination, startDate, endDate, and travelStyle are required.' },
        { status: 400 }
      );
    }

    const { name: destinationName, country: destinationCountry } = parseDestination(destination);
    if (!destinationName) {
      return NextResponse.json(
        { error: 'Unable to parse destination name from input.' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return NextResponse.json(
        { error: 'Invalid trip dates provided.' },
        { status: 400 }
      );
    }

    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const insights = await getDestinationInsights(destinationName);

    // Enhanced prompt with specific destination requirements
    const month = new Date(startDate).toLocaleString('en-US', { month: 'long' });
    const prompt = `You are a travel expert. Generate detailed travel information for ${destinationName}, ${destinationCountry}.

IMPORTANT: Provide SPECIFIC, REAL information about ${destinationName}, ${destinationCountry}. Do NOT use generic placeholders.

Travel details:
- Style: ${travelStyle}
- Duration: ${totalDays} days
- Travel month: ${month}${dailyBudget ? `\n- Daily budget: $${dailyBudget}` : ''}${travelerCount ? `\n- Travelers: ${travelerCount}` : '\n- Travelers: 2 adults'}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "destination": {
    "averageDailyCost": {"min": number, "max": number},
    "weather": {"season": string, "averageTemp": number},
    "visa": {"type": string, "requirements": string},
    "popularAreas": [string, string, string, string]
  },
  "forecast": {
    "ranges": {"minimum": number, "average": number, "comfortable": number},
    "confidence": {"level": number, "basedOn": number},
    "seasonal": {"adjustment": number, "reason": string},
    "breakdown": {"accommodation": number, "food": number, "transport": number, "activities": number}
  },
  "summary": {
    "overview": "Brief trip overview",
    "highlights": ["tip1", "tip2", "tip3"]
  }
}

CRITICAL REQUIREMENTS:
1. destination.averageDailyCost: Provide REALISTIC costs for ${destinationName} (USD per day). Research actual costs.
2. destination.weather.season: Use the ACTUAL season name for ${month} in ${destinationCountry} (e.g., "Summer", "Winter", "Monsoon", "Dry season").
3. destination.weather.averageTemp: Provide REAL average temperature for ${month} in ${destinationName} (Celsius).
4. destination.visa.type: Provide SPECIFIC visa type (e.g., "Visa on arrival", "Visa-free for 30 days", "eVisa required", "Visa required").
5. destination.visa.requirements: Provide SPECIFIC requirements for ${destinationCountry} (e.g., "US citizens need visa", "Visa-free for 90 days", etc.).
6. destination.popularAreas: List ACTUAL popular neighborhoods/areas in ${destinationName} (e.g., "Shibuya", "Old Town", "French Quarter", NOT generic terms).

7. forecast.ranges: Provide TOTAL trip costs (not daily) for ${totalDays} days:
   - minimum: Budget traveler total cost
   - average: Mid-range traveler total cost  
   - comfortable: Luxury traveler total cost
8. forecast.breakdown: Provide TOTAL costs for the ENTIRE ${totalDays}-day trip (not per day):
   - accommodation: Total accommodation cost for ${totalDays} days
   - food: Total food cost for ${totalDays} days
   - transport: Total transport cost (including flights if applicable)
   - activities: Total activities/entertainment cost for ${totalDays} days
   All breakdown values should sum approximately to the "average" range.
9. forecast.confidence: Provide realistic confidence (70-95%) and basedOn (50-500 trips).
10. forecast.seasonal: Provide seasonal adjustment percentage and reason based on ${month} travel.

${insights.averageDailyCost ? `Known data: Daily cost range $${insights.averageDailyCost.min}-${insights.averageDailyCost.max}.` : ''}
${insights.weather ? `Known data: Weather ${insights.weather.season}, ${insights.weather.averageTemp}°C.` : ''}

Use USD for all costs. Use Celsius for temperature.`;

    // Use Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096, // Increased to ensure complete JSON responses
        responseMimeType: 'application/json',
      },
    });

    let content: string;
    try {
      console.log('Calling Gemini API for destination:', destinationName, destinationCountry);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // Get the full text response - handle both single and multiple candidates
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates in AI response.');
      }
      
      // Get text from all parts of the first candidate
      const firstCandidate = candidates[0];
      
      // Check finish reason - if it's MAX_TOKENS, the response was truncated
      if (firstCandidate.finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ WARNING: Response was truncated due to MAX_TOKENS limit!');
      }
      
      if (!firstCandidate.content || !firstCandidate.content.parts) {
        throw new Error('No content parts in AI response.');
      }
      
      // Try response.text() first, then fallback to parts extraction
      try {
        content = response.text();
      } catch (e) {
        // Fallback: extract from parts
        content = firstCandidate.content.parts
          .map((part: any) => part.text || '')
          .join('');
      }
      
      console.log('Raw AI response length:', content?.length || 0);
      console.log('Raw AI response (full):', content || 'No content');
      console.log('Finish reason:', firstCandidate.finishReason);
      
      if (!content || content.trim().length === 0) {
        throw new Error('AI did not return any content.');
      }
      
      // Check if response seems truncated
      if (content.length < 200 || firstCandidate.finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ AI response seems truncated! Length:', content.length, 'Finish reason:', firstCandidate.finishReason);
        // Increase token limit and retry if possible, or use fallback
      }
    } catch (error: any) {
      console.error('Gemini API error:', error);
      
      // Handle quota/rate limit errors - return fallback instead of failing
      if (error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn('Gemini API quota exceeded, using fallback forecast');
        const fallbackForecast = computeFallbackForecast(totalDays, dailyBudget);
        
        const destinationOverview: DestinationOverview = {
          name: destinationName,
          country: destinationCountry,
          averageDailyCost: {
            min: insights.averageDailyCost?.min ?? Math.round(fallbackForecast.ranges.minimum / totalDays),
            max: insights.averageDailyCost?.max ?? Math.round(fallbackForecast.ranges.comfortable / totalDays),
          },
          weather: {
            season: insights.weather?.season ?? 'Season varies',
            averageTemp: insights.weather?.averageTemp ?? 24,
          },
          visa: {
            type: 'Check requirements',
            requirements: 'Consult official embassy resources for current visa rules.',
          },
          popularAreas: ['Historic centre', 'Local markets', 'Outdoor attractions'],
        };

        const summary: TripSummary = {
          overview: `A ${travelStyle.toLowerCase()} trip to ${destinationName} for ${totalDays} days. Budget estimates are based on general travel data.`,
          highlights: [
            'Book accommodations close to key sights to reduce transport costs.',
            'Allocate part of the budget for signature local experiences.',
            'Consider seasonal pricing variations when booking.',
          ],
        };

        const result: ForecastResult = {
          destination: destinationOverview,
          forecast: {
            ...fallbackForecast,
            notes: 'Forecast generated using fallback estimates due to API quota limits. For AI-powered forecasts, please try again later or upgrade your API plan.',
          },
          summary,
        };

        return NextResponse.json(result);
      }
      
      return NextResponse.json(
        { error: 'Failed to generate AI forecast.', details: error?.message || 'Unknown error' },
        { status: 502 }
      );
    }

    let parsed: ForecastResult | null = null;
    try {
      // Clean the content in case it has markdown code blocks
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Check if JSON seems incomplete (doesn't end with } or ])
      if (!cleanedContent.endsWith('}') && !cleanedContent.endsWith(']')) {
        console.warn('⚠️ JSON response appears incomplete, attempting to fix...');
        // Try to complete the JSON structure if it's clearly incomplete
        // Count opening and closing braces
        const openBraces = (cleanedContent.match(/\{/g) || []).length;
        const closeBraces = (cleanedContent.match(/\}/g) || []).length;
        const missingBraces = openBraces - closeBraces;
        
        if (missingBraces > 0) {
          // Try to complete the JSON
          let attemptFix = cleanedContent;
          // Remove trailing comma if present
          attemptFix = attemptFix.replace(/,\s*$/, '');
          // Add missing closing braces
          for (let i = 0; i < missingBraces; i++) {
            attemptFix += '}';
          }
          console.log('Attempting to parse fixed JSON...');
          try {
            parsed = JSON.parse(attemptFix) as ForecastResult;
            console.log('✅ Successfully parsed fixed JSON');
          } catch (fixError) {
            console.error('Failed to parse fixed JSON, will use fallback');
            throw new Error('Incomplete JSON response from AI');
          }
        } else {
          throw new Error('Incomplete JSON response from AI');
        }
      } else {
        parsed = JSON.parse(cleanedContent) as ForecastResult;
      }
      
      // Log the parsed destination data for debugging
      console.log('AI Response - Full parsed data:', JSON.stringify(parsed, null, 2));
      console.log('AI Response - Destination data:', {
        averageDailyCost: parsed?.destination?.averageDailyCost,
        weather: parsed?.destination?.weather,
        visa: parsed?.destination?.visa,
        popularAreas: parsed?.destination?.popularAreas,
      });
      console.log('AI Response - Forecast data:', {
        ranges: parsed?.forecast?.ranges,
        breakdown: parsed?.forecast?.breakdown,
        confidence: parsed?.forecast?.confidence,
        seasonal: parsed?.forecast?.seasonal,
      });
      
      // Check if AI returned generic values
      if (parsed?.destination?.weather?.season === 'Season varies' || 
          parsed?.destination?.visa?.type === 'Check requirements' ||
          (parsed?.destination?.popularAreas?.length > 0 && 
           parsed.destination.popularAreas.some((area: string) => 
             area.toLowerCase().includes('historic centre') || 
             area.toLowerCase().includes('local markets')
           ))) {
        console.warn('⚠️ WARNING: AI returned generic/fallback values! This suggests the AI prompt may need adjustment.');
      }
      
      // Check if breakdown values are missing or zero
      if (!parsed?.forecast?.breakdown || 
          parsed.forecast.breakdown.accommodation === 0 ||
          parsed.forecast.breakdown.food === 0 ||
          parsed.forecast.breakdown.transport === 0 ||
          parsed.forecast.breakdown.activities === 0) {
        console.warn('⚠️ WARNING: AI returned zero or missing breakdown values!');
      }
    } catch (error) {
      console.error('Failed to parse AI JSON response:', content);
      console.error('Parse error:', error);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Ensure the model returns valid JSON.' },
        { status: 502 }
      );
    }

    const fallbackForecast = computeFallbackForecast(totalDays, dailyBudget);
    const forecast: TripBudgetForecast = {
      ranges: {
        minimum: sanitizeNumber(
          parsed?.forecast?.ranges?.minimum,
          fallbackForecast.ranges.minimum,
          { min: 0 }
        ),
        average: sanitizeNumber(
          parsed?.forecast?.ranges?.average,
          fallbackForecast.ranges.average,
          { min: 0 }
        ),
        comfortable: sanitizeNumber(
          parsed?.forecast?.ranges?.comfortable,
          fallbackForecast.ranges.comfortable,
          { min: 0 }
        ),
      },
      confidence: {
        level: sanitizeNumber(parsed?.forecast?.confidence?.level, fallbackForecast.confidence.level, {
          min: 1,
          max: 100,
        }),
        basedOn: sanitizeNumber(
          parsed?.forecast?.confidence?.basedOn,
          fallbackForecast.confidence.basedOn,
          { min: 10 }
        ),
      },
      seasonal: {
        adjustment: sanitizeNumber(
          parsed?.forecast?.seasonal?.adjustment,
          fallbackForecast.seasonal.adjustment,
          { min: -50, max: 50 }
        ),
        reason:
          typeof parsed?.forecast?.seasonal?.reason === 'string' &&
          parsed.forecast.seasonal.reason.trim() !== ''
            ? parsed.forecast.seasonal.reason.trim()
            : fallbackForecast.seasonal.reason,
      },
      breakdown: (() => {
        // Get AI breakdown values
        const aiAccommodation = sanitizeNumber(parsed?.forecast?.breakdown?.accommodation, 0, { min: 0 });
        const aiFood = sanitizeNumber(parsed?.forecast?.breakdown?.food, 0, { min: 0 });
        const aiTransport = sanitizeNumber(parsed?.forecast?.breakdown?.transport, 0, { min: 0 });
        const aiActivities = sanitizeNumber(parsed?.forecast?.breakdown?.activities, 0, { min: 0 });
        
        // If AI provided valid breakdown values, use them
        if (aiAccommodation > 0 && aiFood > 0 && aiTransport > 0 && aiActivities > 0) {
          return {
            accommodation: aiAccommodation,
            food: aiFood,
            transport: aiTransport,
            activities: aiActivities,
          };
        }
        
        // Otherwise, calculate from the average range using standard percentages
        // Use parsed value or fallback
        const averageRange = sanitizeNumber(
          parsed?.forecast?.ranges?.average,
          fallbackForecast.ranges.average,
          { min: 0 }
        );
        return {
          accommodation: Math.round(averageRange * 0.40), // 40% for accommodation
          food: Math.round(averageRange * 0.25), // 25% for food
          transport: Math.round(averageRange * 0.20), // 20% for transport
          activities: Math.round(averageRange * 0.15), // 15% for activities
        };
      })(),
      notes:
        typeof parsed?.forecast?.notes === 'string' && parsed.forecast.notes.trim() !== ''
          ? parsed.forecast.notes.trim()
          : undefined,
    };

    const destinationOverview: DestinationOverview = {
      name: destinationName,
      country: destinationCountry,
      averageDailyCost: {
        min: sanitizeNumber(
          parsed?.destination?.averageDailyCost?.min,
          insights.averageDailyCost?.min ?? forecast.ranges.minimum / totalDays,
          { min: 0 }
        ),
        max: sanitizeNumber(
          parsed?.destination?.averageDailyCost?.max,
          insights.averageDailyCost?.max ?? forecast.ranges.comfortable / totalDays,
          { min: 0 }
        ),
      },
      weather: {
        season:
          typeof parsed?.destination?.weather?.season === 'string' &&
          parsed.destination.weather.season.trim() !== '' &&
          parsed.destination.weather.season.trim() !== 'Season varies'
            ? parsed.destination.weather.season.trim()
            : insights.weather?.season && insights.weather.season !== 'Unknown'
              ? insights.weather.season
              : 'Season varies',
        averageTemp: sanitizeNumber(
          parsed?.destination?.weather?.averageTemp,
          insights.weather?.averageTemp ?? 24,
          { min: -20, max: 45 }
        ),
      },
      visa: {
        type:
          typeof parsed?.destination?.visa?.type === 'string' &&
          parsed.destination.visa.type.trim() !== '' &&
          parsed.destination.visa.type.trim() !== 'Check requirements'
            ? parsed.destination.visa.type.trim()
            : 'Check requirements',
        requirements:
          typeof parsed?.destination?.visa?.requirements === 'string' &&
          parsed.destination.visa.requirements.trim() !== '' &&
          !parsed.destination.visa.requirements.includes('Consult official embassy')
            ? parsed.destination.visa.requirements.trim()
            : 'Consult official embassy resources for current visa rules.',
      },
      popularAreas: Array.isArray(parsed?.destination?.popularAreas) &&
        parsed.destination.popularAreas.length > 0 &&
        !parsed.destination.popularAreas.some((area: string) => 
          area.toLowerCase().includes('historic centre') || 
          area.toLowerCase().includes('local markets') ||
          area.toLowerCase().includes('outdoor attractions')
        )
        ? parsed.destination.popularAreas
            .filter((item: unknown): item is string => typeof item === 'string' && item.trim() !== '')
            .map((item) => item.trim())
            .slice(0, 4)
        : ['Historic centre', 'Local markets', 'Outdoor attractions'],
    };

    const summary: TripSummary = {
      overview:
        typeof parsed?.summary?.overview === 'string' && parsed.summary.overview.trim() !== ''
          ? parsed.summary.overview.trim()
          : `Expect a balanced ${travelStyle.toLowerCase()} experience in ${destinationName}.`,
      highlights: Array.isArray(parsed?.summary?.highlights) &&
        parsed.summary.highlights.length > 0
        ? parsed.summary.highlights
            .filter((item: unknown): item is string => typeof item === 'string' && item.trim() !== '')
            .map((item) => item.trim())
            .slice(0, 5)
        : [
            'Book accommodations close to key sights to reduce transport costs.',
            'Allocate part of the budget for signature local experiences.',
          ],
    };

    const result: ForecastResult = {
      destination: destinationOverview,
      forecast,
      summary,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error generating AI forecast:', error);
    return NextResponse.json(
      { error: 'Unexpected server error while generating trip forecast.' },
      { status: 500 }
    );
  }
}

