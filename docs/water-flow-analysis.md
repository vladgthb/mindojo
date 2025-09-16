# Water Flow Analysis API Documentation

This document provides comprehensive information about the Pacific-Atlantic Water Flow Analysis API implemented in Phase 3 of the Mindojo backend.

## Overview

The Water Flow Analysis API determines grid cells where water can flow to both the Pacific (northwest) and Atlantic (southeast) ocean edges. This implementation uses an optimized reverse BFS algorithm for efficient analysis of large topographical datasets.

## Algorithm Description

### Problem Statement

Given a 2D elevation grid representing an island, determine which cells allow water to flow to both:
- **Pacific Ocean** (accessible from northwest edges: top and/or left borders)
- **Atlantic Ocean** (accessible from southeast edges: bottom and/or right borders)

### Solution Approach

Instead of checking each cell individually (O(n⁴) complexity), we use **reverse BFS**:

1. **Start from ocean borders** rather than individual cells
2. **Traverse inward** using BFS to find all reachable cells
3. **Find intersection** of Pacific-reachable and Atlantic-reachable cells

**Time Complexity:** O(m × n) where m, n are grid dimensions  
**Space Complexity:** O(m × n) for visited sets and result storage

### Algorithm Steps

```
1. Initialize Pacific queue with border cells (top, left edges)
2. Initialize Atlantic queue with border cells (bottom, right edges)
3. Perform BFS from Pacific borders:
   - Water can flow from higher/equal elevation to current cell
   - Mark all reachable cells
4. Perform BFS from Atlantic borders:
   - Same flow rules apply
   - Mark all reachable cells
5. Find intersection of both reachable sets
6. Return cells that can flow to both oceans
```

## API Endpoints

### Core Analysis Endpoints

#### `POST /api/water-flow/analyze`
Analyze water flow from direct grid data.

**Request Body:**
```json
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
```

**Response:**
```json
{
  "cells": [
    {"x": 4, "y": 0, "elevation": 5, "coordinate": "(0,4)"},
    {"x": 3, "y": 1, "elevation": 4, "coordinate": "(1,3)"},
    {"x": 4, "y": 1, "elevation": 4, "coordinate": "(1,4)"},
    {"x": 2, "y": 2, "elevation": 5, "coordinate": "(2,2)"},
    {"x": 0, "y": 3, "elevation": 6, "coordinate": "(3,0)"},
    {"x": 1, "y": 3, "elevation": 7, "coordinate": "(3,1)"},
    {"x": 0, "y": 4, "elevation": 5, "coordinate": "(4,0)"}
  ],
  "stats": {
    "totalCells": 25,
    "flowCells": 7,
    "coverage": 0.28,
    "processingTime": 15,
    "efficiency": {
      "cellsPerMs": 1666,
      "algorithmsComplexity": "O(5 × 5) = O(25)"
    },
    "oceanReachability": {
      "pacific": 12,
      "atlantic": 14,
      "intersection": 7,
      "pacificOnlyPercent": 0.20,
      "atlanticOnlyPercent": 0.28,
      "bothOceansPercent": 0.28
    }
  },
  "metadata": {
    "gridDimensions": {"rows": 5, "cols": 5},
    "algorithm": "optimized-reverse-bfs",
    "timestamp": "2024-01-15T10:30:00Z",
    "processingTime": 15,
    "pacificReachable": 12,
    "atlanticReachable": 14,
    "intersection": 7,
    "configuration": {
      "pacificEdges": ["top", "left"],
      "atlanticEdges": ["bottom", "right"],
      "includeStats": true,
      "includePaths": false
    }
  },
  "requestInfo": {
    "requestId": "wf_1642248600000_abc123",
    "totalProcessingTime": 25,
    "timestamp": "2024-01-15T10:30:00Z",
    "inputSize": {"rows": 5, "cols": 5, "totalCells": 25}
  }
}
```

### Google Sheets Integration

#### `POST /api/water-flow/from-sheet`
Analyze elevation data from Google Sheets.

**Request Body:**
```json
{
  "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "tabName": "Topography",
  "options": {
    "includeStats": true
  }
}
```

**Response includes additional metadata:**
```json
{
  "cells": [...],
  "stats": {...},
  "metadata": {...},
  "sheetInfo": {
    "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "tabName": "Topography",
    "originalRange": "Topography!A1:E5",
    "extractedDimensions": {
      "originalRows": 5,
      "originalCols": 5,
      "processedRows": 5,
      "processedCols": 5
    }
  },
  "processingInfo": {
    "requestId": "wf_1642248600000_def456",
    "dataExtractionTime": 1200,
    "dataConversionTime": 50,
    "algorithmTime": 15,
    "totalTime": 1265,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### `POST /api/water-flow/from-sheet-url`
Analyze from Google Sheets sharing URL.

**Request Body:**
```json
{
  "url": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing",
  "tabName": "Topography",
  "options": {
    "includeStats": true
  }
}
```

### Batch Processing

#### `POST /api/water-flow/batch`
Analyze multiple grids in a single request.

**Request Body:**
```json
{
  "grids": [
    [[1,2],[3,4]],
    [[5,6,7],[8,9,10]],
    [[1,3,5],[2,4,6],[1,1,1]]
  ],
  "options": {
    "includeStats": true
  }
}
```

**Response:**
```json
{
  "batchId": "wf_1642248600000_batch_xyz",
  "totalGrids": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    {"index": 0, "success": true, "result": {...}},
    {"index": 1, "success": true, "result": {...}},
    {"index": 2, "success": true, "result": {...}}
  ],
  "batchStats": {
    "totalProcessingTime": 45,
    "averageTimePerGrid": 15,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Statistics (Placeholder)

#### `GET /api/water-flow/stats/{analysisId}`
Future endpoint for retrieving cached analysis results.

## Configuration Options

### Ocean Edge Configuration

You can customize which edges connect to each ocean:

```json
{
  "pacificEdges": ["top", "left"],      // Default: northwest
  "atlanticEdges": ["bottom", "right"]  // Default: southeast
}
```

**Supported Edge Values:**
- `"top"` - Top border of the grid
- `"left"` - Left border of the grid  
- `"bottom"` - Bottom border of the grid
- `"right"` - Right border of the grid

### Analysis Options

```json
{
  "includeStats": true,           // Include detailed statistics (default: true)
  "includePaths": false,          // Include flow paths (not yet implemented)
  "includeVisualization": false   // Include visualization data (not yet implemented)
}
```

## Grid Data Requirements

### Valid Grid Format

- **2D Array:** Must be a rectangular array of arrays
- **Numeric Values:** All cells must contain valid numbers (integers or decimals)
- **Consistent Rows:** All rows must have the same number of columns
- **Non-empty:** Grid must contain at least one cell

### Example Valid Grids

```javascript
// Minimal grid
[[1]]

// Simple 2x2
[[1, 2], [3, 4]]

// Mixed numeric types
[[1, 2.5, 3], [4.7, 5, 6.2]]

// Larger grid
[
  [1, 2, 2, 3, 5],
  [3, 2, 3, 4, 4],
  [2, 4, 5, 3, 1],
  [6, 7, 1, 4, 5],
  [5, 1, 1, 2, 4]
]
```

### Invalid Grid Examples

```javascript
// Not an array
"invalid"

// Empty grid
[]

// Inconsistent row lengths
[[1, 2], [3, 4, 5]]

// Non-numeric values
[[1, 2, "invalid"], [3, 4, 5]]

// Empty row
[[1, 2], [], [3, 4]]
```

## Google Sheets Integration

### Sheet Data Processing

The API can process Google Sheets data with these features:

1. **Data Type Conversion:** Automatically converts string numbers to numeric values
2. **Empty Cell Handling:** Skips empty cells during processing
3. **Row Normalization:** Pads shorter rows with zeros to maintain rectangular grid
4. **Error Reporting:** Provides detailed error messages for invalid data

### Supported Sheet Formats

```
A1: 1    B1: 2    C1: 3
A2: 4    B2:      C2: 6    (Empty B2 is skipped)
A3: 7.5  B3: 8.2  C3: 9.0  (Decimals supported)
```

### Access Requirements

- Sheet must be shared with your service account email
- Or sheet must be publicly accessible via sharing link
- Service account must have proper Google Sheets API permissions

## Performance Characteristics

### Algorithm Complexity

| Grid Size | Time Complexity | Space Complexity | Typical Processing Time |
|-----------|----------------|------------------|------------------------|
| 10×10     | O(100)         | O(100)          | <1ms                   |
| 100×100   | O(10,000)      | O(10,000)       | 10-50ms                |
| 1000×1000 | O(1,000,000)   | O(1,000,000)    | 100-500ms              |

### Size Limitations

- **Maximum Grid Size:** 10,000 × 10,000 cells
- **Warning Threshold:** 1,000,000 total cells
- **Batch Limit:** 10 grids per request
- **Memory Usage:** ~8 bytes per cell for algorithm data structures

### Performance Optimization Tips

1. **Use Direct Grid Analysis** for best performance
2. **Minimize Google Sheets calls** by caching extracted data
3. **Use Batch Processing** for multiple small grids
4. **Consider chunking** very large grids (>1M cells)

## Error Handling

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `MISSING_GRID_DATA` | Grid data not provided in request | 400 |
| `MISSING_SHEET_PARAMETERS` | Sheet ID or tab name missing | 400 |
| `MISSING_SHEET_URL` | URL not provided for URL-based analysis | 400 |
| `INVALID_SHEET_URL` | Cannot extract Sheet ID from URL | 400 |
| `MISSING_BATCH_DATA` | Batch grids array empty or invalid | 400 |
| `BATCH_SIZE_EXCEEDED` | More than 10 grids in batch | 400 |
| `WATER_FLOW_ERROR` | General algorithm processing error | 500 |
| `MISSING_GOOGLE_CREDENTIALS` | Service account not configured | 500 |

### Error Response Format

```json
{
  "error": "Grid data is required in request body",
  "code": "MISSING_GRID_DATA",
  "details": {
    "timestamp": "2024-01-15T10:30:00Z",
    "type": "water-flow-analysis-error"
  }
}
```

## Usage Examples

### Frontend Integration

```javascript
// Direct grid analysis
async function analyzeElevationGrid(elevationData) {
  const response = await fetch('/api/water-flow/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grid: elevationData,
      options: { includeStats: true }
    })
  });
  
  const result = await response.json();
  return result.cells; // Flow cells
}

// Google Sheets analysis
async function analyzeFromGoogleSheet(sheetUrl, tabName) {
  const response = await fetch('/api/water-flow/from-sheet-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: sheetUrl,
      tabName: tabName || 'Sheet1',
      options: { includeStats: true }
    })
  });
  
  return response.json();
}

// Batch processing
async function analyzeMulitpleGrids(gridsArray) {
  const response = await fetch('/api/water-flow/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grids: gridsArray.slice(0, 10), // Ensure max 10 grids
      options: { includeStats: true }
    })
  });
  
  const batchResult = await response.json();
  return batchResult.results.filter(r => r.success);
}
```

### cURL Examples

```bash
# Simple grid analysis
curl -X POST http://localhost:3001/api/water-flow/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "grid": [[1,2,3],[4,5,6],[7,8,9]],
    "options": {"includeStats": true}
  }'

# Google Sheets analysis
curl -X POST http://localhost:3001/api/water-flow/from-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "sheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "tabName": "Topography"
  }'

# Custom ocean configuration
curl -X POST http://localhost:3001/api/water-flow/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "grid": [[1,2,3],[4,5,6],[7,8,9]],
    "options": {
      "pacificEdges": ["top", "right"],
      "atlanticEdges": ["bottom", "left"],
      "includeStats": true
    }
  }'
```

## Algorithm Testing

### Test Cases Included

1. **Basic Functionality:**
   - Simple 2×2 grids
   - Standard 5×5 test case
   - Single cell grids

2. **Edge Cases:**
   - Uniform elevation grids
   - Single row/column grids  
   - Decreasing/increasing patterns

3. **Performance Tests:**
   - Medium-sized grids (20×20)
   - Processing time validation
   - Memory efficiency checks

4. **Integration Tests:**
   - Google Sheets data extraction
   - URL parsing and validation
   - Batch processing

### Running Tests

```bash
# Run all water flow tests
npm test -- waterFlow.test.js

# Run with coverage
npm run test:coverage -- waterFlow.test.js

# Run specific test suite
npm test -- --testNamePattern="Algorithm Correctness"
```

## Swagger API Documentation

Complete interactive API documentation is available at:
**http://localhost:3001/api-docs**

The Swagger UI includes:
- Full endpoint documentation with examples
- Request/response schema definitions
- Interactive testing interface
- Error response examples

## Future Enhancements

### Planned Features (Phase 4+)

1. **Flow Path Visualization:** Return actual flow paths from cells to oceans
2. **Result Caching:** Store analysis results for repeated access
3. **Streaming Processing:** Handle grids larger than memory limits
4. **Real-time Updates:** WebSocket-based progressive results
5. **Advanced Analytics:** Flow pattern classification and statistics
6. **3D Visualization Data:** Export for 3D terrain visualization
7. **Database Integration:** Persistent storage of analysis results

### Performance Improvements

1. **Parallel Processing:** Multi-threaded BFS for large grids
2. **Memory Optimization:** Chunked processing for huge datasets
3. **Caching:** Intelligent result caching with TTL
4. **Compression:** Compressed grid storage and transmission

## Troubleshooting

### Common Issues

**"Grid data is required"**
- Ensure request body includes `grid` field with valid 2D array

**"Invalid numeric value at position (x,y)"**
- Check for non-numeric values in grid
- Verify all cells contain valid numbers

**"All rows must have the same length"**
- Ensure rectangular grid format
- All rows must have identical column counts

**"Sheet not found or access denied"**
- Verify sheet is shared with service account
- Check Google Sheets API credentials configuration

**"Cannot extract Sheet ID from URL"**
- Verify URL is a valid Google Sheets sharing link
- Check URL format matches supported patterns

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
LOG_LEVEL=debug npm run dev
```

This provides detailed request/response logging for troubleshooting.

---

For additional help, refer to the [Google Sheets setup guide](./google-auth-setup.md) or check the project's GitHub issues.