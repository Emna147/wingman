'use client';

import { authClient } from '@/lib/auth-client';
import { Loader2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport', icon: '🛂' },
  { value: 'visa', label: 'Visa', icon: '📋' },
  { value: 'insurance', label: 'Travel Insurance', icon: '🏥' },
  { value: 'vaccination', label: 'Vaccination Record', icon: '💉' },
  { value: 'ticket', label: 'Flight/Train Ticket', icon: '✈️' },
  { value: 'other', label: 'Other Document', icon: '📄' },
];

const VISA_TYPES = [
  'Tourist',
  'Business',
  'Working Holiday',
  'Student',
  'Transit',
  'E-Visa',
  'Visa on Arrival',
  'Other',
];

export default function AddDocumentModal({
  isOpen,
  onClose,
  onSuccess,
}: AddDocumentModalProps) {
  const [formData, setFormData] = useState({
    type: 'visa',
    country: '',
    countryCode: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    visaType: '',
    maxStayDays: '',
    cost: '',
    currency: 'USD',
    notes: '',
  });

  const [metadata, setMetadata] = useState({
    insuranceProvider: '',
    vaccineType: '',
    ticketType: '',
    flightNumber: '',
    departureCity: '',
    arrivalCity: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedReminders, setSelectedReminders] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleReminder = (days: number) => {
    setSelectedReminders((prev) =>
      prev.includes(days) ? prev.filter((d) => d !== days) : [...prev, days]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    }

    if (formData.type === 'visa' && !formData.visaType) {
      newErrors.visaType = 'Visa type is required for visas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setUploading(true);

    try {
      // Get user session
      const session = await authClient.getSession();
      const userId = session.data?.user?.id || 'user-default-123';

      // For now, we'll just create the document without file upload
      // In production, you'd upload files to S3/Cloudinary first
      const documentData = {
        ...formData,
        countryCode: formData.countryCode || formData.country.substring(0, 2).toUpperCase(),
        maxStayDays: formData.maxStayDays ? parseInt(formData.maxStayDays) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        reminders: selectedReminders.length > 0 
          ? selectedReminders.map(days => ({ days, sent: false }))
          : undefined,
        metadata: Object.fromEntries(
          Object.entries(metadata).filter(([, value]) => value)
        ),
        // Placeholder for attachment URLs
        attachments: attachments.map((file) => file.name),
      };

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(documentData),
      });

      if (response.ok) {
        await response.json(); // Parse response
        
        // Reset form
        resetForm();
        
        // Close modal first so user sees the update
        onClose();
        
        // Trigger parent to refresh data
        onSuccess();
        
        // Show success message after a short delay
        setTimeout(() => {
          alert('✅ Document added successfully! Check your Active Documents list.');
        }, 100);
      } else {
        const error = await response.json();
        alert('❌ ' + (error.error || 'Failed to create document'));
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'visa',
      country: '',
      countryCode: '',
      documentNumber: '',
      issueDate: '',
      expiryDate: '',
      visaType: '',
      maxStayDays: '',
      cost: '',
      currency: 'USD',
      notes: '',
    });
    setMetadata({
      insuranceProvider: '',
      vaccineType: '',
      ticketType: '',
      flightNumber: '',
      departureCity: '',
      arrivalCity: '',
    });
    setAttachments([]);
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Add New Document</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Document Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Document Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DOCUMENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: type.value }))
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === type.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country *
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., Thailand"
              />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country}</p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country Code
              </label>
              <input
                type="text"
                name="countryCode"
                value={formData.countryCode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., TH"
                maxLength={2}
              />
            </div>

            {formData.type === 'visa' && (
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visa Type *
                </label>
                <select
                  name="visaType"
                  value={formData.visaType}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.visaType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select visa type</option>
                  {VISA_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.visaType && (
                  <p className="text-red-500 text-sm mt-1">{errors.visaType}</p>
                )}
              </div>
            )}

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Number
              </label>
              <input
                type="text"
                name="documentNumber"
                value={formData.documentNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., TH123456"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issue Date
              </label>
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date *
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.expiryDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.expiryDate && (
                <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
              )}
            </div>
          </div>

          {/* Visa-specific fields */}
          {formData.type === 'visa' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Stay (days)
                </label>
                <input
                  type="number"
                  name="maxStayDays"
                  value={formData.maxStayDays}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 30"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cost
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="35"
                    min="0"
                    step="0.01"
                  />
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="THB">THB</option>
                    <option value="VND">VND</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Type-specific metadata */}
          {formData.type === 'insurance' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Insurance Provider
              </label>
              <input
                type="text"
                name="insuranceProvider"
                value={metadata.insuranceProvider}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., SafetyWing"
              />
            </div>
          )}

          {formData.type === 'vaccination' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vaccine Type
              </label>
              <input
                type="text"
                name="vaccineType"
                value={metadata.vaccineType}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Yellow Fever"
              />
            </div>
          )}

          {formData.type === 'ticket' && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ticket Type
                </label>
                <input
                  type="text"
                  name="ticketType"
                  value={metadata.ticketType}
                  onChange={handleMetadataChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Flight"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flight/Train Number
                </label>
                <input
                  type="text"
                  name="flightNumber"
                  value={metadata.flightNumber}
                  onChange={handleMetadataChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., TG123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Departure City
                </label>
                <input
                  type="text"
                  name="departureCity"
                  value={metadata.departureCity}
                  onChange={handleMetadataChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Bangkok"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Arrival City
                </label>
                <input
                  type="text"
                  name="arrivalCity"
                  value={metadata.arrivalCity}
                  onChange={handleMetadataChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Chiang Mai"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Reminders */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Set Reminders
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => toggleReminder(30)}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedReminders.includes(30)
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                }`}
              >
                30 days before
              </button>
              <button
                type="button"
                onClick={() => toggleReminder(7)}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedReminders.includes(7)
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                }`}
              >
                7 days before
              </button>
              <button
                type="button"
                onClick={() => toggleReminder(1)}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedReminders.includes(1)
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                }`}
              >
                1 day before
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              You&apos;ll be notified before your document expires
            </p>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attachments
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload documents, photos, or PDFs
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Multiple files supported
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
            {uploading ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
