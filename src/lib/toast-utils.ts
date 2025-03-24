import { toast as sonnerToast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

/**
 * Shows a toast message with standardized styling
 * 
 * @param message Main toast message
 * @param options Toast configuration options
 */
export function toast(message: string, options?: ToastOptions) {
  return sonnerToast(message, options);
}

/**
 * Shows a success toast
 * 
 * @param message Main toast message
 * @param options Toast configuration options
 */
export function successToast(message: string, options?: ToastOptions) {
  return sonnerToast.success(message, options);
}

/**
 * Shows an error toast
 * 
 * @param message Main toast message
 * @param options Toast configuration options
 */
export function errorToast(message: string, options?: ToastOptions) {
  return sonnerToast.error(message, options);
}

/**
 * Shows an info toast
 * 
 * @param message Main toast message
 * @param options Toast configuration options
 */
export function infoToast(message: string, options?: ToastOptions) {
  return sonnerToast.info(message, options);
}

/**
 * Shows a warning toast
 * 
 * @param message Main toast message
 * @param options Toast configuration options
 */
export function warningToast(message: string, options?: ToastOptions) {
  return sonnerToast.warning(message, options);
}

/**
 * Dismiss a specific toast by ID
 * 
 * @param id Toast ID to dismiss
 */
export function dismissToast(id?: string) {
  sonnerToast.dismiss(id);
}

/**
 * Standard toast durations in milliseconds
 */
export const ToastDurations = {
  SHORT: 2000,
  NORMAL: 4000,
  LONG: 8000,
  PERSISTENT: Infinity
};

export default {
  toast,
  success: successToast,
  error: errorToast,
  info: infoToast,
  warning: warningToast,
  dismiss: dismissToast,
  durations: ToastDurations
}; 