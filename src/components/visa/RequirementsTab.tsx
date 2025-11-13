'use client';

import { COUNTRIES, getVisaRequirement, searchCountries, type CountryInfo } from '@/lib/passport-data';
import { Check, MapPin, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import CountryDetailModal from './CountryDetailModal';

interface Filter {
  id: string;
  label: string;
  active: boolean;
}

export default function RequirementsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<CountryInfo[]>(COUNTRIES);
  const [compareCountries, setCompareCountries] = useState<CountryInfo[]>([]);
  const [myPassport, setMyPassport] = useState<string>('TN'); // Default to Tunisia
  const [showPassportSelector, setShowPassportSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'from-my-location'>('all');
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  
  const [filters, setFilters] = useState<Filter[]>([
    { id: 'visa-free', label: 'Visa Free', active: false },
    { id: 'low-cost', label: 'Under $50', active: false },
    { id: 'e-visa', label: 'E-Visa Available', active: false },
    { id: 'high-access', label: '150+ Countries', active: false },
  ]);

  // Debounce search with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter countries based on search and filters
  useEffect(() => {
    let results = COUNTRIES;

    // Apply view mode filter
    if (viewMode === 'from-my-location') {
      results = results.filter(country => {
        const requirement = getVisaRequirement(myPassport, country.code);
        return requirement !== null;
      });
    }

    // Apply search
    if (debouncedQuery) {
      results = searchCountries(debouncedQuery);
    }

    // Apply filters
    const activeFilters = filters.filter(f => f.active);
    
    if (activeFilters.length > 0) {
      results = results.filter(country => {
        // Use OR logic - country must match at least one active filter
        return activeFilters.some(filter => {
          switch (filter.id) {
            case 'visa-free':
              if (viewMode === 'from-my-location') {
                const req = getVisaRequirement(myPassport, country.code);
                return req?.requirement === 'visa free';
              }
              return country.visaFreeCount > 100;
            case 'low-cost':
              // For now, return false as we don't have cost data yet
              return false;
            case 'e-visa':
              if (viewMode === 'from-my-location') {
                const req = getVisaRequirement(myPassport, country.code);
                return req?.requirement === 'e-visa';
              }
              return country.eVisaCount > 10;
            case 'high-access':
              return country.visaFreeCount >= 150;
            default:
              return false;
          }
        });
      });
    }

    setFilteredCountries(results);
  }, [debouncedQuery, filters, viewMode, myPassport]);

  const toggleFilter = (filterId: string) => {
    setFilters(prev =>
      prev.map(f => (f.id === filterId ? { ...f, active: !f.active } : f))
    );
  };

  const toggleCompare = (country: CountryInfo) => {
    setCompareCountries(prev => {
      const exists = prev.find(c => c.code === country.code);
      if (exists) {
        return prev.filter(c => c.code !== country.code);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 countries at a time');
        return prev;
      }
      return [...prev, country];
    });
  };

  const getAccessLevel = (visaFreeCount: number) => {
    if (visaFreeCount >= 180) return { label: 'Excellent', color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20' };
    if (visaFreeCount >= 150) return { label: 'Very Good', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20' };
    if (visaFreeCount >= 100) return { label: 'Good', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20' };
    return { label: 'Limited', color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20' };
  };

  return (
    <div className="space-y-6">
      {/* Passport Selector & View Mode */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <button
            onClick={() => setShowPassportSelector(!showPassportSelector)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-white font-medium">
                My Passport: {COUNTRIES.find(c => c.code === myPassport)?.name || 'Tunisia'}
              </span>
            </div>
            <X className={`w-5 h-5 text-gray-400 transition-transform ${showPassportSelector ? 'rotate-45' : ''}`} />
          </button>

          {/* Passport Dropdown */}
          {showPassportSelector && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {COUNTRIES.map(country => (
                <button
                  key={country.code}
                  onClick={() => {
                    setMyPassport(country.code);
                    setShowPassportSelector(false);
                    if (viewMode === 'from-my-location') {
                      // Reset to all view when changing passport
                      setViewMode('all');
                    }
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <span className="text-2xl">{country.code === 'TN' ? '🇹🇳' : '🌍'}</span>
                  <span className="text-gray-900 dark:text-white">{country.name}</span>
                  {country.code === myPassport && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <button
          onClick={() => setViewMode(viewMode === 'all' ? 'from-my-location' : 'all')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            viewMode === 'from-my-location'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-blue-500'
          }`}
        >
          {viewMode === 'from-my-location' ? 'Showing My Requirements' : 'Show My Requirements'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a country..."
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => toggleFilter(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter.active
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {filter.active && <Check className="w-4 h-4 inline mr-1" />}
            {filter.label}
          </button>
        ))}
      </div>

      {/* Compare Bar */}
      {compareCountries.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Comparing:
              </span>
              {compareCountries.map((country) => (
                <span
                  key={country.code}
                  className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm flex items-center gap-2"
                >
                  {country.name}
                  <button
                    onClick={() => toggleCompare(country)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={() => setCompareCountries([])}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'} found
      </div>

      {/* Country Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCountries.map((country) => {
          const accessLevel = getAccessLevel(country.visaFreeCount);
          const isComparing = compareCountries.some(c => c.code === country.code);

          return (
            <div
              key={country.code}
              onClick={() => setSelectedCountry(country)}
              className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
                isComparing
                  ? 'border-blue-600 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{country.code === 'TN' ? '🇹🇳' : country.code === 'US' ? '🇺🇸' : country.code === 'FR' ? '🇫🇷' : country.code === 'GB' ? '🇬🇧' : country.code === 'DE' ? '🇩🇪' : country.code === 'JP' ? '🇯🇵' : country.code === 'TH' ? '🇹🇭' : country.code === 'VN' ? '🇻🇳' : country.code === 'IN' ? '🇮🇳' : country.code === 'CN' ? '🇨🇳' : country.code === 'BR' ? '🇧🇷' : country.code === 'MX' ? '🇲🇽' : country.code === 'CA' ? '🇨🇦' : country.code === 'AU' ? '🇦🇺' : country.code === 'NZ' ? '🇳🇿' : country.code === 'ES' ? '🇪🇸' : country.code === 'IT' ? '🇮🇹' : country.code === 'PT' ? '🇵🇹' : country.code === 'AE' ? '🇦🇪' : country.code === 'SG' ? '🇸🇬' : '🌍'}</div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {country.name}
                      </h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${accessLevel.color}`}>
                        {accessLevel.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompare(country);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isComparing
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>

                {/* Stats */}
                <div className="space-y-3">
                  {viewMode === 'from-my-location' ? (
                    // Show visa requirement when in "from my location" mode
                    <>
                      {(() => {
                        const requirement = getVisaRequirement(myPassport, country.code);
                        if (!requirement) return null;

                        const requirementColors = {
                          'visa free': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
                          'visa on arrival': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
                          'e-visa': 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
                          'visa required': 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
                          'covid ban': 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
                          'no admission': 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
                        };

                        return (
                          <>
                            <div className={`p-3 rounded-lg ${requirementColors[requirement.requirement]}`}>
                              <div className="text-sm font-medium uppercase tracking-wide mb-1">
                                {requirement.requirement}
                              </div>
                              {requirement.duration && (
                                <div className="text-2xl font-bold">
                                  {requirement.duration} days
                                </div>
                              )}
                            </div>
                            {requirement.notes && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                <div className="font-medium mb-1">Important:</div>
                                {requirement.notes}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    // Show standard stats in normal mode
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Visa Free</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {country.visaFreeCount} countries
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Visa on Arrival</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {country.visaOnArrivalCount} countries
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">E-Visa</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {country.eVisaCount} countries
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Total Access */}
                {viewMode === 'all' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Access
                      </span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {country.visaFreeCount + country.visaOnArrivalCount + country.eVisaCount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCountries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 dark:text-gray-400">
            No countries found matching your criteria
          </p>
        </div>
      )}

      {/* Country Detail Modal */}
      <CountryDetailModal
        country={selectedCountry}
        myPassport={myPassport}
        onClose={() => setSelectedCountry(null)}
      />
    </div>
  );
}
