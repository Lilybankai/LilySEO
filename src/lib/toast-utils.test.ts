/**
 * @jest-environment jsdom
 */
import * as toastUtils from './toast-utils';
import { toast as sonnerToast } from 'sonner';

// Mock the sonner toast
jest.mock('sonner', () => {
  // Create a mock function with proper type
  const mockToast = jest.fn() as jest.Mock & {
    success: jest.Mock;
    error: jest.Mock;
    info: jest.Mock;
    warning: jest.Mock;
    dismiss: jest.Mock;
  };
  
  // Add the methods to the mock
  mockToast.success = jest.fn();
  mockToast.error = jest.fn();
  mockToast.info = jest.fn();
  mockToast.warning = jest.fn();
  mockToast.dismiss = jest.fn();
  
  return {
    toast: mockToast
  };
});

describe('Toast Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('toast function calls sonnerToast with correct parameters', () => {
    const message = 'Test message';
    const options = { description: 'Test description' };
    
    toastUtils.toast(message, options);
    
    expect(sonnerToast).toHaveBeenCalledWith(message, options);
  });

  test('successToast calls sonnerToast.success with correct parameters', () => {
    const message = 'Success message';
    const options = { description: 'Success description' };
    
    toastUtils.successToast(message, options);
    
    expect(sonnerToast.success).toHaveBeenCalledWith(message, options);
  });

  test('errorToast calls sonnerToast.error with correct parameters', () => {
    const message = 'Error message';
    const options = { description: 'Error description' };
    
    toastUtils.errorToast(message, options);
    
    expect(sonnerToast.error).toHaveBeenCalledWith(message, options);
  });

  test('infoToast calls sonnerToast.info with correct parameters', () => {
    const message = 'Info message';
    const options = { description: 'Info description' };
    
    toastUtils.infoToast(message, options);
    
    expect(sonnerToast.info).toHaveBeenCalledWith(message, options);
  });

  test('warningToast calls sonnerToast.warning with correct parameters', () => {
    const message = 'Warning message';
    const options = { description: 'Warning description' };
    
    toastUtils.warningToast(message, options);
    
    expect(sonnerToast.warning).toHaveBeenCalledWith(message, options);
  });

  test('dismissToast calls sonnerToast.dismiss with provided ID', () => {
    const toastId = 'test-id';
    
    toastUtils.dismissToast(toastId);
    
    expect(sonnerToast.dismiss).toHaveBeenCalledWith(toastId);
  });

  test('dismissToast calls sonnerToast.dismiss with no ID to dismiss all', () => {
    toastUtils.dismissToast();
    
    expect(sonnerToast.dismiss).toHaveBeenCalledWith(undefined);
  });

  test('ToastDurations exports correct duration values', () => {
    expect(toastUtils.ToastDurations).toEqual({
      SHORT: 2000,
      NORMAL: 4000,
      LONG: 8000,
      PERSISTENT: Infinity
    });
  });
}); 