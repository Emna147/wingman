import React, { useState, useEffect } from 'react';
import { DayItinerary, Trip } from '../types';
import { DayItineraryView } from './DayItineraryView';

interface TimelineViewProps {
  trip: Trip;
  onUpdateTrip: (updatedTrip: Trip) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  trip,
  onUpdateTrip,
}) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Ensure we always operate on an array to avoid runtime errors when itinerary is undefined
  const itinerary = trip.itinerary ?? [];

  useEffect(() => {
    if (!selectedDay && trip.startDate) {
      setSelectedDay(trip.startDate);
    }
  }, [trip.startDate]);

  const getDaysBetweenDates = (startDate: Date, endDate: Date) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const handleUpdateDay = (updatedDay: DayItinerary) => {
    // Copy existing itinerary or start a new one
    const updatedItinerary = [...itinerary];

    const idx = updatedItinerary.findIndex(
      (d) => d.date.getTime() === updatedDay.date.getTime()
    );

    if (idx !== -1) {
      // replace existing day
      updatedItinerary[idx] = updatedDay;
    } else {
      // add new day
      updatedItinerary.push(updatedDay);
    }

    onUpdateTrip({
      ...trip,
      itinerary: updatedItinerary,
    });
  };

  const allDates = getDaysBetweenDates(trip.startDate, trip.endDate);

  return (
    <div className="space-y-6">
      {/* Timeline Navigation */}
      <div className="flex space-x-2 overflow-x-auto pb-4">
        {allDates.map((date) => {
          const isSelected = selectedDay?.getTime() === date.getTime();
          const hasActivities = itinerary.some(
            (day) => day.date.getTime() === date.getTime()
          );

          return (
            <button
              key={date.getTime()}
              onClick={() => setSelectedDay(date)}
              className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${
                isSelected
                    ? 'bg-brand-500 text-white'
                    : hasActivities
                    ? 'bg-brand-500/10 text-brand-500'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
              }`}
            >
              {date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </button>
          );
        })}
      </div>

      {/* Selected Day View */}
      {selectedDay && (
        <DayItineraryView
            day={
              itinerary.find(
                (day) => day.date.getTime() === selectedDay.getTime()
              ) || {
                date: selectedDay,
                activities: [],
                totalCost: 0,
              }
            }
          onUpdateDay={handleUpdateDay}
          destination={`${trip.destination.name}, ${trip.destination.country}`}
          travelStyle={trip.travelStyle}
        />
      )}

      {/* Trip Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          Trip Summary
        </h3>
    {trip.summary && (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {trip.summary.overview}
        </p>
        {trip.summary.highlights.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
            {trip.summary.highlights.map((highlight, index) => (
              <li key={index}>{highlight}</li>
            ))}
          </ul>
        )}
      </div>
    )}
    <div className="mt-6 space-y-4">
      <div className="flex justify-between">
        <span className="text-gray-600 dark:text-gray-400">Total Days</span>
        <span className="font-medium text-gray-800 dark:text-white/90">{allDates.length} days</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600 dark:text-gray-400">Planned Activities</span>
        <span className="font-medium text-gray-800 dark:text-white/90">
          {itinerary.reduce((sum, day) => sum + (day.activities?.length || 0), 0)}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600 dark:text-gray-400">Total Activities Cost</span>
        <span className="font-medium text-brand-500">
          ${itinerary.reduce((sum, day) => sum + (day.totalCost || 0), 0)}
        </span>
      </div>
        </div>
      </div>
    </div>
  );
};