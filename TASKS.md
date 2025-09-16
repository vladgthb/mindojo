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
- Secure Express server with Helmet and CORS
- Development tooling (linting, formatting, auto-reload)
- Interactive API documentation at `/api-docs`
- Comprehensive test suite setup
- Environment-based configuration
- Graceful server shutdown handling

---

### Phase 2 📋 (Planned)
**Google Sheets API Integration**

**Objective:** Implement Google Sheets API integration to fetch document metadata, list tabs, and read complete sheet content.

#### Step 1: Setup & Dependencies
- [ ] Install `googleapis` package for official Google APIs Node.js client
- [ ] Install `google-auth-library` for service account authentication  
- [ ] Add Google Sheets environment variables to `.env.example`
- [ ] Update package.json dependencies

#### Step 2: Authentication Setup
- [ ] Create service account credentials structure in `src/config/`
- [ ] Implement service account authentication using JSON key file
- [ ] Set up proper scopes: `['https://www.googleapis.com/auth/spreadsheets.readonly']`
- [ ] Create reusable auth client factory function
- [ ] Add credential validation middleware

#### Step 3: Core Service Layer
Create `src/services/googleSheetsService.js` with methods:
- [ ] `getSheetMetadata(spreadsheetId)` - Get basic sheet info and properties
- [ ] `getSheetTabs(spreadsheetId)` - List all tabs/worksheets with names and IDs  
- [ ] `getTabContent(spreadsheetId, tabName)` - Read all content from specific tab
- [ ] `validateSheetAccess(spreadsheetId)` - Verify sheet access permissions
- [ ] Add proper error handling for Google API responses

#### Step 4: API Endpoints with Swagger
Create `src/routes/sheets.js` with endpoints:
- [ ] `GET /api/sheets/:sheetId/metadata` - Get sheet basic info
- [ ] `GET /api/sheets/:sheetId/tabs` - List all available tabs
- [ ] `GET /api/sheets/:sheetId/tabs/:tabName/content` - Get tab content  
- [ ] `POST /api/sheets/validate` - Validate sheet access
- [ ] Add Swagger JSDoc annotations for all endpoints
- [ ] Define response schemas in `src/utils/swagger.js`

#### Step 5: Controllers & Business Logic  
Create `src/controllers/sheetsController.js`:
- [ ] Implement endpoint handlers with proper error handling
- [ ] Add input validation for sheet IDs and tab names
- [ ] Format responses consistently  
- [ ] Handle Google API rate limits and quotas
- [ ] Add request/response logging for debugging

#### Step 6: Error Handling & Validation
- [ ] Create custom error classes for Google Sheets specific errors
- [ ] Add middleware for Google API error translation
- [ ] Implement input sanitization for sheet IDs and tab names
- [ ] Define proper HTTP status codes for different error scenarios
- [ ] Add validation middleware for request parameters

#### Step 7: Environment Configuration
Add required environment variables:
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- [ ] `GOOGLE_PRIVATE_KEY` (base64 encoded)
- [ ] `GOOGLE_PROJECT_ID`  
- [ ] Update `.env.example` with Google Sheets variables
- [ ] Add environment validation on server startup

#### Step 8: Testing & Documentation
- [ ] Write unit tests for Google Sheets service methods
- [ ] Create integration tests for API endpoints
- [ ] Update Swagger schemas for all new endpoints
- [ ] Add comprehensive JSDoc annotations
- [ ] Test error scenarios and edge cases
- [ ] Update README.md with Google Sheets setup instructions

#### Step 9: Security & Best Practices
- [ ] Implement rate limiting for Google Sheets endpoints
- [ ] Add request/response logging for debugging
- [ ] Ensure proper secret management for service account keys
- [ ] Add input validation and sanitization
- [ ] Implement request timeout handling

## API Design Specifications

### Phase 2 Endpoint Responses

#### GET /api/sheets/:sheetId/tabs
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