# Google Sheets Authentication Setup Guide

This guide walks you through setting up Google Service Account authentication for the Mindojo backend to access Google Sheets API.

## Overview

The Mindojo backend uses Google Service Account authentication to access Google Sheets. This approach provides:
- Server-to-server authentication without user interaction
- Secure access using private keys
- Proper scoping to read-only access to Google Sheets

## Architecture Decision: Why Server-Side Integration?

**Important:** Google Sheets API v4 does **NOT** support CORS (Cross-Origin Resource Sharing) configuration. You cannot enable direct browser access to Google Sheets API from frontend JavaScript.

### Current Architecture (Recommended ✅)

```
Frontend Application
        ↓ (HTTP requests with CORS enabled)
Your Express Backend  
        ↓ (Service Account authentication)
Google Sheets API
        ↓ (Server-to-server, no CORS needed)
Google Sheets Data
```

### Why Direct Browser Access Doesn't Work

❌ **This will always fail:**
```javascript
// Frontend JavaScript - BLOCKED by CORS policy
fetch('https://sheets.googleapis.com/v4/spreadsheets/SHEET_ID', {
  headers: { 'Authorization': 'Bearer TOKEN' }
})
// Error: Access blocked by CORS policy
```

❌ **No CORS configuration available:**
- Google Cloud Console has no CORS settings for Sheets API
- Google Sheets API endpoints don't send CORS headers
- Browser security prevents direct API access

### Benefits of Server-Side Approach

✅ **Security**
- API credentials never exposed to browser
- No risk of credential theft from client-side code
- Centralized authentication management

✅ **Reliability**
- Server-to-server communication bypasses CORS entirely
- Built-in rate limiting and error handling
- Consistent API behavior across environments

✅ **Flexibility**
- Can process/transform data before sending to frontend
- Implement caching strategies to reduce API calls
- Add business logic and data validation

✅ **Performance**
- Cache frequently accessed data
- Minimize API quota usage
- Optimize payload size for frontend

## Prerequisites

- Google account
- Access to Google Cloud Console
- Node.js backend setup completed (Phase 1)

## Step-by-Step Setup

### 1. Create or Access Google Cloud Project

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one:
   - **New Project**: Click "Select a project" → "NEW PROJECT"
   - **Existing Project**: Select from the dropdown

### 2. Enable Google Sheets API

1. In the Google Cloud Console sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Sheets API"**
3. Click on the Google Sheets API result
4. Click the **"ENABLE"** button
5. Wait for the API to be enabled (usually takes a few seconds)

### 3. Create Service Account

1. Navigate to **"APIs & Services"** → **"Credentials"**
2. Click **"CREATE CREDENTIALS"** → **"Service account"**
3. Fill in the service account details:
   - **Service account name**: `mindojo-sheets-service` (or your preferred name)
   - **Service account ID**: Auto-generated (you can customize if needed)
   - **Description**: Optional, e.g., "Service account for Mindojo Google Sheets integration"
4. Click **"CREATE AND CONTINUE"**
5. **Skip role assignment** by clicking **"CONTINUE"** (we don't need project-level roles)
6. **Skip user access** by clicking **"DONE"**

### 4. Generate Service Account Key

1. In the **"Credentials"** page, locate your newly created service account
2. Click on the **service account email** to open its details page
3. Navigate to the **"KEYS"** tab
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"** format (recommended)
6. Click **"CREATE"**
7. A JSON file will be automatically downloaded to your computer

⚠️ **Important**: Store this file securely and never commit it to version control!

### 5. Extract Required Credentials

Open the downloaded JSON file. It contains credentials in this format:

```json
{
  "type": "service_account",
  "project_id": "your-project-123456",
  "private_key_id": "abcd1234567890...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "mindojo-sheets-service@your-project-123456.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

Extract these **three key values**:

| Environment Variable | JSON Field | Description |
|---------------------|------------|-------------|
| `GOOGLE_PROJECT_ID` | `project_id` | Your Google Cloud project ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` | Service account email address |
| `GOOGLE_PRIVATE_KEY` | `private_key` | Complete private key including headers |

### 6. Configure Environment Variables

1. **Create environment file** (if not exists):
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual credentials:
   ```bash
   # Google Sheets API (Phase 2)
   GOOGLE_SERVICE_ACCOUNT_EMAIL=mindojo-sheets-service@your-project-123456.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----
   GOOGLE_PROJECT_ID=your-project-123456
   ```

3. **Important formatting notes**:
   - Keep the `\n` characters in the private key
   - Include the complete `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers
   - No quotes around the values in the .env file

### 7. Grant Sheet Access to Service Account

For each Google Sheet you want to access:

1. **Open the Google Sheet** in your browser
2. Click the **"Share"** button (top right corner)
3. **Add the service account email** as a collaborator:
   - Email: `mindojo-sheets-service@your-project-123456.iam.gserviceaccount.com`
   - Permission: **"Viewer"** (sufficient for read-only access)
4. **Send the invitation** (or skip notification)

🔐 **Access Note**: The service account can only access sheets that have been explicitly shared with it.

### 8. Find Google Sheet ID

To use the API endpoints, you need the Google Sheet ID from the URL:

```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                       ↑──────────── Sheet ID ──────────────↑
```

The Sheet ID is the long string between `/d/` and `/edit` in the URL.

## Testing Your Setup

### 1. Start the Development Server

```bash
cd backend
npm run dev
```

### 2. Test Sheet Validation

```bash
curl -X POST http://localhost:3001/api/sheets/validate \
  -H "Content-Type: application/json" \
  -d '{"sheetId": "YOUR_GOOGLE_SHEET_ID"}'
```

**Expected Response** (success):
```json
{
  "hasAccess": true,
  "sheetId": "YOUR_GOOGLE_SHEET_ID",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Test Getting Sheet Tabs

```bash
curl http://localhost:3001/api/sheets/YOUR_GOOGLE_SHEET_ID/tabs
```

### 4. View API Documentation

Open [http://localhost:3001/api-docs](http://localhost:3001/api-docs) to see all available endpoints in the Swagger UI.

## Troubleshooting

### Common Issues

**❌ "Missing required Google service account credentials"**
- Check that all three environment variables are set in `.env`
- Restart the server after changing `.env`

**❌ "Authentication failed"**
- Verify the private key format (including `\n` characters)
- Ensure the service account email is correct
- Check that the service account key hasn't been deleted in Google Cloud Console

**❌ "Sheet not found or access denied"**
- Verify the Sheet ID is correct
- Ensure the service account email has been shared access to the sheet
- Check that the sheet is not private/restricted

**❌ "Rate limit exceeded"**
- The API has built-in rate limiting (100 requests per minute)
- Wait a moment and try again
- Consider implementing exponential backoff for high-volume usage

### Debugging Tips

1. **Check server logs** for detailed error messages
2. **Verify credentials** using the validation endpoint first
3. **Test with a simple, public sheet** initially
4. **Use the Swagger UI** at `/api-docs` for interactive testing

## Security Best Practices

### Development

- ✅ **Never commit** the JSON credentials file to version control
- ✅ **Keep `.env` files** out of version control (already in `.gitignore`)
- ✅ **Use different service accounts** for development and production
- ✅ **Regularly rotate** service account keys

### Production

- ✅ **Use environment variables** or secret management services
- ✅ **Limit service account permissions** to minimum required scope
- ✅ **Monitor API usage** in Google Cloud Console
- ✅ **Enable audit logging** for security monitoring

### Service Account Management

- ✅ **Document which sheets** each service account accesses
- ✅ **Remove unused service accounts** regularly
- ✅ **Use descriptive names** for easy identification
- ✅ **Set up alerts** for unusual API usage patterns

## Alternative Approaches (Not Recommended)

If you absolutely need frontend access to Google Sheets, here are alternative approaches and their significant limitations:

### Option 1: OAuth 2.0 with Google JavaScript SDK

**Implementation:**
```javascript
// Requires user authentication and consent
gapi.load('auth2', function() {
  gapi.auth2.init({
    client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com'
  });
});
```

**❌ Limitations:**
- Every user must authenticate and grant permissions
- Complex OAuth consent screen setup required
- User experience disruption (login flow)
- Token management complexity (refresh tokens, expiration)
- Still limited by API quotas per user

### Option 2: Google Apps Script Web App

**Implementation:**
- Create Google Apps Script with `doGet()`/`doPost()` functions
- Deploy as web app with CORS enabled
- Acts as proxy to Sheets API

**❌ Limitations:**
- Limited JavaScript runtime environment
- Restricted execution time (6 minutes max)
- Less control over error handling
- Harder to maintain and debug
- Google Apps Script learning curve

### Option 3: Public Sheet CSV Export

**Implementation:**
```javascript
// Only works for public sheets
fetch('https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=0')
```

**❌ Limitations:**
- Sheet must be publicly accessible (security risk)
- CSV format only (no metadata, formulas, formatting)
- No authentication or access control
- Limited to simple data structures
- No real-time updates

### Why These Alternatives Are Problematic

1. **Security Concerns:** Exposing credentials or making sheets public
2. **User Experience:** Requiring authentication flows disrupts usability  
3. **Maintenance Overhead:** More complex codebases and debugging
4. **Limited Functionality:** Reduced feature set compared to full API access
5. **Performance Issues:** No server-side caching or optimization

### Recommendation: Stick with Server-Side Architecture

The current server-side approach provides the best balance of security, performance, and maintainability. Your frontend can make simple HTTP requests to your backend, which handles all Google Sheets complexity.

## Available API Endpoints

Once authentication is configured, these endpoints are available:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sheets/{sheetId}/metadata` | Get basic sheet information |
| `GET` | `/api/sheets/{sheetId}/tabs` | List all tabs in a sheet |
| `GET` | `/api/sheets/{sheetId}/tabs/{tabName}/content` | Get all content from a specific tab |
| `POST` | `/api/sheets/validate` | Validate access to a sheet |

### Frontend Integration Example

```javascript
// Frontend code - works perfectly with CORS
async function getSheetTabs(sheetId) {
  const response = await fetch(`/api/sheets/${sheetId}/tabs`);
  const data = await response.json();
  return data.tabs;
}

async function getTabContent(sheetId, tabName) {
  const encodedTabName = encodeURIComponent(tabName);
  const response = await fetch(`/api/sheets/${sheetId}/tabs/${encodedTabName}/content`);
  const data = await response.json();
  return data.data; // 2D array of cell values
}
```

See the [Swagger documentation](http://localhost:3001/api-docs) for detailed request/response formats and examples.

## Next Steps

With Google Sheets authentication configured, you can:

1. **Integrate with existing sheets** by sharing them with your service account
2. **Build data processing workflows** using the sheet content endpoints
3. **Implement caching strategies** to optimize API usage
4. **Add error handling** for production robustness
5. **Scale to multiple sheets** as your application grows

For additional help, refer to the [Google Sheets API documentation](https://developers.google.com/sheets/api/guides/concepts) or check the project's GitHub issues.