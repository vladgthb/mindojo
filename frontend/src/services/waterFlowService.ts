// Water Flow Analysis API service

import { apiClient, type ApiResponse, getErrorMessage } from './apiClient';
import type { WaterFlowResult, WaterFlowOptions } from '../types';

export interface AnalyzeGridRequest {
  grid: number[][];
  options?: WaterFlowOptions;
}

export interface AnalyzeFromSheetRequest {
  sheetId: string;
  tabName: string;
  options?: WaterFlowOptions;
}

export interface AnalyzeFromSheetUrlRequest {
  url: string;
  tabName?: string;
  options?: WaterFlowOptions;
}

export interface AnalyzeSheetUrlRequest {
  url: string;
  tabName?: string;
  options?: WaterFlowOptions;
}

export interface BatchAnalysisRequest {
  grids: number[][][];
  options?: WaterFlowOptions;
}

export interface BatchAnalysisResult {
  batchId: string;
  totalGrids: number;
  successful: number;
  failed: number;
  results: Array<{
    index: number;
    success: boolean;
    result?: WaterFlowResult;
    error?: string;
  }>;
  batchStats: {
    totalProcessingTime: number;
    averageTimePerGrid: number;
    timestamp: string;
  };
}

class WaterFlowService {
  
  /**
   * Analyze water flow from direct grid data
   */
  async analyzeGrid(
    grid: number[][], 
    options: WaterFlowOptions = {}
  ): Promise<ApiResponse<WaterFlowResult>> {
    return apiClient.post<WaterFlowResult>('/api/water-flow/analyze', {
      grid,
      options: {
        includeStats: true,
        ...options,
      },
    });
  }

  /**
   * Analyze water flow from Google Sheets data
   */
  async analyzeFromSheet(
    sheetId: string,
    tabName: string,
    options: WaterFlowOptions = {}
  ): Promise<ApiResponse<WaterFlowResult>> {
    return apiClient.post<WaterFlowResult>('/api/water-flow/from-sheet', {
      sheetId,
      tabName,
      options: {
        includeStats: true,
        ...options,
      },
    });
  }

  /**
   * Analyze water flow from Google Sheets URL
   */
  async analyzeFromSheetUrl(
    url: string,
    tabName: string = 'Sheet1',
    options: WaterFlowOptions = {}
  ): Promise<ApiResponse<WaterFlowResult>> {
    return apiClient.post<WaterFlowResult>('/api/water-flow/from-sheet-url', {
      url,
      tabName,
      options: {
        includeStats: true,
        ...options,
      },
    });
  }

  /**
   * Analyze water flow directly from Google Sheets URL (simplified)
   * This is the main endpoint for the frontend application
   */
  async analyzeSheetUrl(
    url: string,
    tabName: string = 'Sheet1',
    options: WaterFlowOptions = {}
  ): Promise<ApiResponse<WaterFlowResult>> {
    return apiClient.post<WaterFlowResult>('/api/water-flow/from-sheet-url', {
      url,
      tabName,
      options: {
        includeStats: true,
        ...options,
      },
    });
  }

  /**
   * Analyze multiple grids in batch
   */
  async batchAnalyze(
    grids: number[][][],
    options: WaterFlowOptions = {}
  ): Promise<ApiResponse<BatchAnalysisResult>> {
    return apiClient.post<BatchAnalysisResult>('/api/water-flow/batch', {
      grids: grids.slice(0, 10), // Limit to 10 grids
      options: {
        includeStats: true,
        ...options,
      },
    });
  }

  /**
   * Get analysis statistics by ID (placeholder)
   */
  async getAnalysisStats(analysisId: string): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/api/water-flow/stats/${analysisId}`);
  }

  /**
   * Create default analysis options
   */
  getDefaultOptions(): WaterFlowOptions {
    return {
      pacificEdges: ['top', 'left'],
      atlanticEdges: ['bottom', 'right'],
      includeStats: true,
      includePaths: false,
      includeVisualization: false,
    };
  }

  /**
   * Validate grid data before analysis
   */
  validateGrid(grid: number[][]): { isValid: boolean; error?: string } {
    if (!Array.isArray(grid) || grid.length === 0) {
      return {
        isValid: false,
        error: 'Grid must be a non-empty 2D array',
      };
    }

    const firstRowLength = grid[0]?.length || 0;
    if (firstRowLength === 0) {
      return {
        isValid: false,
        error: 'Grid rows cannot be empty',
      };
    }

    // Check if all rows have the same length
    for (let i = 0; i < grid.length; i++) {
      if (!Array.isArray(grid[i]) || grid[i].length !== firstRowLength) {
        return {
          isValid: false,
          error: `All rows must have the same length. Row ${i} has different length.`,
        };
      }

      // Check if all values are numbers
      for (let j = 0; j < grid[i].length; j++) {
        if (typeof grid[i][j] !== 'number' || isNaN(grid[i][j])) {
          return {
            isValid: false,
            error: `Invalid value at position (${i}, ${j}). All values must be numbers.`,
          };
        }
      }
    }

    return { isValid: true };
  }
}

export const waterFlowService = new WaterFlowService();