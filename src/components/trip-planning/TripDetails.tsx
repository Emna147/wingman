'use client';

import { useState } from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';
import { format } from 'date-fns';

interface TripDetailsProps {
  trip: {
    _id: string;
    title: string;
    description?: string;
    destination: {
      name: string;
      country: string;
    };
    startDate: string;
    endDate: string;
    travelStyle?: 'Backpacker' | 'Budget' | 'Comfort' | 'Luxury';
    status?: 'planning' | 'active' | 'completed';
    budget?: {
      accommodation: { amount: number };
      food: { amount: number };
      transport: { amount: number };
      activities: { amount: number };
      total: number;
      currency: string;
    };
    itinerary: Array<{
      day: number;
      time: string;
      activity: string;
      location?: { name: string };
      duration: number;
      notes?: string;
      cost?: number;
    }>;
  };
}

export function TripDetails({ trip }: TripDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  console.log('Trip data received:', trip);

  const getStatusBadgeProps = (status?: string): { color: "warning" | "success" | "info" | "light"; variant: "light" | "solid" } => {
    switch (status) {
      case 'planning':
        return { color: "warning", variant: "light" };
      case 'active':
        return { color: "success", variant: "light" };
      case 'completed':
        return { color: "info", variant: "light" };
      default:
        return { color: "light", variant: "light" };
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <ComponentCard
      title={trip.title}
      desc={`${trip.destination.name}, ${trip.destination.country}`}
      className="mb-4"
    >
      <div className="relative">
        <div className="absolute right-0 top-[-48px] flex items-center gap-2">
          {trip.status && (
            <Badge {...getStatusBadgeProps(trip.status)}>
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="transition-transform"
            startIcon={
              <span
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              >
                ▼
              </span>
            }
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>

        {isExpanded && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h4 className="font-semibold mb-2">Trip Details</h4>
                <p><span className="font-medium">Dates:</span> {formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
                {trip.travelStyle && (
                  <p><span className="font-medium">Style:</span> {trip.travelStyle}</p>
                )}
                {trip.description && (
                  <p className="mt-2">{trip.description}</p>
                )}
              </div>

              {trip.budget && (
                <div>
                  <h4 className="font-semibold mb-2">Budget Breakdown</h4>
                  <ul className="space-y-1">
                    <li>Accommodation: {formatCurrency(trip.budget.accommodation.amount, trip.budget.currency)}</li>
                    <li>Food: {formatCurrency(trip.budget.food.amount, trip.budget.currency)}</li>
                    <li>Transport: {formatCurrency(trip.budget.transport.amount, trip.budget.currency)}</li>
                    <li>Activities: {formatCurrency(trip.budget.activities.amount, trip.budget.currency)}</li>
                    <li className="font-semibold mt-2">
                      Total: {formatCurrency(trip.budget.total, trip.budget.currency)}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {trip.itinerary && trip.itinerary.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Itinerary</h4>
                <div className="space-y-3">
                  {trip.itinerary.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Day {item.day} - {item.time}</p>
                          <p>{item.activity}</p>
                          {item.location && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">📍 {item.location.name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{item.duration} mins</p>
                          {item.cost && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(item.cost, trip.budget?.currency || 'USD')}
                            </p>
                          )}
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              {trip.status === 'planning' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/trips', {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          tripId: trip._id,
                          status: 'active'
                        })
                      });

                      if (!response.ok) {
                        throw new Error('Failed to update trip status');
                      }

                      // Refresh the page to show updated status
                      window.location.reload();
                    } catch (error) {
                      console.error('Error updating trip:', error);
                      alert('Failed to update trip status');
                    }
                  }}
                >
                  Make Active
                </Button>
              )}
              {trip.status === 'active' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/trips', {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          tripId: trip._id,
                          status: 'completed'
                        })
                      });

                      if (!response.ok) {
                        throw new Error('Failed to update trip status');
                      }

                      window.location.reload();
                    } catch (error) {
                      console.error('Error updating trip:', error);
                      alert('Failed to update trip status');
                    }
                  }}
                >
                  Complete Trip
                </Button>
              )}
              <Button 
                variant="outline"
                size="sm"
                onClick={async () => {
                  // Show confirmation dialog
                  if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
                    return;
                  }

                  try {
                    const response = await fetch(`/api/trips?tripId=${trip._id}`, {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                      }
                    });

                    if (!response.ok) {
                      throw new Error('Failed to delete trip');
                    }

                    // Refresh the page after successful deletion
                    window.location.reload();
                  } catch (error) {
                    console.error('Error deleting trip:', error);
                    alert('Failed to delete trip');
                  }
                }}
                className="text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10"
              >
                Delete Trip
              </Button>
            </div>
          </>
        )}
      </div>
    </ComponentCard>
  );
}