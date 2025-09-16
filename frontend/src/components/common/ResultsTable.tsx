import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Stack,
  TextField,
  InputAdornment,
  Button,
  Chip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ContentCopy as CopyIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import type { ResultsTableProps } from '../../types';

type SortField = 'coordinate' | 'row' | 'column' | 'elevation';
type SortDirection = 'asc' | 'desc';

export const ResultsTable: React.FC<ResultsTableProps> = ({ 
  cells, 
  isLoading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('row');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Process and filter cells
  const processedCells = useMemo(() => {
    let filtered = cells.filter(cell => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        cell.coordinate.toLowerCase().includes(searchLower) ||
        cell.x.toString().includes(searchLower) ||
        cell.y.toString().includes(searchLower) ||
        cell.elevation.toString().includes(searchLower)
      );
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'row':
          aValue = a.y;
          bValue = b.y;
          break;
        case 'column':
          aValue = a.x;
          bValue = b.x;
          break;
        case 'elevation':
          aValue = a.elevation;
          bValue = b.elevation;
          break;
        case 'coordinate':
        default:
          aValue = a.coordinate;
          bValue = b.coordinate;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [cells, searchTerm, sortField, sortDirection]);

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'coordinate',
      headerName: 'Coordinate',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          variant="outlined"
          sx={{ fontFamily: 'monospace' }}
        />
      ),
    },
    {
      field: 'row',
      headerName: 'Row',
      width: 80,
      type: 'number',
      valueGetter: (params) => params.row.y,
    },
    {
      field: 'column',
      headerName: 'Column', 
      width: 80,
      type: 'number',
      valueGetter: (params) => params.row.x,
    },
    {
      field: 'elevation',
      headerName: 'Elevation',
      width: 100,
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ fontWeight: 500, color: 'primary.main' }}>
          {params.value}
        </Box>
      ),
    },
  ];

  // DataGrid rows with unique IDs
  const rows = processedCells.map((cell) => ({
    id: `${cell.y}-${cell.x}`,
    ...cell,
  }));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Coordinate', 'Row', 'Column', 'Elevation'];
    const csvContent = [
      headers.join(','),
      ...processedCells.map(cell => 
        `"${cell.coordinate}",${cell.y},${cell.x},${cell.elevation}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `water-flow-results-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    const text = processedCells.map(cell => 
      `${cell.coordinate}: (${cell.y}, ${cell.x}) elevation ${cell.elevation}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
      // In a real app, you'd show a success toast here
      console.log('Copied to clipboard');
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  const clearSearch = () => setSearchTerm('');

  if (cells.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Qualifying Cells Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The water flow analysis did not find any cells where water can reach both oceans.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Qualifying Cells ({processedCells.length} of {cells.length})
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Copy to clipboard">
              <IconButton onClick={handleCopyToClipboard} disabled={isLoading}>
                <CopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export as CSV">
              <IconButton onClick={handleExportCSV} disabled={isLoading}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Search and Sort Controls */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              placeholder="Search coordinates, rows, columns, or elevations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300, flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={clearSearch}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<SortIcon />}
                onClick={() => handleSort('row')}
                variant={sortField === 'row' ? 'contained' : 'outlined'}
              >
                Row {sortField === 'row' && (sortDirection === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                size="small"
                startIcon={<SortIcon />}
                onClick={() => handleSort('column')}
                variant={sortField === 'column' ? 'contained' : 'outlined'}
              >
                Column {sortField === 'column' && (sortDirection === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                size="small"
                startIcon={<SortIcon />}
                onClick={() => handleSort('elevation')}
                variant={sortField === 'elevation' ? 'contained' : 'outlined'}
              >
                Elevation {sortField === 'elevation' && (sortDirection === 'asc' ? '↑' : '↓')}
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Results Summary */}
        {searchTerm && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {processedCells.length === cells.length 
                ? `Showing all ${cells.length} results`
                : `Showing ${processedCells.length} of ${cells.length} results for "${searchTerm}"`
              }
            </Typography>
          </Box>
        )}

        {/* Data Grid */}
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            density="comfortable"
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          />
        </Box>

        {/* Quick Stats */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary">
              <strong>Total:</strong> {cells.length} cells
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Showing:</strong> {processedCells.length} cells
            </Typography>
            {processedCells.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary">
                  <strong>Elevation Range:</strong> {Math.min(...processedCells.map(c => c.elevation))} - {Math.max(...processedCells.map(c => c.elevation))}
                </Typography>
              </>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};