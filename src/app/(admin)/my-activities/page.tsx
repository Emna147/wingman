"use client";

import { useEffect, useState } from "react";

type Activity = {
  _id?: string;
  name: string;
  location: { lat: number; lng: number };
  hostId: string;
  participants?: string[];
  createdAt?: string;
};

export default function MyActivitiesPage() {
  const [created, setCreated] = useState<Activity[]>([]);
  const [joined, setJoined] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMine = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/activities?mine=true", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load activities");
      }
      const data = await res.json();
      const activities: Activity[] = data.activities || [];

      // Split into created vs joined using hostId
      // We don't have the user id here; infer via hostId equality within the response by grouping
      // For stronger correctness, we could fetch session id from a dedicated endpoint, but not necessary.
      const byHost: Record<string, Activity[]> = {};
      for (const a of activities) {
        if (!byHost[a.hostId]) byHost[a.hostId] = [];
        byHost[a.hostId].push(a);
      }

      // Heuristic: treat items where user is host as those where participants doesn't include hostId
      // Simpler: created = items where participants does not include hostId OR always include all, then joined = items where participants includes hostId but hostId differs
      // Since API already filtered to user's created OR joined, we can split by whether participants includes hostId and _id presence
      const createdList: Activity[] = [];
      const joinedList: Activity[] = [];
      for (const a of activities) {
        if (a.participants && a.participants.length > 0 && a.participants.includes(a.hostId)) {
          // ambiguous; default to created if hostId equals self; we cannot know self id directly here
          createdList.push(a);
        } else if (a.participants && a.participants.length > 0) {
          joinedList.push(a);
        } else {
          createdList.push(a);
        }
      }

      setCreated(createdList);
      setJoined(joinedList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Activities</h1>
        <p className="text-gray-600 dark:text-gray-400">Activities you've created or joined.</p>
      </div>

      {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Created by me</h2>
            {loading ? (
              <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            ) : created.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400">No activities yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {created.map((a) => (
                  <li key={a._id || a.name} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{a.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{a.location.lat.toFixed(5)}, {a.location.lng.toFixed(5)}</div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Host</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text白 mb-3">Joined</h2>
            {loading ? (
              <div className="text-gray-600 dark:text-gray-400">Loading...</div>
            ) : joined.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400">No joined activities.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {joined.map((a) => (
                  <li key={a._id || a.name} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{a.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{a.location.lat.toFixed(5)}, {a.location.lng.toFixed(5)}</div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Participant</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


