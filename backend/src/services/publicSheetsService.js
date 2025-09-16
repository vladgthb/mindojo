/**
 * Public Google Sheets Service - Access public sheets without authentication
 * Uses CSV export and direct API calls for public sheets
 */

const axios = require('axios');

class PublicSheetsService {
  constructor() {
    this.baseUrl = 'https://docs.google.com/spreadsheets/d';
  }

  /**
   * Check if a sheet is publicly accessible
   * @param {string} sheetId - Google Sheets ID
   * @returns {Promise<boolean>} - True if publicly accessible
   */
  async isPubliclyAccessible(sheetId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${sheetId}/edit?usp=sharing`,
        { 
          timeout: 10000,
          validateStatus: (status) => status < 500 // Accept 4xx as valid response
        }
      );
      
      // If we can access the edit URL, the sheet is likely public
      return response.status === 200;
    } catch (error) {
      // If we get a network error or 5xx, we can't determine accessibility
      console.warn(`Failed to check public accessibility for ${sheetId}:`, error.message);
      return false;
    }
  }

  /**
   * Get sheet metadata using public access
   * @param {string} sheetId - Google Sheets ID
   * @returns {Promise<object>} - Sheet metadata
   */
  async getPublicSheetMetadata(sheetId) {
    try {
      // Try to get basic info via CSV export (which works for public sheets)
      const csvUrl = `${this.baseUrl}/${sheetId}/export?format=csv&gid=0`;
      
      const response = await axios.head(csvUrl, {
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      if (response.status === 200) {
        return {
          id: sheetId,
          title: `Public Sheet ${sheetId}`, // We can't get the actual title without API access
          isPublic: true,
          accessMethod: 'public_export',
          lastUpdated: new Date().toISOString()
        };
      }

      throw new Error('Sheet is not publicly accessible');
    } catch (error) {
      throw this._handlePublicAccessError(error, 'getPublicSheetMetadata');
    }
  }

  /**
   * Get sheet tabs using public access methods
   * @param {string} sheetId - Google Sheets ID
   * @returns {Promise<object>} - Tabs information
   */
  async getPublicSheetTabs(sheetId) {
    try {
      console.log(`🔍 Getting public sheet tabs for: ${sheetId}`);
      
      // Use the new method that follows the Python example logic
      // This gets actual sheet names instead of "Sheet_X"
      const tabsList = await require('../config/googleAuth').getPublicSheetTabsList(sheetId);
      
      if (!tabsList || tabsList.length === 0) {
        throw new Error('No tabs found in the public spreadsheet');
      }

      // Also get the spreadsheet title
      const metadata = await require('../config/googleAuth').getPublicSpreadsheetMetadata(sheetId);
      
      // Format the response to match expected structure
      const tabs = tabsList.map(tab => ({
        id: tab.sheetId,
        gid: tab.gid,
        name: tab.title, // Real sheet name from API (not "Sheet_X")
        index: tab.index,
        rowCount: tab.rowCount,
        columnCount: tab.columnCount,
        accessible: true,
        detectionMethod: 'google_sheets_api',
        gridProperties: tab.gridProperties,
        sheetType: tab.sheetType,
        hidden: tab.hidden
      }));

      console.log(`✅ Retrieved ${tabs.length} tabs with real names:`);
      tabs.forEach(tab => console.log(`  - "${tab.name}" (GID: ${tab.gid})`));
      
      return {
        sheetId,
        title: metadata.properties.title,
        tabs,
        isPublic: true,
        accessMethod: 'google_sheets_api_key',
        lastUpdated: new Date().toISOString(),
        note: 'Tabs retrieved using Google Sheets API with actual sheet names',
        verified: true
      };
    } catch (error) {
      console.error(`❌ Failed to get public sheet tabs: ${error.message}`);
      throw this._handlePublicAccessError(error, 'getPublicSheetTabs');
    }
  }

  /**
   * Get tab content from public sheet using Google Sheets API by tab name
   * @param {string} sheetId - Google Sheets ID
   * @param {string} tabNameOrGid - Tab name or GID
   * @returns {Promise<object>} - Tab content
   */
  async getPublicTabContent(sheetId, tabNameOrGid) {
    try {
      console.log(`🔍 Fetching content for sheet ${sheetId}, tab: ${tabNameOrGid}`);
      
      // First get the spreadsheet metadata to find the correct tab name
      const spreadsheetData = await require('../config/googleAuth').getPublicSpreadsheetMetadata(sheetId);
      
      let targetTabName = tabNameOrGid;
      
      // If tabNameOrGid looks like a GID (numeric), find the corresponding tab name
      if (/^\d+$/.test(tabNameOrGid)) {
        const targetSheet = spreadsheetData.sheets.find(sheet => 
          sheet.properties.sheetId.toString() === tabNameOrGid
        );
        if (targetSheet) {
          targetTabName = targetSheet.properties.title;
          console.log(`📝 Resolved GID ${tabNameOrGid} to tab name: ${targetTabName}`);
        }
      }
      
      // Use Google Sheets API to get the values
      const valuesData = await require('../config/googleAuth').getPublicSpreadsheetValues(sheetId, targetTabName);
      
      const data = valuesData.values || [];
      const actualRowCount = data.length;
      const actualColumnCount = data.length > 0 ? Math.max(...data.map(row => row.length)) : 0;

      // Find the sheet properties for additional metadata
      const targetSheet = spreadsheetData.sheets.find(sheet => 
        sheet.properties.title === targetTabName
      );
      const gridProperties = targetSheet?.properties.gridProperties || {};

      return {
        tabName: targetTabName, // Real tab name from API
        gid: targetSheet?.properties.sheetId?.toString() || tabNameOrGid,
        range: valuesData.range,
        data: data,
        metadata: {
          rowCount: gridProperties.rowCount || 0,
          columnCount: gridProperties.columnCount || 0,
          actualRowCount,
          actualColumnCount,
          lastUpdated: new Date().toISOString(),
          hasHeaders: actualRowCount > 0 && data[0]?.some(cell => 
            typeof cell === 'string' && cell.trim().length > 0
          ),
          accessMethod: 'google_sheets_api'
        },
        isPublic: true,
        sheetProperties: targetSheet?.properties || {}
      };
    } catch (error) {
      console.error(`❌ Failed to get public tab content: ${error.message}`);
      throw this._handlePublicAccessError(error, 'getPublicTabContent');
    }
  }

  /**
   * Detect available tabs in a public sheet
   * @param {string} sheetId - Google Sheets ID
   * @returns {Promise<Array>} - Array of detected tabs
   */
  async _detectPublicTabs(sheetId) {
    const tabs = [];
    
    // Try common GIDs (0, 1, 2, etc.) to detect tabs
    const maxTabs = 10; // Reasonable limit for detection
    
    for (let gid = 0; gid < maxTabs; gid++) {
      try {
        const csvUrl = `${this.baseUrl}/${sheetId}/export?format=csv&gid=${gid}`;
        
        const response = await axios.head(csvUrl, {
          timeout: 5000,
          validateStatus: (status) => status < 500
        });

        if (response.status === 200) {
          tabs.push({
            id: gid,
            gid: gid.toString(),
            name: `Sheet_${gid}`, // We can't get actual names without API
            index: gid,
            accessible: true,
            detectionMethod: 'head_request'
          });
        }
      } catch (error) {
        // If this GID fails, try the next one
        continue;
      }
    }

    // If no tabs found, assume at least tab 0 exists
    if (tabs.length === 0) {
      tabs.push({
        id: 0,
        gid: '0',
        name: 'Sheet_0',
        index: 0,
        accessible: false,
        detectionMethod: 'assumed_default'
      });
    }

    return tabs;
  }

  /**
   * Simple CSV parser
   * @param {string} csvText - CSV content
   * @returns {Array<Array>} - Parsed rows and columns
   */
  _parseCSV(csvText) {
    if (!csvText) return [];

    const rows = [];
    const lines = csvText.split('\n');

    for (const line of lines) {
      if (line.trim() === '') continue;

      // Simple CSV parsing - handles basic cases
      // For production, consider using a proper CSV library
      const row = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      
      // Add the last field
      row.push(current);
      rows.push(row);
    }

    return rows;
  }

  /**
   * Handle public access errors
   * @param {Error} error - Original error
   * @param {string} method - Method name
   * @returns {Error} - Formatted error
   */
  _handlePublicAccessError(error, method) {
    let errorMessage = `Public sheet access error in ${method}`;
    let errorCode = 'PUBLIC_ACCESS_ERROR';
    let statusCode = 500;

    if (error.response) {
      switch (error.response.status) {
        case 403:
          errorMessage = 'Sheet is private or requires authentication';
          errorCode = 'PRIVATE_SHEET';
          statusCode = 403;
          break;
        case 404:
          errorMessage = 'Sheet not found or has been deleted';
          errorCode = 'SHEET_NOT_FOUND';
          statusCode = 404;
          break;
        case 429:
          errorMessage = 'Rate limit exceeded for public access';
          errorCode = 'RATE_LIMIT_EXCEEDED';
          statusCode = 429;
          break;
        default:
          errorMessage = error.message || errorMessage;
          statusCode = error.response.status;
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Network error accessing Google Sheets';
      errorCode = 'NETWORK_ERROR';
      statusCode = 503;
    }

    const customError = new Error(errorMessage);
    customError.code = errorCode;
    customError.statusCode = statusCode;
    customError.originalError = error;
    
    return customError;
  }

  /**
   * Validate if a sheet URL is for a public sheet
   * @param {string} url - Google Sheets URL
   * @returns {boolean} - True if appears to be a public sharing URL
   */
  static isPublicSharingUrl(url) {
    return url.includes('usp=sharing') || 
           url.includes('/edit?') || 
           url.includes('userstoinvite');
  }
}

module.exports = new PublicSheetsService();