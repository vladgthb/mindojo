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

### Phase 3 📋 (Planned)
**Pacific-Atlantic Water Flow Algorithm**

**Objective:** Implement a system to determine grid cells where water can flow to both the island's northwest (Pacific) and southeast (Atlantic) edges using optimized BFS/DFS to handle large grids efficiently.

#### Core Algorithm: Reverse BFS Optimization
Instead of checking each cell individually (O(n⁴)), use reverse traversal from ocean borders for O(m×n) complexity.

#### Step 1: Algorithm Core Service
Create `src/services/waterFlowService.js`:
- [ ] Implement main algorithm entry point `analyzeWaterFlow(grid)`
- [ ] Create `bfsFromPacific(grid)` - BFS from top and left edges (northwest)
- [ ] Create `bfsFromAtlantic(grid)` - BFS from bottom and right edges (southeast)
- [ ] Implement `findIntersection(pacificCells, atlanticCells)` - Get cells reaching both oceans
- [ ] Add `validateGrid(grid)` - Input validation and preprocessing
- [ ] Optimize data structures using Set for O(1) lookup operations
- [ ] Implement direction arrays for efficient neighbor checking

#### Step 2: Grid Processing Integration  
Extend Google Sheets integration for topographical data:
- [ ] Parse numeric grid data from Google Sheets
- [ ] Handle different data formats (integers, decimals, mixed values)
- [ ] Add data validation and preprocessing utilities
- [ ] Implement grid normalization and error handling
- [ ] Create streaming parser for large sheets without loading entire grid
- [ ] Add data type conversion and validation middleware

#### Step 3: API Endpoints with Swagger
Create `src/routes/waterFlow.js` with endpoints:
- [ ] `POST /api/water-flow/analyze` - Direct grid analysis
- [ ] `POST /api/water-flow/from-sheet` - Analyze from Google Sheets data
- [ ] `GET /api/water-flow/sheet/:sheetId/tab/:tabName` - Sheet-based analysis
- [ ] `POST /api/water-flow/batch` - Multiple grid analysis
- [ ] `GET /api/water-flow/stats/:analysisId` - Get analysis statistics
- [ ] Add comprehensive Swagger JSDoc annotations for all endpoints
- [ ] Define request/response schemas in `src/utils/swagger.js`

#### Step 4: Performance Optimizations
**Memory Management:**
- [ ] Implement streaming for large grids (>1000x1000)
- [ ] Add chunked processing for memory efficiency
- [ ] Create result caching system with TTL for repeated analyses
- [ ] Implement progressive analysis with status updates
- [ ] Add explicit garbage collection for large data structures

**Algorithm Optimizations:**
- [ ] Implement early termination conditions
- [ ] Add bidirectional BFS for faster convergence
- [ ] Create parallel processing for independent grid sections
- [ ] Optimize data structures (Set vs Array performance)
- [ ] Implement dual queue system for Pacific and Atlantic traversals

#### Step 5: Controllers & Business Logic
Create `src/controllers/waterFlowController.js`:
- [ ] Implement input validation for grid dimensions and data types
- [ ] Add integration with Google Sheets service
- [ ] Create response formatting and pagination logic
- [ ] Implement comprehensive error handling for edge cases
- [ ] Add performance monitoring and logging
- [ ] Handle async processing for long-running analyses

#### Step 6: Advanced Features
**Analysis Features:**
- [ ] **Flow Path Visualization**: Return actual flow paths, not just endpoints
- [ ] **Statistical Analysis**: Count cells, percentage coverage, flow intensity
- [ ] **Multi-Ocean Support**: Extend beyond Pacific-Atlantic to custom edges
- [ ] **Grid Comparison**: Compare multiple topographical scenarios
- [ ] **Algorithm Variants**: Support both BFS and DFS implementations

**Optimization Features:**
- [ ] **Result Caching**: Cache analysis results with configurable TTL
- [ ] **Batch Processing**: Handle multiple grids in single request
- [ ] **Progressive Results**: Stream results for large grids
- [ ] **Analysis History**: Store and retrieve previous analyses
- [ ] **Job Queue**: Async processing with job tracking

#### Step 7: Data Models & Schemas
**Request Schemas:**
- [ ] Create `GridAnalysisRequest` schema with grid data and options
- [ ] Define `WaterFlowOptions` with configurable ocean edges
- [ ] Add support for analysis preferences (stats, paths, etc.)

**Response Schemas:**
- [ ] Implement `WaterFlowResult` with cells, stats, and metadata
- [ ] Create `FlowStatistics` with coverage and performance metrics
- [ ] Define `GridMetadata` with dimensions and processing info

#### Step 8: Testing Strategy
**Unit Tests:**
- [ ] Test algorithm correctness with known grid patterns
- [ ] Test edge cases (single row/col, uniform height, extreme values)
- [ ] Create performance benchmarks for various grid sizes
- [ ] Validate memory usage with large grids
- [ ] Test BFS vs DFS performance comparison

**Integration Tests:**
- [ ] Test Google Sheets to water flow pipeline
- [ ] Validate API endpoint functionality
- [ ] Test error handling scenarios
- [ ] Performance test with large grid datasets
- [ ] Test concurrent analysis requests

#### Step 9: Monitoring & Analytics
**Performance Monitoring:**
- [ ] Implement processing time tracking by grid size
- [ ] Add memory usage monitoring and alerts
- [ ] Track cache hit rates and effectiveness
- [ ] Create API usage analytics and reporting

**Algorithm Metrics:**
- [ ] Implement grid complexity analysis
- [ ] Add flow pattern classification
- [ ] Create performance regression detection
- [ ] Track success/error rates and common failure patterns

#### Step 10: Documentation & Examples
- [ ] Create comprehensive API documentation with examples
- [ ] Add algorithm explanation and visualization
- [ ] Document performance characteristics and limitations
- [ ] Provide sample grid datasets for testing
- [ ] Create troubleshooting guide for common issues

## Technical Implementation Specifications

### Algorithm Details:
```
Time Complexity: O(m × n) where m, n are grid dimensions
Space Complexity: O(m × n) for visited sets and result storage
Optimization: Reverse BFS from ocean borders instead of cell-by-cell analysis
```

### API Design Examples:

#### POST /api/water-flow/analyze
```json
// Request
{
  "grid": [
    [1, 2, 2, 3, 5],
    [3, 2, 3, 4, 4], 
    [2, 4, 5, 3, 1],
    [6, 7, 1, 4, 5],
    [5, 1, 1, 2, 4]
  ],
  "options": {
    "pacificEdges": ["top", "left"],
    "atlanticEdges": ["bottom", "right"],
    "includeStats": true,
    "includePaths": false
  }
}

// Response
{
  "cells": [
    {"x": 0, "y": 4}, {"x": 1, "y": 3}, {"x": 1, "y": 4},
    {"x": 2, "y": 2}, {"x": 3, "y": 0}, {"x": 3, "y": 1}, {"x": 4, "y": 0}
  ],
  "stats": {
    "totalCells": 25,
    "flowCells": 7,
    "coverage": 0.28,
    "processingTime": 15
  },
  "metadata": {
    "gridDimensions": {"rows": 5, "cols": 5},
    "algorithm": "optimized-bfs",
    "timestamp": "2024-01-15T10:30:00Z",
    "pacificReachable": 12,
    "atlanticReachable": 14,
    "intersection": 7
  }
}
```

#### GET /api/water-flow/sheet/:sheetId/tab/:tabName
```json
// Response
{
  "sheetInfo": {
    "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "tabName": "Topography",
    "gridDimensions": {"rows": 100, "cols": 100}
  },
  "analysis": {
    "cells": [...], // Flow cells coordinates
    "stats": {...}, // Analysis statistics
    "processingInfo": {
      "dataExtractionTime": 1200,
      "algorithmTime": 450,
      "totalTime": 1650
    }
  }
}
```

---

### Future Phases 🔮 (To Be Planned)

**Potential upcoming phases:**
- **Phase 4:** Database integration and caching
- **Phase 5:** Real-time updates and webhooks
- **Phase 6:** User authentication and authorization
- **Phase 7:** Advanced data transformation features
- **Phase 8:** Machine learning for flow pattern prediction

---

## Development Notes

- All phases should maintain backward compatibility
- Follow existing code patterns and conventions
- Ensure comprehensive testing for each phase
- Update CLAUDE.md guidelines as new patterns emerge
- Maintain Swagger documentation for all endpoints