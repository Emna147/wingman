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
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Generating trip summary...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please wait while we prepare tailored recommendations for your trip.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        Trip Summary
      </h3>

      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        {summary.overview}
      </p>

      {summary.highlights.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 font-medium text-black dark:text-white">
            Key Highlights
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
            {summary.highlights.map((highlight, index) => (
              <li key={index}>{highlight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

