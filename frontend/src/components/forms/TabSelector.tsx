import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Skeleton,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import {
  Tab as TabIcon,
  TableChart as TableIcon
} from '@mui/icons-material';
import { SheetTab } from '../../types';

interface TabSelectorProps {
  tabs: SheetTab[];
  selectedTab: string | null;
  onTabSelect: (tabName: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string | null;
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  tabs,
  selectedTab,
  onTabSelect,
  isLoading = false,
  disabled = false,
  error = null
}) => {
  const handleTabChange = (event: SelectChangeEvent<string>) => {
    onTabSelect(event.target.value);
  };

  if (isLoading) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={300} height={20} sx={{ mt: 1 }} />
          </Box>
          <Skeleton variant="rectangular" height={56} />
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rectangular" width={80} height={32} />
              <Skeleton variant="rectangular" width={100} height={32} />
              <Skeleton variant="rectangular" width={90} height={32} />
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (tabs.length === 0) {
    return null;
  }

  const selectedTabData = tabs.find(tab => tab.name === selectedTab);

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TabIcon />
            Select Sheet Tab
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose which tab contains the elevation data for analysis
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel>Sheet Tab</InputLabel>
            <Select
              value={selectedTab || ''}
              label="Sheet Tab"
              onChange={handleTabChange}
            >
              {tabs.map((tab) => (
                <MenuItem key={tab.id} value={tab.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <TableIcon fontSize="small" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1">
                        {tab.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tab.rowCount} × {tab.columnCount} cells
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Tab overview chips */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Available tabs ({tabs.length}):
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {tabs.map((tab) => (
              <Chip
                key={tab.id}
                label={`${tab.name} (${tab.rowCount}×${tab.columnCount})`}
                variant={selectedTab === tab.name ? 'filled' : 'outlined'}
                size="small"
                color={selectedTab === tab.name ? 'primary' : 'default'}
                clickable={!disabled}
                onClick={() => !disabled && onTabSelect(tab.name)}
                icon={<TableIcon />}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>

        {/* Selected tab details */}
        {selectedTabData && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Selected Tab Details:
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2">
                <strong>{selectedTabData.name}</strong>
              </Typography>
              <Chip 
                label={`${selectedTabData.rowCount} rows`} 
                size="small" 
                variant="outlined" 
              />
              <Chip 
                label={`${selectedTabData.columnCount} columns`} 
                size="small" 
                variant="outlined" 
              />
              <Chip 
                label={`${selectedTabData.rowCount * selectedTabData.columnCount} total cells`} 
                size="small" 
                variant="outlined" 
              />
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};