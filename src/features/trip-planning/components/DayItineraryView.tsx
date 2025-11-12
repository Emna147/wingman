import React, { useState, useEffect } from 'react';
import { DayItinerary, Activity } from '../types';
import { DayTimeSlot } from './DayTimeSlot';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ActivitySuggestion } from '@/app/api/activities/suggestions/route';

interface DayItineraryViewProps {
  day: DayItinerary;
  onUpdateDay: (updatedDay: DayItinerary) => void;
  destination?: string;
  travelStyle?: string;
}

export const DayItineraryView: React.FC<DayItineraryViewProps> = ({
  day,
  onUpdateDay,
  destination,
  travelStyle,
}) => {
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    cost: 0,
  });

  const getMorningActivities = () => day.activities.filter(a => a.time === 'morning');
  const getAfternoonActivities = () => day.activities.filter(a => a.time === 'afternoon');
  const getEveningActivities = () => day.activities.filter(a => a.time === 'evening');

  const handleAddActivity = (activity: Activity) => {
    const updatedDay = {
      ...day,
      activities: [...day.activities, activity],
      totalCost: day.totalCost + (activity.cost || 0),
    };
    onUpdateDay(updatedDay);
    setShowAddActivity(false);
    setNewActivity({ title: '', cost: 0 });
  };

  const handleRemoveActivity = (activityId: string) => {
    const activity = day.activities.find(a => a.id === activityId);
    if (!activity) return;

    const updatedDay = {
      ...day,
      activities: day.activities.filter(a => a.id !== activityId),
      totalCost: day.totalCost - (activity.cost || 0),
    };
    onUpdateDay(updatedDay);
  };

  const fetchSuggestions = async () => {
    if (!destination) {
      alert('Destination is required to get activity suggestions');
      return;
    }

    setLoadingSuggestions(true);
    setShowSuggestions(true);

    try {
      const response = await fetch('/api/activities/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination,
          travelStyle,
          date: day.date.toISOString().split('T')[0],
        }),
      });

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddSuggestion = (suggestion: ActivitySuggestion) => {
    const activity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      title: suggestion.title,
      description: suggestion.description,
      cost: suggestion.cost,
      time: suggestion.time,
      addedBy: 'current-user',
      addedAt: new Date(),
    };
    handleAddActivity(activity);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {day.date.toLocaleDateString()}
          </h3>
          <div className="flex gap-2">
            {destination && (
              <button
                onClick={fetchSuggestions}
                disabled={loadingSuggestions}
                className="rounded bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {loadingSuggestions ? 'Loading...' : 'Get Suggestions'}
              </button>
            )}
            <button
              onClick={() => setShowAddActivity(true)}
              className="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
            >
              Add Activity
            </button>
          </div>
        </div>

        {/* Activity Suggestions */}
        {showSuggestions && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Activity Suggestions
              </h4>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            {loadingSuggestions ? (
              <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                Loading suggestions...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                No suggestions available
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h5 className="font-medium text-gray-800 dark:text-white/90">
                            {suggestion.title}
                          </h5>
                          <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {suggestion.category}
                          </span>
                        </div>
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>${suggestion.cost}</span>
                          {suggestion.duration && <span>• {suggestion.duration}</span>}
                          <span className="capitalize">• {suggestion.time}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddSuggestion(suggestion)}
                        className="ml-2 rounded bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-opacity-90"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showAddActivity && (
          <div className="mb-4 space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <input
              type="text"
              value={newActivity.title}
              onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
              placeholder="Activity title"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-5 py-3 text-sm text-gray-800 dark:text-white/90 placeholder-gray-400 dark:placeholder:text-white/30 focus:outline-hidden focus:border-brand-300 dark:focus:border-brand-800 focus:ring-3 focus:ring-brand-500/10 shadow-theme-xs"
            />
            <input
              type="number"
              value={newActivity.cost || ''}
              onChange={(e) => setNewActivity({ ...newActivity, cost: Number(e.target.value) })}
              placeholder="Cost (optional)"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-5 py-3 text-sm text-gray-800 dark:text-white/90 placeholder-gray-400 dark:placeholder:text-white/30 focus:outline-hidden focus:border-brand-300 dark:focus:border-brand-800 focus:ring-3 focus:ring-brand-500/10 shadow-theme-xs"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddActivity(false)}
                className="rounded px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newActivity.title) {
                    handleAddActivity({
                      id: Math.random().toString(36).substr(2, 9),
                      ...newActivity,
                      time: 'morning',
                      addedBy: 'current-user',
                      addedAt: new Date(),
                    });
                  }
                }}
                disabled={!newActivity.title}
                className="rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DayTimeSlot
            time="morning"
            activities={getMorningActivities()}
            date={day.date}
            onAddActivity={handleAddActivity}
            onRemoveActivity={handleRemoveActivity}
          />
          <DayTimeSlot
            time="afternoon"
            activities={getAfternoonActivities()}
            date={day.date}
            onAddActivity={handleAddActivity}
            onRemoveActivity={handleRemoveActivity}
          />
          <DayTimeSlot
            time="evening"
            activities={getEveningActivities()}
            date={day.date}
            onAddActivity={handleAddActivity}
            onRemoveActivity={handleRemoveActivity}
          />
        </div>

        {day.notes && (
          <div className="mt-4">
            <h4 className="mb-2 font-medium text-gray-800 dark:text-white/90">Notes</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{day.notes}</p>
          </div>
        )}

        <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
          <span className="font-medium text-gray-800 dark:text-white/90">Daily Total</span>
          <span className="font-medium text-brand-500">${day.totalCost}</span>
        </div>
      </div>
    </DndProvider>
  );
};