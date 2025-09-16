const express = require('express');
const waterFlowController = require('../controllers/waterFlowController');
const { 
  validateGoogleCredentials, 
  rateLimitMiddleware
} = require('../middleware/validation');

const router = express.Router();

// Apply rate limiting to all water flow routes
router.use(rateLimitMiddleware());

/**
 * @swagger
 * components:
 *   schemas:
 *     GridData:
 *       type: array
 *       items:
 *         type: array
 *         items:
 *           type: number
 *       description: 2D array representing elevation heights
 *       example: [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
 *     
 *     WaterFlowOptions:
 *       type: object
 *       properties:
 *         pacificEdges:
 *           type: array
 *           items:
 *             type: string
 *             enum: [top, left, bottom, right]
 *           description: Which edges connect to Pacific ocean
 *           default: [top, left]
 *         atlanticEdges:
 *           type: array
 *           items:
 *             type: string
 *             enum: [top, left, bottom, right]
 *           description: Which edges connect to Atlantic ocean
 *           default: [bottom, right]
 *         includeStats:
 *           type: boolean
 *           description: Include detailed statistics in response
 *           default: true
 *         includePaths:
 *           type: boolean
 *           description: Include flow paths (if implemented)
 *           default: false
 *         includeVisualization:
 *           type: boolean
 *           description: Include visualization data
 *           default: false
 * 
 *     FlowCell:
 *       type: object
 *       properties:
 *         x:
 *           type: integer
 *           description: Column coordinate (0-based)
 *         y:
 *           type: integer
 *           description: Row coordinate (0-based)
 *         elevation:
 *           type: number
 *           description: Elevation value at this cell
 *         coordinate:
 *           type: string
 *           description: Human-readable coordinate
 * 
 *     WaterFlowStatistics:
 *       type: object
 *       properties:
 *         totalCells:
 *           type: integer
 *           description: Total number of cells in grid
 *         flowCells:
 *           type: integer
 *           description: Number of cells where water flows to both oceans
 *         coverage:
 *           type: number
 *           description: Percentage of grid covered by flow cells
 *         processingTime:
 *           type: integer
 *           description: Algorithm processing time in milliseconds
 *         efficiency:
 *           type: object
 *           properties:
 *             cellsPerMs:
 *               type: integer
 *               description: Cells processed per millisecond
 *             algorithmsComplexity:
 *               type: string
 *               description: Big O notation complexity
 *         oceanReachability:
 *           type: object
 *           properties:
 *             pacific:
 *               type: integer
 *               description: Cells reachable from Pacific
 *             atlantic:
 *               type: integer
 *               description: Cells reachable from Atlantic
 *             intersection:
 *               type: integer
 *               description: Cells reachable from both oceans
 *             pacificOnlyPercent:
 *               type: number
 *               description: Percentage of cells reachable only from Pacific
 *             atlanticOnlyPercent:
 *               type: number
 *               description: Percentage of cells reachable only from Atlantic
 *             bothOceansPercent:
 *               type: number
 *               description: Percentage of cells reachable from both oceans
 * 
 *     WaterFlowResult:
 *       type: object
 *       properties:
 *         cells:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FlowCell'
 *           description: Cells where water can flow to both oceans
 *         stats:
 *           $ref: '#/components/schemas/WaterFlowStatistics'
 *         metadata:
 *           type: object
 *           properties:
 *             gridDimensions:
 *               type: object
 *               properties:
 *                 rows:
 *                   type: integer
 *                 cols:
 *                   type: integer
 *             algorithm:
 *               type: string
 *               description: Algorithm used for analysis
 *             timestamp:
 *               type: string
 *               format: date-time
 *             processingTime:
 *               type: integer
 *               description: Total processing time in milliseconds
 *             pacificReachable:
 *               type: integer
 *             atlanticReachable:
 *               type: integer
 *             intersection:
 *               type: integer
 * 
 *     SheetAnalysisRequest:
 *       type: object
 *       required:
 *         - sheetId
 *         - tabName
 *       properties:
 *         sheetId:
 *           type: string
 *           description: Google Sheets document ID
 *         tabName:
 *           type: string
 *           description: Name of the tab containing grid data
 *         options:
 *           $ref: '#/components/schemas/WaterFlowOptions'
 * 
 *     SheetUrlAnalysisRequest:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         url:
 *           type: string
 *           description: Google Sheets sharing URL
 *         tabName:
 *           type: string
 *           description: Name of the tab containing grid data (optional, defaults to Sheet1)
 *         options:
 *           $ref: '#/components/schemas/WaterFlowOptions'
 * 
 *     BatchAnalysisRequest:
 *       type: object
 *       required:
 *         - grids
 *       properties:
 *         grids:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GridData'
 *           description: Array of grids to analyze (max 10)
 *         options:
 *           $ref: '#/components/schemas/WaterFlowOptions'
 *     
 *     WaterFlowErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *         code:
 *           type: string
 *           description: Error code
 *         details:
 *           type: object
 *           properties:
 *             timestamp:
 *               type: string
 *               format: date-time
 *             type:
 *               type: string
 */

/**
 * @swagger
 * /api/water-flow/analyze:
 *   post:
 *     summary: Analyze water flow from direct grid data
 *     description: |
 *       Analyzes a 2D elevation grid to determine cells where water can flow to both Pacific and Atlantic oceans.
 *       
 *       **Algorithm:** Optimized reverse BFS with O(m×n) complexity
 *       
 *       **Default Configuration:**
 *       - Pacific edges: top, left (northwest)
 *       - Atlantic edges: bottom, right (southeast)
 *     tags: [Water Flow Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grid
 *             properties:
 *               grid:
 *                 $ref: '#/components/schemas/GridData'
 *               options:
 *                 $ref: '#/components/schemas/WaterFlowOptions'
 *           examples:
 *             simple_5x5:
 *               summary: Simple 5x5 grid
 *               value:
 *                 grid: [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
 *                 options:
 *                   includeStats: true
 *             custom_oceans:
 *               summary: Custom ocean configuration
 *               value:
 *                 grid: [[1,2,3],[4,5,6],[7,8,9]]
 *                 options:
 *                   pacificEdges: ["top", "right"]
 *                   atlanticEdges: ["bottom", "left"]
 *                   includeStats: true
 *     responses:
 *       200:
 *         description: Water flow analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/WaterFlowResult'
 *                 - type: object
 *                   properties:
 *                     requestInfo:
 *                       type: object
 *                       properties:
 *                         requestId:
 *                           type: string
 *                         totalProcessingTime:
 *                           type: integer
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         inputSize:
 *                           type: object
 *       400:
 *         description: Invalid grid data or parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 *       500:
 *         description: Analysis processing error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 */
router.post('/analyze', waterFlowController.analyzeGrid);

/**
 * @swagger
 * /api/water-flow/from-sheet:
 *   post:
 *     summary: Analyze water flow from Google Sheets data
 *     description: |
 *       Extracts elevation data from a Google Sheets tab and performs water flow analysis.
 *       
 *       **Requirements:**
 *       - Sheet must be accessible to service account
 *       - Tab must contain numeric elevation data
 *       - Empty cells are skipped during processing
 *     tags: [Water Flow Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SheetAnalysisRequest'
 *           examples:
 *             sheet_analysis:
 *               summary: Analyze sheet with default options
 *               value:
 *                 sheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
 *                 tabName: "Topography"
 *                 options:
 *                   includeStats: true
 *     responses:
 *       200:
 *         description: Sheet analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/WaterFlowResult'
 *                 - type: object
 *                   properties:
 *                     sheetInfo:
 *                       type: object
 *                       properties:
 *                         sheetId:
 *                           type: string
 *                         tabName:
 *                           type: string
 *                         originalRange:
 *                           type: string
 *                         extractedDimensions:
 *                           type: object
 *                     processingInfo:
 *                       type: object
 *                       properties:
 *                         requestId:
 *                           type: string
 *                         dataExtractionTime:
 *                           type: integer
 *                         dataConversionTime:
 *                           type: integer
 *                         algorithmTime:
 *                           type: integer
 *                         totalTime:
 *                           type: integer
 *       400:
 *         description: Missing parameters or invalid sheet data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 *       404:
 *         description: Sheet or tab not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 *       500:
 *         description: Sheet access or processing error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 */
router.post('/from-sheet', validateGoogleCredentials, waterFlowController.analyzeFromSheet);

/**
 * @swagger
 * /api/water-flow/from-sheet-url:
 *   post:
 *     summary: Analyze water flow from Google Sheets URL
 *     description: |
 *       Extracts sheet ID from sharing URL and performs water flow analysis on the specified tab.
 *       
 *       **Supported URL formats:**
 *       - `https://docs.google.com/spreadsheets/d/SHEET_ID/edit?usp=sharing`
 *       - `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
 *       - Various other Google Sheets URL formats
 *     tags: [Water Flow Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SheetUrlAnalysisRequest'
 *           examples:
 *             url_analysis:
 *               summary: Analyze from sharing URL
 *               value:
 *                 url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
 *                 tabName: "Topography"
 *                 options:
 *                   includeStats: true
 *     responses:
 *       200:
 *         description: URL-based analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/WaterFlowResult'
 *                 - type: object
 *                   properties:
 *                     sheetInfo:
 *                       type: object
 *                     processingInfo:
 *                       type: object
 *                     urlInfo:
 *                       type: object
 *                       description: Parsed URL information
 *                     accessMethod:
 *                       type: string
 *                       example: "extracted_from_url"
 *       400:
 *         description: Invalid URL or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 */
router.post('/from-sheet-url', validateGoogleCredentials, waterFlowController.analyzeFromSheetUrl);

/**
 * @swagger
 * /api/water-flow/analyze-sheet-url:
 *   post:
 *     summary: Analyze water flow directly from Google Sheets public URL
 *     description: |
 *       **Simplified endpoint** that takes a Google Sheets URL and tab name, extracts the grid data,
 *       and performs water flow analysis in one step. This is the most user-friendly endpoint for
 *       frontend applications.
 *       
 *       **Process:**
 *       1. Extract Sheet ID from the provided URL
 *       2. Fetch elevation data from the specified tab
 *       3. Convert sheet data to numeric grid format
 *       4. Perform Pacific-Atlantic water flow analysis
 *       5. Return comprehensive results with performance metrics
 *       
 *       **Supported URL formats:**
 *       - `https://docs.google.com/spreadsheets/d/SHEET_ID/edit?usp=sharing`
 *       - `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
 *       - `https://docs.google.com/spreadsheets/d/SHEET_ID/view`
 *       - And other Google Sheets URL variations
 *       
 *       **Requirements:**
 *       - Sheet must be publicly accessible or shared with service account
 *       - Tab must contain numeric elevation data
 *       - Grid should be rectangular (consistent row lengths)
 *     tags: [Water Flow Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: Public Google Sheets URL
 *                 example: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
 *               tabName:
 *                 type: string
 *                 description: Name of the tab containing elevation data
 *                 default: "Sheet1"
 *                 example: "Topography"
 *               options:
 *                 $ref: '#/components/schemas/WaterFlowOptions'
 *           examples:
 *             basic_analysis:
 *               summary: Basic URL analysis with default tab
 *               value:
 *                 url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
 *             custom_tab:
 *               summary: Analysis with specific tab and options
 *               value:
 *                 url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
 *                 tabName: "Island_Topography"
 *                 options:
 *                   includeStats: true
 *                   pacificEdges: ["top", "left"]
 *                   atlanticEdges: ["bottom", "right"]
 *     responses:
 *       200:
 *         description: Water flow analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/WaterFlowResult'
 *                 - type: object
 *                   properties:
 *                     input:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           description: Original URL provided
 *                         sheetId:
 *                           type: string
 *                           description: Extracted Google Sheets ID
 *                         tabName:
 *                           type: string
 *                           description: Tab name used for analysis
 *                         urlInfo:
 *                           type: object
 *                           description: Parsed URL metadata
 *                     sheetInfo:
 *                       type: object
 *                       properties:
 *                         sheetId:
 *                           type: string
 *                         tabName:
 *                           type: string
 *                         originalRange:
 *                           type: string
 *                           description: Range of data extracted from sheet
 *                         extractedGrid:
 *                           type: object
 *                           properties:
 *                             originalRows:
 *                               type: integer
 *                               description: Rows in original sheet data
 *                             originalCols:
 *                               type: integer
 *                               description: Columns in original sheet data
 *                             processedRows:
 *                               type: integer
 *                               description: Rows after grid processing
 *                             processedCols:
 *                               type: integer
 *                               description: Columns after grid processing
 *                             totalCells:
 *                               type: integer
 *                               description: Total cells in processed grid
 *                     performance:
 *                       type: object
 *                       properties:
 *                         requestId:
 *                           type: string
 *                           description: Unique request identifier
 *                         sheetExtractionTime:
 *                           type: integer
 *                           description: Time to extract data from Google Sheets (ms)
 *                         gridConversionTime:
 *                           type: integer
 *                           description: Time to convert sheet data to grid (ms)
 *                         algorithmProcessingTime:
 *                           type: integer
 *                           description: Time for water flow algorithm (ms)
 *                         totalTime:
 *                           type: integer
 *                           description: Total processing time (ms)
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *             examples:
 *               successful_analysis:
 *                 summary: Successful analysis result
 *                 value:
 *                   cells:
 *                     - {x: 4, y: 0, elevation: 5, coordinate: "(0,4)"}
 *                     - {x: 0, y: 4, elevation: 5, coordinate: "(4,0)"}
 *                   stats:
 *                     totalCells: 25
 *                     flowCells: 7
 *                     coverage: 0.28
 *                     processingTime: 15
 *                   input:
 *                     url: "https://docs.google.com/spreadsheets/d/1Bxi.../edit?usp=sharing"
 *                     sheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
 *                     tabName: "Sheet1"
 *                   sheetInfo:
 *                     originalRange: "Sheet1!A1:E5"
 *                     extractedGrid:
 *                       processedRows: 5
 *                       processedCols: 5
 *                       totalCells: 25
 *                   performance:
 *                     sheetExtractionTime: 1200
 *                     gridConversionTime: 50
 *                     algorithmProcessingTime: 15
 *                     totalTime: 1265
 *       400:
 *         description: Invalid URL or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 *             examples:
 *               missing_url:
 *                 summary: Missing URL parameter
 *                 value:
 *                   error: "Google Sheets URL is required in request body"
 *                   code: "MISSING_SHEET_URL"
 *               invalid_url:
 *                 summary: Invalid Google Sheets URL
 *                 value:
 *                   error: "Cannot extract Sheet ID from the provided URL"
 *                   code: "INVALID_SHEET_URL"
 *                   details:
 *                     supportedFormats:
 *                       - "https://docs.google.com/spreadsheets/d/SHEET_ID/edit?usp=sharing"
 *                       - "https://docs.google.com/spreadsheets/d/SHEET_ID/edit"
 *       403:
 *         description: Access denied to Google Sheet
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 *             examples:
 *               access_denied:
 *                 summary: Sheet access denied
 *                 value:
 *                   error: "Access denied to the Google Sheet"
 *                   code: "SHEET_ACCESS_DENIED"
 *                   details:
 *                     solution: "Share the sheet with the service account or make it publicly viewable"
 *       404:
 *         description: Sheet or tab not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 *             examples:
 *               sheet_not_found:
 *                 summary: Sheet or tab not found
 *                 value:
 *                   error: "Sheet or tab not found"
 *                   code: "SHEET_NOT_FOUND"
 *                   details:
 *                     suggestion: "Ensure the sheet is publicly accessible"
 *       500:
 *         description: Processing error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 */
router.post('/analyze-sheet-url', validateGoogleCredentials, waterFlowController.analyzeSheetUrl);

/**
 * @swagger
 * /api/water-flow/batch:
 *   post:
 *     summary: Analyze multiple grids in a single request
 *     description: |
 *       Performs water flow analysis on multiple grids simultaneously.
 *       
 *       **Limitations:**
 *       - Maximum 10 grids per request
 *       - Each grid is processed independently
 *       - Failed grids don't affect successful ones
 *     tags: [Water Flow Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchAnalysisRequest'
 *           examples:
 *             batch_analysis:
 *               summary: Analyze 3 small grids
 *               value:
 *                 grids:
 *                   - [[1,2],[3,4]]
 *                   - [[5,6,7],[8,9,10]]
 *                   - [[1,3,5],[2,4,6],[1,1,1]]
 *                 options:
 *                   includeStats: true
 *     responses:
 *       200:
 *         description: Batch analysis completed (may include partial failures)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 batchId:
 *                   type: string
 *                   description: Unique batch identifier
 *                 totalGrids:
 *                   type: integer
 *                   description: Total number of grids submitted
 *                 successful:
 *                   type: integer
 *                   description: Number of successfully processed grids
 *                 failed:
 *                   type: integer
 *                   description: Number of failed grids
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       index:
 *                         type: integer
 *                       success:
 *                         type: boolean
 *                       result:
 *                         $ref: '#/components/schemas/WaterFlowResult'
 *                       error:
 *                         type: string
 *                 batchStats:
 *                   type: object
 *                   properties:
 *                     totalProcessingTime:
 *                       type: integer
 *                     averageTimePerGrid:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid batch data or too many grids
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WaterFlowErrorResponse'
 */
router.post('/batch', waterFlowController.batchAnalyze);

/**
 * @swagger
 * /api/water-flow/stats/{analysisId}:
 *   get:
 *     summary: Get analysis statistics by ID (placeholder)
 *     description: |
 *       **Not yet implemented** - placeholder for future caching system.
 *       
 *       This endpoint would retrieve cached analysis results by ID once 
 *       a storage/caching system is implemented.
 *     tags: [Water Flow Analysis]
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *         description: Analysis identifier
 *     responses:
 *       501:
 *         description: Feature not yet implemented
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *                 details:
 *                   type: object
 */
router.get('/stats/:analysisId', waterFlowController.getAnalysisStats);

module.exports = router;