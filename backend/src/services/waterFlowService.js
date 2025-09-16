/**
 * Pacific-Atlantic Water Flow Analysis Service
 * 
 * Implements optimized BFS algorithm to determine grid cells where water can flow
 * to both Pacific (northwest) and Atlantic (southeast) ocean edges.
 * 
 * Algorithm: Reverse BFS from ocean borders for O(m×n) complexity
 * instead of checking each cell individually O(n⁴).
 */

class WaterFlowService {
  /**
   * Main algorithm entry point
   * @param {number[][]} grid - 2D array representing elevation heights
   * @param {object} options - Analysis options
   * @returns {object} - Analysis results with cells, stats, and metadata
   */
  async analyzeWaterFlow(grid, options = {}) {
    try {
      const startTime = Date.now();
      
      // Validate and preprocess grid
      const validatedGrid = this.validateGrid(grid);
      const { rows, cols } = this._getGridDimensions(validatedGrid);
      
      // Set default options
      const config = {
        pacificEdges: options.pacificEdges || ['top', 'left'],
        atlanticEdges: options.atlanticEdges || ['bottom', 'right'],
        includeStats: options.includeStats !== false,
        includePaths: options.includePaths || false,
        includeVisualization: options.includeVisualization || false
      };

      // Perform reverse BFS from ocean borders
      const pacificReachable = this._bfsFromPacific(validatedGrid, config.pacificEdges);
      const atlanticReachable = this._bfsFromAtlantic(validatedGrid, config.atlanticEdges);
      
      // Find intersection - cells reachable by both oceans
      const flowCells = this._findIntersection(pacificReachable, atlanticReachable);
      
      const processingTime = Date.now() - startTime;
      
      // Build comprehensive response
      const result = {
        cells: Array.from(flowCells).map(cellKey => {
          const [row, col] = cellKey.split(',').map(Number);
          return { 
            x: col, 
            y: row, 
            elevation: validatedGrid[row][col],
            coordinate: `(${row},${col})`
          };
        })
      };

      // Add statistics if requested
      if (config.includeStats) {
        result.stats = this._calculateStatistics(
          validatedGrid, 
          pacificReachable, 
          atlanticReachable, 
          flowCells, 
          processingTime
        );
      }

      // Add flow paths if requested
      if (config.includePaths) {
        result.paths = this._generateFlowPaths(validatedGrid, flowCells, config);
      }

      // Add metadata
      result.metadata = {
        gridDimensions: { rows, cols },
        algorithm: 'optimized-reverse-bfs',
        timestamp: new Date().toISOString(),
        processingTime,
        pacificReachable: pacificReachable.size,
        atlanticReachable: atlanticReachable.size,
        intersection: flowCells.size,
        configuration: config
      };

      return result;

    } catch (error) {
      throw new Error(`Water flow analysis failed: ${error.message}`);
    }
  }

  /**
   * BFS from Pacific ocean edges (top and left borders)
   * @param {number[][]} grid - Elevation grid
   * @param {string[]} edges - Which edges connect to Pacific
   * @returns {Set} - Set of reachable cell coordinates
   */
  _bfsFromPacific(grid, edges) {
    const { rows, cols } = this._getGridDimensions(grid);
    const reachable = new Set();
    const queue = [];

    // Add Pacific border cells to queue
    for (const edge of edges) {
      switch (edge) {
        case 'top':
          for (let col = 0; col < cols; col++) {
            queue.push([0, col]);
            reachable.add(`0,${col}`);
          }
          break;
        case 'left':
          for (let row = 0; row < rows; row++) {
            queue.push([row, 0]);
            reachable.add(`${row},0`);
          }
          break;
        case 'bottom':
          for (let col = 0; col < cols; col++) {
            queue.push([rows - 1, col]);
            reachable.add(`${rows - 1},${col}`);
          }
          break;
        case 'right':
          for (let row = 0; row < rows; row++) {
            queue.push([row, cols - 1]);
            reachable.add(`${row},${cols - 1}`);
          }
          break;
      }
    }

    // BFS traversal
    return this._performBFS(grid, queue, reachable);
  }

  /**
   * BFS from Atlantic ocean edges (bottom and right borders)
   * @param {number[][]} grid - Elevation grid
   * @param {string[]} edges - Which edges connect to Atlantic
   * @returns {Set} - Set of reachable cell coordinates
   */
  _bfsFromAtlantic(grid, edges) {
    const { rows, cols } = this._getGridDimensions(grid);
    const reachable = new Set();
    const queue = [];

    // Add Atlantic border cells to queue
    for (const edge of edges) {
      switch (edge) {
        case 'bottom':
          for (let col = 0; col < cols; col++) {
            queue.push([rows - 1, col]);
            reachable.add(`${rows - 1},${col}`);
          }
          break;
        case 'right':
          for (let row = 0; row < rows; row++) {
            queue.push([row, cols - 1]);
            reachable.add(`${row},${cols - 1}`);
          }
          break;
        case 'top':
          for (let col = 0; col < cols; col++) {
            queue.push([0, col]);
            reachable.add(`0,${col}`);
          }
          break;
        case 'left':
          for (let row = 0; row < rows; row++) {
            queue.push([row, 0]);
            reachable.add(`${row},0`);
          }
          break;
      }
    }

    // BFS traversal
    return this._performBFS(grid, queue, reachable);
  }

  /**
   * Perform BFS traversal from initial queue
   * @param {number[][]} grid - Elevation grid
   * @param {Array} queue - Initial queue with border cells
   * @param {Set} reachable - Set to track reachable cells
   * @returns {Set} - Complete set of reachable cells
   */
  _performBFS(grid, queue, reachable) {
    const { rows, cols } = this._getGridDimensions(grid);
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // up, down, left, right

    while (queue.length > 0) {
      const [currentRow, currentCol] = queue.shift();
      const currentHeight = grid[currentRow][currentCol];

      // Check all four directions
      for (const [deltaRow, deltaCol] of directions) {
        const newRow = currentRow + deltaRow;
        const newCol = currentCol + deltaCol;
        const cellKey = `${newRow},${newCol}`;

        // Check bounds
        if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
          continue;
        }

        // Check if already visited
        if (reachable.has(cellKey)) {
          continue;
        }

        // Water flows from higher to lower or equal elevation
        // For reverse BFS, we check if water can flow from neighbor TO current cell
        if (grid[newRow][newCol] >= currentHeight) {
          reachable.add(cellKey);
          queue.push([newRow, newCol]);
        }
      }
    }

    return reachable;
  }

  /**
   * Find intersection of Pacific and Atlantic reachable cells
   * @param {Set} pacificCells - Cells reachable from Pacific
   * @param {Set} atlanticCells - Cells reachable from Atlantic
   * @returns {Set} - Cells reachable from both oceans
   */
  _findIntersection(pacificCells, atlanticCells) {
    const intersection = new Set();
    
    for (const cell of pacificCells) {
      if (atlanticCells.has(cell)) {
        intersection.add(cell);
      }
    }
    
    return intersection;
  }

  /**
   * Calculate comprehensive statistics
   */
  _calculateStatistics(grid, pacificReachable, atlanticReachable, flowCells, processingTime) {
    const { rows, cols } = this._getGridDimensions(grid);
    const totalCells = rows * cols;
    const flowCellCount = flowCells.size;

    return {
      totalCells,
      flowCells: flowCellCount,
      coverage: parseFloat((flowCellCount / totalCells).toFixed(4)),
      processingTime,
      efficiency: {
        cellsPerMs: Math.round(totalCells / processingTime),
        algorithmsComplexity: `O(${rows} × ${cols}) = O(${totalCells})`
      },
      oceanReachability: {
        pacific: pacificReachable.size,
        atlantic: atlanticReachable.size,
        intersection: flowCellCount,
        pacificOnlyPercent: parseFloat(((pacificReachable.size - flowCellCount) / totalCells).toFixed(4)),
        atlanticOnlyPercent: parseFloat(((atlanticReachable.size - flowCellCount) / totalCells).toFixed(4)),
        bothOceansPercent: parseFloat((flowCellCount / totalCells).toFixed(4))
      }
    };
  }

  /**
   * Generate flow paths for visualization
   */
  _generateFlowPaths(grid, flowCells, config) {
    // This is a placeholder for path generation
    // In a full implementation, we'd trace back paths from flow cells to ocean edges
    return {
      note: "Flow path generation not yet implemented",
      flowCellCount: flowCells.size,
      availableInFutureVersion: true
    };
  }

  /**
   * Validate and preprocess grid input
   * @param {any} grid - Input grid to validate
   * @returns {number[][]} - Validated numeric grid
   */
  validateGrid(grid) {
    if (!grid || !Array.isArray(grid)) {
      throw new Error('Grid must be a non-empty 2D array');
    }

    if (grid.length === 0) {
      throw new Error('Grid cannot be empty');
    }

    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    if (cols === 0) {
      throw new Error('Grid rows cannot be empty');
    }

    // Validate grid dimensions and convert to numbers
    const validatedGrid = [];
    
    for (let i = 0; i < rows; i++) {
      if (!Array.isArray(grid[i])) {
        throw new Error(`Row ${i} must be an array`);
      }
      
      if (grid[i].length !== cols) {
        throw new Error(`All rows must have the same length. Row ${i} has ${grid[i].length} columns, expected ${cols}`);
      }

      const validatedRow = [];
      
      for (let j = 0; j < cols; j++) {
        const value = grid[i][j];
        
        // Convert to number and validate
        const numValue = Number(value);
        if (isNaN(numValue)) {
          throw new Error(`Invalid numeric value at position (${i},${j}): ${value}`);
        }
        
        validatedRow.push(numValue);
      }
      
      validatedGrid.push(validatedRow);
    }

    // Check reasonable size limits
    if (rows > 10000 || cols > 10000) {
      throw new Error(`Grid too large: ${rows}×${cols}. Maximum supported size is 10000×10000`);
    }

    if (rows * cols > 1000000) {
      console.warn(`Large grid detected: ${rows}×${cols} = ${rows * cols} cells. Consider chunked processing.`);
    }

    return validatedGrid;
  }

  /**
   * Get grid dimensions
   * @param {number[][]} grid - Grid array
   * @returns {object} - Object with rows and cols properties
   */
  _getGridDimensions(grid) {
    return {
      rows: grid.length,
      cols: grid[0]?.length || 0
    };
  }

  /**
   * Analyze water flow from Google Sheets data
   * @param {string} sheetId - Google Sheets ID
   * @param {string} tabName - Tab name containing grid data
   * @param {object} options - Analysis options
   * @returns {object} - Analysis results with sheet metadata
   */
  async analyzeFromSheet(sheetId, tabName, options = {}) {
    try {
      // This will be implemented when we integrate with Google Sheets service
      throw new Error('Sheet analysis not yet implemented. Use analyzeWaterFlow with direct grid data.');
    } catch (error) {
      throw new Error(`Sheet analysis failed: ${error.message}`);
    }
  }
}

module.exports = new WaterFlowService();