import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Wallet, 
  DollarSign, 
  RefreshCw,
  AlertCircle,
  Info,
  Globe
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PromotedPollService } from '../../services/promotedPollService';
import { PaymentService } from '../../services/paymentService';
import { SettingsService } from '../../services/settingsService';
import { useToast } from '../../hooks/useToast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import type { PromotedPoll, PaymentMethod } from '../../types/api';
import getSymbolFromCurrency from 'currency-symbol-map';

// Initialize Stripe outside of component to avoid re-initialization
// We'll set this dynamically once we fetch the key from settings
let stripePromise: ReturnType<typeof loadStripe> | null = null;

interface RetryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promotedPoll: PromotedPoll;
}

export const RetryPaymentModal: React.FC<RetryPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  promotedPoll
}) => {
  const { user, profile } = useAuth();
  const { successToast, errorToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['USD']);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [stripeKeyLoaded, setStripeKeyLoaded] = useState(false);
  
  // Stripe payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Get the poll currency or default to USD
  const pollCurrency = promotedPoll.currency || 'USD';
  const currencySymbol = getSymbolFromCurrency(pollCurrency) || '$';
  
  // Load Stripe key from settings
  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        // Get Stripe key from settings
        const { data: integrationSettings } = await SettingsService.getSettings('integrations');
        
        if (integrationSettings?.stripePublicKey && 
            integrationSettings.stripePublicKey !== 'your_stripe_publishable_key') {
          // Initialize Stripe with the key from settings
          stripePromise = loadStripe(integrationSettings.stripePublicKey);
          setStripeKeyLoaded(true);
        } else {
          // Fall back to environment variable
          const envStripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
          if (envStripeKey && envStripeKey !== 'your_stripe_publishable_key') {
            stripePromise = loadStripe(envStripeKey);
            setStripeKeyLoaded(true);
          } else {
            console.warn('No valid Stripe public key found in settings or environment variables');
            stripePromise = null;
          }
        }
      } catch (err) {
        console.error('Error loading Stripe key from settings:', err);
        
        // Fall back to environment variable
        const envStripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        if (envStripeKey && envStripeKey !== 'your_stripe_publishable_key') {
          stripePromise = loadStripe(envStripeKey);
          setStripeKeyLoaded(true);
        } else {
          stripePromise = null;
        }
      }
    };
    
    if (isOpen) {
      loadStripeKey();
    }
  }, [isOpen]);
  
  useEffect(() => {
    // Fetch available payment methods for the poll's currency
    const fetchPaymentMethods = async () => {
      try {
        const { data, error } = await PaymentService.getAvailablePaymentMethods(
          profile?.country,
          pollCurrency
        );
        
        if (error) {
          errorToast(error);
          return;
        }
        
        // Filter out Stripe payment methods if Stripe is not configured
        const filteredMethods = data?.filter(method => {
          if (method.type === 'stripe' && !stripePromise) {
            return false;
          }
          return true;
        }) || [];
        
        setPaymentMethods(filteredMethods);
        
        // Default to wallet if available
        const walletMethod = filteredMethods?.find(m => m.type === 'wallet');
        if (walletMethod) {
          setSelectedPaymentMethod(walletMethod.id);
        } else if (filteredMethods && filteredMethods.length > 0) {
          setSelectedPaymentMethod(filteredMethods[0].id);
        }
      } catch (err) {
        errorToast('Failed to load payment methods');
      }
    };
    
    // Fetch supported currencies
    const fetchCurrencies = async () => {
      setLoadingCurrencies(true);
      try {
        const { data, error } = await SettingsService.getSupportedCurrencies();
        if (error) {
          console.error('Error fetching currencies:', error);
        } else {
          setSupportedCurrencies(data || ['USD']);
        }
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
      } finally {
        setLoadingCurrencies(false);
      }
    };
    
    if (isOpen && stripeKeyLoaded) {
      fetchPaymentMethods();
      fetchCurrencies();
    }
  }, [isOpen, profile, pollCurrency, stripeKeyLoaded]);

  const handleRetryPayment = async () => {
    if (!user) {
      errorToast('You must be logged in to perform this action');
      return;
    }
    
    if (!selectedPaymentMethod) {
      errorToast('Please select a payment method');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get the selected payment method
      const paymentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
      
      if (!paymentMethod) {
        throw new Error('Invalid payment method');
      }
      
      if (paymentMethod.type === 'stripe' && !stripePromise) {
        throw new Error('Stripe is not configured. Please contact support.');
      }
      
      // Retry payment
      const { data, error } = await PromotedPollService.retryPromotedPollPayment(
        user.id,
        promotedPoll.id,
        paymentMethod.type
      );
      
      if (error) {
        throw new Error(error);
      }
      
      if (!data) {
        throw new Error('Failed to initialize payment');
      }
      
      // Handle different payment methods
      if (data.authorizationUrl) {
        // For Paystack, redirect to the payment page
        window.location.href = data.authorizationUrl;
      } else if (data.clientSecret) {
        // For Stripe, set the client secret and transaction ID
        setClientSecret(data.clientSecret);
        setTransactionId(data.transactionId);
      } else {
        // For wallet payments or other methods that complete immediately
        successToast('Payment processed successfully!');
        onSuccess();
        onClose();
      }
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to retry payment');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    if (!transactionId) {
      errorToast('Transaction ID not found');
      return;
    }
    
    try {
      // Update transaction status
      const { error } = await PaymentService.updateTransactionStatus(
        transactionId,
        'completed',
        paymentIntentId
      );
      
      if (error) {
        throw new Error(error);
      }
      
      successToast('Payment successful! Your poll promotion is pending approval.');
      onSuccess();
      onClose();
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  };
  
  const handleStripePaymentError = (error: string) => {
    errorToast(`Payment failed: ${error}`);
    // Don't close modal, allow user to try again
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-primary-100 p-3 rounded-lg">
            <CreditCard className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Retry Payment
          </h2>
        </div>
        
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-1">Complete Your Payment</h3>
            <p className="text-blue-700 text-sm">
              Your previous payment attempt for this campaign was not completed. Please select a payment method below to complete your payment.
              {pollCurrency !== 'USD' && (
                <span className="block mt-1">
                  This payment will be processed in {pollCurrency} ({currencySymbol}).
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Poll Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Campaign Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Poll Title</p>
              <p className="font-medium text-gray-900">{promotedPoll.poll?.title || 'Unknown Poll'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium text-gray-900">{currencySymbol}{promotedPoll.budget_amount.toFixed(2)} {pollCurrency}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Target Votes</p>
              <p className="font-medium text-gray-900">{promotedPoll.target_votes}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium text-gray-900 capitalize">{promotedPoll.status.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
        
        {/* Payment Method Selection */}
        {!clientSecret && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select Payment Method
            </label>
            <div className="space-y-3">
              {paymentMethods.map(method => (
                <div
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPaymentMethod === method.id 
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    checked={selectedPaymentMethod === method.id}
                    onChange={() => setSelectedPaymentMethod(method.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      {method.type === 'wallet' ? (
                        <Wallet className="h-5 w-5 text-primary-600 mr-2" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-primary-600 mr-2" />
                      )}
                      <span className="font-medium text-gray-900">{method.name}</span>
                    </div>
                    {method.description && (
                      <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                    )}
                    
                    {method.type === 'wallet' && (
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-600">Available Balance:</span>
                        <span className="font-medium text-gray-900">
                          {profile ? `${profile.points.toLocaleString()} points` : 'Loading...'}
                        </span>
                      </div>
                    )}
                    
                    {/* Show currency support info */}
                    {method.config?.supported_currencies && (
                      <div className="mt-1 text-sm">
                        {method.config.supported_currencies.includes(pollCurrency) ? (
                          <span className="text-success-600">
                            Supports {pollCurrency}
                          </span>
                        ) : (
                          <span className="text-error-600">
                            Does not support {pollCurrency} - payment will be converted to {method.config.default_currency || 'USD'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Promotion Budget:</span>
                  <span className="font-medium">{currencySymbol}{promotedPoll.budget_amount.toFixed(2)} {pollCurrency}</span>
                </div>
                
                {/* If wallet payment, show points conversion */}
                {selectedPaymentMethod === paymentMethods.find(m => m.type === 'wallet')?.id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points Required:</span>
                    <span className="font-medium">
                      {(promotedPoll.budget_amount * 100).toLocaleString()} points
                    </span>
                  </div>
                )}
                
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-medium">Total:</span>
                    <span className="font-bold text-gray-900">{currencySymbol}{promotedPoll.budget_amount.toFixed(2)} {pollCurrency}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Insufficient Points Warning */}
            {selectedPaymentMethod === paymentMethods.find(m => m.type === 'wallet')?.id && 
             profile && 
             profile.points < (promotedPoll.budget_amount * 100) && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start space-x-3 mt-4">
                <AlertCircle className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-error-800 mb-1">Insufficient Points</h3>
                  <p className="text-error-700 text-sm">
                    You don't have enough points for this payment. You need {(promotedPoll.budget_amount * 100).toLocaleString()} points, 
                    but you only have {profile.points.toLocaleString()} points. Please select a different payment method.
                  </p>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="mt-6">
              <button
                onClick={handleRetryPayment}
                disabled={loading || !selectedPaymentMethod || (
                  selectedPaymentMethod === paymentMethods.find(m => m.type === 'wallet')?.id && 
                  profile && 
                  profile.points < (promotedPoll.budget_amount * 100)
                )}
                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5" />
                    <span>Complete Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Stripe Payment Form */}
        {clientSecret && stripePromise && (
          <div className="mt-6">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm 
                amount={promotedPoll.budget_amount}
                transactionId={transactionId || ''}
                onSuccess={handleStripePaymentSuccess}
                onError={handleStripePaymentError}
                currency={pollCurrency}
              />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
};