// Hook for water flow analysis functionality

import { useState, useCallback } from 'react';
import { waterFlowService } from '../services/waterFlowService';
import { mockService } from '../services/mockService';
import { WaterFlowResult, WaterFlowOptions } from '../types';
import { isApiError } from '../services/api';

// Toggle for using mock data during development
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || 
                     import.meta.env.NODE_ENV === 'development';

interface UseWaterFlowAnalysisState {
  isAnalyzing: boolean;
  results: WaterFlowResult | null;
  error: string | null;
  analysisHistory: WaterFlowResult[];
}

const initialState: UseWaterFlowAnalysisState = {
  isAnalyzing: false,
  results: null,
  error: null,
  analysisHistory: [],
};

export const useWaterFlowAnalysis = () => {
  const [state, setState] = useState<UseWaterFlowAnalysisState>(initialState);

  // Choose service based on environment
  const service = USE_MOCK_DATA ? mockService : waterFlowService;

  // Analyze from Google Sheets URL (main analysis method)
  const analyzeFromUrl = useCallback(async (
    url: string, 
    tabName: string, 
    options: WaterFlowOptions = {}
  ): Promise<WaterFlowResult | null> => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
    }));

    try {
      const response = await service.analyzeSheetUrl(url, tabName, options);

      if (isApiError(response)) {
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: response.error.message,
        }));
        return null;
      }

      const results = response.data!;

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        results,
        error: null,
        analysisHistory: [results, ...prev.analysisHistory.slice(0, 9)], // Keep last 10 results
      }));

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [service]);

  // Analyze direct grid data
  const analyzeGrid = useCallback(async (
    grid: number[][], 
    options: WaterFlowOptions = {}
  ): Promise<WaterFlowResult | null> => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
    }));

    try {
      // Validate grid first
      const validation = waterFlowService.validateGrid(grid);
      if (!validation.isValid) {
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: validation.error || 'Invalid grid data',
        }));
        return null;
      }

      const response = await service.analyzeGrid(grid, options);

      if (isApiError(response)) {
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: response.error.message,
        }));
        return null;
      }

      const results = response.data!;

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        results,
        error: null,
        analysisHistory: [results, ...prev.analysisHistory.slice(0, 9)],
      }));

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Grid analysis failed';
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [service]);

  // Batch analyze multiple grids
  const batchAnalyze = useCallback(async (
    grids: number[][][], 
    options: WaterFlowOptions = {}
  ) => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      error: null,
    }));

    try {
      const response = await service.batchAnalyze(grids, options);

      if (isApiError(response)) {
        setState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: response.error.message,
        }));
        return null;
      }

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: null,
      }));

      return response.data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch analysis failed';
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [service]);

  // Clear current results
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: null,
      error: null,
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      analysisHistory: [],
    }));
  }, []);

  // Get default options
  const getDefaultOptions = useCallback((): WaterFlowOptions => {
    return USE_MOCK_DATA 
      ? mockService.getDefaultOptions?.() || waterFlowService.getDefaultOptions()
      : waterFlowService.getDefaultOptions();
  }, []);

  // Get analysis summary
  const getAnalysisSummary = useCallback(() => {
    if (!state.results) return null;

    const { stats, metadata } = state.results;
    
    return {
      totalCells: stats.totalCells,
      qualifyingCells: stats.flowCells,
      coverage: Math.round(stats.coverage * 100),
      processingTime: stats.processingTime,
      gridSize: `${metadata.gridDimensions.rows}×${metadata.gridDimensions.cols}`,
      algorithm: metadata.algorithm,
    };
  }, [state.results]);

  // Export results as JSON
  const exportResultsAsJson = useCallback(() => {
    if (!state.results) return null;

    const exportData = {
      ...state.results,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `water-flow-analysis-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    return exportData;
  }, [state.results]);

  return {
    // State
    ...state,
    
    // Actions
    analyzeFromUrl,
    analyzeGrid,
    batchAnalyze,
    clearResults,
    clearError,
    clearHistory,
    
    // Utilities
    getDefaultOptions,
    getAnalysisSummary,
    exportResultsAsJson,
    
    // Config
    isUsingMockData: USE_MOCK_DATA,
  };
};