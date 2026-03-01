/** Web3 Error handling utilities */

import { ref } from 'vue';
import type { useMessage } from 'naive-ui';

/** Common Web3 error codes and messages */
export const WEB3_ERRORS = {
  // Wallet errors
  WALLET_NOT_CONNECTED: {
    code: 'WALLET_NOT_CONNECTED',
    message: 'Please connect your wallet first',
    action: 'Connect wallet'
  },
  WRONG_CHAIN: {
    code: 'WRONG_CHAIN',
    message: 'Please switch to the correct network',
    action: 'Switch network'
  },
  USER_REJECTED: {
    code: 'USER_REJECTED',
    message: 'Request was rejected',
    action: 'Try again'
  },

  // Transaction errors
  INSUFFICIENT_FUNDS: {
    code: 'INSUFFICIENT_FUNDS',
    message: 'Insufficient funds for transaction',
    action: 'Add funds'
  },
  GAS_TOO_LOW: {
    code: 'GAS_TOO_LOW',
    message: 'Gas estimate too low',
    action: 'Increase gas'
  },
  TRANSACTION_FAILED: {
    code: 'TRANSACTION_FAILED',
    message: 'Transaction failed',
    action: 'View details'
  },

  // Contract errors
  CONTRACT_NOT_FOUND: {
    code: 'CONTRACT_NOT_FOUND',
    message: 'Contract not found at address',
    action: 'Verify address'
  },
  INVALID_ABI: {
    code: 'INVALID_ABI',
    message: 'Invalid contract ABI',
    action: 'Check ABI'
  },
  FUNCTION_NOT_FOUND: {
    code: 'FUNCTION_NOT_FOUND',
    message: 'Contract function not found',
    action: 'Verify ABI'
  },

  // Network errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection error',
    action: 'Retry'
  },
  TIMEOUT: {
    code: 'TIMEOUT',
    message: 'Request timed out',
    action: 'Retry'
  }
};

/** Parse error from Web3 operation */
export function parseWeb3Error(error: any): {
  code: string;
  message: string;
  action?: string;
} {
  if (!error) {
    return WEB3_ERRORS.TRANSACTION_FAILED;
  }

  const errorMessage = error.message || error.toString() || '';

  // Parse common errors
  if (errorMessage.includes('User rejected')) {
    return WEB3_ERRORS.USER_REJECTED;
  }
  if (errorMessage.includes('insufficient funds')) {
    return WEB3_ERRORS.INSUFFICIENT_FUNDS;
  }
  if (errorMessage.includes('gas')) {
    return WEB3_ERRORS.GAS_TOO_LOW;
  }
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return WEB3_ERRORS.NETWORK_ERROR;
  }
  if (errorMessage.includes('timeout')) {
    return WEB3_ERRORS.TIMEOUT;
  }

  // Default to transaction failed
  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage.slice(0, 200),
    action: 'View details'
  };
}

/** Show error message with actions */
export function showWeb3Error(error: any, message?: ReturnType<typeof useMessage>) {
  const parsed = parseWeb3Error(error);
  message?.error(parsed.message);

  console.error('[Web3 Error]', parsed.code, parsed.message);

  return parsed;
}

/** Format error for display */
export function formatErrorForDisplay(error: any): string {
  const parsed = parseWeb3Error(error);

  let display = `❌ ${parsed.message}`;

  if (parsed.action) {
    display += `\n📋 ${parsed.action}`;
  }

  return display;
}

/** Retry utility with exponential backoff */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, onRetry } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt < maxRetries) {
        const waitTime = delay * 2 ** attempt;
        onRetry?.(attempt + 1, error);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

/** Loading state manager */
export function useLoadingState() {
  const isLoading = ref(false);
  const loadingText = ref('');

  const startLoading = (text = 'Loading...') => {
    isLoading.value = true;
    loadingText.value = text;
  };

  const stopLoading = () => {
    isLoading.value = false;
    loadingText.value = '';
  };

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading,
    withLoading: async <T>(fn: () => Promise<T>, text?: string) => {
      startLoading(text);
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    }
  };
}
