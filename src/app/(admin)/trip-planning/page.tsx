'use client';

import React, { useState } from 'react';
import { TripForm } from '@/features/trip-planning/components/TripForm';
import { DestinationInsights } from '@/features/trip-planning/components/DestinationInsights';
import { BudgetForecast } from '@/features/trip-planning/components/BudgetForecast';
import { TimelineView } from '@/features/trip-planning/components/TimelineView';
import { TripSummaryCard } from '@/features/trip-planning/components/TripSummaryCard';
import { useToast } from '@/context/ToastContext';
import { Destination, TripBudgetForecast, Trip, TripSummary } from '@/features/trip-planning/types';

export default function TripPlanningPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [forecast, setForecast] = useState<TripBudgetForecast | null>(null);
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);

  const handleTripFormSubmit = async (formData: any) => {
    setIsLoading(true);
    setDestination(null);
    setForecast(null);
    setSummary(null);
    setTrip(null);

    try {
      const startDateValue = new Date(formData.startDate);
      const endDateValue = new Date(formData.endDate);
      const totalDays = Math.max(
        1,
        Math.ceil(
          (endDateValue.getTime() - startDateValue.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      );

      const dailyBudgetValue =
        formData.dailyBudget !== undefined && formData.dailyBudget !== null
          ? Number(formData.dailyBudget)
          : undefined;

      console.log('Calling forecast API with:', {
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        travelStyle: formData.travelStyle,
        dailyBudget: dailyBudgetValue,
      });

      const forecastResponse = await fetch('/api/trip-planning/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: formData.destination,
          startDate: formData.startDate,
          endDate: formData.endDate,
          travelStyle: formData.travelStyle,
          dailyBudget: dailyBudgetValue,
        }),
      });

      if (!forecastResponse.ok) {
        const errorBody = await forecastResponse.json().catch(() => null);
        console.error('Forecast API error:', errorBody);
        throw new Error(errorBody?.error || 'Failed to generate AI forecast.');
      }

      const forecastResult = await forecastResponse.json();
      console.log('Forecast API response:', {
        destination: forecastResult.destination,
        hasForecast: !!forecastResult.forecast,
        hasSummary: !!forecastResult.summary,
      });

      const { destination: destinationData, forecast: forecastData, summary: summaryData } = forecastResult;
      
      // Log if we got generic values
      if (destinationData?.weather?.season === 'Season varies' || 
          destinationData?.visa?.type === 'Check requirements') {
        console.warn('⚠️ Received generic destination data from forecast API');
      }

      setDestination(destinationData);
      setForecast(forecastData);
      setSummary(summaryData);

      // Prepare trip data for MongoDB
      const tripData = {
        destination: destinationData,
        startDate: startDateValue,
        endDate: endDateValue,
        travelStyle: formData.travelStyle,
        summary: summaryData,
        budget: {
          accommodation: {
            amount: forecastData.breakdown.accommodation,
            details: formData.accommodation || 'Standard accommodation',
          },
          food: {
            amount: forecastData.breakdown.food,
            perDay: Number((forecastData.breakdown.food / totalDays).toFixed(2)),
          },
          transport: {
            amount: forecastData.breakdown.transport,
            details: formData.transport || 'Local transportation',
          },
          activities: {
            amount: forecastData.breakdown.activities,
            breakdown: [],
          },
          total: Object.values(forecastData.breakdown).reduce((a, b) => a + b, 0),
          currency: 'USD',
        },
        itinerary: [],
        attachments: [],
        visibility: 'private',
      };

      // Create trip in MongoDB
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      });

      if (!response.ok) {
        throw new Error('Failed to create trip');
      }

      const created = await response.json();
      const createdTrip: Trip | undefined = created?.trip;

      if (createdTrip) {
        setTrip({
          ...createdTrip,
          startDate: new Date(createdTrip.startDate),
          endDate: new Date(createdTrip.endDate),
          summary: createdTrip.summary ?? summaryData,
        });
      }

      // Show success message
      toast?.({
        title: 'Success!',
        description: 'Your trip has been created successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating trip:', error);
      
      // Show error message
      toast?.({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create trip',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white">
          Plan Your Trip
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter your trip details to get started
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <TripForm onSubmit={handleTripFormSubmit} isLoading={isLoading} />
        </div>

        <div className="space-y-8 xl:col-span-2">
          {destination && (
            <DestinationInsights
              destination={destination}
              isLoading={isLoading}
            />
          )}

          {forecast && (
            <BudgetForecast
              forecast={forecast}
              isLoading={isLoading}
            />
          )}

          {summary && (
            <TripSummaryCard
              summary={summary}
              isLoading={isLoading}
            />
          )}

          {trip && (
            <div className="mt-8">
              <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                Trip Timeline
              </h3>
              <TimelineView
                trip={trip}
                onUpdateTrip={setTrip}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}