import React, { useState } from 'react';
import { 
  PaymentElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';
import { RefreshCw, CreditCard, AlertCircle } from 'lucide-react';
import getSymbolFromCurrency from 'currency-symbol-map';

interface StripePaymentFormProps {
  amount: number;
  transactionId: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  currency?: string;
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  transactionId,
  onSuccess,
  onError,
  currency = 'USD'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Get currency symbol
  const currencySymbol = getSymbolFromCurrency(currency) || '$';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?section=sponsor&payment_status=success&transaction_id=${transactionId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        setErrorMessage(error.message || 'An unexpected error occurred.');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        onSuccess(paymentIntent.id);
      } else {
        // Payment requires additional action or is processing
        setErrorMessage('Payment is processing. Please wait or check your email for confirmation.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      onError('Payment processing error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <PaymentElement />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-error-700 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-bold text-gray-900">{currencySymbol}{amount.toFixed(2)} {currency}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>Pay {currencySymbol}{amount.toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  );
};