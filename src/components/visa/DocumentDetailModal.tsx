'use client';

import { authClient } from '@/lib/auth-client';
import { Bell, Calendar, Clock, Download, FileText, X } from 'lucide-react';
import { useState } from 'react';

interface DocumentDetailModalProps {
  document: {
    _id: string;
    type: string;
    country: string;
    countryCode: string;
    documentNumber?: string;
    issueDate?: string;
    expiryDate: string;
    status: 'valid' | 'expiring' | 'expired';
    daysRemaining?: number;
    visaType?: string;
    maxStayDays?: number;
    cost?: number;
    currency?: string;
    attachments?: string[];
    notes?: string;
    reminders?: { days: number; sent: boolean }[];
    metadata?: {
      insuranceProvider?: string;
      vaccineType?: string;
      ticketType?: string;
      flightNumber?: string;
      departureCity?: string;
      arrivalCity?: string;
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function DocumentDetailModal({
  document,
  isOpen,
  onClose,
  onUpdate,
}: DocumentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(document?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !document) return null;

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

  const handleSetReminder = async (days: number) => {
    try {
      setSaving(true);
      
      // Get user session
      const session = await authClient.getSession();
      const userId = session.data?.user?.id || 'user-default-123';

      const response = await fetch(`/api/documents/${document._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          reminders: [
            ...(document.reminders || []),
            { days, sent: false },
          ],
        }),
      });

      if (response.ok) {
        onUpdate();
        alert(`Reminder set for ${days} days before expiry!`);
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      alert('Failed to set reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSaving(true);
      
      // Get user session
      const session = await authClient.getSession();
      const userId = session.data?.user?.id || 'user-default-123';

      const response = await fetch(`/api/documents/${document._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          notes: editedNotes,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      
      // Get user session
      const session = await authClient.getSession();
      const userId = session.data?.user?.id || 'user-default-123';

      const response = await fetch(`/api/documents/${document._id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      if (response.ok) {
        alert('✅ Document deleted successfully!');
        onClose();
        onUpdate();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('❌ Failed to delete document');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    // Generate simple text version for now
    const content = `
TRAVEL DOCUMENT
================

Type: ${document.type.toUpperCase()}
Country: ${document.country}
${document.documentNumber ? `Document #: ${document.documentNumber}` : ''}
${document.visaType ? `Visa Type: ${document.visaType}` : ''}

DATES
-----
${document.issueDate ? `Issued: ${new Date(document.issueDate).toLocaleDateString()}` : ''}
Expires: ${new Date(document.expiryDate).toLocaleDateString()}
Days Remaining: ${document.daysRemaining || 0} days
Status: ${document.status.toUpperCase()}

${document.maxStayDays ? `Maximum Stay: ${document.maxStayDays} days` : ''}
${document.cost ? `Cost: ${document.cost} ${document.currency || 'USD'}` : ''}

${document.notes ? `NOTES\n-----\n${document.notes}` : ''}

Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.country}-${document.type}-${document._id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{getTypeIcon(document.type)}</span>
              <div>
                <h2 className="text-2xl font-bold">{document.country}</h2>
                <p className="text-blue-100 mt-1">
                  {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
                  {document.visaType && ` • ${document.visaType}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Status Badge */}
          <div className="mb-6">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                document.status
              )}`}
            >
              {document.status.toUpperCase()}
            </span>
            {document.daysRemaining !== undefined && (
              <span
                className={`ml-3 text-lg font-semibold ${
                  document.daysRemaining < 7
                    ? 'text-red-600 dark:text-red-400'
                    : document.daysRemaining < 30
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-green-600 dark:text-green-400'
                }`}
              >
                {document.daysRemaining} days remaining
              </span>
            )}
          </div>

          {/* Document Details Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {document.documentNumber && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Document Number
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {document.documentNumber}
                </p>
              </div>
            )}

            {document.issueDate && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Issue Date
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {new Date(document.issueDate).toLocaleDateString()}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Expiry Date
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(document.expiryDate).toLocaleDateString()}
              </p>
            </div>

            {document.maxStayDays && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Maximum Stay
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {document.maxStayDays} days
                </p>
              </div>
            )}

            {document.cost && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cost</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {document.cost} {document.currency || 'USD'}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          {document.metadata && Object.keys(document.metadata).length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Additional Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(document.metadata).map(
                  ([key, value]) =>
                    value && (
                      <div key={key}>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (str) => str.toUpperCase())}
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {value}
                        </p>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* Reminders */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Set Reminder
            </h3>
            <div className="flex gap-2">
              {[30, 7, 1].map((days) => (
                <button
                  key={days}
                  onClick={() => handleSetReminder(days)}
                  disabled={
                    saving ||
                    document.reminders?.some((r) => r.days === days)
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    document.reminders?.some((r) => r.days === days)
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30'
                  }`}
                >
                  {days} day{days > 1 ? 's' : ''} before
                  {document.reminders?.some((r) => r.days === days) && ' ✓'}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditedNotes(document.notes || '');
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={saving}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Add notes about this document..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {document.notes || 'No notes added yet.'}
              </p>
            )}
          </div>

          {/* Attachments */}
          {document.attachments && document.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Attachments
              </h3>
              <div className="space-y-2">
                {document.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      Attachment {index + 1}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
