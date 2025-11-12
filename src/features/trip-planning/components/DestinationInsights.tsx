import React from 'react';
import { Destination } from '../types';

interface DestinationInsightsProps {
  destination: Destination;
  isLoading?: boolean;
}

export const DestinationInsights: React.FC<DestinationInsightsProps> = ({
  destination,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
          Loading destination insights...
        </h3>
        {/* Add loading skeleton here */}
      </div>
    );
  }

  const {
    name,
    country,
    averageDailyCost,
    weather,
    visa,
    popularAreas,
  } = destination;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
        {name}, {country}
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 font-medium text-gray-800 dark:text-white/90">
            Average Daily Cost
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ${averageDailyCost.min} - ${averageDailyCost.max}
          </p>
        </div>
        
        <div>
          <h4 className="mb-2 font-medium text-gray-800 dark:text-white/90">
            Weather
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {weather.season}, {weather.averageTemp}°C
          </p>
        </div>
        
        <div>
          <h4 className="mb-2 font-medium text-gray-800 dark:text-white/90">
            Visa Requirements
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {visa.type}
            <br />
            {visa.requirements}
          </p>
        </div>
        
        <div>
          <h4 className="mb-2 font-medium text-gray-800 dark:text-white/90">
            Popular Areas
          </h4>
          <ul className="list-disc pl-4 text-sm text-gray-600 dark:text-gray-400">
            {popularAreas.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};