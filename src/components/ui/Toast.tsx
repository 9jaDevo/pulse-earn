import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Toast as HotToast, toast as hotToast, Toaster as HotToaster } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  t: HotToast;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ t, onDismiss }) => {
  const message = t.message as string;
  const type = (t.data?.type as ToastType) || 'info';

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-error-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-primary-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-500" />;
    }
  };

  const getContainerStyles = () => {
    const baseStyles = 'flex items-center p-4 rounded-lg shadow-xl border max-w-md backdrop-blur-sm';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-success-50/95 border-success-200`;
      case 'error':
        return `${baseStyles} bg-error-50/95 border-error-200`;
      case 'info':
        return `${baseStyles} bg-primary-50/95 border-primary-200`;
      case 'warning':
        return `${baseStyles} bg-warning-50/95 border-warning-200`;
      default:
        return `${baseStyles} bg-white/95 border-gray-200`;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-success-800';
      case 'error':
        return 'text-error-800';
      case 'info':
        return 'text-primary-800';
      case 'warning':
        return 'text-warning-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div
      className={`${getContainerStyles()} animate-enter group`}
      style={{
        animationFillMode: 'forwards',
      }}
      data-state={t.visible ? 'open' : 'closed'}
    >
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className={`flex-1 mr-2 ${getTextColor()} font-medium`}>
        {message}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-500 transition-colors rounded-full p-1.5 hover:bg-gray-200/50 focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const Toaster: React.FC = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        className: '!bg-transparent !shadow-none !p-0 !max-w-none !border-0',
        style: { 
          maxWidth: '420px', 
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          border: 'none'
        },
        duration: 4000
      }}
      gutter={16}
    >
      {(t) => {
        return (
          <Toast
            t={t}
            onDismiss={() => hotToast.dismiss(t.id)}
          />
        );
      }}
    </HotToaster>
  );
};