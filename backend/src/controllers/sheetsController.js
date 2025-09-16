const googleSheetsService = require('../services/googleSheetsService');
const SheetUrlParser = require('../utils/sheetUrlParser');

class SheetsController {
  constructor() {
    // Bind methods to preserve 'this' context when passed to Express routes
    this.getSheetMetadata = this.getSheetMetadata.bind(this);
    this.getSheetTabs = this.getSheetTabs.bind(this);
    this.getTabContent = this.getTabContent.bind(this);
    this.validateSheetAccess = this.validateSheetAccess.bind(this);
    this.parseSheetUrl = this.parseSheetUrl.bind(this);
    this.getSheetByUrl = this.getSheetByUrl.bind(this);
    this.getTabContentByUrl = this.getTabContentByUrl.bind(this);
  }

  async getSheetMetadata(req, res) {
    try {
      const { sheetId } = req.params;
      
      if (!sheetId) {
        return res.status(400).json({
          error: 'Sheet ID is required',
          code: 'MISSING_SHEET_ID',
          details: { timestamp: new Date().toISOString() }
        });
      }

      const metadata = await googleSheetsService.getSheetMetadata(sheetId);
      res.json(metadata);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  async getSheetTabs(req, res) {
    try {
      const { sheetId } = req.params;
      
      if (!sheetId) {
        return res.status(400).json({
          error: 'Sheet ID is required',
          code: 'MISSING_SHEET_ID',
          details: { timestamp: new Date().toISOString() }
        });
      }

      const tabs = await googleSheetsService.getSheetTabs(sheetId);
      res.json(tabs);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  async getTabContent(req, res) {
    try {
      const { sheetId, tabName } = req.params;
      
      if (!sheetId || !tabName) {
        return res.status(400).json({
          error: 'Sheet ID and tab name are required',
          code: 'MISSING_PARAMETERS',
          details: { 
            sheetId: !!sheetId,
            tabName: !!tabName,
            timestamp: new Date().toISOString() 
          }
        });
      }

      const decodedTabName = decodeURIComponent(tabName);
      const content = await googleSheetsService.getTabContent(sheetId, decodedTabName);
      res.json(content);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  async validateSheetAccess(req, res) {
    try {
      const { sheetId } = req.body;
      
      if (!sheetId) {
        return res.status(400).json({
          error: 'Sheet ID is required in request body',
          code: 'MISSING_SHEET_ID',
          details: { timestamp: new Date().toISOString() }
        });
      }

      const validation = await googleSheetsService.validateSheetAccess(sheetId);
      
      if (!validation.hasAccess) {
        return res.status(404).json({
          error: validation.error,
          code: 'SHEET_ACCESS_ERROR',
          details: {
            sheetId: validation.sheetId,
            timestamp: validation.timestamp
          }
        });
      }

      res.json(validation);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  async parseSheetUrl(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({
          error: 'Sheet URL is required in request body',
          code: 'MISSING_SHEET_URL',
          details: { timestamp: new Date().toISOString() }
        });
      }

      const parsedUrl = SheetUrlParser.parseSheetUrl(url);
      
      if (!parsedUrl.isValid) {
        return res.status(400).json({
          error: 'Invalid Google Sheets URL format',
          code: 'INVALID_SHEET_URL',
          details: {
            providedUrl: url,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Add generated URLs for convenience
      if (parsedUrl.sheetId) {
        parsedUrl.generatedUrls = SheetUrlParser.generateUrls(parsedUrl.sheetId);
      }

      res.json(parsedUrl);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  async getSheetByUrl(req, res) {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({
          error: 'Sheet URL is required in request body',
          code: 'MISSING_SHEET_URL',
          details: { timestamp: new Date().toISOString() }
        });
      }

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

      // Try to get sheet tabs using the extracted ID
      const tabs = await googleSheetsService.getSheetTabs(sheetId);
      
      // Add URL parsing information to the response
      const urlInfo = SheetUrlParser.parseSheetUrl(url);
      tabs.urlInfo = urlInfo;
      tabs.accessMethod = 'extracted_from_url';

      res.json(tabs);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  async getTabContentByUrl(req, res) {
    try {
      const { url, tabName } = req.body;
      
      if (!url) {
        return res.status(400).json({
          error: 'Sheet URL is required in request body',
          code: 'MISSING_SHEET_URL',
          details: { timestamp: new Date().toISOString() }
        });
      }

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

      // Use provided tabName or try to extract from URL
      let finalTabName = tabName;
      if (!finalTabName) {
        const extractedTabName = SheetUrlParser.extractTabName(url);
        if (extractedTabName) {
          // If gid is extracted, we need to get the actual tab name
          // For now, we'll use the first tab if no tab name is provided
          finalTabName = 'Sheet1'; // Default tab name
        } else {
          finalTabName = 'Sheet1'; // Default tab name
        }
      }

      const content = await googleSheetsService.getTabContent(sheetId, finalTabName);
      
      // Add URL parsing information to the response
      const urlInfo = SheetUrlParser.parseSheetUrl(url);
      content.urlInfo = urlInfo;
      content.accessMethod = 'extracted_from_url';
      content.requestedTabName = finalTabName;

      res.json(content);
    } catch (error) {
      this._handleError(res, error);
    }
  }

  _handleError(res, error) {
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'INTERNAL_SERVER_ERROR';
    const errorMessage = error.message || 'An unexpected error occurred';

    console.error(`Sheets API Error [${errorCode}]:`, {
      message: errorMessage,
      statusCode,
      stack: error.stack,
      originalError: error.originalError
    });

    res.status(statusCode).json({
      error: errorMessage,
      code: errorCode,
      details: {
        timestamp: new Date().toISOString()
      }
    });
  }
}

module.exports = new SheetsController();