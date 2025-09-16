// HTTP client configuration for backend API integration
// Phase 5: Frontend-Backend Integration

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  retryable?: boolean;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

// Environment configuration
const getBaseURL = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Default to backend server running on port 3001
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // Production URL - to be configured in deployment
  return '/api';
};

const DEFAULT_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10);
const DEFAULT_RETRIES = 3;

// Request cache for GET requests
const requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache TTL in milliseconds
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor() {
    this.baseURL = getBaseURL();
    this.defaultTimeout = DEFAULT_TIMEOUT;
  }

  // Create cache key from URL and body
  private getCacheKey(url: string, method: string, body?: any): string {
    const bodyStr = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyStr}`;
  }

  // Get cached response if available and not expired
  private getCachedResponse(key: string): any | null {
    const cached = requestCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      requestCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Cache response
  private setCachedResponse(key: string, data: any, ttl: number = DEFAULT_CACHE_TTL): void {
    requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Create fetch request with retry logic
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = DEFAULT_RETRIES
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort (timeout) or if it's the last attempt
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        
        if (attempt === retries) {
          break;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Parse error response
  private async parseError(response: Response): Promise<ApiError> {
    try {
      const errorData = await response.json();
      return {
        message: errorData.error || errorData.message || 'An error occurred',
        code: errorData.code || `HTTP_${response.status}`,
        details: errorData.details || errorData,
        retryable: response.status >= 500 || response.status === 429
      };
    } catch (parseError) {
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
        code: `HTTP_${response.status}`,
        retryable: response.status >= 500
      };
    }
  }

  // Generic request method
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = method === 'GET' ? this.getCacheKey(url, method, body) : null;

    // Check cache for GET requests
    if (cacheKey && config.cache !== false) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return { data: cached };
      }
    }

    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body && method !== 'GET') {
      requestInit.body = JSON.stringify(body);
    }

    try {
      const response = await this.fetchWithRetry(
        url, 
        requestInit, 
        config.retries ?? DEFAULT_RETRIES
      );

      if (!response.ok) {
        const error = await this.parseError(response);
        return { error };
      }

      const data = await response.json();

      // Cache successful GET responses
      if (cacheKey && config.cache !== false) {
        this.setCachedResponse(cacheKey, data);
      }

      return { data };
    } catch (error) {
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR',
        retryable: true
      };
      return { error: apiError };
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, config);
  }

  async put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body, config);
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { cache: false });
      return !response.error;
    } catch {
      return false;
    }
  }

  // Clear cache
  clearCache(): void {
    requestCache.clear();
  }

  // Update base URL (useful for testing)
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  // Get current configuration
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.defaultTimeout,
      cacheSize: requestCache.size
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Utility function to check if error is retryable
export const isRetryableError = (error: ApiError): boolean => {
  return error.retryable === true;
};

// Error mapping to user-friendly messages
export const getErrorMessage = (error: ApiError): string => {
  const errorMessages: Record<string, string> = {
    'SHEET_ACCESS_ERROR': 'Unable to access the Google Sheet. Please check sharing permissions.',
    'SHEET_NOT_FOUND': 'The requested sheet or tab was not found.',
    'INVALID_URL': 'Please enter a valid Google Sheets URL.',
    'INVALID_SHEET_URL': 'The URL format is not recognized as a valid Google Sheets link.',
    'ANALYSIS_TIMEOUT': 'Analysis is taking longer than expected. Please try again.',
    'ANALYSIS_FAILED': 'The water flow analysis could not be completed.',
    'NETWORK_ERROR': 'Connection failed. Please check your internet connection.',
    'HTTP_429': 'Too many requests. Please wait a moment before trying again.',
    'HTTP_500': 'Server error. Please try again later.',
    'HTTP_503': 'Service temporarily unavailable. Please try again later.'
  };

  return errorMessages[error.code || ''] || error.message || 'An unexpected error occurred.';
};

export default apiClient;