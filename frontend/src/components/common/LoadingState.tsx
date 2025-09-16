import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Skeleton
} from '@mui/material';
import type {LoadingStateProps} from '../../types';

interface ExtendedLoadingStateProps extends LoadingStateProps {
  variant?: 'circular' | 'linear' | 'skeleton';
  size?: 'small' | 'medium' | 'large';
}

export const LoadingState: React.FC<ExtendedLoadingStateProps> = ({
  isLoading,
  loadingText = 'Loading...',
  variant = 'circular',
  size = 'medium'
}) => {
  if (!isLoading) return null;

  const sizeMap = {
    small: { circular: 24, text: 'body2' as const },
    medium: { circular: 40, text: 'body1' as const },
    large: { circular: 60, text: 'h6' as const }
  };

  const currentSize = sizeMap[size];

  if (variant === 'skeleton') {
    return (
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="rectangular" height={200} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rectangular" width={80} height={32} />
              <Skeleton variant="rectangular" width={100} height={32} />
              <Skeleton variant="rectangular" width={120} height={32} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'linear') {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant={currentSize.text} color="text.secondary" sx={{ mb: 2 }}>
              {loadingText}
            </Typography>
            <LinearProgress sx={{ width: '100%', maxWidth: 300, mx: 'auto' }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 4 
        }}>
          <CircularProgress size={currentSize.circular} sx={{ mb: 2 }} />
          <Typography variant={currentSize.text} color="text.secondary">
            {loadingText}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Specialized loading components
export const TabsLoadingState: React.FC = () => (
  <LoadingState 
    isLoading={true} 
    loadingText="Loading sheet tabs..." 
    variant="skeleton" 
  />
);

export const AnalysisLoadingState: React.FC = () => (
  <LoadingState 
    isLoading={true} 
    loadingText="Analyzing water flow patterns..." 
    variant="linear" 
  />
);

export const GridLoadingState: React.FC = () => (
  <Card>
    <CardContent>
      <Stack spacing={2}>
        <Skeleton variant="text" width="40%" height={32} />
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" width={80} height={24} />
          <Skeleton variant="rectangular" width={100} height={24} />
          <Skeleton variant="rectangular" width={90} height={24} />
        </Stack>
        <Skeleton variant="rectangular" height={300} />
      </Stack>
    </CardContent>
  </Card>
);