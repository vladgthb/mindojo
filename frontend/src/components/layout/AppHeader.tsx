import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Water,
  GitHub,
  Info
} from '@mui/icons-material';

interface AppHeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  darkMode,
  onToggleTheme,
}) => {
  const theme = useTheme();

  const handleGitHubClick = () => {
    // In a real app, this would open the project's GitHub repository
    console.log('GitHub repository link');
  };

  const handleInfoClick = () => {
    // In a real app, this would show an info dialog or navigate to docs
    console.log('Show application info');
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={2}
      sx={{
        background: darkMode 
          ? 'linear-gradient(45deg, #1a237e 30%, #283593 90%)'
          : 'linear-gradient(45deg, #0077BE 30%, #4FC3F7 90%)',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Water sx={{ mr: 2, fontSize: 32 }} />
          <Box>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                lineHeight: 1.2
              }}
            >
              Island Water Flow Analysis
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.9,
                fontSize: '0.875rem',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Pacific-Atlantic Water Flow Algorithm
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="View source code">
            <IconButton 
              color="inherit" 
              onClick={handleGitHubClick}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <GitHub />
            </IconButton>
          </Tooltip>

          <Tooltip title="About this application">
            <IconButton 
              color="inherit" 
              onClick={handleInfoClick}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <Info />
            </IconButton>
          </Tooltip>

          <Tooltip title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
            <IconButton color="inherit" onClick={onToggleTheme}>
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};