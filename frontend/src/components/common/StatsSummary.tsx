import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  LinearProgress,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import {
  Timer as TimerIcon,
  GridOn as GridIcon,
  Water as WaterIcon,
  Speed as SpeedIcon,
  Info as InfoIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import type { StatsSummaryProps } from '../../types';

export const StatsSummary: React.FC<StatsSummaryProps> = ({ 
  stats, 
  metadata,
}) => {
  const coveragePercent = Math.round(stats.coverage * 100);
  const efficiency = stats.efficiency;
  const oceanReach = stats.oceanReachability;

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WaterIcon color="primary" />
            Analysis Results
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Algorithm details">
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download results">
              <IconButton size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ justifyContent: 'space-between' }}>
          {/* Primary Stats */}
          <Box sx={{ textAlign: 'center', p: 2, flex: 1 }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
              {stats.flowCells}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Qualifying Cells
            </Typography>
            <Chip 
              label={`${coveragePercent}% coverage`} 
              size="small" 
              color={coveragePercent > 20 ? 'success' : coveragePercent > 10 ? 'warning' : 'default'}
              variant="outlined"
            />
          </Box>

          <Box sx={{ textAlign: 'center', p: 2, flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {formatNumber(stats.totalCells)}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Cells
            </Typography>
            <Chip 
              label={`${metadata.gridDimensions.rows}×${metadata.gridDimensions.cols}`}
              size="small"
              variant="outlined"
              icon={<GridIcon />}
            />
          </Box>

          <Box sx={{ textAlign: 'center', p: 2, flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {formatTime(stats.processingTime)}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Processing Time
            </Typography>
            <Chip 
              label={`${formatNumber(efficiency.cellsPerMs)}/ms`}
              size="small"
              variant="outlined"
              icon={<SpeedIcon />}
            />
          </Box>

          <Box sx={{ textAlign: 'center', p: 2, flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {metadata.algorithm.split('-')[0]}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Algorithm
            </Typography>
            <Chip 
              label={efficiency.algorithmsComplexity}
              size="small"
              variant="outlined"
              icon={<TimerIcon />}
            />
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Coverage Visualization */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Grid Coverage
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {coveragePercent}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={coveragePercent} 
            sx={{ height: 8, borderRadius: 4 }}
            color={coveragePercent > 20 ? 'success' : coveragePercent > 10 ? 'warning' : 'primary'}
          />
        </Box>

        {/* Ocean Reachability */}
        <Box>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
            Ocean Reachability
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1, flex: 1 }}>
              <Typography variant="h6" color="info.main">
                {oceanReach.pacific}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pacific Only
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(oceanReach.pacificOnlyPercent * 100)}%
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 1, flex: 1 }}>
              <Typography variant="h6" color="warning.main">
                {oceanReach.atlantic}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Atlantic Only
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(oceanReach.atlanticOnlyPercent * 100)}%
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.main', color: 'success.contrastText', borderRadius: 1, flex: 1 }}>
              <Typography variant="h6">
                {oceanReach.intersection}
              </Typography>
              <Typography variant="body2">
                Both Oceans
              </Typography>
              <Typography variant="caption">
                {Math.round(oceanReach.bothOceansPercent * 100)}%
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Algorithm Configuration */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Configuration:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Pacific: ${metadata.configuration.pacificEdges?.join(', ') || 'top, left'}`} size="small" />
            <Chip label={`Atlantic: ${metadata.configuration.atlanticEdges?.join(', ') || 'bottom, right'}`} size="small" />
            {metadata.configuration.includeStats && (
              <Chip label="Statistics enabled" size="small" variant="outlined" />
            )}
          </Stack>
        </Box>

        {/* Timestamp */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Analysis completed at {new Date(metadata.timestamp).toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};