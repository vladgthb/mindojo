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
      await this.ensureInitialized();
      
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'properties,sheets.properties'
      });

      return {
        id: spreadsheetId,
        title: response.data.properties.title,
        locale: response.data.properties.locale,
        timeZone: response.data.properties.timeZone,
        properties: response.data.properties,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this._handleGoogleApiError(error, 'getSheetMetadata');
    }
  }

  async getSheetTabs(spreadsheetId) {
    try {
      await this.ensureInitialized();
      
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'properties.title,sheets.properties'
      });

      const tabs = response.data.sheets.map(sheet => ({
        id: sheet.properties.sheetId,
        name: sheet.properties.title,
        index: sheet.properties.index,
        rowCount: sheet.properties.gridProperties?.rowCount || 0,
        columnCount: sheet.properties.gridProperties?.columnCount || 0,
        gridProperties: sheet.properties.gridProperties || {}
      }));

      return {
        sheetId: spreadsheetId,
        title: response.data.properties.title,
        tabs,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      this._handleGoogleApiError(error, 'getSheetTabs');
    }
  }

  async getTabContent(spreadsheetId, tabName) {
    try {
      await this.ensureInitialized();
      
      const range = `${tabName}`;
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING'
      });

      const data = response.data.values || [];
      const actualRowCount = data.length;
      const actualColumnCount = data.length > 0 ? Math.max(...data.map(row => row.length)) : 0;

      const tabMetadataResponse = await this.sheets.spreadsheets.get({
        spreadsheetId,
        ranges: [tabName],
        fields: 'sheets.properties'
      });

      const sheetProperties = tabMetadataResponse.data.sheets[0]?.properties;
      const gridProperties = sheetProperties?.gridProperties || {};

      return {
        tabName,
        range: response.data.range,
        data,
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
      await this.ensureInitialized();
      
      await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'properties.title'
      });

      return {
        hasAccess: true,
        sheetId: spreadsheetId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error.code === 404) {
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