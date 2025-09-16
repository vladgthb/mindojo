# Mindojo Project Development Tasks

## Project Overview

Mindojo is a multi-phase backend project built with Node.js + Express that integrates with Google Sheets APIs. The project follows a structured development approach with clearly defined phases, each building upon the previous one.

## Development Phases

### Phase 1 ✅ (Completed)
**Basic Express Backend Setup**

**Completed Tasks:**
- [x] Created backend directory structure with organized folders
- [x] Initialized Node.js project with package.json (Node.js >=22 enforced)  
- [x] Installed core dependencies (Express, CORS, Helmet, Morgan, dotenv)
- [x] Installed development dependencies (Nodemon, ESLint, Prettier, Jest, Supertest)
- [x] Created Express server setup with middleware configuration
- [x] Implemented health check endpoint (`/health`)
- [x] Added API info endpoint (`/api`)
- [x] Created configuration files (.env.example, .gitignore, ESLint, Prettier)
- [x] Set up testing framework with Jest and Supertest
- [x] Added Swagger UI Express integration
- [x] Documented existing endpoints with Swagger JSDoc annotations
- [x] Updated project documentation (README.md, CLAUDE.md)

**Key Features Delivered:**
- Google Sheets API integration with service account authentication
- Support for both traditional Sheet IDs and shared URLs  
- Comprehensive API endpoints for metadata, tabs, and content access
- Base64 service account JSON support for easier deployment
- Advanced URL parsing for Google Sheets sharing links
- Rate limiting and security middleware
- Complete Swagger API documentation
- Comprehensive test suite with mocking
- Enhanced CORS configuration for Swagger UI
- Detailed setup documentation and troubleshooting guide

---

### Phase 2 ✅ (Completed)
**Google Sheets API Integration**

**Objective:** Implement Google Sheets API integration to fetch document metadata, list tabs, and read complete sheet content.

#### Step 1: Setup & Dependencies ✅
- [x] Install `googleapis` package for official Google APIs Node.js client
- [x] Install `google-auth-library` for service account authentication  
- [x] Add Google Sheets environment variables to `.env.example`
- [x] Update package.json dependencies

#### Step 2: Authentication Setup ✅
- [x] Create service account credentials structure in `src/config/googleAuth.js`
- [x] Implement service account authentication using JSON key file
- [x] Set up proper scopes: `['https://www.googleapis.com/auth/spreadsheets.readonly']`
- [x] Create reusable auth client factory function
- [x] Add credential validation middleware
- [x] **BONUS:** Implement Base64 service account JSON support for easier deployment

#### Step 3: Core Service Layer ✅
Create `src/services/googleSheetsService.js` with methods:
- [x] `getSheetMetadata(spreadsheetId)` - Get basic sheet info and properties
- [x] `getSheetTabs(spreadsheetId)` - List all tabs/worksheets with names and IDs  
- [x] `getTabContent(spreadsheetId, tabName)` - Read all content from specific tab
- [x] `validateSheetAccess(spreadsheetId)` - Verify sheet access permissions
- [x] Add proper error handling for Google API responses

#### Step 4: API Endpoints with Swagger ✅
Create `src/routes/sheets.js` with endpoints:
- [x] `GET /api/sheets/:sheetId/metadata` - Get sheet basic info
- [x] `GET /api/sheets/:sheetId/tabs` - List all available tabs
- [x] `GET /api/sheets/:sheetId/tabs/:tabName/content` - Get tab content  
- [x] `POST /api/sheets/validate` - Validate sheet access
- [x] Add Swagger JSDoc annotations for all endpoints
- [x] Define response schemas in `src/utils/swagger.js`
- [x] **BONUS:** Add URL-based endpoints for shared Google Sheets links

#### Step 5: Controllers & Business Logic ✅
Create `src/controllers/sheetsController.js`:
- [x] Implement endpoint handlers with proper error handling
- [x] Add input validation for sheet IDs and tab names
- [x] Format responses consistently  
- [x] Handle Google API rate limits and quotas
- [x] Add request/response logging for debugging
- [x] **BONUS:** Add URL parsing and shared link support

#### Step 6: Error Handling & Validation ✅
- [x] Create custom error classes for Google Sheets specific errors
- [x] Add middleware for Google API error translation (`src/middleware/validation.js`)
- [x] Implement input sanitization for sheet IDs and tab names
- [x] Define proper HTTP status codes for different error scenarios
- [x] Add validation middleware for request parameters
- [x] **BONUS:** Add rate limiting middleware

#### Step 7: Environment Configuration ✅
Add required environment variables:
- [x] `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- [x] `GOOGLE_PRIVATE_KEY` 
- [x] `GOOGLE_PROJECT_ID`
- [x] **BONUS:** `GOOGLE_SERVICE_ACCOUNT_BASE64` for simplified deployment
- [x] Update `.env.example` with Google Sheets variables
- [x] Add environment validation on server startup

#### Step 8: Testing & Documentation ✅
- [x] Write unit tests for Google Sheets service methods (`tests/sheets.test.js`)
- [x] Create integration tests for API endpoints
- [x] Update Swagger schemas for all new endpoints
- [x] Add comprehensive JSDoc annotations
- [x] Test error scenarios and edge cases
- [x] Create comprehensive Google Sheets setup documentation (`docs/google-auth-setup.md`)

#### Step 9: Security & Best Practices ✅
- [x] Implement rate limiting for Google Sheets endpoints
- [x] Add request/response logging for debugging
- [x] Ensure proper secret management for service account keys
- [x] Add input validation and sanitization
- [x] Implement request timeout handling
- [x] **BONUS:** CORS configuration for Swagger UI compatibility

#### Bonus Features Added 🆕
- [x] **Shared URL Support:** Parse and extract Sheet IDs from Google Sheets sharing URLs
- [x] **URL-based Endpoints:** Direct integration with shared Google Sheets links
  - `POST /api/sheets/parse-url` - Parse Google Sheets URLs
  - `POST /api/sheets/by-url` - Get tabs from shared URL
  - `POST /api/sheets/tabs-from-url` - Alias for tabs from URL
  - `POST /api/sheets/content-by-url` - Get tab content from URL
- [x] **Enhanced Authentication:** Base64 service account JSON support
- [x] **Utility Tools:** Service account encoding script (`scripts/encode-service-account.js`)
- [x] **Comprehensive Documentation:** Complete setup guide with troubleshooting

## API Design Specifications

### Phase 2 Endpoint Responses

#### Traditional Sheet ID Endpoints

##### GET /api/sheets/:sheetId/tabs
```json
{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "title": "Example Sheet", 
  "tabs": [
    { 
      "id": 0, 
      "name": "Sheet1", 
      "rowCount": 100, 
      "columnCount": 26,
      "gridProperties": {
        "rowCount": 100,
        "columnCount": 26
      }
    },
    { 
      "id": 1, 
      "name": "Data", 
      "rowCount": 50, 
      "columnCount": 10,
      "gridProperties": {
        "rowCount": 50,
        "columnCount": 10
      }
    }
  ],
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

#### GET /api/sheets/:sheetId/tabs/:tabName/content
```json
{
  "tabName": "Sheet1",
  "range": "A1:Z100", 
  "data": [
    ["Header1", "Header2", "Header3"],
    ["Row1Col1", "Row1Col2", "Row1Col3"],
    ["Row2Col1", "Row2Col2", "Row2Col3"]
  ],
  "metadata": {
    "rowCount": 100,
    "columnCount": 3,
    "actualRowCount": 3,
    "actualColumnCount": 3,
    "lastUpdated": "2024-01-15T10:30:00Z",
    "hasHeaders": true
  }
}
```

#### URL-based Endpoints (Bonus Feature)

##### POST /api/sheets/by-url
```json
// Request
{
  "url": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
}

// Response
{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "title": "Example Sheet",
  "tabs": [...],
  "lastUpdated": "2024-01-15T10:30:00Z",
  "urlInfo": {
    "isValid": true,
    "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "originalUrl": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing",
    "isPublicLink": true,
    "accessType": "public_sharing"
  },
  "accessMethod": "extracted_from_url"
}
```

##### POST /api/sheets/parse-url
```json
// Request
{
  "url": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
}

// Response
{
  "isValid": true,
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "tabName": null,
  "originalUrl": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing",
  "isPublicLink": true,
  "accessType": "public_sharing",
  "generatedUrls": {
    "edit": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
    "view": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
    "share": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing",
    "csv": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv"
  }
}
```

#### Error Response Format
```json
{
  "error": "Sheet not found or access denied",
  "code": "SHEET_ACCESS_ERROR", 
  "details": {
    "sheetId": "invalid-sheet-id",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### Future Phases 🔮 (To Be Planned)

**Potential upcoming phases:**
- **Phase 3:** Data processing and validation  
- **Phase 4:** Database integration and caching
- **Phase 5:** Real-time updates and webhooks
- **Phase 6:** User authentication and authorization
- **Phase 7:** Advanced data transformation features

---

## Development Notes

- All phases should maintain backward compatibility
- Follow existing code patterns and conventions
- Ensure comprehensive testing for each phase
- Update CLAUDE.md guidelines as new patterns emerge
- Maintain Swagger documentation for all endpoints