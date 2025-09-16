import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  FormControlLabel,
  Switch,
  Stack,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { FlowCell, GridVisualizationProps } from '../../types';
import { gridColors } from '../../theme';

interface GridCell {
  x: number;
  y: number;
  elevation: number;
  isQualifying: boolean;
}

interface GridVisualizationExtendedProps extends GridVisualizationProps {
  title?: string;
  showElevation?: boolean;
  showCoordinates?: boolean;
  enableZoom?: boolean;
  maxDisplaySize?: number;
}

export const GridVisualization: React.FC<GridVisualizationExtendedProps> = ({
  grid,
  qualifyingCells = [],
  onCellHover,
  onCellClick,
  title = "Grid Visualization",
  showElevation = true,
  showCoordinates = false,
  enableZoom = true,
  maxDisplaySize = 20
}) => {
  const theme = useTheme();
  const [zoom, setZoom] = useState(1);
  const [showElevationColors, setShowElevationColors] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);

  const isDarkMode = theme.palette.mode === 'dark';
  const colors = gridColors[isDarkMode ? 'dark' : 'light'];

  // Create a set of qualifying cell coordinates for fast lookup
  const qualifyingCellSet = useMemo(() => {
    const set = new Set<string>();
    qualifyingCells.forEach(cell => {
      set.add(`${cell.y},${cell.x}`);
    });
    return set;
  }, [qualifyingCells]);

  // Calculate elevation range for color mapping
  const { minElevation, maxElevation } = useMemo(() => {
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    
    grid.forEach(row => {
      row.forEach(cell => {
        min = Math.min(min, cell);
        max = Math.max(max, cell);
      });
    });
    
    return { minElevation: min, maxElevation: max };
  }, [grid]);

  // Get cell color based on elevation or qualifying status
  const getCellColor = (row: number, col: number, elevation: number): string => {
    const isQualifying = qualifyingCellSet.has(`${row},${col}`);
    
    if (isQualifying) {
      return colors.qualifying;
    }
    
    if (showElevationColors && maxElevation > minElevation) {
      const normalized = (elevation - minElevation) / (maxElevation - minElevation);
      if (normalized < 0.33) {
        return colors.elevation.low;
      } else if (normalized < 0.66) {
        return colors.elevation.medium;
      } else {
        return colors.elevation.high;
      }
    }
    
    return colors.regular;
  };

  const handleCellMouseEnter = (row: number, col: number, elevation: number) => {
    const cellData: GridCell = {
      x: col,
      y: row,
      elevation,
      isQualifying: qualifyingCellSet.has(`${row},${col}`)
    };
    
    setHoveredCell(cellData);
    onCellHover?.(cellData);
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
    onCellHover?.(null);
  };

  const handleCellClick = (row: number, col: number, elevation: number) => {
    const cellData = { x: col, y: row, elevation };
    onCellClick?.(cellData);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
  const handleZoomReset = () => setZoom(1);

  // Check if grid is too large to display efficiently
  const gridSize = grid.length * (grid[0]?.length || 0);
  const isLargeGrid = gridSize > maxDisplaySize * maxDisplaySize;

  if (isLargeGrid) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              bgcolor: 'background.paper',
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 2
            }}
          >
            <PaletteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Grid Too Large for Visualization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Grid size: {grid.length} × {grid[0]?.length || 0} ({gridSize} cells)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Maximum display size: {maxDisplaySize} × {maxDisplaySize}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`${qualifyingCells.length} qualifying cells found`}
                color="success"
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const cellSize = Math.max(20, Math.min(40, 300 / Math.max(grid.length, grid[0]?.length || 0)));
  const scaledCellSize = cellSize * zoom;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {title}
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={showElevationColors}
                  onChange={(e) => setShowElevationColors(e.target.checked)}
                  size="small"
                />
              }
              label="Elevation Colors"
              sx={{ mr: 2 }}
            />
            
            {enableZoom && (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                  <ZoomOutIcon />
                </IconButton>
                <IconButton size="small" onClick={handleZoomReset}>
                  <CenterIcon />
                </IconButton>
                <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomInIcon />
                </IconButton>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* Grid Info */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip 
              label={`${grid.length} × ${grid[0]?.length || 0}`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={`${qualifyingCells.length} qualifying cells`} 
              size="small" 
              color="success" 
            />
            {showElevationColors && (
              <Chip 
                label={`Elevation: ${minElevation}-${maxElevation}`} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Stack>
        </Box>

        {/* Legend */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Legend:
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  bgcolor: colors.regular,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 0.5
                }} 
              />
              <Typography variant="body2">Regular terrain</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  bgcolor: colors.qualifying,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 0.5
                }} 
              />
              <Typography variant="body2">Qualifying cells</Typography>
            </Box>
            {showElevationColors && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      bgcolor: colors.elevation.low,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 0.5
                    }} 
                  />
                  <Typography variant="body2">Low elevation</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      bgcolor: colors.elevation.medium,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 0.5
                    }} 
                  />
                  <Typography variant="body2">Medium elevation</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      bgcolor: colors.elevation.high,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 0.5
                    }} 
                  />
                  <Typography variant="body2">High elevation</Typography>
                </Box>
              </>
            )}
          </Stack>
        </Box>

        {/* Grid Display */}
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            maxHeight: 600,
            overflow: 'auto',
            bgcolor: alpha(theme.palette.background.paper, 0.5)
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${grid[0]?.length || 0}, ${scaledCellSize}px)`,
              gap: 1,
              justifyContent: 'center',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((elevation, colIndex) => {
                const isQualifying = qualifyingCellSet.has(`${rowIndex},${colIndex}`);
                const isHovered = hoveredCell?.x === colIndex && hoveredCell?.y === rowIndex;
                
                return (
                  <Tooltip
                    key={`${rowIndex}-${colIndex}`}
                    title={
                      <Box>
                        <Typography variant="body2">
                          Position: ({rowIndex}, {colIndex})
                        </Typography>
                        <Typography variant="body2">
                          Elevation: {elevation}
                        </Typography>
                        {isQualifying && (
                          <Typography variant="body2" color="success.main">
                            ✓ Qualifying cell
                          </Typography>
                        )}
                      </Box>
                    }
                    placement="top"
                  >
                    <Box
                      sx={{
                        width: scaledCellSize,
                        height: scaledCellSize,
                        bgcolor: getCellColor(rowIndex, colIndex, elevation),
                        border: `1px solid ${colors.border}`,
                        borderRadius: 0.5,
                        cursor: onCellClick ? 'pointer' : 'default',
                        transition: 'all 0.15s ease-in-out',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: scaledCellSize > 25 ? '0.75rem' : '0.6rem',
                        fontWeight: 500,
                        color: isQualifying ? theme.palette.getContrastText(colors.qualifying) : theme.palette.text.primary,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                          transform: 'scale(1.05)',
                          zIndex: 1,
                          boxShadow: theme.shadows[4],
                        },
                        ...(isHovered && {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                          zIndex: 2,
                        }),
                      }}
                      onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex, elevation)}
                      onMouseLeave={handleCellMouseLeave}
                      onClick={() => handleCellClick(rowIndex, colIndex, elevation)}
                    >
                      {showElevation && scaledCellSize > 20 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontSize: scaledCellSize > 30 ? '0.75rem' : '0.6rem',
                            fontWeight: 600,
                            textShadow: isQualifying ? '0 0 2px rgba(0,0,0,0.5)' : 'none'
                          }}
                        >
                          {elevation}
                        </Typography>
                      )}
                      {showCoordinates && scaledCellSize > 35 && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            fontSize: '0.5rem',
                            opacity: 0.7,
                          }}
                        >
                          {rowIndex},{colIndex}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                );
              })
            )}
          </Box>
        </Paper>

        {/* Hovered Cell Info */}
        {hoveredCell && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Hovered Cell:</strong> ({hoveredCell.y}, {hoveredCell.x}) | 
              Elevation: {hoveredCell.elevation} |
              {hoveredCell.isQualifying ? (
                <span style={{ color: theme.palette.success.main }}> ✓ Qualifying</span>
              ) : (
                ' Regular terrain'
              )}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};