const { google } = require('googleapis');

class GoogleAuthClient {
  constructor() {
    this.auth = null;
    this.sheets = null;
  }

  async initialize() {
    try {
      const {
        GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_PRIVATE_KEY,
        GOOGLE_PROJECT_ID
      } = process.env;

      if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_PROJECT_ID) {
        throw new Error('Missing required Google service account credentials');
      }

      const privateKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: privateKey,
          project_id: GOOGLE_PROJECT_ID
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      return this.sheets;
    } catch (error) {
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
    const {
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY,
      GOOGLE_PROJECT_ID
    } = process.env;

    return !!(GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_PROJECT_ID);
  }
}

const googleAuthClient = new GoogleAuthClient();

module.exports = googleAuthClient;