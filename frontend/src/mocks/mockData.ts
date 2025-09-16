// Mock data for development and testing

import type { 
  SheetMetadata, 
  WaterFlowResult, 
  FlowCell, 
  MockGrid, 
  MockSheetData
} from '../types';

// Mock Google Sheets data
export const mockSheetMetadata: SheetMetadata = {
  sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  title: 'Island Topography Analysis - Demo',
  tabs: [
    { 
      id: 0, 
      name: 'Island_5x5', 
      rowCount: 5, 
      columnCount: 5,
      gridProperties: { rowCount: 5, columnCount: 5 }
    },
    { 
      id: 1, 
      name: 'Mountain_10x10', 
      rowCount: 10, 
      columnCount: 10,
      gridProperties: { rowCount: 10, columnCount: 10 }
    },
    { 
      id: 2, 
      name: 'Valley_20x20', 
      rowCount: 20, 
      columnCount: 20,
      gridProperties: { rowCount: 20, columnCount: 20 }
    },
    { 
      id: 3, 
      name: 'Complex_15x15', 
      rowCount: 15, 
      columnCount: 15,
      gridProperties: { rowCount: 15, columnCount: 15 }
    },
  ],
  lastUpdated: '2024-01-15T10:30:00Z',
  urlInfo: {
    isValid: true,
    sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    originalUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing',
    isPublicLink: true,
    accessType: 'public_sharing'
  },
  accessMethod: 'extracted_from_url'
};

// Mock elevation grids
export const mockGrids: Record<string, MockGrid> = {
  'Island_5x5': {
    name: 'Island_5x5',
    size: '5x5',
    grid: [
      [1, 2, 2, 3, 5],
      [3, 2, 3, 4, 4], 
      [2, 4, 5, 3, 1],
      [6, 7, 1, 4, 5],
      [5, 1, 1, 2, 4]
    ],
    expectedCells: [
      { x: 4, y: 0, elevation: 5, coordinate: '(0,4)' },
      { x: 3, y: 1, elevation: 4, coordinate: '(1,3)' },
      { x: 4, y: 1, elevation: 4, coordinate: '(1,4)' },
      { x: 2, y: 2, elevation: 5, coordinate: '(2,2)' },
      { x: 0, y: 3, elevation: 6, coordinate: '(3,0)' },
      { x: 1, y: 3, elevation: 7, coordinate: '(3,1)' },
      { x: 0, y: 4, elevation: 5, coordinate: '(4,0)' }
    ]
  },
  'Mountain_10x10': {
    name: 'Mountain_10x10',
    size: '10x10',
    grid: [
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      [4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      [5, 6, 7, 8, 15, 14, 13, 12, 11, 10],
      [6, 7, 8, 9, 14, 15, 14, 13, 12, 11],
      [7, 8, 9, 10, 13, 14, 15, 14, 13, 12],
      [8, 9, 10, 11, 12, 13, 14, 15, 14, 13],
      [9, 10, 11, 12, 11, 12, 13, 14, 15, 14],
      [10, 11, 12, 13, 10, 11, 12, 13, 14, 15]
    ]
  },
  'Valley_20x20': {
    name: 'Valley_20x20',
    size: '20x20',
    grid: Array.from({ length: 20 }, (_, i) =>
      Array.from({ length: 20 }, (_, j) => {
        // Create a valley pattern with hills on edges
        const distanceFromEdge = Math.min(i, j, 19 - i, 19 - j);
        const centerDistance = Math.sqrt(Math.pow(i - 10, 2) + Math.pow(j - 10, 2));
        return Math.max(1, Math.floor(5 + distanceFromEdge * 2 - centerDistance * 0.3));
      })
    )
  },
  'Complex_15x15': {
    name: 'Complex_15x15',
    size: '15x15',
    grid: Array.from({ length: 15 }, (_, i) =>
      Array.from({ length: 15 }, (_, j) => {
        // Complex terrain with multiple peaks and valleys
        const x = i / 15 * 4 * Math.PI;
        const y = j / 15 * 4 * Math.PI;
        return Math.max(1, Math.floor(10 + 
          5 * Math.sin(x) * Math.cos(y) + 
          3 * Math.cos(x * 2) * Math.sin(y * 2) +
          Math.random() * 2 - 1
        ));
      })
    )
  }
};

// Mock water flow analysis result
export const createMockWaterFlowResult = (gridName: string): WaterFlowResult => {
  const mockGrid = mockGrids[gridName];
  const grid = mockGrid.grid;
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Generate some qualifying cells (simplified logic for demo)
  const qualifyingCells: FlowCell[] = mockGrid.expectedCells || [
    { x: 0, y: 0, elevation: grid[0][0], coordinate: '(0,0)' },
    { x: cols - 1, y: rows - 1, elevation: grid[rows - 1][cols - 1], coordinate: `(${rows - 1},${cols - 1})` }
  ];

  return {
    cells: qualifyingCells,
    stats: {
      totalCells: rows * cols,
      flowCells: qualifyingCells.length,
      coverage: qualifyingCells.length / (rows * cols),
      processingTime: Math.floor(Math.random() * 50) + 10,
      efficiency: {
        cellsPerMs: Math.floor((rows * cols) / 20),
        algorithmsComplexity: `O(${rows} × ${cols}) = O(${rows * cols})`
      },
      oceanReachability: {
        pacific: Math.floor((rows * cols) * 0.4),
        atlantic: Math.floor((rows * cols) * 0.5),
        intersection: qualifyingCells.length,
        pacificOnlyPercent: 0.15,
        atlanticOnlyPercent: 0.25,
        bothOceansPercent: qualifyingCells.length / (rows * cols)
      }
    },
    metadata: {
      gridDimensions: { rows, cols },
      algorithm: 'optimized-reverse-bfs',
      timestamp: new Date().toISOString(),
      processingTime: Math.floor(Math.random() * 50) + 10,
      pacificReachable: Math.floor((rows * cols) * 0.4),
      atlanticReachable: Math.floor((rows * cols) * 0.5),
      intersection: qualifyingCells.length,
      configuration: {
        pacificEdges: ['top', 'left'],
        atlanticEdges: ['bottom', 'right'],
        includeStats: true,
        includePaths: false
      }
    },
    input: {
      url: mockSheetMetadata.urlInfo!.originalUrl,
      sheetId: mockSheetMetadata.sheetId,
      tabName: gridName,
      urlInfo: mockSheetMetadata.urlInfo!
    },
    sheetInfo: {
      sheetId: mockSheetMetadata.sheetId,
      tabName: gridName,
      originalRange: `${gridName}!A1:${String.fromCharCode(65 + cols - 1)}${rows}`,
      extractedGrid: {
        originalRows: rows,
        originalCols: cols,
        processedRows: rows,
        processedCols: cols,
        totalCells: rows * cols
      }
    },
    performance: {
      requestId: `wf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      sheetExtractionTime: Math.floor(Math.random() * 500) + 200,
      gridConversionTime: Math.floor(Math.random() * 100) + 20,
      algorithmProcessingTime: Math.floor(Math.random() * 50) + 10,
      totalTime: Math.floor(Math.random() * 600) + 300,
      timestamp: new Date().toISOString()
    }
  };
};

// Mock sheet data structure
export const mockSheetData: MockSheetData = {
  tabs: mockSheetMetadata.tabs,
  grids: mockGrids
};

// Mock URL validation responses
export const mockUrlValidation = {
  valid: {
    isValid: true,
    sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    originalUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing',
    isPublicLink: true,
    accessType: 'public_sharing'
  },
  invalid: {
    isValid: false,
    sheetId: '',
    originalUrl: 'https://invalid-url.com/document',
    isPublicLink: false,
    accessType: 'invalid'
  }
};

// Demo URLs for testing
export const demoUrls = [
  'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing',
  'https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3/edit',
  'https://docs.google.com/spreadsheets/d/1ExampleSheetForWaterFlowAnalysisDemo123456789/view'
];

// Error scenarios for testing
export const mockErrors = {
  networkError: {
    message: 'Network error - unable to connect to server',
    code: 'NETWORK_ERROR'
  },
  invalidUrl: {
    message: 'Cannot extract Sheet ID from the provided URL',
    code: 'INVALID_SHEET_URL',
    details: {
      supportedFormats: [
        'https://docs.google.com/spreadsheets/d/SHEET_ID/edit?usp=sharing',
        'https://docs.google.com/spreadsheets/d/SHEET_ID/edit'
      ]
    }
  },
  accessDenied: {
    message: 'Access denied to the Google Sheet',
    code: 'SHEET_ACCESS_DENIED',
    details: {
      solution: 'Share the sheet with the service account or make it publicly viewable'
    }
  },
  sheetNotFound: {
    message: 'Sheet or tab not found',
    code: 'SHEET_NOT_FOUND',
    details: {
      suggestion: 'Ensure the sheet is publicly accessible'
    }
  }
};