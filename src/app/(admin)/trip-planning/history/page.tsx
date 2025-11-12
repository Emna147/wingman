"use client";

import React from 'react';
import TripHistory from '@/features/trip-planning/components/TripHistory';

export default function TripHistoryAdminPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold text-black dark:text-white">Trip History</h1>
      <TripHistory />
    </div>
  );
}
