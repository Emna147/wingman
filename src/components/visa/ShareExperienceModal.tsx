'use client';

import { authClient } from '@/lib/auth-client';
import { X } from 'lucide-react';
import { useState } from 'react';

interface ShareExperienceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: 'visa-free', label: 'Visa Free', icon: '✅', description: 'Share visa-free travel experiences' },
  { id: 'visa-required', label: 'Visa Required', icon: '📄', description: 'Share visa application process' },
  { id: 'e-visa', label: 'E-Visa', icon: '💻', description: 'Share e-visa application experience' },
  { id: 'visa-on-arrival', label: 'Visa on Arrival', icon: '🎫', description: 'Share visa on arrival experience' },
  { id: 'rejection', label: 'Rejections & Appeals', icon: '❌', description: 'Share rejection stories and appeals' },
  { id: 'tips', label: 'Tips & Tricks', icon: '💡', description: 'Share helpful tips and advice' },
];

export default function ShareExperienceModal({ onClose, onSuccess }: ShareExperienceModalProps) {
  const [formData, setFormData] = useState({
    country: '',
    category: '',
    title: '',
    content: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const { data: session } = await authClient.getSession();
      if (!session?.user?.id) {
        alert('Please sign in to share your experience');
        return;
      }

      const response = await fetch('/api/visa-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id,
        },
        body: JSON.stringify({
          ...formData,
          userName: session.user.name || session.user.email || 'Anonymous',
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to share experience');
      }
    } catch (error) {
      console.error('Error sharing experience:', error);
      alert('Failed to share experience. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Share Your Experience
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Help others by sharing your visa journey
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          <div className="space-y-6">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., United States, France, Japan"
                className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${
                  errors.country ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: category.id })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.category === category.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.description}
                    </p>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Got my US tourist visa in 2 weeks!"
                className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white ${
                  errors.title ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.title.length}/100 characters (min. 10)
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Experience <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Share details about your experience: application process, documents required, timeline, tips, etc."
                rows={8}
                className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none ${
                  errors.content ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">{errors.content}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.content.length}/2000 characters (min. 50)
              </p>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                💡 Sharing Guidelines
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Be specific about dates, timelines, and requirements</li>
                <li>• Include helpful tips that others can learn from</li>
                <li>• Be respectful and constructive</li>
                <li>• Avoid sharing personal sensitive information</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sharing...' : 'Share Experience'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
