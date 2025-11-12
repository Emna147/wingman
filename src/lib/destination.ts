// Helper to enrich destination objects with coordinates and simple insights.
// Uses OpenTripMap for geocoding/places (requires API key) and Open-Meteo for weather (no key required).

export interface DestinationInsights {
  name: string;
  lat?: number;
  lng?: number;
  country?: string;
  averageDailyCost?: { min: number; max: number } | null;
  weather?: { season: string; averageTemp: number } | null;
  placeId?: string | null;
}

const OTM_API_KEY = process.env.OPENTRIPMAP_API_KEY;
const OTM_GEOCODE_URL = 'https://api.opentripmap.com/0.1/en/places/geoname';
const OTM_PLACE_URL = 'https://api.opentripmap.com/0.1/en/places/radius';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export async function getDestinationInsights(name: string): Promise<DestinationInsights> {
  const insights: DestinationInsights = {
    name,
    lat: undefined,
    lng: undefined,
    country: undefined,
    averageDailyCost: null,
    weather: null,
    placeId: null,
  };

  if (!name) return insights;

  try {
    // 1) Geocode using OpenTripMap geoname endpoint. Requires API key.
    if (OTM_API_KEY) {
      const geocodeUrl = `${OTM_GEOCODE_URL}?name=${encodeURIComponent(name)}&apikey=${OTM_API_KEY}`;
      const geoRes = await fetch(geocodeUrl);
      if (geoRes.ok) {
        const geoJson = await geoRes.json();
        if (geoJson && typeof geoJson.lat === 'number' && typeof geoJson.lon === 'number') {
          insights.lat = geoJson.lat;
          insights.lng = geoJson.lon;
          insights.country = geoJson.country || insights.country;
          insights.placeId = geoJson.osm_id ? String(geoJson.osm_id) : insights.placeId;
        }
      }
    }

    // 2) If we have coordinates, fetch simple weather estimate from Open-Meteo
    if (insights.lat !== undefined && insights.lng !== undefined) {
      const weatherUrl = `${OPEN_METEO_URL}?latitude=${insights.lat}&longitude=${insights.lng}&daily=temperature_2m_mean&timezone=UTC`;
      const wRes = await fetch(weatherUrl);
      if (wRes.ok) {
        const wJson = await wRes.json();
        // average daily temp - take the mean of returned daily temps if present
        if (wJson && wJson.daily && Array.isArray(wJson.daily.temperature_2m_mean) && wJson.daily.temperature_2m_mean.length) {
          const temps = wJson.daily.temperature_2m_mean;
          const avgTemp = temps.reduce((s: number, v: number) => s + v, 0) / temps.length;
          insights.weather = { season: 'Unknown', averageTemp: Math.round(avgTemp) };
        }
      }
    }

    // 3) Placeholder for average daily costs: try OTM places radius for POI density as a proxy (best-effort)
    if (OTM_API_KEY && insights.lat !== undefined && insights.lng !== undefined) {
      const placeUrl = `${OTM_PLACE_URL}?radius=10000&limit=20&lon=${insights.lng}&lat=${insights.lat}&apikey=${OTM_API_KEY}`;
      const pRes = await fetch(placeUrl);
      if (pRes.ok) {
        const pJson = await pRes.json();
        // crude heuristic: more POIs -> higher average daily cost; this is just a placeholder
        if (pJson && Array.isArray(pJson.features)) {
          const count = pJson.features.length;
          const min = Math.max(10, Math.round(20 + count * 2));
          const max = Math.max(30, Math.round(40 + count * 5));
          insights.averageDailyCost = { min, max };
        }
      }
    }

  } catch (err) {
    // don't fail the whole request if insights can't be fetched
    console.warn('getDestinationInsights error:', err);
  }

  return insights;
}
