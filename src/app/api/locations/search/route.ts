import { NextRequest, NextResponse } from 'next/server';

interface LocationSuggestion {
  name: string;
  country: string;
  displayName: string;
}

// Using a free geocoding API (Nominatim OpenStreetMap) for location search
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Use Nominatim API for location search (free, no API key required)
    const response = await fetch(
      `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Wingman Trip Planner', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = await response.json();

    const suggestions: LocationSuggestion[] = data
      .filter((item: any) => item.type === 'city' || item.type === 'town' || item.type === 'administrative')
      .map((item: any) => {
        const name = item.name || item.display_name.split(',')[0];
        const country = item.address?.country || item.display_name.split(',').pop()?.trim() || 'Unknown';
        return {
          name: name.trim(),
          country: country.trim(),
          displayName: `${name}, ${country}`,
        };
      })
      .filter((item: LocationSuggestion, index: number, self: LocationSuggestion[]) => 
        // Remove duplicates
        index === self.findIndex((t) => t.displayName === item.displayName)
      )
      .slice(0, 6); // Limit to 6 suggestions

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error searching locations:', error);
    return NextResponse.json({ suggestions: [] });
  }
}

