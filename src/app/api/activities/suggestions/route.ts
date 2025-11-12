import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash";

export interface ActivitySuggestion {
  title: string;
  description: string;
  cost: number;
  time: 'morning' | 'afternoon' | 'evening';
  category: string;
  duration?: string;
}

interface SuggestionsRequestBody {
  destination: string;
  travelStyle?: string;
  date?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const body: SuggestionsRequestBody = await request.json();
    const { destination, travelStyle, date } = body ?? {};

    if (!destination) {
      return NextResponse.json(
        { error: 'destination is required.' },
        { status: 400 }
      );
    }

    // Use Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const prompt = `List 8 popular activities for ${destination}${travelStyle ? ` (${travelStyle} travelers)` : ''} as a JSON array. Each activity must have: title, description (1 sentence), cost (USD), time (morning/afternoon/evening), category (Sightseeing/Adventure/Culture/Food/Nature/Entertainment).

Format:
[
  {"title": "Name", "description": "One sentence", "cost": 0, "time": "morning", "category": "Sightseeing"}
]`;

    let content: string;
    try {
      const result = await model.generateContent(prompt);
      const response = await (result as any).response;

      // Helper to extract text/content from various possible response shapes
      const extractContent = async (resp: any, resObj: any): Promise<string> => {
        if (!resp) return '';

        // If response has text() accessor (some SDK builds)
        if (typeof resp.text === 'function') {
          try {
            const t = resp.text();
            // text() may return a string or promise
            return typeof t === 'string' ? t : await t;
          } catch (e) {
            // fallthrough to other shapes
          }
        }

        // Handle candidates with content.parts (Gemini 2.5 structure)
        if (Array.isArray(resp.candidates) && resp.candidates.length) {
          const cand = resp.candidates[0];
          
          // Extract from content.parts[].text
          if (cand?.content && Array.isArray(cand.content.parts)) {
            const partsText = cand.content.parts
              .map((p: any) => p?.text || '')
              .join('');
            if (partsText) return partsText;
          }
          
          // Try direct content string
          if (typeof cand?.content === 'string') return cand.content;
          
          // Try outputText or other fields
          if (cand?.outputText) return cand.outputText;
          if (Array.isArray(cand?.output)) {
            return cand.output.map((o: any) => o?.content || o?.text || '').join(' ');
          }
        }

        if (Array.isArray(resp.outputs) && resp.outputs.length) {
          return resp.outputs.map((o: any) => o?.content || o?.text || '').join(' ');
        }

        if (resp.outputText) return resp.outputText;
        if (resp.outputsString) return resp.outputsString;
        if (typeof resp === 'string') return resp;

        // Try top-level result.output as a fallback
        if (resObj && Array.isArray(resObj.output) && resObj.output.length) {
          return resObj.output.map((o: any) => o?.content || o?.text || '').join(' ');
        }

        return '';
      };

      content = await extractContent(response, result);

      if (!content) {
        // log detailed response for debugging
        try {
          console.error('Full Gemini response for debugging:', JSON.stringify(response, null, 2));
        } catch {
          console.error('Full Gemini response (non-serializable):', response);
        }
        throw new Error('AI did not return any content.');
      }
    } catch (error: any) {
      console.error('Gemini API error:', error);

      // Return fallback suggestions if API fails
      return NextResponse.json({
        suggestions: getFallbackSuggestions(destination, travelStyle),
      });
    }

    let parsed: ActivitySuggestion[] = [];
    try {
      const parsedData = JSON.parse(content);
      // Handle both array and object with suggestions property
      parsed = Array.isArray(parsedData)
        ? parsedData
        : parsedData?.suggestions || parsedData?.activities || [];
    } catch (error) {
      console.error('Failed to parse AI JSON response:', content);
      return NextResponse.json({
        suggestions: getFallbackSuggestions(destination, travelStyle),
      });
    }

    // Validate and sanitize suggestions
    const suggestions: ActivitySuggestion[] = parsed
      .filter((item: any) => item && item.title && typeof item.cost === 'number')
      .map((item: any) => ({
        title: String(item.title || '').trim(),
        description: String(item.description || '').trim(),
        cost: Math.max(0, Math.round(Number(item.cost) || 0)),
        time: ['morning', 'afternoon', 'evening'].includes(item.time) 
          ? item.time 
          : 'morning',
        category: String(item.category || 'Sightseeing').trim(),
        duration: item.duration ? String(item.duration).trim() : undefined,
      }))
      .slice(0, 10); // Limit to 10 suggestions

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Unexpected error generating activity suggestions:', error);
    return NextResponse.json(
      { error: 'Unexpected server error while generating activity suggestions.' },
      { status: 500 }
    );
  }
}

function getFallbackSuggestions(destination: string, travelStyle?: string): ActivitySuggestion[] {
  return [
    {
      title: 'City Walking Tour',
      description: 'Explore the main attractions and landmarks on foot',
      cost: travelStyle === 'Backpacker' ? 0 : travelStyle === 'Premium' ? 50 : 20,
      time: 'morning',
      category: 'Sightseeing',
      duration: '2-3 hours',
    },
    {
      title: 'Local Market Visit',
      description: 'Experience local culture and cuisine at traditional markets',
      cost: 0,
      time: 'morning',
      category: 'Culture',
      duration: '1-2 hours',
    },
    {
      title: 'Museum Visit',
      description: 'Discover local history and art at popular museums',
      cost: travelStyle === 'Backpacker' ? 5 : travelStyle === 'Premium' ? 30 : 15,
      time: 'afternoon',
      category: 'Culture',
      duration: '2-3 hours',
    },
    {
      title: 'Local Restaurant Experience',
      description: 'Try authentic local cuisine at recommended restaurants',
      cost: travelStyle === 'Backpacker' ? 10 : travelStyle === 'Premium' ? 80 : 30,
      time: 'evening',
      category: 'Food',
      duration: '1-2 hours',
    },
    {
      title: 'Scenic Viewpoint',
      description: 'Visit popular viewpoints for stunning city or nature views',
      cost: 0,
      time: 'afternoon',
      category: 'Nature',
      duration: '1 hour',
    },
  ];
}

