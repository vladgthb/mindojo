/**
 * Utility functions for parsing and validating Google Sheets URLs
 */

class SheetUrlParser {
  /**
   * Extract Google Sheet ID from various URL formats
   * @param {string} url - Google Sheets URL or ID
   * @returns {string|null} - Extracted Sheet ID or null if invalid
   */
  static extractSheetId(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // If it's already a Sheet ID (not a URL), return it
    if (!/^https?:\/\//.test(url) && /^[a-zA-Z0-9-_]+$/.test(url)) {
      return url;
    }

    // Common Google Sheets URL patterns
    const patterns = [
      // Standard sharing links
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      // Edit links
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/,
      // View links  
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/view/,
      // Export links
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/export/,
      // Copy links
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/copy/,
      // Mobile links
      /\/spreadsheets\/u\/\d+\/d\/([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract tab/sheet name from Google Sheets URL
   * @param {string} url - Google Sheets URL
   * @returns {string|null} - Tab name or null if not specified
   */
  static extractTabName(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Look for gid parameter (numeric sheet ID)
    const gidMatch = url.match(/[?&#]gid=(\d+)/);
    if (gidMatch) {
      return gidMatch[1]; // Return the gid as string
    }

    // Look for sheet name in fragment
    const fragmentMatch = url.match(/#gid=(\d+)/);
    if (fragmentMatch) {
      return fragmentMatch[1];
    }

    return null;
  }

  /**
   * Validate if a URL is a valid Google Sheets URL
   * @param {string} url - URL to validate
   * @returns {boolean} - True if valid Google Sheets URL
   */
  static isValidGoogleSheetsUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Check if it's a Google Sheets domain
    const isGoogleDomain = /^https:\/\/(docs\.google\.com|drive\.google\.com)/.test(url);
    
    // Check if it contains spreadsheets path
    const hasSpreadsheetPath = url.includes('/spreadsheets/');
    
    // Check if we can extract a valid sheet ID
    const sheetId = this.extractSheetId(url);
    
    return isGoogleDomain && hasSpreadsheetPath && !!sheetId;
  }

  /**
   * Parse a complete Google Sheets URL and extract all components
   * @param {string} url - Google Sheets URL
   * @returns {object} - Parsed components
   */
  static parseSheetUrl(url) {
    const sheetId = this.extractSheetId(url);
    const tabName = this.extractTabName(url);
    
    return {
      isValid: this.isValidGoogleSheetsUrl(url),
      sheetId,
      tabName,
      originalUrl: url,
      isPublicLink: url.includes('usp=sharing') || url.includes('userstoinvite'),
      accessType: this.determineAccessType(url)
    };
  }

  /**
   * Determine the access type of the Google Sheets URL
   * @param {string} url - Google Sheets URL  
   * @returns {string} - Access type
   */
  static determineAccessType(url) {
    if (url.includes('usp=sharing')) {
      return 'public_sharing';
    }
    if (url.includes('/edit')) {
      return 'edit_access';
    }
    if (url.includes('/view')) {
      return 'view_only';
    }
    if (url.includes('userstoinvite')) {
      return 'invite_link';
    }
    return 'direct_access';
  }

  /**
   * Convert various sheet identifiers to a standard sheet ID
   * @param {string} input - Sheet URL, ID, or other identifier
   * @returns {string|null} - Standardized sheet ID
   */
  static normalizeSheetIdentifier(input) {
    if (!input) return null;
    
    // Try to extract as URL first
    const sheetId = this.extractSheetId(input);
    if (sheetId) return sheetId;
    
    // If not a URL and looks like a sheet ID, return as-is
    if (/^[a-zA-Z0-9-_]+$/.test(input)) {
      return input;
    }
    
    return null;
  }

  /**
   * Generate different URL formats for a given sheet ID
   * @param {string} sheetId - Google Sheets ID
   * @returns {object} - Different URL formats
   */
  static generateUrls(sheetId) {
    if (!sheetId) return {};
    
    return {
      edit: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      view: `https://docs.google.com/spreadsheets/d/${sheetId}/view`,
      share: `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing`,
      csv: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
      pdf: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=pdf`
    };
  }

  /**
   * Validate sheet access permissions
   * @param {string} sheetId - Google Sheets ID
   * @param {object} sheetsService - Google Sheets service instance
   * @returns {Promise<object>} - Access validation result
   */
  static async validateAccess(sheetId, sheetsService) {
    try {
      const result = await sheetsService.validateSheetAccess(sheetId);
      return {
        hasAccess: result.hasAccess,
        sheetId: result.sheetId,
        timestamp: result.timestamp,
        accessMethod: 'service_account'
      };
    } catch (error) {
      return {
        hasAccess: false,
        sheetId,
        error: error.message,
        timestamp: new Date().toISOString(),
        accessMethod: 'service_account'
      };
    }
  }
}

module.exports = SheetUrlParser;