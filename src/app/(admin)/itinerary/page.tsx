"use client";

import { Modal } from '@/components/ui/modal';
import { Bus, Car, Edit2, MapPin, Plane, Plus, Ship, Train, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Stop {
  city: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  accommodation?: string;
  notes?: string;
  location?: { lat: number; lng: number };
}

interface TransportLeg {
  from: string;
  to: string;
  mode: 'flight' | 'train' | 'bus' | 'car' | 'boat' | 'other';
  date: string;
  cost?: number;
  duration?: number;
  confirmationNumber?: string;
  notes?: string;
}

interface Itinerary {
  _id: string;
  name: string;
  tripId?: string;
  stops: Stop[];
  transport: TransportLeg[];
  totalEstimatedCost: number;
  status: 'draft' | 'confirmed' | 'completed';
  createdAt: string;
}

export default function ItineraryPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    status: 'draft' as 'draft' | 'confirmed' | 'completed',
  });

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/itineraries', {
        headers: { 'x-user-id': 'user-default-123' },
      });

      if (res.ok) {
        const data = await res.json();
        setItineraries(data.itineraries || []);
      }
    } catch (error) {
      console.error('Error fetching itineraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-default-123',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setFormData({ name: '', status: 'draft' });
        fetchItineraries();
      }
    } catch (error) {
      console.error('Error creating itinerary:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;

    try {
      const res = await fetch(`/api/itineraries/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'user-default-123' },
      });

      if (res.ok) {
        fetchItineraries();
      }
    } catch (error) {
      console.error('Error deleting itinerary:', error);
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'flight': return <Plane className="w-4 h-4" />;
      case 'train': return <Train className="w-4 h-4" />;
      case 'bus': return <Bus className="w-4 h-4" />;
      case 'car': return <Car className="w-4 h-4" />;
      case 'boat': return <Ship className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Itineraries</h1>
          <p className="text-gray-600 dark:text-gray-400">Plan your routes and travel schedules</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', status: 'draft' });
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New Itinerary
        </button>
      </div>

      {/* Itineraries List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading itineraries...</p>
        </div>
      ) : itineraries.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No itineraries yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first travel route!</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg transition"
          >
            Create Itinerary
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {itineraries.map((itinerary) => (
            <div
              key={itinerary._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {itinerary.name}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(itinerary.status)}`}>
                    {itinerary.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // TODO: Implement edit functionality
                      alert('Edit functionality coming soon!');
                    }}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(itinerary._id)}
                    className="flex items-center gap-2 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-200 px-3 py-2 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stops */}
              {itinerary.stops.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Stops</h4>
                  <div className="space-y-2">
                    {itinerary.stops.map((stop, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <MapPin className="w-4 h-4 text-brand-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {stop.city}, {stop.country}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(stop.arrivalDate).toLocaleDateString()} - {new Date(stop.departureDate).toLocaleDateString()}
                          </div>
                          {stop.accommodation && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              🏨 {stop.accommodation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transport */}
              {itinerary.transport.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Transport</h4>
                  <div className="space-y-2">
                    {itinerary.transport.map((leg, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        {getTransportIcon(leg.mode)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {leg.from} → {leg.to}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(leg.date).toLocaleDateString()} • {leg.mode}
                            {leg.cost && ` • $${leg.cost}`}
                            {leg.duration && ` • ${Math.floor(leg.duration / 60)}h ${leg.duration % 60}m`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost Summary */}
              {itinerary.totalEstimatedCost > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Estimated Cost</span>
                    <span className="text-lg font-bold text-brand-600">
                      ${itinerary.totalEstimatedCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="max-w-md p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Create New Itinerary
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Itinerary Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Southeast Asia Route"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'confirmed' | 'completed' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
