import React from 'react';
import { TripSummary } from '../types';

interface TripSummaryCardProps {
  summary: TripSummary;
  isLoading?: boolean;
}

export const TripSummaryCard: React.FC<TripSummaryCardProps> = ({
  summary,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          Generating trip summary...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please wait while we prepare tailored recommendations for your trip.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
        Trip Summary
      </h3>

      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {summary.overview}
      </p>

      {summary.highlights.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 font-medium text-gray-800 dark:text-white/90">
            Key Highlights
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
            {summary.highlights.map((highlight, index) => (
              <li key={index}>{highlight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

