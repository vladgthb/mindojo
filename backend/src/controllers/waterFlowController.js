const waterFlowService = require('../services/waterFlowService');
const googleSheetsService = require('../services/googleSheetsService');
const SheetUrlParser = require('../utils/sheetUrlParser');

class WaterFlowController {
  constructor() {
    // Bind methods to preserve 'this' context when passed to Express routes
    this.analyzeGrid = this.analyzeGrid.bind(this);
    this.analyzeFromSheet = this.analyzeFromSheet.bind(this);
    this.analyzeFromSheetUrl = this.analyzeFromSheetUrl.bind(this);
    this.batchAnalyze = this.batchAnalyze.bind(this);
    this.getAnalysisStats = this.getAnalysisStats.bind(this);
  }

  /**
   * Analyze water flow from direct grid data
   * POST /api/water-flow/analyze
   */
  async analyzeGrid(req, res) {
    try {
      const { grid, options = {} } = req.body;

      if (!grid) {
        return res.status(400).json({
          error: 'Grid data is required in request body',
          code: 'MISSING_GRID_DATA',
          details: { timestamp: new Date().toISOString() }
        });
      }

      // Add request tracking
      const requestId = this._generateRequestId();
      const startTime = Date.now();

      console.log(`[WaterFlow] Starting analysis ${requestId} for ${grid.length}x${grid[0]?.length || 0} grid`);

      // Perform analysis
      const result = await waterFlowService.analyzeWaterFlow(grid, options);

      // Add request metadata
      result.requestInfo = {
        requestId,
        totalProcessingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        inputSize: {
          rows: grid.length,
          cols: grid[0]?.length || 0,
          totalCells: grid.length * (grid[0]?.length || 0)
        }
      };

      console.log(`[WaterFlow] Completed analysis ${requestId} in ${result.requestInfo.totalProcessingTime}ms`);

      res.json(result);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Analyze water flow from Google Sheets data
   * POST /api/water-flow/from-sheet
   */
  async analyzeFromSheet(req, res) {
    try {
      const { sheetId, tabName, options = {} } = req.body;

      if (!sheetId || !tabName) {
        return res.status(400).json({
          error: 'Sheet ID and tab name are required',
          code: 'MISSING_SHEET_PARAMETERS',
          details: {
            provided: { sheetId: !!sheetId, tabName: !!tabName },
            timestamp: new Date().toISOString()
          }
        });
      }

      const requestId = this._generateRequestId();
      const startTime = Date.now();

      console.log(`[WaterFlow] Starting sheet analysis ${requestId} for ${sheetId}/${tabName}`);

      // Extract data from Google Sheets
      const sheetData = await googleSheetsService.getTabContent(sheetId, tabName);
      const extractionTime = Date.now() - startTime;

      // Convert sheet data to numeric grid
      const grid = this._convertSheetDataToGrid(sheetData.data);
      const conversionTime = Date.now() - startTime - extractionTime;

      // Perform water flow analysis
      const analysisStartTime = Date.now();
      const result = await waterFlowService.analyzeWaterFlow(grid, options);
      const analysisTime = Date.now() - analysisStartTime;

      // Add sheet and processing metadata
      result.sheetInfo = {
        sheetId,
        tabName,
        originalRange: sheetData.range,
        extractedDimensions: {
          originalRows: sheetData.data.length,
          originalCols: sheetData.data[0]?.length || 0,
          processedRows: grid.length,
          processedCols: grid[0]?.length || 0
        }
      };

      result.processingInfo = {
        requestId,
        dataExtractionTime: extractionTime,
        dataConversionTime: conversionTime,
        algorithmTime: analysisTime,
        totalTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      console.log(`[WaterFlow] Completed sheet analysis ${requestId} in ${result.processingInfo.totalTime}ms`);

      res.json(result);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Analyze water flow from Google Sheets URL
   * POST /api/water-flow/from-sheet-url
   */
  async analyzeFromSheetUrl(req, res) {
    try {
      const { url, tabName, options = {} } = req.body;

      if (!url) {
        return res.status(400).json({
          error: 'Sheet URL is required in request body',
          code: 'MISSING_SHEET_URL',
          details: { timestamp: new Date().toISOString() }
        });
      }

      // Parse URL to extract sheet ID
      const sheetId = SheetUrlParser.extractSheetId(url);
      
      if (!sheetId) {
        return res.status(400).json({
          error: 'Cannot extract Sheet ID from the provided URL',
          code: 'INVALID_SHEET_URL',
          details: {
            providedUrl: url,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Use default tab name if not provided
      const finalTabName = tabName || 'Sheet1';

      // Delegate to sheet analysis with extracted ID
      req.body.sheetId = sheetId;
      req.body.tabName = finalTabName;
      
      const result = await this._performSheetAnalysis(req.body);
      
      // Add URL parsing information
      result.urlInfo = SheetUrlParser.parseSheetUrl(url);
      result.accessMethod = 'extracted_from_url';

      res.json(result);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Batch analyze multiple grids
   * POST /api/water-flow/batch
   */
  async batchAnalyze(req, res) {
    try {
      const { grids, options = {} } = req.body;

      if (!grids || !Array.isArray(grids) || grids.length === 0) {
        return res.status(400).json({
          error: 'Array of grids is required',
          code: 'MISSING_BATCH_DATA',
          details: { 
            provided: Array.isArray(grids) ? grids.length : 'not an array',
            timestamp: new Date().toISOString() 
          }
        });
      }

      if (grids.length > 10) {
        return res.status(400).json({
          error: 'Batch size limited to 10 grids per request',
          code: 'BATCH_SIZE_EXCEEDED',
          details: { 
            provided: grids.length,
            maximum: 10,
            timestamp: new Date().toISOString() 
          }
        });
      }

      const batchId = this._generateRequestId();
      const startTime = Date.now();

      console.log(`[WaterFlow] Starting batch analysis ${batchId} for ${grids.length} grids`);

      const results = [];
      
      for (let i = 0; i < grids.length; i++) {
        try {
          const gridResult = await waterFlowService.analyzeWaterFlow(grids[i], options);
          results.push({
            index: i,
            success: true,
            result: gridResult
          });
        } catch (error) {
          results.push({
            index: i,
            success: false,
            error: error.message,
            details: error.stack
          });
        }
      }

      const batchResult = {
        batchId,
        totalGrids: grids.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
        batchStats: {
          totalProcessingTime: Date.now() - startTime,
          averageTimePerGrid: Math.round((Date.now() - startTime) / grids.length),
          timestamp: new Date().toISOString()
        }
      };

      console.log(`[WaterFlow] Completed batch analysis ${batchId} in ${batchResult.batchStats.totalProcessingTime}ms`);

      res.json(batchResult);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Get analysis statistics (placeholder for future caching system)
   * GET /api/water-flow/stats/:analysisId
   */
  async getAnalysisStats(req, res) {
    try {
      const { analysisId } = req.params;

      // This is a placeholder for a future caching/storage system
      res.json({
        error: 'Analysis statistics retrieval not yet implemented',
        code: 'FEATURE_NOT_IMPLEMENTED',
        details: {
          analysisId,
          message: 'This feature requires a caching/database system to store analysis results',
          suggestedApproach: 'Use direct analysis endpoints for now',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      this._handleError(res, error);
    }
  }

  /**
   * Internal method to perform sheet analysis (reusable)
   */
  async _performSheetAnalysis(params) {
    const { sheetId, tabName, options = {} } = params;
    const requestId = this._generateRequestId();
    const startTime = Date.now();

    // Extract data from Google Sheets
    const sheetData = await googleSheetsService.getTabContent(sheetId, tabName);
    const extractionTime = Date.now() - startTime;

    // Convert sheet data to numeric grid
    const grid = this._convertSheetDataToGrid(sheetData.data);
    const conversionTime = Date.now() - startTime - extractionTime;

    // Perform water flow analysis
    const analysisStartTime = Date.now();
    const result = await waterFlowService.analyzeWaterFlow(grid, options);
    const analysisTime = Date.now() - analysisStartTime;

    // Add metadata
    result.sheetInfo = {
      sheetId,
      tabName,
      originalRange: sheetData.range,
      extractedDimensions: {
        originalRows: sheetData.data.length,
        originalCols: sheetData.data[0]?.length || 0,
        processedRows: grid.length,
        processedCols: grid[0]?.length || 0
      }
    };

    result.processingInfo = {
      requestId,
      dataExtractionTime: extractionTime,
      dataConversionTime: conversionTime,
      algorithmTime: analysisTime,
      totalTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    return result;
  }

  /**
   * Convert Google Sheets data to numeric grid
   * @param {Array[]} sheetData - 2D array from Google Sheets
   * @returns {number[][]} - Numeric grid for analysis
   */
  _convertSheetDataToGrid(sheetData) {
    if (!sheetData || !Array.isArray(sheetData) || sheetData.length === 0) {
      throw new Error('Sheet data is empty or invalid');
    }

    const grid = [];
    
    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (!Array.isArray(row)) {
        throw new Error(`Row ${i} is not an array`);
      }

      const gridRow = [];
      
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        
        // Skip empty cells
        if (cell === null || cell === undefined || cell === '') {
          continue;
        }

        // Convert to number
        const numValue = Number(cell);
        if (isNaN(numValue)) {
          throw new Error(`Invalid numeric value at row ${i}, column ${j}: "${cell}"`);
        }
        
        gridRow.push(numValue);
      }

      // Only add rows that have numeric data
      if (gridRow.length > 0) {
        grid.push(gridRow);
      }
    }

    if (grid.length === 0) {
      throw new Error('No valid numeric data found in sheet');
    }

    // Ensure all rows have the same length (pad with zeros if needed)
    const maxCols = Math.max(...grid.map(row => row.length));
    
    for (let i = 0; i < grid.length; i++) {
      while (grid[i].length < maxCols) {
        grid[i].push(0); // Pad with elevation 0
      }
    }

    return grid;
  }

  /**
   * Generate unique request ID for tracking
   */
  _generateRequestId() {
    return `wf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Handle errors consistently
   */
  _handleError(res, error) {
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'WATER_FLOW_ERROR';
    const errorMessage = error.message || 'An unexpected error occurred during water flow analysis';

    console.error(`[WaterFlow] Error [${errorCode}]:`, {
      message: errorMessage,
      statusCode,
      stack: error.stack
    });

    res.status(statusCode).json({
      error: errorMessage,
      code: errorCode,
      details: {
        timestamp: new Date().toISOString(),
        type: 'water-flow-analysis-error'
      }
    });
  }
}

module.exports = new WaterFlowController();