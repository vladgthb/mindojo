// Phase 5: Backward compatibility layer for existing API usage
// Re-exports from the new apiClient for seamless transition

export {
  apiClient,
  type ApiResponse,
  type ApiError,
  type RequestConfig,
  getErrorMessage,
  isRetryableError
} from './apiClient';

// Import types for use in functions
import type { ApiResponse, ApiError } from './apiClient';

// Response helpers for backward compatibility
export const isApiError = <T>(response: ApiResponse<T>): response is { error: ApiError } => {
  return 'error' in response && response.error !== undefined;
};

export const handleApiResponse = <T>(
  response: ApiResponse<T>,
  onSuccess: (data: T) => void,
  onError: (error: ApiError) => void
) => {
  if (isApiError(response)) {
    onError(response.error);
  } else if (response.data) {
    onSuccess(response.data);
  }
};