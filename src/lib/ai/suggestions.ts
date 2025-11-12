export interface GeminiSuggestionPayload {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
}

export const parseSuggestionFromText = (text: string): GeminiSuggestionPayload | null => {
  const jsonMatches = text.match(/\{[^}]+\}/g);
  if (!jsonMatches) return null;

  for (const candidate of jsonMatches) {
    try {
      const parsed = JSON.parse(candidate);
      if (
        typeof parsed.lat === "number" &&
        typeof parsed.lng === "number" &&
        parsed.lat >= -90 &&
        parsed.lat <= 90 &&
        parsed.lng >= -180 &&
        parsed.lng <= 180
      ) {
        return {
          lat: parsed.lat,
          lng: parsed.lng,
          title: typeof parsed.title === "string" ? parsed.title : undefined,
          description: typeof parsed.description === "string" ? parsed.description : undefined,
        };
      }
    } catch {
      // ignore malformed JSON fragments and continue iterating
    }
  }

  return null;
};


