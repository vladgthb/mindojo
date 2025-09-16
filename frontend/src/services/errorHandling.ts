// Phase 5: Comprehensive error handling service
// Centralized error management for API integration

import type { ApiError } from './apiClient';

export interface ErrorHandlerOptions {
  showNotification?: boolean;
  retryable?: boolean;
  fallbackMessage?: string;
  context?: string;
}

export interface RetryOptions {
  maxRetries: number;
  delay: number;
  backoff: boolean;
}

// Error categories for different handling strategies
export const ErrorCategory = {
  NETWORK: 'network',
  AUTHENTICATION: 'auth', 
  VALIDATION: 'validation',
  RATE_LIMIT: 'rate_limit',
  SERVER_ERROR: 'server',
  NOT_FOUND: 'not_found',
  UNKNOWN: 'unknown'
} as const;

export type ErrorCategory = typeof ErrorCategory[keyof typeof ErrorCategory];

// Map error codes to categories
const ERROR_CATEGORY_MAP: Record<string, ErrorCategory> = {
  'NETWORK_ERROR': ErrorCategory.NETWORK,
  'CONNECTION_FAILED': ErrorCategory.NETWORK,
  'TIMEOUT': ErrorCategory.NETWORK,
  'HTTP_401': ErrorCategory.AUTHENTICATION,
  'HTTP_403': ErrorCategory.AUTHENTICATION,
  'SHEET_ACCESS_ERROR': ErrorCategory.AUTHENTICATION,
  'HTTP_400': ErrorCategory.VALIDATION,
  'INVALID_URL': ErrorCategory.VALIDATION,
  'INVALID_SHEET_URL': ErrorCategory.VALIDATION,
  'HTTP_429': ErrorCategory.RATE_LIMIT,
  'HTTP_500': ErrorCategory.SERVER_ERROR,
  'HTTP_502': ErrorCategory.SERVER_ERROR,
  'HTTP_503': ErrorCategory.SERVER_ERROR,
  'HTTP_404': ErrorCategory.NOT_FOUND,
  'SHEET_NOT_FOUND': ErrorCategory.NOT_FOUND,
  'ANALYSIS_TIMEOUT': ErrorCategory.SERVER_ERROR,
  'ANALYSIS_FAILED': ErrorCategory.SERVER_ERROR
};

// User-friendly error messages with actions
const ERROR_MESSAGES: Record<string, { message: string; action?: string }> = {
  [ErrorCategory.NETWORK]: {
    message: 'Connection failed. Please check your internet connection.',
    action: 'Try again'
  },
  [ErrorCategory.AUTHENTICATION]: {
    message: 'Unable to access the Google Sheet. Please check sharing permissions.',
    action: 'Check permissions'
  },
  [ErrorCategory.VALIDATION]: {
    message: 'The provided information is invalid. Please check and try again.',
    action: 'Correct input'
  },
  [ErrorCategory.RATE_LIMIT]: {
    message: 'Too many requests. Please wait a moment before trying again.',
    action: 'Wait and retry'
  },
  [ErrorCategory.SERVER_ERROR]: {
    message: 'Server error. Please try again later.',
    action: 'Retry later'
  },
  [ErrorCategory.NOT_FOUND]: {
    message: 'The requested resource was not found.',
    action: 'Check URL'
  },
  [ErrorCategory.UNKNOWN]: {
    message: 'An unexpected error occurred.',
    action: 'Try again'
  }
};

// Specific error messages for better UX
const SPECIFIC_ERROR_MESSAGES: Record<string, string> = {
  'SHEET_ACCESS_ERROR': 'Unable to access the Google Sheet. Please make sure the sheet is publicly viewable or shared with the appropriate permissions.',
  'INVALID_SHEET_URL': 'The URL format is not recognized as a valid Google Sheets link. Please copy the URL from your browser address bar.',
  'ANALYSIS_TIMEOUT': 'The water flow analysis is taking longer than expected. This may be due to a large grid size.',
  'SHEET_NOT_FOUND': 'The Google Sheet or tab was not found. Please check the URL and tab name.',
  'HTTP_429': 'Too many requests have been made. Please wait 30 seconds before trying again.',
  'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection and try again.'
};

class ErrorHandler {
  private errorLog: Array<{ timestamp: Date; error: ApiError; context?: string }> = [];
  private maxLogSize = 100;

  // Get error category
  private getErrorCategory(error: ApiError): ErrorCategory {
    return ERROR_CATEGORY_MAP[error.code || ''] || ErrorCategory.UNKNOWN;
  }

  // Get user-friendly error message
  getUserMessage(error: ApiError, context?: string): string {
    // Check for specific error messages first
    if (error.code && SPECIFIC_ERROR_MESSAGES[error.code]) {
      return SPECIFIC_ERROR_MESSAGES[error.code];
    }

    // Fall back to category-based messages
    const category = this.getErrorCategory(error);
    const categoryMessage = ERROR_MESSAGES[category];
    
    return categoryMessage.message;
  }

  // Get suggested action for error
  getSuggestedAction(error: ApiError): string | null {
    const category = this.getErrorCategory(error);
    return ERROR_MESSAGES[category].action || null;
  }

  // Check if error is retryable
  isRetryable(error: ApiError): boolean {
    if (error.retryable !== undefined) {
      return error.retryable;
    }

    const category = this.getErrorCategory(error);
    const retryableCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.SERVER_ERROR
    ];
    return retryableCategories.includes(category as any);
  }

  // Get retry delay based on error type
  getRetryDelay(error: ApiError, attemptNumber: number = 1): number {
    const category = this.getErrorCategory(error);
    
    const baseDelays: Record<ErrorCategory, number> = {
      [ErrorCategory.NETWORK]: 2000,
      [ErrorCategory.RATE_LIMIT]: 30000,
      [ErrorCategory.SERVER_ERROR]: 5000,
      [ErrorCategory.AUTHENTICATION]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.NOT_FOUND]: 0,
      [ErrorCategory.UNKNOWN]: 3000
    };

    const baseDelay = baseDelays[category] || 3000;
    
    // Exponential backoff for retryable errors
    if (this.isRetryable(error)) {
      return baseDelay * Math.pow(2, attemptNumber - 1);
    }
    
    return baseDelay;
  }

  // Log error for debugging
  logError(error: ApiError, context?: string): void {
    const logEntry = {
      timestamp: new Date(),
      error,
      context
    };

    this.errorLog.unshift(logEntry);
    
    // Limit log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console logging in development
    if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      console.group('🚨 API Error');
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Category:', this.getErrorCategory(error));
      console.log('User Message:', this.getUserMessage(error, context));
      console.log('Retryable:', this.isRetryable(error));
      console.groupEnd();
    }
  }

  // Get error statistics
  getErrorStats() {
    const now = Date.now();
    const lastHour = this.errorLog.filter(entry => 
      now - entry.timestamp.getTime() < 3600000
    );

    const errorCounts = this.errorLog.reduce((acc, entry) => {
      const category = this.getErrorCategory(entry.error);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    return {
      totalErrors: this.errorLog.length,
      errorsLastHour: lastHour.length,
      errorsByCategory: errorCounts,
      mostRecentError: this.errorLog[0] || null
    };
  }

  // Clear error log
  clearLog(): void {
    this.errorLog = [];
  }

  // Create notification-ready error object
  createNotification(error: ApiError, context?: string) {
    return {
      message: this.getUserMessage(error, context),
      action: this.getSuggestedAction(error),
      severity: this.getErrorSeverity(error),
      retryable: this.isRetryable(error),
      duration: this.getNotificationDuration(error)
    };
  }

  // Get error severity for notification styling
  private getErrorSeverity(error: ApiError): 'error' | 'warning' | 'info' {
    const category = this.getErrorCategory(error);
    
    if (category === ErrorCategory.SERVER_ERROR || category === ErrorCategory.NETWORK) {
      return 'error';
    }
    
    if (category === ErrorCategory.RATE_LIMIT || category === ErrorCategory.AUTHENTICATION) {
      return 'warning';
    }
    
    return 'info';
  }

  // Get notification duration based on error type
  private getNotificationDuration(error: ApiError): number {
    const category = this.getErrorCategory(error);
    
    const durations: Record<ErrorCategory, number> = {
      [ErrorCategory.NETWORK]: 8000,
      [ErrorCategory.SERVER_ERROR]: 8000,
      [ErrorCategory.RATE_LIMIT]: 10000,
      [ErrorCategory.AUTHENTICATION]: 12000,
      [ErrorCategory.VALIDATION]: 6000,
      [ErrorCategory.NOT_FOUND]: 6000,
      [ErrorCategory.UNKNOWN]: 6000
    };

    return durations[category] || 6000;
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Utility functions
export const handleApiError = (
  error: ApiError, 
  context?: string,
  options: ErrorHandlerOptions = {}
) => {
  errorHandler.logError(error, context);
  
  const notification = errorHandler.createNotification(error, context);
  
  return {
    ...notification,
    ...options
  };
};

export const createRetryFunction = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = { maxRetries: 3, delay: 1000, backoff: true }
) => {
  return async (...args: T): Promise<R> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        if (attempt > options.maxRetries) {
          break;
        }
        
        const delay = options.backoff 
          ? options.delay * Math.pow(2, attempt - 1)
          : options.delay;
          
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
};

export default errorHandler;