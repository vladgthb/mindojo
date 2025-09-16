const express = require('express');
const sheetsController = require('../controllers/sheetsController');
const { 
  validateGoogleCredentials, 
  validateSheetId, 
  validateTabName,
  rateLimitMiddleware
} = require('../middleware/validation');

const router = express.Router();

// Apply rate limiting to all sheets routes
router.use(rateLimitMiddleware());

// Apply Google credentials validation to all routes
router.use(validateGoogleCredentials);

/**
 * @swagger
 * components:
 *   schemas:
 *     SheetMetadata:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The spreadsheet ID
 *         title:
 *           type: string
 *           description: The title of the spreadsheet
 *         locale:
 *           type: string
 *           description: The locale of the spreadsheet
 *         timeZone:
 *           type: string
 *           description: The time zone of the spreadsheet
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: When the metadata was last fetched
 *     SheetTabs:
 *       type: object
 *       properties:
 *         sheetId:
 *           type: string
 *           description: The spreadsheet ID
 *         title:
 *           type: string
 *           description: The title of the spreadsheet
 *         tabs:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: The sheet ID
 *               name:
 *                 type: string
 *                 description: The name of the tab
 *               index:
 *                 type: integer
 *                 description: The position of the tab
 *               rowCount:
 *                 type: integer
 *                 description: Total number of rows in the sheet
 *               columnCount:
 *                 type: integer
 *                 description: Total number of columns in the sheet
 *               gridProperties:
 *                 type: object
 *                 description: Grid properties of the sheet
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: When the tabs were last fetched
 *     TabContent:
 *       type: object
 *       properties:
 *         tabName:
 *           type: string
 *           description: The name of the tab
 *         range:
 *           type: string
 *           description: The range of data returned
 *         data:
 *           type: array
 *           items:
 *             type: array
 *             items:
 *               description: Cell values
 *           description: 2D array of cell values
 *         metadata:
 *           type: object
 *           properties:
 *             rowCount:
 *               type: integer
 *               description: Total number of rows in the sheet
 *             columnCount:
 *               type: integer
 *               description: Total number of columns in the sheet
 *             actualRowCount:
 *               type: integer
 *               description: Actual number of rows with data
 *             actualColumnCount:
 *               type: integer
 *               description: Actual number of columns with data
 *             lastUpdated:
 *               type: string
 *               format: date-time
 *               description: When the content was last fetched
 *             hasHeaders:
 *               type: boolean
 *               description: Whether the first row appears to contain headers
 *     ValidationResult:
 *       type: object
 *       properties:
 *         hasAccess:
 *           type: boolean
 *           description: Whether access to the sheet is available
 *         sheetId:
 *           type: string
 *           description: The spreadsheet ID that was validated
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the validation was performed
 *         error:
 *           type: string
 *           description: Error message if access is not available
 *     ValidationRequest:
 *       type: object
 *       required:
 *         - sheetId
 *       properties:
 *         sheetId:
 *           type: string
 *           description: The spreadsheet ID to validate
 *     ErrorResponse:
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
 *               description: When the error occurred
 */

/**
 * @swagger
 * /api/sheets/{sheetId}/metadata:
 *   get:
 *     summary: Get basic metadata for a Google Sheet
 *     tags: [Google Sheets]
 *     parameters:
 *       - in: path
 *         name: sheetId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Google Sheets document ID
 *     responses:
 *       200:
 *         description: Sheet metadata retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SheetMetadata'
 *       400:
 *         description: Missing or invalid sheet ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Access denied to the sheet
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sheet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:sheetId/metadata', validateSheetId, sheetsController.getSheetMetadata);

/**
 * @swagger
 * /api/sheets/{sheetId}/tabs:
 *   get:
 *     summary: List all tabs/worksheets in a Google Sheet
 *     tags: [Google Sheets]
 *     parameters:
 *       - in: path
 *         name: sheetId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Google Sheets document ID
 *     responses:
 *       200:
 *         description: Sheet tabs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SheetTabs'
 *       400:
 *         description: Missing or invalid sheet ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Access denied to the sheet
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sheet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:sheetId/tabs', validateSheetId, sheetsController.getSheetTabs);

/**
 * @swagger
 * /api/sheets/{sheetId}/tabs/{tabName}/content:
 *   get:
 *     summary: Get all content from a specific tab in a Google Sheet
 *     tags: [Google Sheets]
 *     parameters:
 *       - in: path
 *         name: sheetId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Google Sheets document ID
 *       - in: path
 *         name: tabName
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the tab/worksheet (URL encoded if contains special characters)
 *     responses:
 *       200:
 *         description: Tab content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TabContent'
 *       400:
 *         description: Missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Access denied to the sheet
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sheet or tab not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:sheetId/tabs/:tabName/content', validateSheetId, validateTabName, sheetsController.getTabContent);

/**
 * @swagger
 * /api/sheets/validate:
 *   post:
 *     summary: Validate access to a Google Sheet
 *     tags: [Google Sheets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidationRequest'
 *     responses:
 *       200:
 *         description: Sheet access validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationResult'
 *       400:
 *         description: Missing sheet ID in request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sheet not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationResult'
 */
router.post('/validate', sheetsController.validateSheetAccess);

/**
 * @swagger
 * /api/sheets/parse-url:
 *   post:
 *     summary: Parse a Google Sheets URL and extract components
 *     tags: [Google Sheets]
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
 *                 description: Google Sheets URL to parse
 *                 example: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
 *     responses:
 *       200:
 *         description: URL parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                   description: Whether the URL is a valid Google Sheets URL
 *                 sheetId:
 *                   type: string
 *                   description: Extracted Sheet ID
 *                 tabName:
 *                   type: string
 *                   description: Extracted tab name (if present in URL)
 *                 originalUrl:
 *                   type: string
 *                   description: Original URL provided
 *                 isPublicLink:
 *                   type: boolean
 *                   description: Whether this appears to be a public sharing link
 *                 accessType:
 *                   type: string
 *                   description: Detected access type
 *                 generatedUrls:
 *                   type: object
 *                   description: Generated URLs in different formats
 *       400:
 *         description: Missing or invalid URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/parse-url', sheetsController.parseSheetUrl);

/**
 * @swagger
 * /api/sheets/by-url:
 *   post:
 *     summary: Get sheet tabs by providing a Google Sheets URL
 *     tags: [Google Sheets]
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
 *                 description: Google Sheets URL
 *                 example: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
 *     responses:
 *       200:
 *         description: Sheet tabs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SheetTabs'
 *                 - type: object
 *                   properties:
 *                     urlInfo:
 *                       type: object
 *                       description: Parsed URL information
 *                     accessMethod:
 *                       type: string
 *                       description: How the sheet was accessed
 *       400:
 *         description: Missing or invalid URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/by-url', sheetsController.getSheetByUrl);

/**
 * @swagger
 * /api/sheets/content-by-url:
 *   post:
 *     summary: Get tab content by providing a Google Sheets URL
 *     tags: [Google Sheets]
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
 *                 description: Google Sheets URL
 *                 example: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
 *               tabName:
 *                 type: string
 *                 description: Specific tab name to fetch (optional, defaults to first tab)
 *                 example: "Sheet1"
 *     responses:
 *       200:
 *         description: Tab content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/TabContent'
 *                 - type: object
 *                   properties:
 *                     urlInfo:
 *                       type: object
 *                       description: Parsed URL information
 *                     accessMethod:
 *                       type: string
 *                       description: How the sheet was accessed
 *                     requestedTabName:
 *                       type: string
 *                       description: The tab name that was requested
 *       400:
 *         description: Missing or invalid URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/content-by-url', sheetsController.getTabContentByUrl);

module.exports = router;