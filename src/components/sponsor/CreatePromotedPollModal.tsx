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
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PollService } from '../../services/pollService';
import { PromotedPollService } from '../../services/promotedPollService';
import { PaymentService } from '../../services/paymentService';
import { useToast } from '../../hooks/useToast';
import type { Poll, PaymentMethod } from '../../types/api';

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
    endDate: ''
  });
  
  // Load user's polls and payment methods
  useEffect(() => {
    if (user) {
      fetchUserPolls();
      fetchPaymentMethods();
      fetchSettings();
    }
  }, [user]);
  
  // Update target votes when budget changes
  useEffect(() => {
    if (settings.default_cost_per_vote > 0) {
      const targetVotes = Math.floor(formData.budget / settings.default_cost_per_vote);
      setFormData(prev => ({ ...prev, targetVotes }));
    }
  }, [formData.budget, settings.default_cost_per_vote]);
  
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
  
  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await PaymentService.getPaymentMethods();
      
      if (error) {
        errorToast(error);
        return;
      }
      
      setPaymentMethods(data || []);
      
      // Default to wallet if available
      const walletMethod = data?.find(m => m.type === 'wallet');
      if (walletMethod) {
        setSelectedPaymentMethod(walletMethod.id);
      } else if (data && data.length > 0) {
        setSelectedPaymentMethod(data[0].id);
      }
    } catch (err) {
      errorToast('Failed to load payment methods');
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
          end_date: formData.endDate || undefined
        }
      );
      
      if (promotionError) {
        throw new Error(promotionError);
      }
      
      if (!promotedPoll) {
        throw new Error('Failed to create promoted poll');
      }
      
      // Process payment based on selected method
      const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
      
      if (!selectedMethod) {
        throw new Error('Invalid payment method');
      }
      
      if (selectedMethod.type === 'wallet') {
        // Process wallet payment
        const { error: paymentError } = await PaymentService.processWalletPayment(
          user.id,
          formData.budget,
          promotedPoll.id
        );
        
        if (paymentError) {
          throw new Error(paymentError);
        }
        
        successToast('Payment successful! Your poll promotion is pending approval.');
      } else {
        // For other payment methods, we would redirect to the payment gateway
        // This is a placeholder for now
        successToast('Your poll promotion has been created and is pending payment and approval.');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      errorToast(err instanceof Error ? err.message : 'Failed to create promoted poll');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter polls based on search term
  const filteredPolls = userPolls.filter(poll => 
    poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (poll.description && poll.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
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
                  You'll be charged ${settings.default_cost_per_vote.toFixed(2)} per vote your poll receives. 
                  Set your budget and we'll promote your poll until you reach your target votes or your budget is spent.
                </p>
              </div>
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
                <span>${settings.minimum_budget}</span>
                <span>${settings.maximum_budget}</span>
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
                Based on ${settings.default_cost_per_vote.toFixed(2)} per vote
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
                  <span className="font-medium">${formData.budget.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost per Vote:</span>
                  <span className="font-medium">${settings.default_cost_per_vote.toFixed(2)}</span>
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Promotion Budget:</span>
                  <span className="font-medium">${formData.budget.toFixed(2)}</span>
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
                
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-medium">Total:</span>
                    <span className="font-bold text-gray-900">${formData.budget.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Insufficient Points Warning */}
            {selectedPaymentMethod === paymentMethods.find(m => m.type === 'wallet')?.id && 
             profile && 
             profile.points < (formData.budget * settings.points_to_usd_conversion) && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start space-x-3">
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
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step !== 'select-poll' ? (
            <button
              onClick={() => setStep(step === 'configure' ? 'select-poll' : 'configure')}
              className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
          
          {step === 'payment' && (
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