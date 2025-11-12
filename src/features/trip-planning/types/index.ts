export type TravelStyle = 'Backpacker' | 'Digital Nomad' | 'Comfortable' | 'Premium';

export interface Destination {
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

export interface TripSummary {
  overview: string;
  highlights: string[];
}

export interface Activity {
  id: string;
  title: string;
  time: string; // 'morning' | 'afternoon' | 'evening'
  cost: number;
  description?: string;
  addedBy: string; // user ID
  addedAt: Date;
}

export interface DayItinerary {
  date: Date;
  activities: Activity[];
  notes?: string;
  totalCost: number;
}

export interface Budget {
  accommodation: {
    amount: number;
    details: string;
  };
  food: {
    amount: number;
    perDay: number;
  };
  transport: {
    amount: number;
    details: string;
  };
  activities: {
    amount: number;
    breakdown: Array<{ title: string; cost: number }>;
  };
  total: number;
  currency: string;
}

export interface Collaborator {
  userId: string;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  role: 'owner' | 'editor' | 'viewer';
  joinedAt?: Date;
}

export interface TripAttachment {
  id: string;
  type: 'note' | 'link' | 'file';
  title: string;
  content: string;
  addedBy: string;
  addedAt: Date;
}

export interface Trip {
  id?: string;
  destination: Destination;
  startDate: Date;
  endDate: Date;
  travelStyle: TravelStyle;
  budget: Budget;
  itinerary: DayItinerary[];
  summary?: TripSummary;
  collaborators?: Collaborator[];
  attachments?: TripAttachment[];
  visibility?: 'private' | 'shared' | 'public';
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TripBudgetForecast {
  ranges: {
    minimum: number;
    average: number;
    comfortable: number;
  };
  confidence: {
    level: number;
    basedOn: number; // number of trips
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