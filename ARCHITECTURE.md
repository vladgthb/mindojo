# Mindojo System Architecture

This document provides a comprehensive technical overview of the Mindojo Island Water Flow Analysis system architecture, covering all development phases, technology choices, and implementation patterns.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [Technology Stack](#technology-stack)
- [Phase-by-Phase Architecture](#phase-by-phase-architecture)
- [API Design](#api-design)
- [Algorithm Implementation](#algorithm-implementation)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Performance & Scalability](#performance--scalability)
- [Deployment Architecture](#deployment-architecture)

## 🏗️ System Overview

Mindojo is a full-stack web application built using a **multi-phase development approach**, where each phase builds upon previous functionality while maintaining system integrity and performance. The system analyzes topographical data from Google Sheets using the Pacific-Atlantic water flow algorithm to determine optimal drainage patterns.

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                       │
│              React 19 + TypeScript + Vite                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST API
┌─────────────────────────▼───────────────────────────────────┐
│                     API Gateway                            │
│                 Express.js + Swagger                       │
├─────────────────────────┬───────────────────────────────────┤
│         Google Sheets   │        Water Flow                │
│         Integration     │        Algorithm                 │
│         (Phase 2)       │        (Phase 3)                │
└─────────────────────────┴───────────────────────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  Google Sheets  │
                 │      API        │
                 └─────────────────┘
```

## 🎯 Architecture Principles

### 1. **Separation of Concerns**
- **Frontend**: Pure presentation layer with state management
- **Backend**: Business logic, API orchestration, and data processing
- **External Services**: Google Sheets API integration via service accounts

### 2. **Scalable Design**
- Microservice-ready architecture with clear service boundaries
- Horizontal scaling capabilities for algorithm processing
- Caching layers for performance optimization

### 3. **Type Safety**
- End-to-end TypeScript implementation
- Strict interface definitions between layers
- Runtime type validation for external data

### 4. **Performance First**
- O(m×n) algorithm complexity optimization
- Memory-efficient processing for large datasets
- Response caching and request optimization

### 5. **Developer Experience**
- Comprehensive API documentation with Swagger
- Hot module replacement for rapid development
- Automated testing and code quality tools

## 🛠️ Technology Stack

### Frontend Architecture (Phase 4)

```typescript
Frontend Stack:
├── React 19            // Component framework with concurrent features
├── TypeScript 5.8      // Type safety and developer experience
├── Vite 7              // Fast build tool and dev server
├── Material-UI 7       // Professional component library
├── React Router 7      // Client-side routing
├── Emotion 11          // CSS-in-JS styling
└── ESLint + Prettier   // Code quality and formatting
```

**Key Features:**
- **Concurrent React**: Automatic batching and priority-based rendering
- **TypeScript Strict Mode**: Maximum type safety with strict compiler settings
- **Hot Module Replacement**: Sub-second refresh during development
- **Tree Shaking**: Optimal bundle sizes with dead code elimination

### Backend Architecture (Phases 1-3)

```javascript
Backend Stack:
├── Node.js 22+         // Runtime with latest ES features
├── Express.js 4        // Minimal web application framework
├── Google APIs 159     // Official Google Sheets integration
├── Swagger/OpenAPI     // Interactive API documentation
├── Jest + Supertest    // Testing framework with API testing
├── ESLint + Prettier   // Code quality and formatting
└── Helmet + CORS       // Security middleware
```

**Key Features:**
- **Node.js 22**: Latest LTS with performance improvements and modern JavaScript
- **Express Middleware**: Modular request processing pipeline
- **Service Account Auth**: Secure Google API authentication without user interaction
- **Comprehensive Testing**: Unit, integration, and API endpoint testing

## 📐 Phase-by-Phase Architecture

### Phase 1: Backend Foundation ✅

**Objective**: Establish robust Express.js server infrastructure

**Architecture Components:**
```javascript
backend/
├── src/
│   ├── app.js           // Express application setup
│   ├── middleware/      // Custom middleware functions
│   ├── utils/          // Utility functions and helpers
│   └── routes/         // Route definitions (minimal)
├── tests/              // Jest test suites
├── server.js           // Server entry point
└── package.json        // Node.js >=22 enforcement
```

**Key Decisions:**
- **CommonJS Modules**: Consistent with Node.js ecosystem
- **Middleware Pipeline**: Security (Helmet), CORS, logging (Morgan)
- **Graceful Shutdown**: SIGTERM and SIGINT handling
- **Environment Configuration**: dotenv for configuration management

### Phase 2: Google Sheets Integration ✅

**Objective**: Seamless Google Sheets API integration with service account authentication

**Architecture Components:**
```javascript
Google Sheets Integration:
├── config/
│   └── googleAuth.js           // Service account configuration
├── services/
│   └── googleSheetsService.js  // Google API wrapper service
├── controllers/
│   └── sheetsController.js     // HTTP request handlers
├── routes/
│   └── sheets.js              // API endpoint definitions
├── utils/
│   └── sheetUrlParser.js      // URL parsing utilities
└── middleware/
    └── validation.js          // Request validation
```

**API Endpoints:**
- `POST /api/sheets/parse-url` - Parse Google Sheets URLs
- `POST /api/sheets/tabs-from-url` - Retrieve sheet tabs
- `POST /api/sheets/content-by-url` - Get sheet content
- `POST /api/sheets/validate` - Validate sheet access

**Key Features:**
- **Service Account Authentication**: Base64-encoded JSON credentials
- **URL Parsing**: Extract sheet IDs from various Google Sheets URL formats
- **Error Handling**: Comprehensive error mapping and user-friendly messages
- **Caching**: TTL-based response caching for repeated requests

### Phase 3: Water Flow Algorithm ✅

**Objective**: Implement optimized Pacific-Atlantic water flow algorithm

**Architecture Components:**
```javascript
Water Flow Analysis:
├── services/
│   └── waterFlowService.js     // Core algorithm implementation
├── controllers/
│   └── waterFlowController.js  // Analysis request handlers
└── routes/
    └── waterFlow.js           // Analysis API endpoints
```

**Algorithm Implementation:**
```javascript
// Reverse BFS Optimization - O(m×n) complexity
class WaterFlowAnalyzer {
  analyzeWaterFlow(grid) {
    const pacificReachable = this.bfsFromPacific(grid);
    const atlanticReachable = this.bfsFromAtlantic(grid);
    return this.findIntersection(pacificReachable, atlanticReachable);
  }
  
  bfsFromPacific(grid) {
    // BFS from top and left edges (northwest)
    return this.performBFS(grid, this.getPacificStartingPoints(grid));
  }
  
  bfsFromAtlantic(grid) {
    // BFS from bottom and right edges (southeast)  
    return this.performBFS(grid, this.getAtlanticStartingPoints(grid));
  }
}
```

**API Endpoints:**
- `POST /api/water-flow/analyze` - Direct grid analysis
- `POST /api/water-flow/analyze-sheet-url` - Analyze from Google Sheets
- `POST /api/water-flow/batch` - Batch processing
- `GET /api/water-flow/stats/{id}` - Analysis statistics

**Performance Optimizations:**
- **Reverse BFS**: Start from ocean edges instead of individual cells
- **Set-Based Lookup**: O(1) visited cell checking
- **Memory Management**: Streaming for large datasets
- **Early Termination**: Optional optimization for specific use cases

### Phase 4: React Frontend ✅

**Objective**: Modern, responsive web interface with interactive visualization

**Architecture Components:**
```typescript
frontend/src/
├── components/
│   ├── layout/
│   │   └── AppHeader.tsx       // Application header
│   ├── forms/
│   │   ├── UrlInputForm.tsx    // Google Sheets URL input
│   │   └── TabSelector.tsx     // Dynamic tab selection
│   ├── visualization/
│   │   └── GridVisualization.tsx // Interactive grid display
│   └── common/
│       ├── LoadingState.tsx    // Loading components
│       ├── ResultsTable.tsx    // Results data table
│       └── StatsSummary.tsx    // Analysis statistics
├── hooks/
│   ├── useAppState.ts          // Global application state
│   ├── useSheetData.ts         // Google Sheets data management
│   └── useWaterFlowAnalysis.ts // Analysis results management
├── services/
│   ├── mockService.ts          // Development mock data
│   ├── sheetsService.ts        // Google Sheets API client
│   └── waterFlowService.ts     // Water flow analysis client
├── types/
│   └── index.ts                // TypeScript type definitions
└── theme/
    └── index.ts                // Material-UI theme configuration
```

**State Management:**
```typescript
interface AppState {
  sheetUrl: string | null;
  selectedTab: string | null;
  isLoading: boolean;
  tabs: SheetTab[];
  analysisResults: WaterFlowResult | null;
  error: string | null;
  urlValidation: ValidationState;
}

// URL-based state persistence
const useAppState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<AppState>(initialState);
  
  // Sync with URL parameters for shareable links
  useEffect(() => {
    if (state.sheetUrl) {
      searchParams.set('url', state.sheetUrl);
      setSearchParams(searchParams);
    }
  }, [state.sheetUrl]);
};
```

**Key Features:**
- **URL-based State**: Shareable analysis links via URL parameters
- **Progressive Loading**: Skeleton components for better UX
- **Responsive Design**: Mobile-first approach with breakpoint optimization
- **Interactive Visualization**: Hover effects, zoom, and pan for large grids
- **Error Boundaries**: Graceful error handling with recovery options

### Phase 5: Frontend-Backend Integration 📋

**Objective**: Replace mock data with real API integration

**Integration Architecture:**
```typescript
API Integration Layer:
├── services/
│   ├── apiClient.ts           // HTTP client configuration
│   ├── errorHandling.ts       // Centralized error management
│   └── caching.ts            // Request caching optimization
├── hooks/
│   ├── useApiClient.ts       // API client hook
│   └── useErrorHandler.ts    // Error handling hook
└── utils/
    └── responseTransforms.ts  // API response transformations
```

**Data Flow:**
```
User Action → React Component → Custom Hook → Service Layer → API Client → Backend API
                    ↓                           ↑
              State Update ←  Response Transform ←  HTTP Response
```

## 🔌 API Design

### RESTful Architecture

**Endpoint Naming Convention:**
```
/api/{resource}/{action}
/api/{resource}/{id}/{sub-resource}
/api/{resource}/{id}/{sub-resource}/{action}
```

**Example Endpoints:**
```http
# Google Sheets Integration
POST   /api/sheets/parse-url          # Parse and validate URLs
POST   /api/sheets/tabs-from-url      # Get available tabs
POST   /api/sheets/content-by-url     # Retrieve sheet content

# Water Flow Analysis  
POST   /api/water-flow/analyze        # Direct grid analysis
POST   /api/water-flow/analyze-sheet-url  # Analyze from URL
POST   /api/water-flow/batch          # Batch processing

# System Health
GET    /health                        # Health check
GET    /api                          # API information
```

### Request/Response Patterns

**Standard Response Format:**
```javascript
{
  "data": {},           // Response payload
  "metadata": {         // Response metadata
    "timestamp": "2024-01-15T10:30:00Z",
    "processingTime": 1250,
    "version": "1.0.0"
  },
  "pagination": {       // For paginated responses
    "page": 1,
    "limit": 50,
    "total": 150
  }
}
```

**Error Response Format:**
```javascript
{
  "error": "Human-readable error message",
  "code": "SYSTEM_ERROR_CODE",
  "details": {
    "field": "Specific error details",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "retryable": true
}
```

### OpenAPI/Swagger Documentation

**Swagger Configuration:**
```javascript
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Mindojo Backend API',
    version: '1.0.0',
    description: 'Island Water Flow Analysis API'
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    }
  ],
  components: {
    schemas: {
      WaterFlowResult: { /* ... */ },
      SheetTab: { /* ... */ },
      Error: { /* ... */ }
    }
  }
};
```

## 🧠 Algorithm Implementation

### Pacific-Atlantic Water Flow

**Problem Statement:**
Given an m×n grid representing island elevations, find all cells where rainwater can flow to both the Pacific Ocean (accessible from top and left edges) and Atlantic Ocean (accessible from bottom and right edges).

**Naive Approach - O(m²×n²):**
```javascript
// Inefficient: Run DFS from each cell to both oceans
function naiveApproach(grid) {
  const result = [];
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[0].length; j++) {
      if (canReachPacific(grid, i, j) && canReachAtlantic(grid, i, j)) {
        result.push([i, j]);
      }
    }
  }
  return result;
}
```

**Optimized Approach - O(m×n):**
```javascript
class WaterFlowAnalyzer {
  analyzeWaterFlow(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    
    // Initialize visited sets for both oceans
    const pacificVisited = new Set();
    const atlanticVisited = new Set();
    
    // Run BFS from Pacific edges (top and left)
    this.bfsFromEdges(grid, pacificVisited, this.getPacificStarts(rows, cols));
    
    // Run BFS from Atlantic edges (bottom and right)  
    this.bfsFromEdges(grid, atlanticVisited, this.getAtlanticStarts(rows, cols));
    
    // Find intersection of both sets
    return this.findIntersection(pacificVisited, atlanticVisited, rows, cols);
  }
  
  bfsFromEdges(grid, visited, startingPoints) {
    const queue = [...startingPoints];
    const directions = [[0,1], [1,0], [0,-1], [-1,0]];
    
    while (queue.length > 0) {
      const [row, col] = queue.shift();
      const key = `${row},${col}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      // Check all four directions
      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;
        const newKey = `${newRow},${newCol}`;
        
        if (this.isValid(newRow, newCol, grid) && 
            !visited.has(newKey) &&
            grid[newRow][newCol] >= grid[row][col]) {
          queue.push([newRow, newCol]);
        }
      }
    }
  }
}
```

**Algorithm Complexity Analysis:**
- **Time Complexity**: O(m×n) - Each cell visited at most twice
- **Space Complexity**: O(m×n) - Visited sets and queue storage
- **Optimization**: Reverse BFS eliminates redundant path checking

**Memory Optimization for Large Grids:**
```javascript
class StreamingWaterFlowAnalyzer {
  analyzeWaterFlowStreaming(grid) {
    // Process grid in chunks to manage memory
    const chunkSize = 1000;
    const results = [];
    
    for (let i = 0; i < grid.length; i += chunkSize) {
      for (let j = 0; j < grid[0].length; j += chunkSize) {
        const chunk = this.extractChunk(grid, i, j, chunkSize);
        const chunkResult = this.analyzeWaterFlow(chunk);
        results.push(...this.translateCoordinates(chunkResult, i, j));
        
        // Explicit garbage collection for large datasets
        if (global.gc) global.gc();
      }
    }
    
    return results;
  }
}
```

## 🌊 Data Flow

### Complete Request Lifecycle

**1. User Interaction:**
```typescript
// User pastes Google Sheets URL
const handleUrlSubmit = async (url: string) => {
  setLoading(true);
  try {
    // Validate URL format
    const validationResult = await sheetsService.validateUrl(url);
    if (!validationResult.isValid) {
      throw new Error('Invalid Google Sheets URL');
    }
    
    // Fetch available tabs
    const tabs = await sheetsService.getSheetTabs(url);
    setTabs(tabs);
    
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
};
```

**2. API Request Processing:**
```javascript
// Backend endpoint handler
const validateSheetUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    
    // Parse URL and extract sheet ID
    const parseResult = sheetUrlParser.parseUrl(url);
    if (!parseResult.isValid) {
      return res.status(400).json({
        error: 'Invalid Google Sheets URL format',
        code: 'INVALID_URL'
      });
    }
    
    // Validate access to Google Sheet
    const sheetMetadata = await googleSheetsService.getSheetMetadata(
      parseResult.sheetId
    );
    
    res.json({
      isValid: true,
      sheetId: parseResult.sheetId,
      metadata: sheetMetadata
    });
    
  } catch (error) {
    next(error);
  }
};
```

**3. Google Sheets Integration:**
```javascript
class GoogleSheetsService {
  async getSheetMetadata(spreadsheetId) {
    try {
      const auth = await this.getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      const response = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'properties,sheets.properties'
      });
      
      return this.transformMetadataResponse(response.data);
      
    } catch (error) {
      throw this.handleGoogleApiError(error);
    }
  }
  
  async getAuthClient() {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
      );
      return google.auth.fromJSON(credentials);
    }
    
    throw new Error('Google Service Account credentials not configured');
  }
}
```

**4. Algorithm Processing:**
```javascript
const analyzeWaterFlow = async (req, res, next) => {
  try {
    const { url, tabName } = req.body;
    
    // Get grid data from Google Sheets
    const gridData = await googleSheetsService.getTabContent(url, tabName);
    
    // Validate and preprocess grid
    const validatedGrid = waterFlowService.validateGrid(gridData);
    
    // Run water flow analysis
    const analysisResult = await waterFlowService.analyzeWaterFlow(validatedGrid);
    
    // Format response with metadata
    res.json({
      cells: analysisResult.qualifyingCells,
      stats: {
        totalCells: validatedGrid.length * validatedGrid[0].length,
        flowCells: analysisResult.qualifyingCells.length,
        coverage: analysisResult.coverage,
        processingTime: analysisResult.processingTime
      },
      metadata: {
        gridDimensions: {
          rows: validatedGrid.length,
          cols: validatedGrid[0].length
        },
        algorithm: 'optimized-bfs',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    next(error);
  }
};
```

**5. Frontend State Update:**
```typescript
const useWaterFlowAnalysis = () => {
  const [analysisResults, setAnalysisResults] = useState<WaterFlowResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const runAnalysis = async (url: string, tabName: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await waterFlowService.analyzeWaterFlow(url, tabName);
      setAnalysisResults(result);
      
      // Update URL state for shareable links
      updateUrlParams({ url, tab: tabName });
      
    } catch (err) {
      setError(err.message);
      setAnalysisResults(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  return { analysisResults, isLoading, error, runAnalysis };
};
```

## 🔒 Security Architecture

### Authentication & Authorization

**Google Service Account Authentication:**
```javascript
// Secure credential management
const getServiceAccountCredentials = () => {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
    // Base64-encoded service account JSON (recommended)
    return JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
    );
  }
  
  if (process.env.GOOGLE_PRIVATE_KEY) {
    // Individual environment variables (legacy)
    return {
      type: 'service_account',
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      project_id: process.env.GOOGLE_PROJECT_ID
    };
  }
  
  throw new Error('Google Service Account credentials not found');
};
```

### Security Middleware

**Express Security Stack:**
```javascript
// Security headers and CORS configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request size limiting
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### Input Validation & Sanitization

**Request Validation Middleware:**
```javascript
const validateSheetUrl = (req, res, next) => {
  const { url } = req.body;
  
  // URL format validation
  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      error: 'URL is required and must be a string',
      code: 'INVALID_INPUT'
    });
  }
  
  // Google Sheets URL pattern validation
  const googleSheetsPattern = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  if (!googleSheetsPattern.test(url)) {
    return res.status(400).json({
      error: 'Invalid Google Sheets URL format',
      code: 'INVALID_URL_FORMAT'
    });
  }
  
  // Sanitize URL
  req.body.url = url.trim();
  next();
};
```

### Error Handling Security

**Secure Error Responses:**
```javascript
const errorHandler = (err, req, res, next) => {
  // Log full error details for debugging
  console.error('API Error:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
  
  // Return sanitized error to client
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
};
```

## ⚡ Performance & Scalability

### Algorithm Performance

**Complexity Analysis:**
```
Standard Implementation:
- Time Complexity: O(m² × n²) - Check each cell for both oceans
- Space Complexity: O(m × n) - Recursion stack depth

Optimized Implementation:  
- Time Complexity: O(m × n) - Each cell visited at most twice
- Space Complexity: O(m × n) - Visited sets storage
- Memory Optimization: Streaming for grids >1000x1000
```

**Performance Benchmarks:**
```
Grid Size    | Processing Time | Memory Usage
5×5         | <1ms           | <1MB
100×100     | <100ms         | <10MB  
1000×1000   | <5s            | <100MB
5000×5000   | <60s           | <500MB (streaming)
```

### Caching Strategy

**Multi-Level Caching:**
```javascript
class CacheManager {
  constructor() {
    // In-memory cache for frequently accessed data
    this.memoryCache = new Map();
    
    // TTL-based cache with automatic cleanup
    this.ttlCache = new Map();
    
    // Cache statistics for monitoring
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }
  
  async get(key) {
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      this.stats.hits++;
      return this.memoryCache.get(key);
    }
    
    // Check TTL cache
    const ttlEntry = this.ttlCache.get(key);
    if (ttlEntry && ttlEntry.expires > Date.now()) {
      this.stats.hits++;
      // Promote to memory cache for frequent access
      this.memoryCache.set(key, ttlEntry.value);
      return ttlEntry.value;
    }
    
    this.stats.misses++;
    return null;
  }
  
  set(key, value, ttl = 300000) { // 5 minute default TTL
    // Store in both caches
    this.memoryCache.set(key, value);
    this.ttlCache.set(key, {
      value,
      expires: Date.now() + ttl
    });
    
    // Cleanup expired entries periodically
    if (this.ttlCache.size % 100 === 0) {
      this.cleanup();
    }
  }
}
```

### Memory Management

**Large Dataset Handling:**
```javascript
class StreamingAnalyzer {
  async analyzeStreamingGrid(sheetUrl, tabName) {
    const gridStream = await this.createGridStream(sheetUrl, tabName);
    const chunkSize = 1000;
    let processedRows = 0;
    let results = [];
    
    for await (const chunk of this.chunkStream(gridStream, chunkSize)) {
      // Process chunk with overlap for edge connections
      const chunkResult = await this.processChunk(chunk, processedRows);
      results = this.mergeResults(results, chunkResult);
      
      processedRows += chunk.length;
      
      // Memory cleanup
      if (global.gc && processedRows % 10000 === 0) {
        global.gc();
      }
      
      // Progress reporting
      this.reportProgress(processedRows);
    }
    
    return this.finalizeResults(results);
  }
}
```

### Request Optimization

**Connection Pooling & Compression:**
```javascript
// HTTP client optimization
const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 30000,
  
  // Connection pooling
  httpAgent: new http.Agent({
    keepAlive: true,
    maxSockets: 10,
    maxFreeSockets: 5,
    timeout: 60000
  }),
  
  // Response compression
  decompress: true,
  
  // Request/response interceptors
  transformRequest: [
    (data) => {
      // Compress large payloads
      if (data && JSON.stringify(data).length > 10000) {
        return compressData(data);
      }
      return data;
    }
  ],
  
  transformResponse: [
    (data) => {
      // Decompress responses if needed
      return isCompressed(data) ? decompressData(data) : data;
    }
  ]
});
```

## 🚀 Deployment Architecture

### Development Environment

**Local Development Stack:**
```yaml
Development Setup:
├── Backend Server      # http://localhost:3001
│   ├── API Endpoints   # /api/*
│   ├── Health Check    # /health
│   └── Documentation   # /api-docs
├── Frontend Server     # http://localhost:5173  
│   ├── React App       # Vite dev server
│   ├── HMR Enabled     # Hot module replacement
│   └── Proxy Config    # Backend API proxy
└── External Services
    └── Google Sheets   # External API integration
```

**Concurrent Development:**
```json
{
  "scripts": {
    "dev:backend": "cd ../backend && npm run dev",
    "dev:frontend": "vite",
    "dev:full": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "health-check": "curl -f http://localhost:3001/health"
  }
}
```

### Production Architecture

**Containerized Deployment:**
```dockerfile
# Backend Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]

# Frontend Dockerfile  
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

**Docker Compose Configuration:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - PORT=3001
      - GOOGLE_SERVICE_ACCOUNT_BASE64=${GOOGLE_SERVICE_ACCOUNT_BASE64}
    ports:
      - "3001:3001"
    restart: unless-stopped
    
  frontend:
    build: ./frontend  
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "443:443"
    depends_on:
      - frontend
      - backend
```

### Scaling Considerations

**Horizontal Scaling:**
```
Load Balancer
    ↓
┌─────────────────────────────────────┐
│           Frontend Layer            │
│      (Multiple Nginx instances)     │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│           API Gateway               │
│    (Multiple Express instances)     │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│        Algorithm Workers            │
│     (Dedicated compute nodes)       │
└─────────────────────────────────────┘
```

**Microservice Migration Path:**
```
Phase 5+: Service Decomposition
├── Authentication Service    # User auth and session management
├── Sheets Integration Service # Google Sheets API wrapper
├── Analysis Engine Service   # Water flow algorithm processing
├── Result Storage Service    # Analysis result persistence
└── Notification Service      # Real-time updates and webhooks
```

---

This architecture document provides a comprehensive technical foundation for understanding, maintaining, and extending the Mindojo system. Each architectural decision balances performance, maintainability, and scalability while supporting the multi-phase development approach.