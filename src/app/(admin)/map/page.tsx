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
  const [activities, setActivities] = useState<Array<{ _id?: string; name: string; location: { lat: number; lng: number } }>>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setError(null);
      const res = await fetch("/api/activities", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load activities");
      const data = await res.json();
      setActivities(data.activities ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const onLocationChange = () => {};

  const handleCreated = async () => {
    await fetchActivities();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Map</h1>
        <p className="text-gray-600 dark:text-gray-400">Interactive map powered by Leaflet.js</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          <MapComponent activities={activities} onLocationChange={onLocationChange} onActivityCreated={handleCreated} />
        </div>
      </div>
    </div>
  );
}
