import React from 'react';
import { TripBudgetForecast } from '../types';

interface BudgetForecastProps {
  forecast: TripBudgetForecast;
  isLoading?: boolean;
}

export const BudgetForecast: React.FC<BudgetForecastProps> = ({
  forecast,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Calculating budget forecast...
        </h3>
        {/* Add loading skeleton here */}
      </div>
    );
  }

  const {
    ranges,
    confidence,
    seasonal,
    breakdown,
  notes,
  } = forecast;

  return (
    <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
        Budget Forecast
      </h3>

      <div className="mb-6">
        <h4 className="mb-3 font-medium text-black dark:text-white">
          Budget Ranges
        </h4>
        <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-stroke p-4 dark:border-strokedark bg-gray-50 dark:bg-boxdark">
              <p className="text-sm text-gray-500 dark:text-gray-400">Minimum</p>
              <p className="text-lg font-semibold text-black dark:text-white">${ranges.minimum}</p>
            </div>
          <div className="rounded-lg border border-stroke p-4 dark:border-strokedark bg-gray-50 dark:bg-boxdark">
            <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
            <p className="text-lg font-semibold text-black dark:text-white">${ranges.average}</p>
          </div>
          <div className="rounded-lg border border-stroke p-4 dark:border-strokedark bg-gray-50 dark:bg-boxdark">
            <p className="text-sm text-gray-500 dark:text-gray-400">Comfortable</p>
            <p className="text-lg font-semibold text-black dark:text-white">${ranges.comfortable}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="mb-3 font-medium text-black dark:text-white">
          Confidence Level
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {confidence.level}% confidence based on {confidence.basedOn} nomad trips
        </p>
      </div>

      {seasonal.adjustment !== 0 && (
        <div className="mb-6">
          <h4 className="mb-3 font-medium text-black dark:text-white">
            Seasonal Adjustment
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {seasonal.adjustment > 0 ? '+' : ''}{seasonal.adjustment}% - {seasonal.reason}
          </p>
        </div>
      )}

      <div>
        <h4 className="mb-3 font-medium text-black dark:text-white">
          Cost Breakdown
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Accommodation</span>
            <span className="text-sm font-medium text-black dark:text-white">${breakdown.accommodation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Food</span>
            <span className="text-sm font-medium text-black dark:text-white">${breakdown.food}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Transport</span>
            <span className="text-sm font-medium text-black dark:text-white">${breakdown.transport}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Activities</span>
            <span className="text-sm font-medium text-black dark:text-white">${breakdown.activities}</span>
          </div>
        </div>
      </div>

      {notes && (
        <div className="mt-6 rounded-lg bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
          {notes}
        </div>
      )}
    </div>
  );
};