import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Ban as Bank, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PayoutService } from '../../services/payoutService';
import { useToast } from '../../hooks/useToast';
import type { PayoutMethod } from '../../types/api';
import getSymbolFromCurrency from 'currency-symbol-map';

interface PayoutSettingsFormProps {
  onSaved?: () => void;
}

export const PayoutSettingsForm: React.FC<PayoutSettingsFormProps> = ({ onSaved }) => {
  const { user, profile, updateProfile } = useAuth();
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [availablePayoutMethods, setAvailablePayoutMethods] = useState<PayoutMethod[]>([]);
  
  // Form state
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paypalEmail, setPaypalEmail] = useState<string>('');
  const [bankDetails, setBankDetails] = useState<{
    account_name: string;
    account_number: string;
    bank_name: string;
    routing_number: string;
    swift_code: string;
    bank_address: string;
  }>({
    account_name: '',
    account_number: '',
    bank_name: '',
    routing_number: '',
    swift_code: '',
    bank_address: ''
  });
  
  // Load payout methods and user's current settings
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load all payout methods
        const { data, error } = await PayoutService.getPayoutMethods();
        
        if (error) {
          errorToast(`Failed to load payout methods: ${error}`);
          return;
        }
        
        setPayoutMethods(data || []);
        
        // Get available payout methods for user's country and currency
        if (profile) {
          const { data: availableMethods } = await PayoutService.getAvailablePaymentMethods(
            profile.country,
            profile.currency
          );
          
          setAvailablePayoutMethods(availableMethods || data || []);
        } else {
          setAvailablePayoutMethods(data || []);
        }
        
        // Set initial values from profile
        if (profile) {
          setSelectedMethod(profile.payout_method || '');
          setPaypalEmail(profile.paypal_email || '');
          
          if (profile.bank_details) {
            setBankDetails({
              account_name: profile.bank_details.account_name || '',
              account_number: profile.bank_details.account_number || '',
              bank_name: profile.bank_details.bank_name || '',
              routing_number: profile.bank_details.routing_number || '',
              swift_code: profile.bank_details.swift_code || '',
              bank_address: profile.bank_details.bank_address || ''
            });
          }
        }
      } catch (err) {
        errorToast('Failed to load payout settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [profile]);
  
  const handleSave = async () => {
    if (!user || !updateProfile) {
      errorToast('You must be logged in to update payout settings');
      return;
    }
    
    // Validate based on selected method
    if (selectedMethod === 'PayPal' && !paypalEmail) {
      errorToast('PayPal email is required');
      return;
    }
    
    if (selectedMethod === 'Bank Transfer' && 
        (!bankDetails.account_name || !bankDetails.account_number || !bankDetails.bank_name)) {
      errorToast('Bank account details are required');
      return;
    }
    
    setSaving(true);
    
    try {
      const updates: any = {
        payout_method: selectedMethod
      };
      
      if (selectedMethod === 'PayPal') {
        updates.paypal_email = paypalEmail;
      }
      
      if (selectedMethod === 'Bank Transfer') {
        updates.bank_details = bankDetails;
      }
      
      const { error } = await updateProfile(updates);
      
      if (error) {
        throw new Error(error);
      }
      
      successToast('Payout settings updated successfully');
      
      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      errorToast('Failed to update payout settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading payout settings...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800 mb-1">Payout Information</h3>
          <p className="text-blue-700 text-sm">
            Set up your preferred payout method to receive your ambassador earnings. 
            We'll use this information to process your payout requests.
            {profile?.currency && (
              <span className="block mt-1">
                Your preferred currency is {profile.currency} {getSymbolFromCurrency(profile.currency)}. 
                Payouts will be processed in this currency when possible.
              </span>
            )}
          </p>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payout Method *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availablePayoutMethods.map((method) => (
            <div 
              key={method.id}
              onClick={() => setSelectedMethod(method.name)}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedMethod === method.name 
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  selectedMethod === method.name ? 'bg-primary-100' : 'bg-gray-100'
                }`}>
                  {method.name === 'PayPal' && <DollarSign className="h-5 w-5 text-primary-600" />}
                  {method.name === 'Bank Transfer' && <Bank className="h-5 w-5 text-primary-600" />}
                  {method.name === 'Manual' && <CreditCard className="h-5 w-5 text-primary-600" />}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{method.name}</h3>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
              </div>
              
              {method.config?.min_payout && (
                <div className="mt-2 text-xs text-gray-500">
                  Minimum: {profile?.currency ? getSymbolFromCurrency(profile.currency) : '$'}{method.config.min_payout}
                </div>
              )}
              
              {(method.config?.fee_percentage > 0 || method.config?.fee_fixed > 0) && (
                <div className="mt-1 text-xs text-gray-500">
                  Fee: {method.config.fee_percentage > 0 ? `${method.config.fee_percentage}% + ` : ''}
                  {method.config.fee_fixed > 0 ? `${profile?.currency ? getSymbolFromCurrency(profile.currency) : '$'}${method.config.fee_fixed}` : ''}
                </div>
              )}
              
              {method.config?.supported_currencies && (
                <div className="mt-1 text-xs text-gray-500">
                  {profile?.currency && !method.config.supported_currencies.includes(profile.currency) ? (
                    <span className="text-error-600">
                      Does not support {profile.currency}
                    </span>
                  ) : (
                    <span>
                      Supports {profile?.currency || 'your currency'}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* PayPal Details */}
      {selectedMethod === 'PayPal' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PayPal Email *
          </label>
          <input
            type="email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your PayPal email address"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Make sure this is the email associated with your PayPal account
          </p>
        </div>
      )}
      
      {/* Bank Transfer Details */}
      {selectedMethod === 'Bank Transfer' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={bankDetails.account_name}
                onChange={(e) => setBankDetails(prev => ({ ...prev, account_name: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter account holder name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={bankDetails.account_number}
                onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter account number"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={bankDetails.bank_name}
                onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter bank name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Routing Number
              </label>
              <input
                type="text"
                value={bankDetails.routing_number}
                onChange={(e) => setBankDetails(prev => ({ ...prev, routing_number: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter routing number (if applicable)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SWIFT/BIC Code
              </label>
              <input
                type="text"
                value={bankDetails.swift_code}
                onChange={(e) => setBankDetails(prev => ({ ...prev, swift_code: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter SWIFT/BIC code (for international transfers)"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Address
              </label>
              <textarea
                value={bankDetails.bank_address}
                onChange={(e) => setBankDetails(prev => ({ ...prev, bank_address: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter bank address"
                rows={2}
              />
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-700 text-sm">
                Please ensure your bank details are accurate. Incorrect information may result in failed transfers or additional fees.
                {profile?.currency && profile.currency !== 'USD' && (
                  <span className="block mt-1">
                    Your preferred currency is {profile.currency}. Bank transfers may be subject to currency conversion fees.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Manual Payout Info */}
      {selectedMethod === 'Manual' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-700">
            Manual payouts are processed by our team on a case-by-case basis. 
            When you request a payout, our team will contact you to arrange the details.
            {profile?.currency && profile.currency !== 'USD' && (
              <span className="block mt-2">
                Your preferred currency is {profile.currency}. We'll try to accommodate this currency for manual payouts when possible.
              </span>
            )}
          </p>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !selectedMethod}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {saving ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Payout Settings</span>
          )}
        </button>
      </div>
    </div>
  );
};