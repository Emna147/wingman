"use client";

import { Modal } from '@/components/ui/modal';
import { Calendar, DollarSign, Edit2, Globe, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Trip {
  _id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetEstimate?: number;
  collaboratorIds: string[];
  status: 'planning' | 'active' | 'completed';
  visibility: 'private' | 'friends' | 'public';
  createdAt: string;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budgetEstimate: '',
    visibility: 'private' as 'private' | 'friends' | 'public',
    status: 'planning' as 'planning' | 'active' | 'completed',
  });

  useEffect(() => {
    fetchTrips();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? '/api/trips' 
        : `/api/trips?status=${statusFilter}`;
      
      const res = await fetch(url, {
        headers: { 'x-user-id': 'user-default-123' },
      });
      
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips || []);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingTrip ? 'PUT' : 'POST';
      const url = editingTrip ? `/api/trips/${editingTrip._id}` : '/api/trips';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-default-123',
        },
        body: JSON.stringify({
          ...formData,
          budgetEstimate: formData.budgetEstimate ? parseFloat(formData.budgetEstimate) : 0,
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setEditingTrip(null);
        setFormData({
          destination: '',
          startDate: '',
          endDate: '',
          budgetEstimate: '',
          visibility: 'private',
          status: 'planning',
        });
        fetchTrips();
      }
    } catch (error) {
      console.error('Error saving trip:', error);
    }
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'user-default-123' },
      });

      if (res.ok) {
        fetchTrips();
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      destination: trip.destination,
      startDate: trip.startDate.split('T')[0],
      endDate: trip.endDate.split('T')[0],
      budgetEstimate: trip.budgetEstimate?.toString() || '',
      visibility: trip.visibility,
      status: trip.status,
    });
    setIsCreateModalOpen(true);
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Trips</h1>
          <p className="text-gray-600 dark:text-gray-400">Plan and manage your travel journeys</p>
        </div>
        <button
          onClick={() => {
            setEditingTrip(null);
            setFormData({
              destination: '',
              startDate: '',
              endDate: '',
              budgetEstimate: '',
              visibility: 'private',
              status: 'planning',
            });
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New Trip
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {['all', 'planning', 'active', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize transition ${
              statusFilter === status
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trips...</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No trips yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Start planning your next adventure!</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg transition"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {trip.destination}
                  </h3>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{getDuration(trip.startDate, trip.endDate)} days</span>
                </div>
                {trip.budgetEstimate && trip.budgetEstimate > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span>${trip.budgetEstimate.toLocaleString()} budget</span>
                  </div>
                )}
                {trip.collaboratorIds.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{trip.collaboratorIds.length} collaborator{trip.collaboratorIds.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleEdit(trip)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded transition"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(trip._id)}
                  className="flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-200 px-3 py-2 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTrip(null);
        }}
        className="max-w-2xl p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {editingTrip ? 'Edit Trip' : 'Create New Trip'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Destination *
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              required
              placeholder="e.g., Bali, Indonesia"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget Estimate (USD)
            </label>
            <input
              type="number"
              value={formData.budgetEstimate}
              onChange={(e) => setFormData({ ...formData, budgetEstimate: e.target.value })}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'planning' | 'active' | 'completed' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'private' | 'friends' | 'public' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="private">Private</option>
                <option value="friends">Friends</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingTrip(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition"
            >
              {editingTrip ? 'Update Trip' : 'Create Trip'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
