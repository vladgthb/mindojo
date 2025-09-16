// Hook for Google Sheets data management

import { useState, useCallback, useEffect } from 'react';
import { sheetsService } from '../services/sheetsService';
import { mockService } from '../services/mockService';
import { SheetMetadata, SheetTab, UrlInfo } from '../types';
import { isApiError } from '../services/api';

// Toggle for using mock data during development
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || 
                     import.meta.env.NODE_ENV === 'development';

interface UseSheetDataState {
  isValidating: boolean;
  isLoadingTabs: boolean;
  urlValidation: {
    isValid: boolean | null;
    isValidating: boolean;
    error: string | null;
  };
  tabs: SheetTab[];
  sheetMetadata: SheetMetadata | null;
  error: string | null;
}

const initialState: UseSheetDataState = {
  isValidating: false,
  isLoadingTabs: false,
  urlValidation: {
    isValid: null,
    isValidating: false,
    error: null,
  },
  tabs: [],
  sheetMetadata: null,
  error: null,
};

export const useSheetData = () => {
  const [state, setState] = useState<UseSheetDataState>(initialState);

  // Choose service based on environment
  const service = USE_MOCK_DATA ? mockService : sheetsService;

  // Validate Google Sheets URL
  const validateUrl = useCallback(async (url: string) => {
    if (!url.trim()) {
      setState(prev => ({
        ...prev,
        urlValidation: {
          isValid: null,
          isValidating: false,
          error: null,
        },
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      urlValidation: {
        ...prev.urlValidation,
        isValidating: true,
        error: null,
      },
    }));

    try {
      const response = USE_MOCK_DATA 
        ? await service.parseUrl(url)
        : await service.validateSheet(url);

      if (isApiError(response)) {
        setState(prev => ({
          ...prev,
          urlValidation: {
            isValid: false,
            isValidating: false,
            error: response.error.message,
          },
        }));
        return;
      }

      const isValid = USE_MOCK_DATA 
        ? response.data?.isValid || false
        : response.data?.isValid || false;

      setState(prev => ({
        ...prev,
        urlValidation: {
          isValid,
          isValidating: false,
          error: isValid ? null : (response.data as any)?.message || 'Invalid URL',
        },
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        urlValidation: {
          isValid: false,
          isValidating: false,
          error: error instanceof Error ? error.message : 'Validation failed',
        },
      }));
    }
  }, [service]);

  // Load sheet tabs
  const loadTabs = useCallback(async (url: string): Promise<SheetTab[]> => {
    setState(prev => ({
      ...prev,
      isLoadingTabs: true,
      error: null,
      tabs: [],
      sheetMetadata: null,
    }));

    try {
      const response = await service.getSheetFromUrl(url);

      if (isApiError(response)) {
        setState(prev => ({
          ...prev,
          isLoadingTabs: false,
          error: response.error.message,
        }));
        return [];
      }

      const metadata = response.data!;
      const tabs = metadata.tabs || [];

      setState(prev => ({
        ...prev,
        isLoadingTabs: false,
        tabs,
        sheetMetadata: metadata,
        error: null,
      }));

      return tabs;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sheet tabs';
      setState(prev => ({
        ...prev,
        isLoadingTabs: false,
        error: errorMessage,
      }));
      return [];
    }
  }, [service]);

  // Get tab information
  const getTabInfo = useCallback((tabName: string) => {
    return state.tabs.find(tab => tab.name === tabName) || null;
  }, [state.tabs]);

  // Clear all data
  const clearData = useCallback(() => {
    setState(initialState);
  }, []);

  // Reset error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Get available tab names
  const getTabNames = useCallback(() => {
    return state.tabs.map(tab => tab.name);
  }, [state.tabs]);

  // Check if URL format is valid (client-side validation)
  const isGoogleSheetsUrl = useCallback((url: string): boolean => {
    if (!url) return false;
    
    const patterns = [
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/,
    ];
    
    return patterns.some(pattern => pattern.test(url));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    validateUrl,
    loadTabs,
    getTabInfo,
    getTabNames,
    clearData,
    clearError,
    
    // Utilities
    isGoogleSheetsUrl,
    
    // Config
    isUsingMockData: USE_MOCK_DATA,
  };
};