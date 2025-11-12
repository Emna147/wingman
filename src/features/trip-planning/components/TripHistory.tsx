"use client";

import React, { useEffect, useState } from 'react';
import { TripDetails } from '@/components/trip-planning/TripDetails';

interface Trip {
  _id: string | { toString(): string };
  title: string;
  description?: string;
  destination: {
    name: string;
    country: string;
  };
  startDate: string;
  endDate: string;
  travelStyle?: 'Backpacker' | 'Budget' | 'Comfort' | 'Luxury';
  status?: 'planning' | 'active' | 'completed';
  budget?: {
    accommodation: { amount: number };
    food: { amount: number };
    transport: { amount: number };
    activities: { amount: number };
    total: number;
    currency: string;
  };
  itinerary: Array<{
    day: number;
    time: string;
    activity: string;
    location?: { name: string };
    duration: number;
    notes?: string;
    cost?: number;
  }>;
  createdBy: string;
  updatedAt: string;
}

const TripHistory: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter trips based on search term
  const filterTrips = (searchTerm: string, trips: Trip[]) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      return trips;
    }
    return trips.filter(trip => 
      trip.title?.toLowerCase().includes(term) ||
      trip.destination.name.toLowerCase().includes(term) ||
      trip.destination.country.toLowerCase().includes(term) ||
      trip.status?.toLowerCase().includes(term) ||
      trip.travelStyle?.toLowerCase().includes(term)
    );
  };

  // Handle search input changes
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    setFilteredTrips(filterTrips(newSearchTerm, trips));
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    console.log('Fetching trips...');
    
    const fetchTrips = async () => {
      try {
        const res = await fetch('/api/trips?mine=true');
        const responseText = await res.text(); // Get raw response text
        console.log('Raw API Response:', responseText);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch trips: ${res.status} ${res.statusText}`);
        }
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          throw new Error('Invalid JSON response from server');
        }
        
        if (!mounted) return;
        
        console.log('Parsed trips data:', data);
        
        if (!data.trips) {
          console.warn('No trips array in response:', data);
          setTrips([]);
          setFilteredTrips([]);
          return;
        }
        
        if (!Array.isArray(data.trips)) {
          console.error('trips is not an array:', data.trips);
          throw new Error('Server returned invalid data format');
        }
        
        const trips = data.trips;
        console.log(`Found ${trips.length} trips:`, trips);
        setTrips(trips);
        setFilteredTrips(trips);
      } catch (err) {
        console.error('Error in fetchTrips:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTrips();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg p-4 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="rounded-lg p-6 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark">
        <p className="text-gray-600 dark:text-gray-300">No trips found yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Field */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search trips by title, destination, status..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-2 rounded-lg border border-stroke bg-white dark:bg-boxdark dark:border-strokedark focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-colors duration-200"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Search Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {searchTerm ? (
          <p>Found {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} matching "{searchTerm}"</p>
        ) : (
          <p>Total {trips.length} trip{trips.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {filteredTrips.length === 0 && searchTerm ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No trips found matching your search.</p>
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <TripDetails 
              key={trip._id.toString()} 
              trip={{...trip, _id: trip._id.toString()}} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TripHistory;
