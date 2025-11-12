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
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
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
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        {name}, {country}
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 font-medium text-black dark:text-white">
            Average Daily Cost
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            ${averageDailyCost.min} - ${averageDailyCost.max}
          </p>
        </div>
        
        <div>
          <h4 className="mb-2 font-medium text-black dark:text-white">
            Weather
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {weather.season}, {weather.averageTemp}°C
          </p>
        </div>
        
        <div>
          <h4 className="mb-2 font-medium text-black dark:text-white">
            Visa Requirements
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {visa.type}
            <br />
            {visa.requirements}
          </p>
        </div>
        
        <div>
          <h4 className="mb-2 font-medium text-black dark:text-white">
            Popular Areas
          </h4>
          <ul className="list-disc pl-4 text-sm text-gray-700 dark:text-gray-300">
            {popularAreas.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};