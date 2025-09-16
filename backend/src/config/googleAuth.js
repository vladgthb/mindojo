const { google } = require('googleapis');

class GoogleAuthClient {
  constructor() {
    this.auth = null;
    this.sheets = null;
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

  validateCredentials() {
    // Method 1: Base64-encoded service account JSON (Recommended)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      try {
        const serviceAccountJson = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        const credentials = JSON.parse(serviceAccountJson);
        
        const requiredFields = ['client_email', 'private_key', 'project_id'];
        const hasAllFields = requiredFields.every(field => credentials[field]);
        
        if (!hasAllFields) {
          console.error('Base64 service account missing required fields:', requiredFields);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Invalid Base64 service account credentials:', error.message);
        return false;
      }
    }
    
    // Method 2: Individual environment variables (Legacy)
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
      
      if (!testKey.includes('-----BEGIN PRIVATE KEY-----') || !testKey.includes('-----END PRIVATE KEY-----')) {
        console.error('Private key validation failed: Missing BEGIN/END markers');
        console.log('Expected format: -----BEGIN PRIVATE KEY-----\\n...key content...\\n-----END PRIVATE KEY-----');
        return false;
      }
    }

    return hasCredentials;
  }
}

const googleAuthClient = new GoogleAuthClient();

module.exports = googleAuthClient;