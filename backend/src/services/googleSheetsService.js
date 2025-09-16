const googleAuthClient = require('../config/googleAuth');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
  }

  async ensureInitialized() {
    if (!this.sheets) {
      this.sheets = await googleAuthClient.getSheetsClient();
    }
  }

  async getSheetMetadata(spreadsheetId) {
    try {
      // Use dual authentication strategy
      const result = await googleAuthClient.getSpreadsheetWithFallback(spreadsheetId, 'metadata');
      
      return {
        id: spreadsheetId,
        title: result.data.properties.title,
        locale: result.data.properties.locale,
        timeZone: result.data.properties.timeZone,
        properties: result.data.properties,
        authMethod: result.authMethod,
        isPublic: result.isPublic,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this._handleGoogleApiError(error, 'getSheetMetadata');
    }
  }

  async getSheetTabs(spreadsheetId) {
    try {
      // Use dual authentication strategy  
      const result = await googleAuthClient.getSpreadsheetWithFallback(spreadsheetId, 'metadata');
      
      const tabs = result.data.sheets.map(sheet => ({
        id: sheet.properties.sheetId,
        gid: sheet.properties.sheetId.toString(),
        name: sheet.properties.title,
        index: sheet.properties.index,
        rowCount: sheet.properties.gridProperties?.rowCount || 0,
        columnCount: sheet.properties.gridProperties?.columnCount || 0,
        gridProperties: sheet.properties.gridProperties || {},
        accessible: true,
        detectionMethod: result.authMethod === 'api_key' ? 'api_key' : 'service_account'
      }));

      return {
        sheetId: spreadsheetId,
        title: result.data.properties.title,
        tabs,
        isPublic: result.isPublic,
        accessMethod: result.authMethod,
        lastUpdated: new Date().toISOString(),
        ...(result.isPublic && {
          note: 'Enhanced public sheet access with full tab metadata',
          notice: 'Accessed using Google Sheets API with proper authentication'
        })
      };
    } catch (error) {
      this._handleGoogleApiError(error, 'getSheetTabs');
    }
  }

  async getTabContent(spreadsheetId, tabName) {
    try {
      // Get tab content using dual authentication strategy
      const range = `${tabName}`;
      const result = await googleAuthClient.getSpreadsheetWithFallback(spreadsheetId, 'values', range);
      
      const data = result.data.values || [];
      const actualRowCount = data.length;
      const actualColumnCount = data.length > 0 ? Math.max(...data.map(row => row.length)) : 0;

      // Get metadata for the specific tab
      const metadataResult = await googleAuthClient.getSpreadsheetWithFallback(spreadsheetId, 'metadata');
      const sheetProperties = metadataResult.data.sheets.find(sheet => 
        sheet.properties.title === tabName
      )?.properties;
      const gridProperties = sheetProperties?.gridProperties || {};

      return {
        tabName,
        range: result.data.range,
        data,
        authMethod: result.authMethod,
        isPublic: result.isPublic,
        metadata: {
          rowCount: gridProperties.rowCount || 0,
          columnCount: gridProperties.columnCount || 0,
          actualRowCount,
          actualColumnCount,
          lastUpdated: new Date().toISOString(),
          hasHeaders: actualRowCount > 0 && data[0].some(cell => 
            typeof cell === 'string' && cell.trim().length > 0
          )
        }
      };
    } catch (error) {
      this._handleGoogleApiError(error, 'getTabContent');
    }
  }

  async validateSheetAccess(spreadsheetId) {
    try {
      // Use dual authentication strategy for validation
      const result = await googleAuthClient.getSpreadsheetWithFallback(spreadsheetId, 'metadata');

      return {
        hasAccess: true,
        sheetId: spreadsheetId,
        title: result.data.properties.title,
        authMethod: result.authMethod,
        isPublic: result.isPublic,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return {
          hasAccess: false,
          sheetId: spreadsheetId,
          error: 'Sheet not found or access denied',
          timestamp: new Date().toISOString()
        };
      }
      this._handleGoogleApiError(error, 'validateSheetAccess');
    }
  }

  _handleGoogleApiError(error, method) {
    let errorMessage = `Google Sheets API error in ${method}`;
    let errorCode = 'GOOGLE_API_ERROR';
    let statusCode = 500;

    if (error.code) {
      switch (error.code) {
        case 400:
          errorMessage = 'Invalid request parameters';
          errorCode = 'INVALID_REQUEST';
          statusCode = 400;
          break;
        case 401:
          errorMessage = 'Authentication failed';
          errorCode = 'AUTH_ERROR';
          statusCode = 401;
          break;
        case 403:
          errorMessage = 'Access denied to Google Sheets';
          errorCode = 'ACCESS_DENIED';
          statusCode = 403;
          break;
        case 404:
          errorMessage = 'Sheet not found';
          errorCode = 'SHEET_NOT_FOUND';
          statusCode = 404;
          break;
        case 429:
          errorMessage = 'Rate limit exceeded';
          errorCode = 'RATE_LIMIT_EXCEEDED';
          statusCode = 429;
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    }

    const customError = new Error(errorMessage);
    customError.code = errorCode;
    customError.statusCode = statusCode;
    customError.originalError = error;
    
    throw customError;
  }
}

module.exports = new GoogleSheetsService();