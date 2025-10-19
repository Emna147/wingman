"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the Map component to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/map/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Map
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Interactive map powered by Leaflet.js
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <MapComponent />
        </div>
      </div>
    </div>
  );
}
