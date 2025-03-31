// Stub file for @paypal/react-paypal-js
export const PayPalScriptProvider = ({ children }) => children;
export const PayPalButtons = () => null;
export const usePayPalScriptReducer = () => [{ isPending: false, isResolved: true, isRejected: false }];

// Any other exports that might be needed
export const FUNDING = {
  PAYPAL: 'paypal',
  CREDIT: 'credit',
  CARD: 'card',
}; 