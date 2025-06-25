import React, { useState } from 'react';
import { X, Flag, Shield } from 'lucide-react';

interface ReportContentModalProps {
  contentType: 'poll' | 'comment';
  contentId: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const ReportContentModal: React.FC<ReportContentModalProps> = ({
  contentType,
  contentId,
  onClose,
  onSubmit
}) => {
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const commonReasons = [
    'Inappropriate content',
    'Hate speech or harassment',
    'Spam or misleading',
    'Violates community guidelines',
    'Other'
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason && !reason.trim()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const finalReason = selectedReason === 'Other' ? reason : (selectedReason || reason);
      await onSubmit(finalReason);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-error-100 p-3 rounded-full inline-flex items-center justify-center mx-auto mb-4">
            <Flag className="h-8 w-8 text-error-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report {contentType}</h2>
          <p className="text-gray-600">
            Help us maintain a respectful community by reporting content that violates our guidelines.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a reason
            </label>
            <div className="space-y-2">
              {commonReasons.map((r) => (
                <label key={r} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-900">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tell us why you're reporting this content..."
                rows={3}
                required
              />
            </div>
          )}

          <div className="bg-primary-50 p-4 rounded-lg flex items-start space-x-3">
            <Shield className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-primary-800">
              Our moderation team will review this report and take appropriate action. Thank you for helping keep our community safe.
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!selectedReason && !reason.trim())}
              className="bg-error-600 text-white px-6 py-3 rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};