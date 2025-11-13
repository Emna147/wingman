'use client';

import { getVisaRequirement, type CountryInfo } from '@/lib/passport-data';
import { FileText, Globe, Lightbulb, MapPin, X } from 'lucide-react';

interface CountryDetailModalProps {
  country: CountryInfo | null;
  myPassport: string;
  onClose: () => void;
}

export default function CountryDetailModal({ country, myPassport, onClose }: CountryDetailModalProps) {
  if (!country) return null;

  const requirement = getVisaRequirement(myPassport, country.code);

  const getRequirementColor = (req: string) => {
    switch (req) {
      case 'visa free':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'visa on arrival':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'e-visa':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'visa required':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="text-5xl">
              {country.code === 'TN' ? '🇹🇳' : 
               country.code === 'US' ? '🇺🇸' : 
               country.code === 'FR' ? '🇫🇷' : 
               country.code === 'GB' ? '🇬🇧' : 
               country.code === 'DE' ? '🇩🇪' : 
               country.code === 'JP' ? '🇯🇵' : 
               country.code === 'TH' ? '🇹🇭' : 
               country.code === 'VN' ? '🇻🇳' : 
               country.code === 'IN' ? '🇮🇳' : 
               country.code === 'CN' ? '🇨🇳' : 
               country.code === 'BR' ? '🇧🇷' : 
               country.code === 'MX' ? '🇲🇽' : 
               country.code === 'CA' ? '🇨🇦' : 
               country.code === 'AU' ? '🇦🇺' : 
               country.code === 'NZ' ? '🇳🇿' : 
               country.code === 'ES' ? '🇪🇸' : 
               country.code === 'IT' ? '🇮🇹' : 
               country.code === 'PT' ? '🇵🇹' : 
               country.code === 'AE' ? '🇦🇪' : 
               country.code === 'SG' ? '🇸🇬' : '🌍'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {country.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {country.continent}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {/* Visa Requirement Section */}
          {requirement && (
            <div className={`p-6 rounded-lg border-2 mb-6 ${getRequirementColor(requirement.requirement)}`}>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5" />
                <h3 className="text-lg font-bold uppercase tracking-wide">
                  {requirement.requirement}
                </h3>
              </div>
              
              {requirement.duration && (
                <div className="mb-3">
                  <div className="text-4xl font-bold">
                    {requirement.duration} days
                  </div>
                  <div className="text-sm opacity-75">
                    Maximum stay duration
                  </div>
                </div>
              )}

              {requirement.notes && (
                <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                  <div className="font-semibold mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Important Information:
                  </div>
                  <p className="text-sm">{requirement.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Global Access Statistics */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Global Access Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Visa Free</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {country.visaFreeCount}
                </div>
                <div className="text-xs text-gray-500">countries</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Visa on Arrival</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {country.visaOnArrivalCount}
                </div>
                <div className="text-xs text-gray-500">countries</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">E-Visa</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {country.eVisaCount}
                </div>
                <div className="text-xs text-gray-500">countries</div>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Access</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {country.visaFreeCount + country.visaOnArrivalCount + country.eVisaCount}
                </div>
                <div className="text-xs text-gray-500">countries</div>
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Required Documents
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Valid passport (min. 6 months validity)</span>
              </li>
              {requirement?.requirement === 'visa required' && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">Completed visa application form</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">Recent passport-sized photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">Proof of accommodation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">Flight itinerary</span>
                  </li>
                </>
              )}
              {requirement?.requirement === 'e-visa' && (
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Apply online before travel</span>
                </li>
              )}
            </ul>
          </div>

          {/* Travel Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              Travel Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Always check official embassy websites for the most up-to-date requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Apply for visas well in advance of your travel dates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Keep copies of all important documents in digital and physical format</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Consider travel insurance that covers visa-related delays</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
