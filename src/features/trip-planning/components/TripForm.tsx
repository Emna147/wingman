import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { TravelStyle } from '../types';
import DatePicker from '@/components/form/date-picker';
import Label from '@/components/form/Label';

// Fix for CalendarIcon
const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

interface TripFormData {
  destination: string;
  startDate: Date;
  endDate: Date;
  travelStyle: TravelStyle;
  accommodation?: string;
  transport?: string;
  dailyBudget?: number;
}

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  isLoading?: boolean;
}

interface LocationSuggestion {
  name: string;
  country: string;
  displayName: string;
}

export const TripForm: React.FC<TripFormProps> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TripFormData>();
  const [destinationQuery, setDestinationQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch location suggestions
  useEffect(() => {
    if (destinationQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce API calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/locations/search?q=${encodeURIComponent(destinationQuery)}`);
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(data.suggestions?.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [destinationQuery]);

  // Handle input change
  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestinationQuery(value);
    setValue('destination', value, { shouldValidate: false });
    setShowSuggestions(true);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setValue('destination', suggestion.displayName);
    setDestinationQuery(suggestion.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="relative">
        <Label htmlFor="destination">Destination *</Label>
        <input
          id="destination"
          ref={(e) => {
            inputRef.current = e;
            register('destination', { required: 'Destination is required' }).ref(e);
          }}
          type="text"
          value={destinationQuery}
          onChange={handleDestinationChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-5 py-3 text-sm text-gray-800 dark:text-white/90 placeholder-gray-400 dark:placeholder:text-white/30 focus:outline-hidden focus:border-brand-300 dark:focus:border-brand-800 focus:ring-3 focus:ring-brand-500/10 shadow-theme-xs"
          placeholder="e.g. Bali, Indonesia"
          autoComplete="off"
        />
        {errors.destination && (
          <p className="mt-1 text-sm text-danger">{errors.destination.message}</p>
        )}
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.displayName}-${index}`}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  index === selectedIndex
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'bg-white dark:bg-gray-900'
                } text-gray-800 dark:text-white/90 border-b border-gray-200 dark:border-gray-700 last:border-b-0`}
              >
                <div className="font-medium">{suggestion.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{suggestion.country}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date *</Label>
          <div className="mt-2">
        <DatePicker
              id="startDate"
              mode="single"
              onChange={(selectedDates) => {
                const date = selectedDates[0];
                if (date) {
                  const event = {
                    target: {
                      name: 'startDate',
                      value: date
                    }
                  };
                  register('startDate', { required: 'Start date is required' }).onChange(event);
                }
              }}
            />
          </div>
          {errors.startDate && (
            <p className="mt-1 text-sm text-danger">{errors.startDate.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="endDate">End Date *</Label>
          <div className="mt-2">
        <DatePicker
              id="endDate"
              mode="single"
              onChange={(selectedDates) => {
                const date = selectedDates[0];
                if (date) {
                  const event = {
                    target: {
                      name: 'endDate',
                      value: date
                    }
                  };
                  register('endDate', { required: 'End date is required' }).onChange(event);
                }
              }}
            />
          </div>
          {errors.endDate && (
            <p className="mt-1 text-sm text-danger">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="travelStyle">Travel Style *</Label>
        <select
          id="travelStyle"
          {...register('travelStyle', { required: 'Travel style is required' })}
          className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-5 py-3 text-sm text-gray-800 dark:text-white/90 focus:outline-hidden focus:border-brand-300 dark:focus:border-brand-800 focus:ring-3 focus:ring-brand-500/10 shadow-theme-xs appearance-none"
        >
          <option value="" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90">Select travel style</option>
          <option value="Backpacker" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90">Backpacker</option>
          <option value="Digital Nomad" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90">Digital Nomad</option>
          <option value="Comfortable" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90">Comfortable</option>
          <option value="Premium" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90">Premium</option>
        </select>
        {errors.travelStyle && (
          <p className="mt-1 text-sm text-danger">{errors.travelStyle.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="accommodation">Accommodation (Optional)</Label>
        <input
          id="accommodation"
          type="text"
          {...register('accommodation')}
          className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-5 py-3 text-sm text-gray-800 dark:text-white/90 placeholder-gray-400 dark:placeholder:text-white/30 focus:outline-hidden focus:border-brand-300 dark:focus:border-brand-800 focus:ring-3 focus:ring-brand-500/10 shadow-theme-xs"
          placeholder="e.g. Hotel preferences, areas"
        />
      </div>

      <div>
        <Label htmlFor="transport">Transport (Optional)</Label>
        <input
          id="transport"
          type="text"
          {...register('transport')}
          className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-5 py-3 text-sm text-gray-800 dark:text-white/90 placeholder-gray-400 dark:placeholder:text-white/30 focus:outline-hidden focus:border-brand-300 dark:focus:border-brand-800 focus:ring-3 focus:ring-brand-500/10 shadow-theme-xs"
          placeholder="e.g. Flight, car rental"
        />
      </div>

      <div>
        <Label htmlFor="dailyBudget">Daily Budget (Optional)</Label>
        <input
          id="dailyBudget"
          type="number"
          {...register('dailyBudget')}
          className="mt-2 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 px-5 py-3 text-sm text-gray-800 dark:text-white/90 placeholder-gray-400 dark:placeholder:text-white/30 focus:outline-hidden focus:border-brand-300 dark:focus:border-brand-800 focus:ring-3 focus:ring-brand-500/10 shadow-theme-xs"
          placeholder="Enter amount in USD"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full justify-center rounded bg-brand-500 dark:bg-brand-500 px-6 py-3 font-medium text-white hover:shadow-1 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-brand-500/80"
      >
        {isLoading ? 'Creating Trip...' : 'Create Trip'}
      </button>
    </form>
  );
};