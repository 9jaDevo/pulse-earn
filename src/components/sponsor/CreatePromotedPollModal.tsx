import React, { useState, useEffect } from 'react';
import { 
  X, 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Users, 
  Info, 
  AlertCircle, 
  CreditCard, 
  Wallet, 
  RefreshCw,
  Globe
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PollService } from '../../services/pollService';
import { PromotedPollService } from '../../services/promotedPollService';
import { PaymentService } from '../../services/paymentService';
import { SettingsService } from '../../services/settingsService';
import { useToast } from '../../hooks/useToast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripePaymentForm } from './StripePaymentForm';
import type { Poll, PaymentMethod } from '../../types/api';
import getSymbolFromCurrency from 'currency-symbol-map';

interface CreatePromotedPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sponsorId: string;
}

export const CreatePromotedPollModal: React.FC<CreatePromotedPollModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sponsorId
}) => {
  const { user, profile } = useAuth();
  const { successToast, errorToast } = useToast();
  
  const [step, setStep] = useState<'select-poll' | 'configure' | 'payment'>('select-poll');
  const [loading, setLoading] = useState(false);
  const [userPolls, setUserPolls] = useState<Poll[]>([]);
  const [selectedPollId, setSelectedPollId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['USD']);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  
  // Stripe state
  const [stripeInstance, setStripeInstance] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [stripeLoadError, setStripeLoadError] = useState<string | null>(null);
  
  // Promotion settings
  const [settings, setSettings] = useState<{
    default_cost_per_vote: number;
    minimum_budget: number;
    maximum_budget: number;
    points_to_usd_conversion: number;
  }>({
    default_cost_per_vote: 0.05,
    minimum_budget: 10,
    maximum_budget: 1000,
    points_to_usd_conversion: 100
  });
  
  // Form data
  const [formData, setFormData] = useState({
    budget: 50,
    targetVotes: 1000,
    startDate: '',
    endDate: '',
    currency: 'USD'
  });
  
  // Helper function to validate Stripe key
  const isValidStripeKey = (key: string): boolean => {
    return key && 
           key !== 'your_stripe_publishable_key' && 
           key !== 'pk_test_placeholder_key_replace_with_actual_stripe_key' &&
           (key.startsWith('pk_test_') || key.startsWith('pk_live_'));
  };
  
  // Load Stripe key from settings
  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        setStripeLoadError(null);
        
        // Get Stripe key from settings
        const { data: integrationSettings } = await SettingsService.getSettings('integrations');
        
        let stripeKey = null;
        
        if (integrationSettings?.stripePublicKey && 
            isValidStripeKey(integrationSettings.stripePublicKey)) {
          stripeKey = integrationSettings.stripePublicKey;
        } else {
          // Fall back to environment variable
          const envStripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
          if (isValidStripeKey(envStripeKey)) {
            stripeKey = envStripeKey;
          }
        }
        
        if (stripeKey) {
          try {
            const stripePromise = loadStripe(stripeKey);
            setStripeInstance(stripePromise);
          } catch (err) {
            console.error('Error loading Stripe:', err);
            setStripeLoadError('Failed to load Stripe payment system');
            setStripeInstance(null);
          }
        } else {
          console.warn('No valid Stripe public key found');
          setStripeLoadError('Stripe payment system is not configured');
          setStripeInstance(null);
        }
      } catch (err) {
        console.error('Error loading Stripe key from settings:', err);
        setStripeLoadError('Failed to load payment configuration');
        setStripeInstance(null);
      }
    };
    
    loadStripeKey();
  }, []);
  
  // Load user's polls and payment methods
  useEffect(() => {
    if (user) {
      fetchUserPolls();
      fetchPaymentMethods();
      fetchSettings();
      fetchSupportedCurrencies();
    }
  }, [user]);
  
  // Update target votes when budget changes
  useEffect(() => {
    if (settings.default_cost_per_vote > 0) {
      const targetVotes = Math.floor(formData.budget / settings.default_cost_per_vote);
      setFormData(prev => ({ ...prev, targetVotes }));
    }
  }, [formData.budget, settings.default_cost_per_vote]);
  
  // Set default currency from user profile
  useEffect(() => {
    if (profile?.currency) {
      setFormData(prev => ({ ...prev, currency: profile.currency }));
    }
  }, [profile]);
  
  // Update available payment methods when currency changes
  useEffect(() => {
    if (user && formData.currency) {
      fetchPaymentMethodsForCurrency(formData.currency);
    }
  }, [user, formData.currency]);
  
  const fetchUserPolls = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { data } = await PollService.getUserPollHistory(user.id, {
        includeCreated: true,
        includeVoted: false
      });
      
      if (data) {
        setUserPolls(data.createdPolls);
      }
    } catch (err) {
      errorToast('Failed to load your polls');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSupportedCurrencies = async () => {
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
  
  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await PaymentService.getPaymentMethods();
      
      if (error) {
        errorToast(error);
        return;
      }
      
      // Filter out Stripe payment methods if Stripe is not configured or has errors
      const filteredMethods = data?.filter(method => {
        if (method.type === 'stripe' && (!stripeInstance || stripeLoadError)) {
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
  
  const fetchPaymentMethodsForCurrency = async (currency: string) => {
    try {
      const { data, error } = await PaymentService.getAvailablePaymentMethods(
        profile?.country,
        currency
      );
      
      if (error) {
        errorToast(error);
        return;
      }
      
      // Filter out Stripe payment methods if Stripe is not configured or has errors
      const filteredMethods = data?.filter(method => {
        if (method.type === 'stripe' && (!stripeInstance || stripeLoadError)) {
          return false;
        }
        return true;
      }) || [];
      
      setPaymentMethods(filteredMethods);
      
      // Reset selected payment method if it's no longer available
      if (filteredMethods && selectedPaymentMethod) {
        const methodStillAvailable = filteredMethods.some(m => m.id === selectedPaymentMethod);
        if (!methodStillAvailable && filteredMethods.length > 0) {
          // Default to wallet if available
          const walletMethod = filteredMethods.find(m => m.type === 'wallet');
          setSelectedPaymentMethod(walletMethod ? walletMethod.id : filteredMethods[0].id);
        }
      }
    } catch (err) {
      errorToast('Failed to load payment methods for selected currency');
    }
  };
  
  const fetchSettings = async () => {
    try {
      const { data, error } = await PromotedPollService.getPromotedPollSettings();
      
      if (error) {
        errorToast(error);
        return;
      }
      
      if (data) {
        setSettings({
          default_cost_per_vote: data.default_cost_per_vote,
          minimum_budget: data.minimum_budget,
          maximum_budget: data.maximum_budget,
          points_to_usd_conversion: data.points_to_usd_conversion
        });
        
        // Update initial budget and target votes
        setFormData(prev => ({
          ...prev,
          budget: data.minimum_budget,
          targetVotes: Math.floor(data.minimum_budget / data.default_cost_per_vote)
        }));
      }
    } catch (err) {
      errorToast('Failed to load promotion settings');
    }
  };
  
  const handleSelectPoll = (pollId: string) => {
    setSelectedPollId(pollId);
    setStep('configure');
  };
  
  const handleBudgetChange = (value: number) => {
    // Ensure budget is within limits
    const budget = Math.max(
      settings.minimum_budget,
      Math.min(settings.maximum_budget, value)
    );
    
    setFormData(prev => ({ ...prev, budget }));
  };
  
  const handleSubmitConfiguration = () => {
    // Validate dates if provided
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start > end) {
        errorToast('End date must be after start date');
        return;
      }
    }
    
    setStep('payment');
  };

  // New helper function to initiate payment flow
  const initiatePaymentFlow = async (
    promotedPollId: string,
    paymentMethodType: string
  ): Promise<boolean> => {
    try {
      // Process payment based on selected method
      if (paymentMethodType === 'wallet') {
        // Process wallet payment
        const { error: paymentError } = await PaymentService.processWalletPayment(
          user!.id,
          formData.budget,
          promotedPollId,
          formData.currency
        );
        
        if (paymentError) {
          throw new Error(paymentError);
        }
        
        successToast('Payment successful! Your poll promotion is pending approval.');
        onSuccess();
        onClose();
        return true;
      } else if (paymentMethodType === 'stripe') {
        if (!stripeInstance || stripeLoadError) {
          throw new Error('Stripe payment system is not available. Please contact support or use an alternative payment method.');
        }
        
        // Initialize Stripe payment
        const { data: stripeData, error: stripeError } = await PaymentService.initializeStripePayment(
          user!.id,
          formData.budget,
          promotedPollId,
          formData.currency
        );
        
        if (stripeError) {
          throw new Error(stripeError);
        }
        
        if (!stripeData) {
          throw new Error('Failed to initialize Stripe payment');
        }
        
        // Set client secret and transaction ID for Stripe Elements
        setClientSecret(stripeData.clientSecret);
        setTransactionId(stripeData.transactionId);
        
        // Don't close modal yet - user needs to complete Stripe payment
        return true;
      } else if (paymentMethodType === 'paystack') {
        // Initialize Paystack payment
        const { data: paystackData, error: paystackError } = await PaymentService.initializePaystackPayment(
          user!.id,
          formData.budget,
          promotedPollId,
          formData.currency
        );
        
        if (paystackError) {
          throw new Error(paystackError);
        }
        
        if (!paystackData || !paystackData.authorizationUrl) {
          throw new Error('Failed to initialize Paystack payment');
        }
        
        // Redirect to Paystack payment page
        window.location.href = paystackData.authorizationUrl;
        
        // Don't close modal or show success message yet - user needs to complete Paystack payment
        return true;
      } else {
        // For other payment methods (PayPal)
        // This would be implemented similarly to Stripe
        successToast('Your poll promotion has been created and is pending payment and approval.');
        onSuccess();
        onClose();
        return true;
      }
    } catch (error) {
      errorToast(error instanceof Error ? error.message : 'Failed to process payment');
      return false;
    }
  };
  
  const handlePayment = async () => {
    if (!user || !selectedPollId || !sponsorId) {
      errorToast('Missing required information');
      return;
    }
    
    setLoading(true);
    
    try {
      // Create the promoted poll
      const { data: promotedPoll, error: promotionError } = await PromotedPollService.createPromotedPoll(
        user.id,
        {
          poll_id: selectedPollId,
          sponsor_id: sponsorId,
          budget_amount: formData.budget,
          target_votes: formData.targetVotes,
          start_date: formData.startDate || undefined,
          end_date: formData.endDate || undefined,
          currency: formData.currency
        }
      );
      
      if (promotionError) {
        throw new Error(promotionError);
      }
      
      if (!promotedPoll) {
        throw new Error('Failed to create promoted poll');
      }
      
      // Get the selected payment method
      const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
      
      if (!selectedMethod) {
        throw new Error('Invalid payment method');
      }
      
      // Initiate payment flow
      const paymentSuccess = await initiatePaymentFlow(promotedPoll.id, selectedMethod.type);
      
      if (!paymentSuccess) {
        // If payment failed, we'll keep the modal open for the user to try again
        setLoading(false);
      }
      
    } catch (error) {
      errorToast(error instanceof Error ? error.message : 'Failed to create promoted poll');
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
  
  // Filter polls based on search term
  const filteredPolls = userPolls.filter(poll => 
    poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (poll.description && poll.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Get currency symbol
  const currencySymbol = getSymbolFromCurrency(formData.currency) || '$';
  
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
            <BarChart3 className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Promote a Poll
          </h2>
        </div>
        
        {/* Stripe Configuration Warning */}
        {stripeLoadError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-1">Payment System Notice</h3>
              <p className="text-yellow-700 text-sm">
                {stripeLoadError}. Credit card payments are currently unavailable, but you can still use other payment methods.
              </p>
            </div>
          </div>
        )}
        
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'select-poll' 
                ? 'bg-primary-600 text-white' 
                : 'bg-primary-100 text-primary-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              step === 'select-poll' ? 'bg-gray-200' : 'bg-primary-600'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'configure' 
                ? 'bg-primary-600 text-white' 
                : step === 'payment'
                ? 'bg-primary-100 text-primary-600'
                : 'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              step === 'payment' ? 'bg-primary-600' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'payment' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              3
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm font-medium">Select Poll</span>
            <span className="text-sm font-medium">Configure</span>
            <span className="text-sm font-medium">Payment</span>
          </div>
        </div>

        {/* Step Content */}
        {step === 'select-poll' && (
          <div className="space-y-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Your Polls
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Search by title or description"
              />
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your polls...</p>
              </div>
            ) : filteredPolls.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Polls Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'No polls match your search criteria.' 
                    : 'You haven\'t created any polls yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {filteredPolls.map(poll => (
                  <div 
                    key={poll.id} 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => handleSelectPoll(poll.id)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{poll.title}</h3>
                    {poll.description && (
                      <p className="text-gray-600 text-sm mb-3">{poll.description}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {poll.total_votes} votes
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(poll.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {step === 'configure' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">How Promotion Works</h3>
                <p className="text-blue-700 text-sm">
                  You'll be charged {currencySymbol}{settings.default_cost_per_vote.toFixed(2)} per vote your poll receives. 
                  Set your budget and we'll promote your poll until you reach your target votes or your budget is spent.
                </p>
              </div>
            </div>
            
            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency *
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  {loadingCurrencies ? (
                    <option value="USD">Loading currencies...</option>
                  ) : (
                    supportedCurrencies.map(curr => (
                      <option key={curr} value={curr}>
                        {curr} {getSymbolFromCurrency(curr) || ''}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select the currency you want to use for this promotion
              </p>
            </div>
            
            {/* Budget Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion Budget *
              </label>
              <div className="flex items-center space-x-4">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <input
                  type="range"
                  min={settings.minimum_budget}
                  max={settings.maximum_budget}
                  step={5}
                  value={formData.budget}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  className="flex-1"
                />
                <div className="w-20">
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleBudgetChange(Number(e.target.value))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-center"
                    min={settings.minimum_budget}
                    max={settings.maximum_budget}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{currencySymbol}{settings.minimum_budget}</span>
                <span>{currencySymbol}{settings.maximum_budget}</span>
              </div>
            </div>
            
            {/* Target Votes (calculated from budget) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Votes
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.targetVotes}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Based on {currencySymbol}{settings.default_cost_per_vote.toFixed(2)} per vote
              </p>
            </div>
            
            {/* Date Range (Optional) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to start immediately after approval
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to run until budget is spent
                </p>
              </div>
            </div>
            
            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Promotion Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">{currencySymbol}{formData.budget.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost per Vote:</span>
                  <span className="font-medium">{currencySymbol}{settings.default_cost_per_vote.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Votes:</span>
                  <span className="font-medium">{formData.targetVotes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {formData.startDate && formData.endDate 
                      ? `${new Date(formData.startDate).toLocaleDateString()} - ${new Date(formData.endDate).toLocaleDateString()}`
                      : 'Until budget is spent'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency:</span>
                  <span className="font-medium">{formData.currency} ({currencySymbol})</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {step === 'payment' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3 mb-6">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">Approval Required</h3>
                <p className="text-yellow-700 text-sm">
                  Your promoted poll will be reviewed by our team before it goes live. 
                  This typically takes 1-2 business days. You'll only be charged once your promotion is approved.
                </p>
              </div>
            </div>
            
            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Payment Method
              </label>
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <div
                    key={method.id}
                    onClick={() => {
                      setSelectedPaymentMethod(method.id);
                      // Reset Stripe state when changing payment method
                      if (method.type !== 'stripe') {
                        setClientSecret(null);
                        setTransactionId(null);
                      }
                    }}
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
                          {method.config.supported_currencies.includes(formData.currency) ? (
                            <span className="text-success-600">
                              Supports {formData.currency}
                            </span>
                          ) : (
                            <span className="text-error-600">
                              Does not support {formData.currency} - payment will be converted to {method.config.default_currency || 'USD'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Stripe Payment Form */}
              {selectedPaymentMethod === paymentMethods.find(m => m.type === 'stripe')?.id && 
               clientSecret && 
               stripeInstance && (
                <div className="mt-6">
                  <Elements stripe={stripeInstance} options={{ clientSecret }}>
                    <StripePaymentForm 
                      amount={formData.budget}
                      transactionId={transactionId || ''}
                      onSuccess={handleStripePaymentSuccess}
                      onError={handleStripePaymentError}
                      currency={formData.currency}
                    />
                  </Elements>
                </div>
              )}
              
              {/* Payment Summary (only show if not using Stripe or Stripe not initialized) */}
              {(selectedPaymentMethod !== paymentMethods.find(m => m.type === 'stripe')?.id || !clientSecret) && (
                <div className="bg-gray-50 p-4 rounded-lg mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Promotion Budget:</span>
                      <span className="font-medium">{currencySymbol}{formData.budget.toFixed(2)}</span>
                    </div>
                    
                    {/* If wallet payment, show points conversion */}
                    {selectedPaymentMethod === paymentMethods.find(m => m.type === 'wallet')?.id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Points Required:</span>
                        <span className="font-medium">
                          {(formData.budget * settings.points_to_usd_conversion).toLocaleString()} points
                        </span>
                      </div>
                    )}
                    
                    {/* Show currency conversion if applicable */}
                    {selectedPaymentMethod && formData.currency !== 'USD' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Currency:</span>
                        <span className="font-medium">
                          {formData.currency} ({currencySymbol})
                        </span>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-gray-200 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-medium">Total:</span>
                        <span className="font-bold text-gray-900">{currencySymbol}{formData.budget.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Insufficient Points Warning */}
              {selectedPaymentMethod === paymentMethods.find(m => m.type === 'wallet')?.id && 
               profile && 
               profile.points < (formData.budget * settings.points_to_usd_conversion) && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start space-x-3 mt-4">
                  <AlertCircle className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-error-800 mb-1">Insufficient Points</h3>
                    <p className="text-error-700 text-sm">
                      You don't have enough points for this payment. You need {(formData.budget * settings.points_to_usd_conversion).toLocaleString()} points, 
                      but you only have {profile.points.toLocaleString()} points. Please select a different payment method or reduce your budget.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step !== 'select-poll' ? (
            <button
              onClick={() => setStep(step === 'configure' ? 'select-poll' : 'configure')}
              className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Back
            </button>
          ) : (
            <div></div> // Empty div to maintain layout
          )}
          
          {step === 'select-poll' && (
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          
          {step === 'configure' && (
            <button
              onClick={handleSubmitConfiguration}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Continue to Payment
            </button>
          )}
          
          {/* Only show the payment button if not using Stripe or Stripe not initialized */}
          {step === 'payment' && 
           (selectedPaymentMethod !== paymentMethods.find(m => m.type === 'stripe')?.id || !clientSecret) && (
            <button
              onClick={handlePayment}
              disabled={loading || (
                selectedPaymentMethod === paymentMethods.find(m => m.type === 'wallet')?.id && 
                profile && 
                profile.points < (formData.budget * settings.points_to_usd_conversion)
              )}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
          )}
        </div>
      </div>
    </div>
  );
};