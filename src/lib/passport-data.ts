// Passport Index Data - Simplified version
// Source: https://github.com/ilyankou/passport-index-dataset
// This is a subset for initial implementation

export interface PassportRequirement {
  from: string; // Your passport country
  to: string; // Destination country
  requirement: 'visa free' | 'visa on arrival' | 'visa required' | 'e-visa' | 'covid ban' | 'no admission';
  duration?: number; // Days allowed
  notes?: string;
}

export interface CountryInfo {
  code: string;
  name: string;
  visaFreeCount: number;
  visaOnArrivalCount: number;
  eVisaCount: number;
  continent: string;
}

// Visa requirements matrix - Tunisia as example passport
// Format: { 'TN-US': { requirement, duration }, ... }
const VISA_REQUIREMENTS: Record<string, PassportRequirement> = {
  // Tunisia passport holders
  'TN-TN': { from: 'TN', to: 'TN', requirement: 'visa free', duration: 365 },
  'TN-US': { from: 'TN', to: 'US', requirement: 'visa required', notes: 'B1/B2 tourist visa required' },
  'TN-GB': { from: 'TN', to: 'GB', requirement: 'visa required', notes: 'Standard visitor visa required' },
  'TN-FR': { from: 'TN', to: 'FR', requirement: 'visa free', duration: 90, notes: 'Schengen area' },
  'TN-DE': { from: 'TN', to: 'DE', requirement: 'visa free', duration: 90, notes: 'Schengen area' },
  'TN-ES': { from: 'TN', to: 'ES', requirement: 'visa free', duration: 90, notes: 'Schengen area' },
  'TN-IT': { from: 'TN', to: 'IT', requirement: 'visa free', duration: 90, notes: 'Schengen area' },
  'TN-PT': { from: 'TN', to: 'PT', requirement: 'visa free', duration: 90, notes: 'Schengen area' },
  'TN-JP': { from: 'TN', to: 'JP', requirement: 'visa required', notes: 'Tourist visa required' },
  'TN-TH': { from: 'TN', to: 'TH', requirement: 'visa on arrival', duration: 30, notes: '$35 USD fee' },
  'TN-VN': { from: 'TN', to: 'VN', requirement: 'e-visa', duration: 30, notes: 'Apply online, $25 USD' },
  'TN-IN': { from: 'TN', to: 'IN', requirement: 'e-visa', duration: 60, notes: 'E-tourist visa available' },
  'TN-CN': { from: 'TN', to: 'CN', requirement: 'visa required', notes: 'Tourist L visa required' },
  'TN-BR': { from: 'TN', to: 'BR', requirement: 'e-visa', duration: 90, notes: 'E-visa available online' },
  'TN-MX': { from: 'TN', to: 'MX', requirement: 'visa free', duration: 180 },
  'TN-CA': { from: 'TN', to: 'CA', requirement: 'visa required', notes: 'Visitor visa or eTA required' },
  'TN-AU': { from: 'TN', to: 'AU', requirement: 'e-visa', duration: 90, notes: 'ETA available online' },
  'TN-NZ': { from: 'TN', to: 'NZ', requirement: 'visa required', notes: 'Visitor visa required' },
  'TN-AE': { from: 'TN', to: 'AE', requirement: 'visa on arrival', duration: 30, notes: 'Free for 30 days' },
  'TN-SG': { from: 'TN', to: 'SG', requirement: 'visa required', notes: 'Entry visa required' },
  
  // Add more country combinations as needed
  // For other passports, follow same pattern
};

// Sample data - We'll expand this with the full dataset
export const COUNTRIES: CountryInfo[] = [
  { code: 'TN', name: 'Tunisia', visaFreeCount: 71, visaOnArrivalCount: 29, eVisaCount: 18, continent: 'Africa' },
  { code: 'US', name: 'United States', visaFreeCount: 186, visaOnArrivalCount: 37, eVisaCount: 12, continent: 'North America' },
  { code: 'GB', name: 'United Kingdom', visaFreeCount: 187, visaOnArrivalCount: 35, eVisaCount: 12, continent: 'Europe' },
  { code: 'FR', name: 'France', visaFreeCount: 189, visaOnArrivalCount: 36, eVisaCount: 11, continent: 'Europe' },
  { code: 'DE', name: 'Germany', visaFreeCount: 190, visaOnArrivalCount: 36, eVisaCount: 11, continent: 'Europe' },
  { code: 'JP', name: 'Japan', visaFreeCount: 193, visaOnArrivalCount: 41, eVisaCount: 16, continent: 'Asia' },
  { code: 'TH', name: 'Thailand', visaFreeCount: 79, visaOnArrivalCount: 38, eVisaCount: 8, continent: 'Asia' },
  { code: 'VN', name: 'Vietnam', visaFreeCount: 54, visaOnArrivalCount: 43, eVisaCount: 7, continent: 'Asia' },
  { code: 'IN', name: 'India', visaFreeCount: 60, visaOnArrivalCount: 40, eVisaCount: 6, continent: 'Asia' },
  { code: 'CN', name: 'China', visaFreeCount: 80, visaOnArrivalCount: 45, eVisaCount: 9, continent: 'Asia' },
  { code: 'BR', name: 'Brazil', visaFreeCount: 170, visaOnArrivalCount: 42, eVisaCount: 14, continent: 'South America' },
  { code: 'MX', name: 'Mexico', visaFreeCount: 158, visaOnArrivalCount: 43, eVisaCount: 13, continent: 'North America' },
  { code: 'CA', name: 'Canada', visaFreeCount: 185, visaOnArrivalCount: 51, eVisaCount: 13, continent: 'North America' },
  { code: 'AU', name: 'Australia', visaFreeCount: 186, visaOnArrivalCount: 49, eVisaCount: 13, continent: 'Oceania' },
  { code: 'NZ', name: 'New Zealand', visaFreeCount: 187, visaOnArrivalCount: 48, eVisaCount: 12, continent: 'Oceania' },
  { code: 'ES', name: 'Spain', visaFreeCount: 190, visaOnArrivalCount: 36, eVisaCount: 11, continent: 'Europe' },
  { code: 'IT', name: 'Italy', visaFreeCount: 190, visaOnArrivalCount: 36, eVisaCount: 11, continent: 'Europe' },
  { code: 'PT', name: 'Portugal', visaFreeCount: 188, visaOnArrivalCount: 50, eVisaCount: 13, continent: 'Europe' },
  { code: 'AE', name: 'United Arab Emirates', visaFreeCount: 180, visaOnArrivalCount: 55, eVisaCount: 12, continent: 'Asia' },
  { code: 'SG', name: 'Singapore', visaFreeCount: 192, visaOnArrivalCount: 39, eVisaCount: 12, continent: 'Asia' },
];

// Function to get visa requirements from Tunisia (example)
export function getVisaRequirements(fromCountry: string, toCountry: string): PassportRequirement | null {
  // This would query the full dataset
  // For now, return sample data
  const sampleRequirements: Record<string, PassportRequirement> = {
    'TN-US': { from: 'TN', to: 'US', requirement: 'visa required', duration: 0 },
    'TN-FR': { from: 'TN', to: 'FR', requirement: 'visa free', duration: 90 },
    'TN-TH': { from: 'TN', to: 'TH', requirement: 'visa on arrival', duration: 30 },
    'TN-VN': { from: 'TN', to: 'VN', requirement: 'e-visa', duration: 30 },
  };
  
  return sampleRequirements[`${fromCountry}-${toCountry}`] || null;
}

export function searchCountries(query: string): CountryInfo[] {
  if (!query) return COUNTRIES;
  
  const lowerQuery = query.toLowerCase();
  return COUNTRIES.filter(country => 
    country.name.toLowerCase().includes(lowerQuery) ||
    country.code.toLowerCase().includes(lowerQuery)
  );
}

// Get visa requirement for specific passport to destination
export function getVisaRequirement(fromCountry: string, toCountry: string): PassportRequirement | null {
  const key = `${fromCountry}-${toCountry}`;
  return VISA_REQUIREMENTS[key] || null;
}

// Get all destinations accessible from a passport
export function getDestinationsFrom(passportCountry: string): {
  visaFree: CountryInfo[];
  visaOnArrival: CountryInfo[];
  eVisa: CountryInfo[];
  visaRequired: CountryInfo[];
} {
  const destinations = {
    visaFree: [] as CountryInfo[],
    visaOnArrival: [] as CountryInfo[],
    eVisa: [] as CountryInfo[],
    visaRequired: [] as CountryInfo[]
  };

  COUNTRIES.forEach(country => {
    const requirement = getVisaRequirement(passportCountry, country.code);
    if (!requirement) return;

    switch (requirement.requirement) {
      case 'visa free':
        destinations.visaFree.push(country);
        break;
      case 'visa on arrival':
        destinations.visaOnArrival.push(country);
        break;
      case 'e-visa':
        destinations.eVisa.push(country);
        break;
      case 'visa required':
        destinations.visaRequired.push(country);
        break;
    }
  });

  return destinations;
}
