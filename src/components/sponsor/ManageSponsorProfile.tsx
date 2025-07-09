import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Globe, 
  FileText, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Info 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SponsorService } from '../../services/sponsorService';
import { useToast } from '../../hooks/useToast';
import type { Sponsor } from '../../types/api';

interface ManageSponsorProfileProps {
  sponsor: Sponsor | null;
  onSponsorCreated: (sponsor: Sponsor) => void;
  onSponsorUpdated: (sponsor: Sponsor) => void;
}

export const ManageSponsorProfile: React.FC<ManageSponsorProfileProps> = ({
  sponsor,
  onSponsorCreated,
  onSponsorUpdated
}) => {
  const { user } = useAuth();
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    website_url: '',
    description: ''
  });
  
  // Initialize form with sponsor data if available
  useEffect(() => {
    if (sponsor) {
      setFormData({
        name: sponsor.name,
        contact_email: sponsor.contact_email,
        website_url: sponsor.website_url || '',
        description: sponsor.description || ''
      });
    }
  }, [sponsor]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      errorToast('You must be logged in to perform this action');
      return;
    }
    
    // Validate form
    if (!formData.name.trim()) {
      errorToast('Sponsor name is required');
      return;
    }
    
    if (!formData.contact_email.trim()) {
      errorToast('Contact email is required');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email)) {
      errorToast('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      if (sponsor) {
        // Update existing sponsor
        const { data, error } = await SponsorService.updateSponsor(
          user.id,
          sponsor.id,
          {
            name: formData.name,
            contact_email: formData.contact_email,
            website_url: formData.website_url || undefined,
            description: formData.description || undefined
          }
        );
        
        if (error) {
          throw new Error(error);
        }
        
        if (data) {
          onSponsorUpdated(data);
        }
      } else {
        // Create new sponsor
        const { data, error } = await SponsorService.createSponsor(
          user.id,
          {
            name: formData.name,
            contact_email: formData.contact_email,
            website_url: formData.website_url || undefined,
            description: formData.description || undefined
          }
        );
        
        if (error) {
          throw new Error(error);
        }
        
        if (data) {
          onSponsorCreated(data);
        }
      }
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to save sponsor profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800 mb-1">About Sponsor Profiles</h3>
          <p className="text-blue-700 text-sm">
            A sponsor profile represents your organization or brand. This information will be displayed alongside 
            your promoted polls. Complete your profile to establish credibility with users.
          </p>
        </div>
      </div>
      
      {/* Sponsor Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {sponsor ? 'Edit Sponsor Profile' : 'Create Sponsor Profile'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sponsor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sponsor Name *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter organization or brand name"
                required
              />
            </div>
          </div>
          
          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter contact email"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This email will be used for communications about your promoted polls.
            </p>
          </div>
          
          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL (Optional)
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe your organization or brand"
                rows={4}
              />
            </div>
          </div>
          
          {/* Verification Status (read-only) */}
          {sponsor && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                {sponsor.is_verified ? (
                  <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {sponsor.is_verified ? 'Verified Sponsor' : 'Verification Pending'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {sponsor.is_verified 
                      ? 'Your sponsor profile has been verified by our team.' 
                      : 'Your sponsor profile is pending verification. This may take 1-2 business days.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>{sponsor ? 'Update Profile' : 'Create Profile'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Verification Info */}
      {!sponsor && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800 mb-1">Verification Process</h3>
            <p className="text-yellow-700 text-sm">
              After creating your sponsor profile, our team will review it for verification. 
              This process typically takes 1-2 business days. You can still create promoted polls 
              while verification is pending, but they will only go live after your profile is verified.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};