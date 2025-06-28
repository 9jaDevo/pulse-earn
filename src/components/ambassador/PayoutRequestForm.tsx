import React, { useState, useEffect } from 'react';
import { DollarSign, Send, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PayoutService } from '../../services/payoutService';
import { AmbassadorService } from '../../services/ambassadorService';
import { useToast } from '../../hooks/useToast';
import type { PayoutMethod } from '../../types/api';

interface PayoutRequestFormProps {
  onRequestSubmitted?: () => void;
}

export const PayoutRequestForm: React.FC<PayoutRequestFormProps> = ({ onRequestSubmitted }) => {
  const { user, profile } = useAuth();
  const { successToast, errorToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [payableBalance, setPayableBalance] = useState<number>(0);
  
  // Form state
  const [amount, setAmount] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');
  
  // Load payout methods and payable balance
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Load payout methods
        const { data: methods, error: methodsError } = await PayoutService.getPayoutMethods();
        
        if (methodsError) {
          errorToast(`Failed to load payout methods: ${methodsError}`);
          return;
        }
        
        setPayoutMethods(methods || []);
        
        // Set default selected method from profile
        if (profile?.payout_method) {
          setSelectedMethod(profile.payout_method);
        } else if (methods && methods.length > 0) {
          setSelectedMethod(methods[0].name);
        }
        
        // Load payable balance
        const { data: balance, error: balanceError } = await PayoutService.getPayableBalance(user.id);
        
        if (balanceError) {
          errorToast(`Failed to load payable balance: ${balanceError}`);
          return;
        }
        
        setPayableBalance(balance || 0);
        
        // Set default amount to minimum payout or half of balance
        if (balance && balance > 0) {
          const selectedMethodObj = methods?.find(m => m.name === (profile?.payout_method || methods[0]?.name));
          const minPayout = selectedMethodObj?.config?.min_payout || 10;
          const halfBalance = balance / 2;
          
          setAmount(Math.max(minPayout, Math.min(halfBalance, balance)));
        }
      } catch (err) {
        errorToast('Failed to load payout data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, profile]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      errorToast('You must be logged in to request a payout');
      return;
    }
    
    if (!selectedMethod) {
      errorToast('Please select a payout method');
      return;
    }
    
    if (amount <= 0) {
      errorToast('Payout amount must be greater than zero');
      return;
    }
    
    if (amount > payableBalance) {
      errorToast(`Payout amount cannot exceed your available balance of $${payableBalance.toFixed(2)}`);
      return;
    }
    
    // Check minimum payout amount
    const selectedMethodObj = payoutMethods.find(m => m.name === selectedMethod);
    const minPayout = selectedMethodObj?.config?.min_payout || 0;
    
    if (amount < minPayout) {
      errorToast(`Minimum payout amount for ${selectedMethod} is $${minPayout.toFixed(2)}`);
      return;
    }
    
    // Validate required details
    if (selectedMethod === 'PayPal' && !profile?.paypal_email) {
      errorToast('Please set up your PayPal email in your profile settings first');
      return;
    }
    
    if (selectedMethod === 'Bank Transfer' && 
        (!profile?.bank_details?.account_name || 
         !profile?.bank_details?.account_number || 
         !profile?.bank_details?.bank_name)) {
      errorToast('Please set up your bank details in your profile settings first');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare additional details
      const payoutDetails: Record<string, any> = {};
      
      if (additionalDetails.trim()) {
        payoutDetails.notes = additionalDetails.trim();
      }
      
      const { data, error } = await PayoutService.requestPayout(user.id, {
        amount,
        payout_method: selectedMethod,
        payout_details: payoutDetails
      });
      
      if (error) {
        throw new Error(error);
      }
      
      successToast('Payout request submitted successfully');
      
      // Reset form
      setAmount(0);
      setAdditionalDetails('');
      
      // Refresh payable balance
      const { data: newBalance } = await PayoutService.getPayableBalance(user.id);
      setPayableBalance(newBalance || 0);
      
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to submit payout request');
    } finally {
      setSubmitting(false);
    }
  };
  
  const getMethodMinimum = (methodName: string): number => {
    const method = payoutMethods.find(m => m.name === methodName);
    return method?.config?.min_payout || 0;
  };
  
  const getMethodFees = (methodName: string, amount: number): number => {
    const method = payoutMethods.find(m => m.name === methodName);
    if (!method) return 0;
    
    const percentageFee = method.config?.fee_percentage ? (amount * method.config.fee_percentage / 100) : 0;
    const fixedFee = method.config?.fee_fixed || 0;
    
    return percentageFee + fixedFee;
  };
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading payout information...</p>
      </div>
    );
  }
  
  // Check if payout settings are complete
  const isPayoutSettingsComplete = () => {
    if (!profile) return false;
    
    if (!profile.payout_method) return false;
    
    if (profile.payout_method === 'PayPal' && !profile.paypal_email) return false;
    
    if (profile.payout_method === 'Bank Transfer' && 
        (!profile.bank_details?.account_name || 
         !profile.bank_details?.account_number || 
         !profile.bank_details?.bank_name)) return false;
    
    return true;
  };
  
  if (!isPayoutSettingsComplete()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800 mb-2">Payout Settings Incomplete</h3>
            <p className="text-yellow-700 mb-4">
              Please complete your payout settings before requesting a payout. You need to:
            </p>
            <ul className="list-disc list-inside text-yellow-700 space-y-1 mb-4">
              {!profile?.payout_method && <li>Select a payout method</li>}
              {profile?.payout_method === 'PayPal' && !profile.paypal_email && <li>Add your PayPal email</li>}
              {profile?.payout_method === 'Bank Transfer' && (!profile.bank_details?.account_name || !profile.bank_details?.account_number || !profile.bank_details?.bank_name) && <li>Complete your bank details</li>}
            </ul>
            <p className="text-yellow-700">
              You can update your payout settings in your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (payableBalance <= 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Balance</h3>
        <p className="text-gray-600 mb-4">
          You don't have any earnings available for payout at this time.
        </p>
        <p className="text-gray-500">
          Continue referring users and earning commissions to build your balance.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Payout</h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-700 text-sm">
            Your available balance is <span className="font-bold">${payableBalance.toFixed(2)}</span>. 
            Payouts are typically processed within 3-5 business days.
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payout Method
          </label>
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
            disabled={true} // Disabled because it's already set in profile
          >
            <option value="">Select a method</option>
            {payoutMethods.map((method) => (
              <option key={method.id} value={method.name}>
                {method.name} {method.config?.min_payout ? `(Min: $${method.config.min_payout})` : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Using your preferred method: {profile?.payout_method}. To change, update your profile settings.
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Request (USD)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter amount"
              min={getMethodMinimum(selectedMethod)}
              max={payableBalance}
              step="0.01"
              required
            />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-500">
              Minimum: ${getMethodMinimum(selectedMethod).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              Available: ${payableBalance.toFixed(2)}
            </p>
          </div>
        </div>
        
        {/* Fee calculation */}
        {amount > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">Request amount:</span>
              <span className="font-medium">${amount.toFixed(2)}</span>
            </div>
            
            {getMethodFees(selectedMethod, amount) > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Fees:</span>
                <span className="font-medium text-error-600">-${getMethodFees(selectedMethod, amount).toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
              <span className="text-gray-900">You'll receive:</span>
              <span className="text-gray-900">${(amount - getMethodFees(selectedMethod, amount)).toFixed(2)}</span>
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Details (Optional)
          </label>
          <textarea
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Any additional information for this payout request"
            rows={3}
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || amount <= 0 || amount > payableBalance || !selectedMethod}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Request Payout</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};