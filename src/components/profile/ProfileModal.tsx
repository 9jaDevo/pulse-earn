import React, { useState } from 'react';
import { X, User, Mail, Globe, Camera, Save, Gift, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CountrySelect } from '../ui/CountrySelect';
import { useToast } from '../../hooks/useToast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedReferral, setCopiedReferral] = useState(false);
  const { successToast, errorToast } = useToast();

  React.useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCountry(profile.country || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await updateProfile({
        name: name.trim(),
        country: country.trim(),
      });

      if (error) {
        setError(error);
        errorToast('Failed to update profile: ' + error);
        errorToast('Failed to update profile: ' + error);
      } else {
        successToast('Profile updated successfully!');
        successToast('Profile updated successfully!');
        setTimeout(() => {          
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      errorToast('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      successToast('Referral code copied to clipboard!');
      successToast('Referral code copied to clipboard!');
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  if (!isOpen || !profile) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-error-100 text-error-700';
      case 'ambassador':
        return 'bg-accent-100 text-accent-700';
      case 'moderator':
        return 'bg-warning-100 text-warning-700';
      default:
        return 'bg-primary-100 text-primary-700';
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

        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-white" />
            </div>
            <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <Camera className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Profile</h2>
          <div className="flex items-center justify-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(profile.role)}`}>
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </span>
            <span className="text-primary-600 font-semibold">{profile.points.toLocaleString()} pts</span>
          </div>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <CountrySelect
              value={country}
              onChange={setCountry}
              placeholder="Select your country"
              showFlag={true}
              showPopular={true}
            />
          </div>

          {profile.referral_code && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Referral Code
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={profile.referral_code}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={copyReferralCode}
                  className="bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copiedReferral ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this code with friends to earn bonus points when they sign up!
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Account Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Member since</p>
                <p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Badges earned</p>
                <p className="font-medium">{profile.badges.length}</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            <Save className="h-5 w-5" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};