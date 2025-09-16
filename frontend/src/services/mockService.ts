// Mock service for development and testing

import type { ApiResponse } from './api';
import type {
  SheetMetadata, 
  WaterFlowResult, 
  UrlInfo,
  WaterFlowOptions 
} from '../types';
import { 
  mockSheetMetadata, 
  createMockWaterFlowResult, 
  mockUrlValidation,
  mockErrors,
  mockGrids
} from '../mocks/mockData';

const MOCK_DELAY = 800; // Simulate network delay

class MockService {
  private shouldSimulateError = false;
  private errorType: keyof typeof mockErrors = 'networkError';

  // Toggle error simulation for testing
  simulateError(enabled: boolean, errorType: keyof typeof mockErrors = 'networkError') {
    this.shouldSimulateError = enabled;
    this.errorType = errorType;
  }

  private async delay(ms: number = MOCK_DELAY): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async mockResponse<T>(data: T): Promise<ApiResponse<T>> {
    await this.delay();
    
    if (this.shouldSimulateError) {
      return {
        error: mockErrors[this.errorType]
      };
    }
    
    return { data };
  }

  // Google Sheets mock methods
  async parseUrl(url: string): Promise<ApiResponse<UrlInfo>> {
    const isValidUrl = url.includes('docs.google.com/spreadsheets');
    const mockData = isValidUrl ? mockUrlValidation.valid : mockUrlValidation.invalid;
    
    return this.mockResponse(mockData);
  }

  async getSheetFromUrl(): Promise<ApiResponse<SheetMetadata>> {
    return this.mockResponse(mockSheetMetadata);
  }

  async getTabsFromUrl(): Promise<ApiResponse<SheetMetadata>> {
    return this.mockResponse(mockSheetMetadata);
  }

  async validateSheet(url: string): Promise<ApiResponse<{ isValid: boolean; message: string }>> {
    const isValidUrl = url.includes('docs.google.com/spreadsheets');
    
    return this.mockResponse({
      isValid: isValidUrl,
      message: isValidUrl ? 'Sheet is accessible' : 'Invalid Google Sheets URL format'
    });
  }

  // Water flow analysis mock methods
  async analyzeGrid(
    grid: number[][], 
    options: WaterFlowOptions = {}
  ): Promise<ApiResponse<WaterFlowResult>> {
    // Create a mock result based on the grid
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    
    const mockResult: WaterFlowResult = {
      cells: [
        { x: 0, y: 0, elevation: grid[0][0], coordinate: '(0,0)' },
        { x: cols - 1, y: rows - 1, elevation: grid[rows - 1][cols - 1], coordinate: `(${rows - 1},${cols - 1})` }
      ],
      stats: {
        totalCells: rows * cols,
        flowCells: 2,
        coverage: 2 / (rows * cols),
        processingTime: Math.floor(Math.random() * 50) + 10,
        efficiency: {
          cellsPerMs: Math.floor((rows * cols) / 20),
          algorithmsComplexity: `O(${rows} × ${cols}) = O(${rows * cols})`
        },
        oceanReachability: {
          pacific: Math.floor((rows * cols) * 0.4),
          atlantic: Math.floor((rows * cols) * 0.5),
          intersection: 2,
          pacificOnlyPercent: 0.15,
          atlanticOnlyPercent: 0.25,
          bothOceansPercent: 2 / (rows * cols)
        }
      },
      metadata: {
        gridDimensions: { rows, cols },
        algorithm: 'optimized-reverse-bfs',
        timestamp: new Date().toISOString(),
        processingTime: Math.floor(Math.random() * 50) + 10,
        pacificReachable: Math.floor((rows * cols) * 0.4),
        atlanticReachable: Math.floor((rows * cols) * 0.5),
        intersection: 2,
        configuration: {
          pacificEdges: options.pacificEdges || ['top', 'left'],
          atlanticEdges: options.atlanticEdges || ['bottom', 'right'],
          includeStats: options.includeStats !== false,
          includePaths: options.includePaths || false
        }
      }
    };

    return this.mockResponse(mockResult);
  }

  async analyzeSheetUrl(
    url: string,
    tabName: string = 'Island_5x5'
  ): Promise<ApiResponse<WaterFlowResult>> {
    // Use predefined mock data for known tab names
    const availableGrids = Object.keys(mockGrids);
    const gridName = availableGrids.includes(tabName) ? tabName : 'Island_5x5';
    
    const mockResult = createMockWaterFlowResult(gridName);
    
    return this.mockResponse(mockResult);
  }

  async analyzeFromSheetUrl(
    url: string,
    tabName: string = 'Island_5x5'
  ): Promise<ApiResponse<WaterFlowResult>> {
    return this.analyzeSheetUrl(url, tabName);
  }

  async batchAnalyze(
    grids: number[][][]
  ): Promise<ApiResponse<any>> {
    await this.delay();
    
    const results = grids.map((grid, index) => ({
      index,
      success: true,
      result: {
        cells: [
          { x: 0, y: 0, elevation: grid[0][0], coordinate: '(0,0)' }
        ],
        stats: {
          totalCells: grid.length * (grid[0]?.length || 0),
          flowCells: 1,
          coverage: 1 / (grid.length * (grid[0]?.length || 0)),
          processingTime: Math.floor(Math.random() * 20) + 5
        }
      }
    }));

    return this.mockResponse({
      batchId: `batch_${Date.now()}`,
      totalGrids: grids.length,
      successful: grids.length,
      failed: 0,
      results,
      batchStats: {
        totalProcessingTime: results.length * 15,
        averageTimePerGrid: 15,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Utility methods for testing
  getAvailableGrids(): string[] {
    return Object.keys(mockGrids);
  }

  getGridData(gridName: string): number[][] | null {
    return mockGrids[gridName]?.grid || null;
  }

  resetErrorSimulation(): void {
    this.shouldSimulateError = false;
  }
}

export const mockService = new MockService();