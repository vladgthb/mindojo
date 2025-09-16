const googleSheetsService = require('../services/googleSheetsService');

class SheetsController {
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