const { google } = require('googleapis');
const axios = require('axios');

class GoogleAuthClient {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.apiKey = process.env.GOOGLE_API_KEY;
  }

  async initialize() {
    try {
      // Method 1: Base64-encoded service account JSON (Recommended)
      if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
        const serviceAccountJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        const credentials = JSON.parse(serviceAccountJson);
        
        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
      }
      // Method 2: Individual environment variables (Legacy)
      else {
        const {
          GOOGLE_SERVICE_ACCOUNT_EMAIL,
          GOOGLE_PRIVATE_KEY,
          GOOGLE_PROJECT_ID
        } = process.env;

        if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_PROJECT_ID) {
          throw new Error('Missing required Google service account credentials. Use either GOOGLE_SERVICE_ACCOUNT_BASE64 or individual variables.');
        }

        // Handle different private key formats
        let privateKey = GOOGLE_PRIVATE_KEY;
        
        // If the key looks like it's base64 encoded, decode it
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          try {
            privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
          } catch (e) {
            // If base64 decode fails, continue with original key
          }
        }
        
        // Replace escaped newlines with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        // Ensure proper formatting
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          throw new Error('Invalid private key format. Must include -----BEGIN PRIVATE KEY----- header');
        }

        this.auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: privateKey,
            project_id: GOOGLE_PROJECT_ID
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
      }

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      return this.sheets;
    } catch (error) {
      console.error('Google Auth initialization failed:', {
        error: error.message,
        hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
        hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
        keyStartsWith: process.env.GOOGLE_PRIVATE_KEY?.substring(0, 50) + '...'
      });
      throw new Error(`Failed to initialize Google Auth: ${error.message}`);
    }
  }

  async getAuthClient() {
    if (!this.auth) {
      await this.initialize();
    }
    return this.auth;
  }

  async getSheetsClient() {
    if (!this.sheets) {
      await this.initialize();
    }
    return this.sheets;
  }

  /**
   * Get spreadsheet metadata using API key (for public sheets)
   */
  async getPublicSpreadsheetMetadata(spreadsheetId) {
    if (!this.apiKey) {
      throw new Error('Google API Key not configured for public sheet access');
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          fields: 'properties,sheets.properties'
        },
        timeout: 10000
      });

      console.log('✅ Retrieved public spreadsheet metadata via API key');
      return response.data;
    } catch (error) {
      console.error('❌ Public API Error:', error.response?.data || error.message);
      throw new Error(`Failed to access public spreadsheet: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get spreadsheet values using API key (for public sheets)
   */
  async getPublicSpreadsheetValues(spreadsheetId, range) {
    if (!this.apiKey) {
      throw new Error('Google API Key not configured for public sheet access');
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
      const response = await axios.get(url, {
        params: {
          key: this.apiKey
        },
        timeout: 30000
      });

      console.log('✅ Retrieved public spreadsheet values via API key');
      return response.data;
    } catch (error) {
      console.error('❌ Public API Error:', error.response?.data || error.message);
      throw new Error(`Failed to access public spreadsheet values: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Try to access spreadsheet with dual authentication strategy
   */
  async getSpreadsheetWithFallback(spreadsheetId, operation = 'metadata', range = null) {
    try {
      // First try service account authentication (for private/shared sheets)
      if (operation === 'metadata') {
        const sheets = await this.getSheetsClient();
        const result = await sheets.spreadsheets.get({
          spreadsheetId,
          fields: 'properties,sheets.properties'
        });
        
        console.log('✅ Used service account authentication');
        return {
          data: result.data,
          authMethod: 'service_account',
          isPublic: false
        };
      } else if (operation === 'values' && range) {
        const sheets = await this.getSheetsClient();
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range
        });
        
        console.log('✅ Used service account authentication');
        return {
          data: result.data,
          authMethod: 'service_account',
          isPublic: false
        };
      }
    } catch (error) {
      console.log(`⚠️  Service account failed: ${error.message}, trying API key...`);
      
      // If service account fails (403, 401), try API key for public sheets
      if ((error.code === 403 || error.code === 401 || error.status === 403 || error.status === 401) && this.apiKey) {
        try {
          if (operation === 'metadata') {
            const result = await this.getPublicSpreadsheetMetadata(spreadsheetId);
            return {
              data: result,
              authMethod: 'api_key',
              isPublic: true
            };
          } else if (operation === 'values' && range) {
            const result = await this.getPublicSpreadsheetValues(spreadsheetId, range);
            return {
              data: result,
              authMethod: 'api_key',
              isPublic: true
            };
          }
        } catch (apiError) {
          console.error('❌ Both authentication methods failed');
          throw new Error(`Unable to access spreadsheet: ${apiError.message}`);
        }
      }
      
      throw error;
    }
  }

  validateCredentials() {
    const results = {
      serviceAccount: false,
      apiKey: false,
      methods: []
    };

    // Method 1: Base64-encoded service account JSON (Recommended)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      try {
        const serviceAccountJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        const credentials = JSON.parse(serviceAccountJson);
        
        const requiredFields = ['client_email', 'private_key', 'project_id'];
        const hasAllFields = requiredFields.every(field => credentials[field]);
        
        if (hasAllFields) {
          results.serviceAccount = true;
          results.methods.push('Base64 Service Account');
        } else {
          console.error('Base64 service account missing required fields:', requiredFields);
        }
      } catch (error) {
        console.error('Invalid Base64 service account credentials:', error.message);
      }
    }
    
    // Method 2: Individual environment variables (Legacy)
    if (!results.serviceAccount) {
      const {
        GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_PRIVATE_KEY,
        GOOGLE_PROJECT_ID
      } = process.env;

      const hasCredentials = !!(GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_PROJECT_ID);
      
      if (hasCredentials && GOOGLE_PRIVATE_KEY) {
        // Check if the private key has the correct format
        let testKey = GOOGLE_PRIVATE_KEY;
        
        // Try to decode if it looks base64 encoded
        if (!testKey.includes('-----BEGIN PRIVATE KEY-----')) {
          try {
            testKey = Buffer.from(testKey, 'base64').toString('utf8');
          } catch (e) {
            console.warn('Private key appears to be neither properly formatted nor valid base64');
          }
        }
        
        testKey = testKey.replace(/\\n/g, '\n');
        
        if (testKey.includes('-----BEGIN PRIVATE KEY-----') && testKey.includes('-----END PRIVATE KEY-----')) {
          results.serviceAccount = true;
          results.methods.push('Individual Environment Variables');
        } else {
          console.error('Private key validation failed: Missing BEGIN/END markers');
        }
      }
    }

    // Method 3: API Key for public sheets
    if (this.apiKey) {
      results.apiKey = true;
      results.methods.push('API Key');
    }

    return results;
  }
}

const googleAuthClient = new GoogleAuthClient();

module.exports = googleAuthClient;