'use client';

import { useSession } from '@/lib/auth-client';
import {
  Briefcase,
  Calendar,
  Camera,
  Clock,
  Edit,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  Shield,
  X
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Profile() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    phone: '',
    bio: '',
    location: '',
    occupation: '',
    website: '',
  });
  const [stats, setStats] = useState({
    documents: 0,
    posts: 0,
    helpfulGiven: 0,
  });

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
      fetchUserStats();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserData({
          phone: data.user.phone || '',
          bio: data.user.bio || '',
          location: data.user.location || '',
          occupation: data.user.occupation || '',
          website: data.user.website || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setIsEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Please sign in to view your profile</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative">
          <button className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg hover:bg-opacity-30 transition-colors">
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 md:-mt-12">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white dark:border-gray-800 shadow-lg">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={128}
                      height={128}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(session.user.name || 'User')
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors shadow-lg">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Name & Title */}
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {session.user.name}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {userData.occupation || 'Traveler'}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(session.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  {userData.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{userData.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex gap-2 mt-4 md:mt-0">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.documents}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Documents</div>
            </div>
            <div className="text-center border-x border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.posts}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.helpfulGiven}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Helpful Given</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* About */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h2>
              {isEditing ? (
                <textarea
                  value={userData.bio}
                  onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {userData.bio || 'No bio added yet.'}
                </p>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{session.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={userData.phone}
                        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{userData.phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userData.location}
                        onChange={(e) => setUserData({ ...userData, location: e.target.value })}
                        placeholder="City, Country"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{userData.location || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
                    {isEditing ? (
                      <input
                        type="url"
                        value={userData.website}
                        onChange={(e) => setUserData({ ...userData, website: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{userData.website || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Occupation</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={userData.occupation}
                        onChange={(e) => setUserData({ ...userData, occupation: e.target.value })}
                        placeholder="Your occupation"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white">{userData.occupation || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Verified</span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                    {session.user.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Total Documents</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.documents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Community Posts</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{stats.posts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Member For</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.floor((new Date().getTime() - new Date(session.user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

