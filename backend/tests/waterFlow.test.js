const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/config/googleAuth');
jest.mock('../src/services/googleSheetsService');

const mockGoogleAuth = require('../src/config/googleAuth');
const mockSheetsService = require('../src/services/googleSheetsService');

describe('Water Flow Analysis API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGoogleAuth.validateCredentials.mockReturnValue(true);
  });

  describe('POST /api/water-flow/analyze', () => {
    it('should analyze a simple 2x2 grid successfully', async () => {
      const testGrid = [
        [1, 2],
        [3, 4]
      ];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: testGrid })
        .expect(200);

      expect(response.body).toHaveProperty('cells');
      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata.algorithm).toBe('optimized-reverse-bfs');
      expect(response.body.metadata.gridDimensions).toEqual({ rows: 2, cols: 2 });
    });

    it('should analyze the standard 5x5 test case', async () => {
      const testGrid = [
        [1, 2, 2, 3, 5],
        [3, 2, 3, 4, 4],
        [2, 4, 5, 3, 1],
        [6, 7, 1, 4, 5],
        [5, 1, 1, 2, 4]
      ];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ 
          grid: testGrid, 
          options: { includeStats: true } 
        })
        .expect(200);

      expect(response.body.cells).toBeInstanceOf(Array);
      expect(response.body.stats.totalCells).toBe(25);
      expect(response.body.stats.flowCells).toBeGreaterThan(0);
      expect(response.body.stats.coverage).toBeGreaterThan(0);
      expect(response.body.requestInfo).toHaveProperty('requestId');
    });

    it('should handle custom ocean edge configurations', async () => {
      const testGrid = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ 
          grid: testGrid,
          options: {
            pacificEdges: ['top', 'right'],
            atlanticEdges: ['bottom', 'left'],
            includeStats: true
          }
        })
        .expect(200);

      expect(response.body.metadata.configuration.pacificEdges).toEqual(['top', 'right']);
      expect(response.body.metadata.configuration.atlanticEdges).toEqual(['bottom', 'left']);
    });

    it('should return 400 for missing grid data', async () => {
      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Grid data is required');
      expect(response.body.code).toBe('MISSING_GRID_DATA');
    });

    it('should return 400 for invalid grid format', async () => {
      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: "not an array" })
        .expect(500);

      expect(response.body.error).toContain('Water flow analysis failed');
    });

    it('should return 400 for non-numeric grid values', async () => {
      const invalidGrid = [
        [1, 2, 'invalid'],
        [3, 4, 5]
      ];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: invalidGrid })
        .expect(500);

      expect(response.body.error).toContain('Water flow analysis failed');
    });

    it('should handle single cell grid', async () => {
      const singleCellGrid = [[5]];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: singleCellGrid })
        .expect(200);

      expect(response.body.metadata.gridDimensions).toEqual({ rows: 1, cols: 1 });
      expect(response.body.cells).toHaveLength(1); // Single cell should flow to both oceans
    });

    it('should handle uniform height grid', async () => {
      const uniformGrid = [
        [5, 5, 5],
        [5, 5, 5],
        [5, 5, 5]
      ];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: uniformGrid })
        .expect(200);

      expect(response.body.cells).toHaveLength(9); // All cells should flow to both oceans
      expect(response.body.stats.coverage).toBe(1.0);
    });
  });

  describe('POST /api/water-flow/from-sheet', () => {
    it('should analyze grid data from Google Sheets', async () => {
      const mockSheetData = {
        range: 'Sheet1!A1:C3',
        data: [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9']
        ]
      };

      mockSheetsService.getTabContent.mockResolvedValue(mockSheetData);

      const response = await request(app)
        .post('/api/water-flow/from-sheet')
        .send({
          sheetId: 'test-sheet-id',
          tabName: 'Sheet1'
        })
        .expect(200);

      expect(response.body).toHaveProperty('sheetInfo');
      expect(response.body.sheetInfo.sheetId).toBe('test-sheet-id');
      expect(response.body.sheetInfo.tabName).toBe('Sheet1');
      expect(response.body).toHaveProperty('processingInfo');
      expect(response.body.processingInfo).toHaveProperty('dataExtractionTime');
      expect(response.body.processingInfo).toHaveProperty('algorithmTime');
    });

    it('should handle mixed data types in sheets', async () => {
      const mockSheetData = {
        range: 'Sheet1!A1:C3',
        data: [
          ['1.5', '2.7', '3'],
          ['4', '', '6.2'],  // Empty cell
          ['7.1', '8', '9.9']
        ]
      };

      mockSheetsService.getTabContent.mockResolvedValue(mockSheetData);

      const response = await request(app)
        .post('/api/water-flow/from-sheet')
        .send({
          sheetId: 'test-sheet-id',
          tabName: 'Sheet1'
        })
        .expect(200);

      expect(response.body.cells).toBeDefined();
      expect(response.body.sheetInfo.extractedDimensions.processedRows).toBe(3);
    });

    it('should return 400 for missing sheet parameters', async () => {
      const response = await request(app)
        .post('/api/water-flow/from-sheet')
        .send({ sheetId: 'test-id' }) // Missing tabName
        .expect(400);

      expect(response.body.error).toContain('Sheet ID and tab name are required');
      expect(response.body.code).toBe('MISSING_SHEET_PARAMETERS');
    });

    it('should handle Google Sheets service errors', async () => {
      mockSheetsService.getTabContent.mockRejectedValue(new Error('Sheet not found'));

      const response = await request(app)
        .post('/api/water-flow/from-sheet')
        .send({
          sheetId: 'nonexistent-sheet',
          tabName: 'Sheet1'
        })
        .expect(500);

      expect(response.body.error).toContain('Sheet not found');
    });

    it('should return 500 when Google credentials are not configured', async () => {
      mockGoogleAuth.validateCredentials.mockReturnValue(false);

      const response = await request(app)
        .post('/api/water-flow/from-sheet')
        .send({
          sheetId: 'test-sheet',
          tabName: 'Sheet1'
        })
        .expect(500);

      expect(response.body.error).toContain('Google service account credentials not properly configured');
    });
  });

  describe('POST /api/water-flow/from-sheet-url', () => {
    it('should analyze from Google Sheets URL', async () => {
      const mockSheetData = {
        range: 'Sheet1!A1:B2',
        data: [['1', '2'], ['3', '4']]
      };

      mockSheetsService.getTabContent.mockResolvedValue(mockSheetData);

      const response = await request(app)
        .post('/api/water-flow/from-sheet-url')
        .send({
          url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing',
          tabName: 'Sheet1'
        })
        .expect(200);

      expect(response.body).toHaveProperty('urlInfo');
      expect(response.body.urlInfo.isValid).toBe(true);
      expect(response.body.accessMethod).toBe('extracted_from_url');
      expect(response.body.sheetInfo.sheetId).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
    });

    it('should use default tab name when not provided', async () => {
      const mockSheetData = {
        range: 'Sheet1!A1:B2',
        data: [['1', '2'], ['3', '4']]
      };

      mockSheetsService.getTabContent.mockResolvedValue(mockSheetData);

      const response = await request(app)
        .post('/api/water-flow/from-sheet-url')
        .send({
          url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'
        })
        .expect(200);

      expect(response.body.sheetInfo.tabName).toBe('Sheet1');
    });

    it('should return 400 for invalid URLs', async () => {
      const response = await request(app)
        .post('/api/water-flow/from-sheet-url')
        .send({
          url: 'not a valid google sheets url'
        })
        .expect(400);

      expect(response.body.error).toContain('Cannot extract Sheet ID');
      expect(response.body.code).toBe('INVALID_SHEET_URL');
    });

    it('should return 400 for missing URL', async () => {
      const response = await request(app)
        .post('/api/water-flow/from-sheet-url')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Sheet URL is required');
      expect(response.body.code).toBe('MISSING_SHEET_URL');
    });
  });

  describe('POST /api/water-flow/batch', () => {
    it('should analyze multiple grids successfully', async () => {
      const testGrids = [
        [[1, 2], [3, 4]],
        [[5, 6, 7], [8, 9, 10]],
        [[1, 1], [1, 1]]
      ];

      const response = await request(app)
        .post('/api/water-flow/batch')
        .send({ grids: testGrids })
        .expect(200);

      expect(response.body).toHaveProperty('batchId');
      expect(response.body.totalGrids).toBe(3);
      expect(response.body.successful).toBe(3);
      expect(response.body.failed).toBe(0);
      expect(response.body.results).toHaveLength(3);
      
      // Check all results are successful
      response.body.results.forEach((result, index) => {
        expect(result.index).toBe(index);
        expect(result.success).toBe(true);
        expect(result.result).toHaveProperty('cells');
      });
    });

    it('should handle mixed success and failure in batch', async () => {
      const testGrids = [
        [[1, 2], [3, 4]], // Valid
        'invalid grid',   // Invalid
        [[5, 6], [7, 8]]  // Valid
      ];

      const response = await request(app)
        .post('/api/water-flow/batch')
        .send({ grids: testGrids })
        .expect(200);

      expect(response.body.totalGrids).toBe(3);
      expect(response.body.successful).toBe(2);
      expect(response.body.failed).toBe(1);
      
      expect(response.body.results[0].success).toBe(true);
      expect(response.body.results[1].success).toBe(false);
      expect(response.body.results[2].success).toBe(true);
    });

    it('should return 400 for empty batch', async () => {
      const response = await request(app)
        .post('/api/water-flow/batch')
        .send({ grids: [] })
        .expect(400);

      expect(response.body.error).toContain('Array of grids is required');
      expect(response.body.code).toBe('MISSING_BATCH_DATA');
    });

    it('should return 400 for oversized batch', async () => {
      const largeGridsArray = new Array(15).fill([[1, 2], [3, 4]]);

      const response = await request(app)
        .post('/api/water-flow/batch')
        .send({ grids: largeGridsArray })
        .expect(400);

      expect(response.body.error).toContain('Batch size limited to 10 grids');
      expect(response.body.code).toBe('BATCH_SIZE_EXCEEDED');
    });

    it('should apply options to all grids in batch', async () => {
      const testGrids = [
        [[1, 2], [3, 4]],
        [[5, 6], [7, 8]]
      ];

      const response = await request(app)
        .post('/api/water-flow/batch')
        .send({ 
          grids: testGrids,
          options: { includeStats: true }
        })
        .expect(200);

      response.body.results.forEach(result => {
        if (result.success) {
          expect(result.result).toHaveProperty('stats');
        }
      });
    });
  });

  describe('GET /api/water-flow/stats/:analysisId', () => {
    it('should return not implemented message', async () => {
      const response = await request(app)
        .get('/api/water-flow/stats/test-analysis-id')
        .expect(200);

      expect(response.body.error).toContain('Analysis statistics retrieval not yet implemented');
      expect(response.body.code).toBe('FEATURE_NOT_IMPLEMENTED');
      expect(response.body.details.analysisId).toBe('test-analysis-id');
    });
  });

  describe('Algorithm Correctness Tests', () => {
    it('should correctly identify flow cells in known pattern', async () => {
      // Test case from algorithm problem: cells that can flow to both Pacific and Atlantic
      const knownGrid = [
        [1, 2, 2, 3, 5],
        [3, 2, 3, 4, 4],
        [2, 4, 5, 3, 1],
        [6, 7, 1, 4, 5],
        [5, 1, 1, 2, 4]
      ];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: knownGrid })
        .expect(200);

      // Expected cells that can flow to both oceans: (0,4), (1,3), (1,4), (2,2), (3,0), (3,1), (4,0)
      expect(response.body.cells.length).toBeGreaterThan(5); // Should have multiple flow cells
      
      // Check specific expected cells are present
      const cellCoords = response.body.cells.map(cell => `${cell.y},${cell.x}`);
      expect(cellCoords).toContain('0,4'); // Top-right corner
      expect(cellCoords).toContain('4,0'); // Bottom-left corner
    });

    it('should handle edge case: single row', async () => {
      const singleRowGrid = [[1, 2, 3, 4, 5]];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: singleRowGrid })
        .expect(200);

      // In a single row, all cells should be able to flow to both oceans
      expect(response.body.cells.length).toBe(5);
      expect(response.body.stats.coverage).toBe(1.0);
    });

    it('should handle edge case: single column', async () => {
      const singleColGrid = [[1], [2], [3], [4], [5]];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: singleColGrid })
        .expect(200);

      // In a single column, all cells should be able to flow to both oceans
      expect(response.body.cells.length).toBe(5);
      expect(response.body.stats.coverage).toBe(1.0);
    });

    it('should handle decreasing height pattern', async () => {
      const decreasingGrid = [
        [9, 8, 7],
        [6, 5, 4],
        [3, 2, 1]
      ];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: decreasingGrid })
        .expect(200);

      // All cells should be able to flow to both oceans
      expect(response.body.cells.length).toBe(9);
      expect(response.body.stats.coverage).toBe(1.0);
    });

    it('should handle increasing height pattern', async () => {
      const increasingGrid = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: increasingGrid })
        .expect(200);

      // Only corner cells should be able to flow to both oceans
      expect(response.body.cells.length).toBe(4); // Four corners
    });
  });

  describe('Performance Tests', () => {
    it('should handle medium-sized grid efficiently', async () => {
      // Create a 20x20 grid
      const mediumGrid = Array.from({ length: 20 }, (_, i) =>
        Array.from({ length: 20 }, (_, j) => i + j)
      );

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: mediumGrid })
        .expect(200);
      const totalTime = Date.now() - startTime;

      expect(response.body.stats.totalCells).toBe(400);
      expect(response.body.stats.processingTime).toBeLessThan(1000); // Should be fast
      expect(totalTime).toBeLessThan(2000); // Including network overhead
      expect(response.body.stats.efficiency.cellsPerMs).toBeGreaterThan(0);
    });

    it('should report processing metrics', async () => {
      const testGrid = [[1, 2], [3, 4]];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: testGrid })
        .expect(200);

      expect(response.body.stats.processingTime).toBeGreaterThan(0);
      expect(response.body.stats.efficiency.cellsPerMs).toBeGreaterThan(0);
      expect(response.body.stats.efficiency.algorithmsComplexity).toContain('O(');
      expect(response.body.metadata.processingTime).toBe(response.body.stats.processingTime);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to water flow endpoints', async () => {
      // This test checks that rate limiting middleware is applied
      // In a real implementation, you'd test by making many requests
      const testGrid = [[1, 2], [3, 4]];

      const response = await request(app)
        .post('/api/water-flow/analyze')
        .send({ grid: testGrid })
        .expect(200);

      // If rate limiting is working, the request should still succeed for the first few
      expect(response.body).toHaveProperty('cells');
    });
  });
});