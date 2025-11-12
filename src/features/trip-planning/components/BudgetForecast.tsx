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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
        Budget Forecast
      </h3>

      <div className="mb-6">
        <h4 className="mb-3 font-medium text-gray-800 dark:text-white/90">
          Budget Ranges
        </h4>
        <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">Minimum</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">${ranges.minimum}</p>
            </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">${ranges.average}</p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Comfortable</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white/90">${ranges.comfortable}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="mb-3 font-medium text-gray-800 dark:text-white/90">
          Confidence Level
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {confidence.level}% confidence based on {confidence.basedOn} nomad trips
        </p>
      </div>

      {seasonal.adjustment !== 0 && (
        <div className="mb-6">
          <h4 className="mb-3 font-medium text-gray-800 dark:text-white/90">
            Seasonal Adjustment
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {seasonal.adjustment > 0 ? '+' : ''}{seasonal.adjustment}% - {seasonal.reason}
          </p>
        </div>
      )}

      <div>
        <h4 className="mb-3 font-medium text-gray-800 dark:text-white/90">
          Cost Breakdown
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Accommodation</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">${breakdown.accommodation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Food</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">${breakdown.food}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Transport</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">${breakdown.transport}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Activities</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">${breakdown.activities}</span>
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