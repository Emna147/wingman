'use client';

import AddDocumentModal from '@/components/visa/AddDocumentModal';
import CommunityTab from '@/components/visa/CommunityTab';
import DocumentDetailModal from '@/components/visa/DocumentDetailModal';
import RequirementsTab from '@/components/visa/RequirementsTab';
import { authClient } from '@/lib/auth-client';
import { AlertTriangle, FileText, Globe, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VisaDocument {
  _id: string;
  type: string;
  country: string;
  countryCode: string;
  documentNumber?: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
  daysRemaining?: number;
  visaType?: string;
  maxStayDays?: number;
  cost?: number;
  currency?: string;
}

interface DocumentStats {
  total: number;
  needingAttention: number;
  expired: number;
  expiring: number;
  valid: number;
}

export default function VisaManagerPage() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'requirements' | 'community'
  >('dashboard');
  const [documents, setDocuments] = useState<VisaDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    needingAttention: 0,
    expired: 0,
    expiring: 0,
    valid: 0,
  });
  const [currentLocation, setCurrentLocation] = useState<{
    country: string;
    daysRemaining: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VisaDocument | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [manualLocation, setManualLocation] = useState('');

  useEffect(() => {
    // Get user session for future use
    authClient.getSession();
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setRefreshing(true);
      const res = await authClient.getSession();
      const userId = res.data?.user?.id || 'user-default-123';

      const response = await fetch('/api/documents', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        setStats(data.stats);

        // Find current location (most recent active visa)
        const activeVisas = data.documents.filter(
          (doc: VisaDocument) =>
            doc.type === 'visa' && doc.status === 'valid' && doc.daysRemaining! > 0
        );

        if (activeVisas.length > 0) {
          const newest = activeVisas.reduce((prev: VisaDocument, curr: VisaDocument) =>
            new Date(curr.expiryDate) > new Date(prev.expiryDate) ? curr : prev
          );
          setCurrentLocation({
            country: newest.country,
            daysRemaining: newest.daysRemaining || 0,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'expiring':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'passport':
        return '🛂';
      case 'visa':
        return '📋';
      case 'insurance':
        return '🏥';
      case 'vaccination':
        return '💉';
      case 'ticket':
        return '✈️';
      default:
        return '📄';
    }
  };

  const handleDocumentClick = (document: VisaDocument) => {
    setSelectedDocument(document);
    setShowDetailModal(true);
  };

  const handleAlertClick = () => {
    // Find first expiring document and open it
    const expiringDoc = documents.find((doc) => doc.status === 'expiring');
    if (expiringDoc) {
      handleDocumentClick(expiringDoc);
    }
  };

  const handleAddDocument = () => {
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowDetailModal(false);
    setSelectedDocument(null);
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
  };

  const handleDocumentUpdate = async () => {
    // Refresh the documents list
    await fetchDocuments();
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert('❌ Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get country
          // Using BigDataCloud's free API (no key required)
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const country = data.countryName || 'Unknown';
            
            setCurrentLocation({
              country,
              daysRemaining: 0, // Will be updated when visa is added
            });
            
            alert(`📍 Location detected: ${country}\n\nAdd a visa for this country to track your stay!`);
          } else {
            throw new Error('Failed to get location details');
          }
        } catch (error) {
          console.error('Error getting location:', error);
          alert('❌ Failed to get location details. Please add your location manually.');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setDetectingLocation(false);
        
        let message = '❌ Unable to detect location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += 'Please enable location permissions in your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            message += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message += 'Location request timed out.';
            break;
          default:
            message += 'An unknown error occurred.';
        }
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSetManualLocation = () => {
    if (manualLocation.trim()) {
      setCurrentLocation({
        country: manualLocation.trim(),
        daysRemaining: 0,
      });
      setShowLocationInput(false);
      setManualLocation('');
      alert(`📍 Location set to: ${manualLocation}\n\nAdd a visa for this country to track your stay!`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Page Header */}
      <div className="col-span-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Visa Manager
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Track your travel documents and visa status
            </p>
          </div>
          <button
            onClick={handleAddDocument}
            className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Document
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'requirements'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Requirements
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'community'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Community
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Alert Banner */}
          {stats.expiring > 0 && (
            <div className="col-span-12">
              <div 
                onClick={handleAlertClick}
                className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                      {stats.expiring === 1
                        ? 'Document expiring soon!'
                        : `${stats.expiring} documents expiring soon!`}
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      {documents
                        .filter((doc) => doc.status === 'expiring')
                        .map((doc) => `${doc.country} ${doc.type}`)
                        .join(', ')}{' '}
                      - Click to view details
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="col-span-12 md:col-span-6">
              {/* Current Location */}
              <div className="bg-blue-500 text-white rounded-xl p-6 shadow-lg h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-blue-100 text-sm font-medium mb-1">
                      Current Location
                    </p>
                    <h2 className="text-3xl font-bold">
                      {currentLocation?.country || 'Not Set'}
                    </h2>
                    {currentLocation && currentLocation.daysRemaining > 0 && (
                      <p className="text-blue-100 mt-2">
                        {currentLocation.daysRemaining} days remaining
                      </p>
                    )}
                  </div>
                  <Globe className="w-16 h-16 text-blue-300" />
                </div>
                {!currentLocation && !showLocationInput && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleShareLocation}
                      disabled={detectingLocation}
                      className="flex-1 mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {detectingLocation ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Detecting...
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4" />
                          Auto-Detect
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowLocationInput(true)}
                      className="flex-1 mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                    >
                      Set Manually
                    </button>
                  </div>
                )}
                {!currentLocation && showLocationInput && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={manualLocation}
                      onChange={(e) => setManualLocation(e.target.value)}
                      placeholder="Enter country name..."
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSetManualLocation();
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSetManualLocation}
                        disabled={!manualLocation.trim()}
                        className="flex-1 px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Set Location
                      </button>
                      <button
                        onClick={() => {
                          setShowLocationInput(false);
                          setManualLocation('');
                        }}
                        className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {currentLocation && (
                  <button
                    onClick={() => {
                      setCurrentLocation(null);
                      setShowLocationInput(false);
                      setManualLocation('');
                    }}
                    className="w-full mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    Change Location
                  </button>
                )}
              </div>

          </div>
          <div className="col-span-12 md:col-span-6">
              {/* Documents */}
              <div className="bg-purple-500 text-white rounded-xl p-6 shadow-lg h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium mb-1">
                      Documents
                    </p>
                    <h2 className="text-3xl font-bold">{stats.total}</h2>
                    {stats.needingAttention > 0 && (
                      <p className="text-purple-100 mt-2">
                        {stats.needingAttention} need attention
                      </p>
                    )}
                  </div>
                  <FileText className="w-16 h-16 text-purple-300" />
                </div>
              </div>
          </div>

            {/* Active Documents */}
            <div className="col-span-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Active Documents
                </h3>
                {refreshing && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Updating...</span>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {documents.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No documents yet. Add your first document to get started.
                    </p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc._id}
                      onClick={() => handleDocumentClick(doc)}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-3xl">{getTypeIcon(doc.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {doc.country}
                              </h4>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  doc.status
                                )}`}
                              >
                                {doc.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                              {doc.visaType && ` • ${doc.visaType}`}
                              {doc.documentNumber && ` • #${doc.documentNumber}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Expires:{' '}
                            {new Date(doc.expiryDate).toLocaleDateString()}
                          </p>
                          {doc.daysRemaining !== undefined && (
                            <p
                              className={`text-sm font-medium mt-1 ${
                                doc.daysRemaining < 7
                                  ? 'text-red-600 dark:text-red-400'
                                  : doc.daysRemaining < 30
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-green-600 dark:text-green-400'
                              }`}
                            >
                              {doc.daysRemaining} days remaining
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            </div>
          </>
        )}

        {activeTab === 'requirements' && (
          <div className="col-span-12">
            <RequirementsTab />
          </div>
        )}

        {activeTab === 'community' && (
          <div className="col-span-12">
            <CommunityTab />
          </div>
        )}

      {/* Modals */}
      <DocumentDetailModal
        document={selectedDocument}
        isOpen={showDetailModal}
        onClose={handleModalClose}
        onUpdate={handleDocumentUpdate}
      />

      <AddDocumentModal
        isOpen={showAddModal}
        onClose={handleAddModalClose}
        onSuccess={handleDocumentUpdate}
      />
    </div>
  );
}
