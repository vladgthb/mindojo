// Main application state management hook

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppState, SheetTab, WaterFlowResult } from '../types';

const initialState: AppState = {
  sheetUrl: null,
  selectedTab: null,
  isLoading: false,
  tabs: [],
  analysisResults: null,
  error: null,
  urlValidation: {
    isValid: null,
    isValidating: false,
    error: null,
  },
};

export const useAppState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<AppState>(() => {
    // Initialize state from URL params if available
    const urlFromParams = searchParams.get('url');
    const tabFromParams = searchParams.get('tab');
    
    return {
      ...initialState,
      sheetUrl: urlFromParams,
      selectedTab: tabFromParams,
    };
  });

  // Update URL params when state changes (for shareable links)
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (state.sheetUrl) {
      params.set('url', state.sheetUrl);
    }
    
    if (state.selectedTab) {
      params.set('tab', state.selectedTab);
    }

    // Only update if params actually changed
    const currentParams = searchParams.toString();
    const newParams = params.toString();
    
    if (currentParams !== newParams) {
      setSearchParams(params, { replace: true });
    }
  }, [state.sheetUrl, state.selectedTab, searchParams, setSearchParams]);

  // URL management
  const setSheetUrl = useCallback((url: string | null) => {
    setState(prev => ({
      ...prev,
      sheetUrl: url,
      // Reset related state when URL changes
      tabs: url === prev.sheetUrl ? prev.tabs : [],
      selectedTab: url === prev.sheetUrl ? prev.selectedTab : null,
      analysisResults: null,
      error: null,
    }));
  }, []);

  // Tab management
  const setTabs = useCallback((tabs: SheetTab[]) => {
    setState(prev => ({
      ...prev,
      tabs,
      // Auto-select first tab if none selected
      selectedTab: prev.selectedTab || (tabs.length > 0 ? tabs[0].name : null),
    }));
  }, []);

  const setSelectedTab = useCallback((tabName: string | null) => {
    setState(prev => ({
      ...prev,
      selectedTab: tabName,
      // Clear analysis results when changing tabs
      analysisResults: null,
    }));
  }, []);

  // Loading states
  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  // Error handling
  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // URL validation
  const setUrlValidation = useCallback((validation: AppState['urlValidation']) => {
    setState(prev => ({
      ...prev,
      urlValidation: validation,
    }));
  }, []);

  // Analysis results
  const setAnalysisResults = useCallback((results: WaterFlowResult | null) => {
    setState(prev => ({ ...prev, analysisResults: results }));
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setState(initialState);
    setSearchParams({});
  }, [setSearchParams]);

  // Computed properties
  const canAnalyze = Boolean(
    state.sheetUrl && 
    state.selectedTab && 
    !state.isLoading &&
    state.urlValidation.isValid === true
  );

  const hasValidSheet = Boolean(
    state.sheetUrl && 
    state.tabs.length > 0 && 
    state.urlValidation.isValid === true
  );

  return {
    // State
    ...state,
    
    // Actions
    setSheetUrl,
    setTabs,
    setSelectedTab,
    setLoading,
    setError,
    clearError,
    setUrlValidation,
    setAnalysisResults,
    resetState,
    
    // Computed properties
    canAnalyze,
    hasValidSheet,
  };
};