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

### Phase 3 ✅ (Completed)
**Pacific-Atlantic Water Flow Algorithm**

**Objective:** Implement a system to determine grid cells where water can flow to both the island's northwest (Pacific) and southeast (Atlantic) edges using optimized BFS/DFS to handle large grids efficiently.

#### Core Algorithm: Reverse BFS Optimization
Instead of checking each cell individually (O(n⁴)), use reverse traversal from ocean borders for O(m×n) complexity.

#### Step 1: Algorithm Core Service ✅
Create `src/services/waterFlowService.js`:
- [x] Implement main algorithm entry point `analyzeWaterFlow(grid)`
- [x] Create `bfsFromPacific(grid)` - BFS from top and left edges (northwest)
- [x] Create `bfsFromAtlantic(grid)` - BFS from bottom and right edges (southeast)
- [x] Implement `findIntersection(pacificCells, atlanticCells)` - Get cells reaching both oceans
- [x] Add `validateGrid(grid)` - Input validation and preprocessing
- [x] Optimize data structures using Set for O(1) lookup operations
- [x] Implement direction arrays for efficient neighbor checking

#### Step 2: Grid Processing Integration ✅ 
Extend Google Sheets integration for topographical data:
- [x] Parse numeric grid data from Google Sheets
- [x] Handle different data formats (integers, decimals, mixed values)
- [x] Add data validation and preprocessing utilities
- [x] Implement grid normalization and error handling
- [x] Create streaming parser for large sheets without loading entire grid
- [x] Add data type conversion and validation middleware

#### Step 3: API Endpoints with Swagger ✅
Create `src/routes/waterFlow.js` with endpoints:
- [x] `POST /api/water-flow/analyze` - Direct grid analysis
- [x] `POST /api/water-flow/from-sheet` - Analyze from Google Sheets data
- [x] `POST /api/water-flow/from-sheet-url` - Sheet-based analysis from URL
- [x] `POST /api/water-flow/analyze-sheet-url` - Simplified URL-based analysis
- [x] `POST /api/water-flow/batch` - Multiple grid analysis
- [x] `GET /api/water-flow/stats/:analysisId` - Get analysis statistics (placeholder)
- [x] Add comprehensive Swagger JSDoc annotations for all endpoints
- [x] Define request/response schemas in `src/utils/swagger.js`

#### Step 4: Performance Optimizations ✅
**Memory Management:**
- [x] Implement streaming for large grids (>1000x1000)
- [x] Add chunked processing for memory efficiency
- [x] Create result caching system with TTL for repeated analyses
- [x] Implement progressive analysis with status updates
- [x] Add explicit garbage collection for large data structures

**Algorithm Optimizations:**
- [x] Implement early termination conditions
- [x] Add bidirectional BFS for faster convergence
- [x] Create parallel processing for independent grid sections
- [x] Optimize data structures (Set vs Array performance)
- [x] Implement dual queue system for Pacific and Atlantic traversals

#### Step 5: Controllers & Business Logic ✅
Create `src/controllers/waterFlowController.js`:
- [x] Implement input validation for grid dimensions and data types
- [x] Add integration with Google Sheets service
- [x] Create response formatting and pagination logic
- [x] Implement comprehensive error handling for edge cases
- [x] Add performance monitoring and logging
- [x] Handle async processing for long-running analyses

#### Step 6: Advanced Features ✅
**Analysis Features:**
- [x] **Flow Path Visualization**: Return actual flow paths, not just endpoints
- [x] **Statistical Analysis**: Count cells, percentage coverage, flow intensity
- [x] **Multi-Ocean Support**: Extend beyond Pacific-Atlantic to custom edges
- [x] **Grid Comparison**: Compare multiple topographical scenarios
- [x] **Algorithm Variants**: Support both BFS and DFS implementations

**Optimization Features:**
- [x] **Result Caching**: Cache analysis results with configurable TTL
- [x] **Batch Processing**: Handle multiple grids in single request
- [x] **Progressive Results**: Stream results for large grids
- [ ] **Analysis History**: Store and retrieve previous analyses (requires database)
- [ ] **Job Queue**: Async processing with job tracking (requires database)

#### Step 7: Data Models & Schemas ✅
**Request Schemas:**
- [x] Create `GridAnalysisRequest` schema with grid data and options
- [x] Define `WaterFlowOptions` with configurable ocean edges
- [x] Add support for analysis preferences (stats, paths, etc.)

**Response Schemas:**
- [x] Implement `WaterFlowResult` with cells, stats, and metadata
- [x] Create `FlowStatistics` with coverage and performance metrics
- [x] Define `GridMetadata` with dimensions and processing info

#### Step 8: Testing Strategy ✅
**Unit Tests:**
- [x] Test algorithm correctness with known grid patterns
- [x] Test edge cases (single row/col, uniform height, extreme values)
- [x] Create performance benchmarks for various grid sizes
- [x] Validate memory usage with large grids
- [x] Test BFS vs DFS performance comparison

**Integration Tests:**
- [x] Test Google Sheets to water flow pipeline
- [x] Validate API endpoint functionality
- [x] Test error handling scenarios
- [x] Performance test with large grid datasets
- [x] Test concurrent analysis requests

#### Step 9: Monitoring & Analytics ✅
**Performance Monitoring:**
- [x] Implement processing time tracking by grid size
- [x] Add memory usage monitoring and alerts
- [x] Track cache hit rates and effectiveness
- [x] Create API usage analytics and reporting

**Algorithm Metrics:**
- [x] Implement grid complexity analysis
- [x] Add flow pattern classification
- [x] Create performance regression detection
- [x] Track success/error rates and common failure patterns

#### Step 10: Documentation & Examples ✅
- [x] Create comprehensive API documentation with examples
- [x] Add algorithm explanation and visualization
- [x] Document performance characteristics and limitations
- [x] Provide sample grid datasets for testing
- [x] Create troubleshooting guide for common issues

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

### Phase 4 📋 (Planned)
**React + TypeScript Frontend with Grid Visualization**

**Objective:** Create a modern web interface for Island Water Flow Analysis using React + Vite + TypeScript + MUI, with URL input, dynamic tab selection, and interactive grid visualization.

#### Project Setup & Structure
Create `frontend/` directory with modern React stack:
- **React 18** with TypeScript for type safety
- **Vite** as build tool for fast development
- **MUI (Material-UI)** for consistent UI components
- **Node.js >=22** requirement matching backend
- **URL-based state management** for shareable analysis links

#### Step 1: Project Initialization
- [ ] Create `frontend/` directory structure
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Node.js >=22 requirement in `package.json`
- [ ] Install and configure MUI components and theming
- [ ] Set up TypeScript strict mode configuration
- [ ] Configure Vite for development and production builds
- [ ] Add ESLint and Prettier for consistent code formatting

#### Step 2: Project Structure & Architecture
```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Generic components
│   │   ├── forms/           # Form-related components
│   │   ├── visualization/   # Grid visualization components
│   │   └── layout/          # Layout components
│   ├── pages/               # Main application pages
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API integration services
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── mocks/               # Mock data for development
│   └── theme/               # MUI theme configuration
├── public/                  # Static assets
├── tests/                   # Component and integration tests
└── package.json             # Dependencies and scripts
```

#### Step 3: Core UI Components with MUI
**Header Component:**
- [ ] Create `AppHeader` with "Island Water Flow Analysis" title
- [ ] Implement MUI AppBar with responsive design
- [ ] Add branding and navigation elements
- [ ] Include theme toggle (light/dark mode support)

**URL Input Section:**
- [ ] Create `UrlInputForm` component with MUI TextField
- [ ] Implement URL validation with TypeScript types
- [ ] Add real-time validation feedback (error states, success indicators)
- [ ] Support Google Sheets URL format validation
- [ ] Include loading states for URL processing

**Dynamic Tab Selection:**
- [ ] Create `TabSelector` component with MUI Select/Autocomplete
- [ ] Implement dynamic population from API responses
- [ ] Add loading skeleton while fetching tabs
- [ ] Handle empty states and error conditions
- [ ] Include tab metadata display (row/column counts)

#### Step 4: State Management & URL Integration
**React State Architecture:**
- [ ] Implement URL-based state management using `useSearchParams`
- [ ] Create custom hooks for state persistence
- [ ] Add `useUrlState` hook for shareable analysis links
- [ ] Implement `useSheetData` hook for Google Sheets integration
- [ ] Add `useWaterFlowAnalysis` hook for algorithm results

**State Structure:**
```typescript
interface AppState {
  sheetUrl: string | null;
  selectedTab: string | null;
  isLoading: boolean;
  tabs: SheetTab[];
  analysisResults: WaterFlowResult | null;
  error: string | null;
}
```

#### Step 5: API Integration Services
**Service Layer:**
- [ ] Create `sheetsService.ts` for Google Sheets API calls
- [ ] Implement `waterFlowService.ts` for analysis API integration
- [ ] Add `mockService.ts` for development with realistic mock data
- [ ] Create TypeScript interfaces matching backend API responses
- [ ] Add error handling and retry logic
- [ ] Implement request caching for improved performance

**Mock Data Implementation:**
- [ ] Create comprehensive mock datasets for development
- [ ] Include various grid sizes (5x5, 10x10, 20x20)
- [ ] Add realistic topographical elevation data
- [ ] Mock multiple sheet tabs with different scenarios
- [ ] Include edge cases (uniform heights, extreme values)

#### Step 6: Grid Visualization Components
**GridVisualization Component:**
- [ ] Create interactive grid display using CSS Grid or Canvas
- [ ] Implement color-coded cell rendering:
  - **Grey cells**: Regular terrain (non-qualifying)
  - **Blue cells**: Qualifying cells (water reaches both oceans)
  - **Elevation gradient**: Optional height-based coloring
- [ ] Add hover effects showing cell coordinates and elevation
- [ ] Implement responsive grid sizing for different screen sizes
- [ ] Add zoom and pan functionality for large grids

**Visualization Features:**
- [ ] **Cell Tooltips**: Show coordinates, elevation, flow status
- [ ] **Legend Component**: Explain color coding and grid features
- [ ] **Grid Statistics**: Display analysis results summary
- [ ] **Export Options**: Save visualization as PNG/SVG
- [ ] **Animation**: Optional flow path animation

#### Step 7: Results Display Components
**Results Section:**
- [ ] Create `AnalysisResults` component for displaying results
- [ ] Implement `ResultsTable` with sortable coordinates table
- [ ] Add `StatsSummary` showing qualified cell count and percentage
- [ ] Create `QualifyingCellsList` with MUI DataGrid
- [ ] Include pagination for large result sets

**Results Features:**
- [ ] **Sortable Table**: Sort by row, column, or elevation
- [ ] **Search/Filter**: Find specific coordinates
- [ ] **Export Options**: Download results as CSV/JSON
- [ ] **Copy to Clipboard**: Share coordinates list
- [ ] **Results Persistence**: Save analysis in browser storage

#### Step 8: User Experience & Interactions
**Progressive Enhancement:**
- [ ] Implement progressive loading states
- [ ] Add skeleton loading for all components
- [ ] Create smooth transitions between states
- [ ] Add success/error notifications using MUI Snackbar
- [ ] Implement optimistic UI updates

**Responsive Design:**
- [ ] Mobile-first responsive design approach
- [ ] Tablet and desktop optimized layouts
- [ ] Grid visualization adapts to screen size
- [ ] Touch-friendly interactions for mobile
- [ ] Accessibility compliance (WCAG 2.1)

#### Step 9: Development Tools & Testing
**Development Setup:**
- [ ] Configure hot module replacement (HMR)
- [ ] Add development proxy for backend API calls
- [ ] Set up environment variables for API endpoints
- [ ] Create development scripts for mock data testing
- [ ] Add TypeScript strict mode and error checking

**Testing Strategy:**
- [ ] Unit tests for utility functions and hooks
- [ ] Component testing with React Testing Library
- [ ] Integration tests for user workflows
- [ ] Visual regression testing for grid visualization
- [ ] Accessibility testing with axe-core

#### Step 10: Build & Deployment Configuration
**Build Optimization:**
- [ ] Configure Vite for optimized production builds
- [ ] Implement code splitting for better performance
- [ ] Add bundle analysis tools
- [ ] Optimize asset loading and caching
- [ ] Configure environment-specific builds

**Deployment Ready:**
- [ ] Create Docker configuration for containerized deployment
- [ ] Add CI/CD pipeline configuration
- [ ] Configure static file serving
- [ ] Add health check endpoints
- [ ] Implement error boundaries for graceful error handling

## Technical Implementation Specifications

### Component Architecture:
```typescript
// Main App Component Structure
App
├── AppHeader
├── UrlInputSection
│   ├── UrlInputForm
│   └── ValidationFeedback
├── TabSelection
│   ├── TabSelector
│   └── TabInfo
├── AnalysisSection
│   ├── RunAnalysisButton
│   └── ProgressIndicator
└── ResultsDisplay
    ├── StatsSummary
    ├── GridVisualization
    └── ResultsTable
```

### TypeScript Interfaces:
```typescript
interface SheetTab {
  id: number;
  name: string;
  rowCount: number;
  columnCount: number;
}

interface WaterFlowResult {
  cells: Array<{x: number, y: number}>;
  stats: {
    totalCells: number;
    flowCells: number;
    coverage: number;
  };
  grid: number[][]; // Elevation data
}

interface GridVisualizationProps {
  grid: number[][];
  qualifyingCells: Array<{x: number, y: number}>;
  onCellHover: (cell: {x: number, y: number, elevation: number}) => void;
}
```

### Mock Data Examples:
```typescript
// Sample mock data structure
const mockSheetData = {
  tabs: [
    { id: 0, name: "Island_5x5", rowCount: 5, columnCount: 5 },
    { id: 1, name: "Mountain_10x10", rowCount: 10, columnCount: 10 },
    { id: 2, name: "Valley_20x20", rowCount: 20, columnCount: 20 }
  ]
};

const mockAnalysisResult = {
  cells: [
    {x: 0, y: 4}, {x: 1, y: 3}, {x: 2, y: 2}
  ],
  stats: {
    totalCells: 25,
    flowCells: 3,
    coverage: 0.12
  },
  grid: [
    [1, 2, 2, 3, 5],
    [3, 2, 3, 4, 4], 
    [2, 4, 5, 3, 1],
    [6, 7, 1, 4, 5],
    [5, 1, 1, 2, 4]
  ]
};
```

### User Flow:
1. **Landing**: User sees header and URL input field
2. **URL Entry**: User pastes Google Sheets URL with validation
3. **Tab Loading**: System fetches and displays available tabs
4. **Tab Selection**: User selects tab from dropdown
5. **Analysis**: "Run Analysis" button appears and executes
6. **Results**: Grid visualization and results table display
7. **Interaction**: User can explore results, export data

### Features for Phase 4:
- ✅ **Modern React Stack**: Vite + TypeScript + MUI
- ✅ **URL Validation**: Real-time Google Sheets URL validation
- ✅ **Dynamic Tabs**: Auto-populated dropdown from API
- ✅ **Grid Visualization**: Interactive terrain and qualifying cells
- ✅ **Results Display**: Count, coordinates table, statistics
- ✅ **Mock Data**: Comprehensive test scenarios
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **TypeScript**: Full type safety and development experience

---

### Future Phases 🔮 (To Be Planned)

**Potential upcoming phases:**
- **Phase 5:** Backend-Frontend Integration (Replace mocks with real API)
- **Phase 6:** Database integration and caching
- **Phase 7:** Real-time collaboration features
- **Phase 8:** User authentication and saved analyses
- **Phase 9:** Advanced visualization (3D terrain, flow animations)
- **Phase 10:** Machine learning for flow pattern prediction

---

## Development Notes

- All phases should maintain backward compatibility
- Follow existing code patterns and conventions
- Ensure comprehensive testing for each phase
- Update CLAUDE.md guidelines as new patterns emerge
- Maintain Swagger documentation for all endpoints