import { toast } from 'react-hot-toast';
import type { ToastType } from '../components/ui/Toast';

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Custom hook for showing toast notifications
 */
export const useToast = () => {
  const showToast = (message: string, type: ToastType = 'info', options?: ToastOptions) => {
    return toast(
      message,
      {
        duration: options?.duration || 4000,
        position: options?.position || 'top-right',
        data: { type },
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Ensure unique ID for each toast
      }
    );
  };

  const successToast = (message: string, options?: ToastOptions) => {
    return showToast(message, 'success', options);
  };

  const errorToast = (message: string, options?: ToastOptions) => {
    return showToast(message, 'error', options);
  };

  const infoToast = (message: string, options?: ToastOptions) => {
    return showToast(message, 'info', options);
  };

  const warningToast = (message: string, options?: ToastOptions) => {
    return showToast(message, 'warning', options);
  };

  const dismissToast = (toastId: string) => {
    toast.dismiss(toastId);
  };

  const dismissAllToasts = () => {
    toast.dismiss();
  };

  return {
    showToast,
    successToast,
    errorToast,
    infoToast,
    warningToast,
    dismissToast,
    dismissAllToasts
  };
};