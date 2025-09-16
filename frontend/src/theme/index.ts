import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Custom color palette for water flow visualization
const customColors = {
  pacific: '#0077BE',      // Pacific blue
  atlantic: '#006B54',     // Atlantic teal
  qualifying: '#4CAF50',   // Success green for qualifying cells
  regular: '#E0E0E0',      // Light gray for regular terrain
  elevation: {
    low: '#8BC34A',        // Light green for low elevation
    medium: '#FFC107',     // Amber for medium elevation
    high: '#FF5722'        // Deep orange for high elevation
  }
};

// Light theme configuration
const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: customColors.pacific,
      light: '#4FC3F7',
      dark: '#01579B',
      contrastText: '#ffffff',
    },
    secondary: {
      main: customColors.atlantic,
      light: '#4DB6AC',
      dark: '#004D40',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    success: {
      main: customColors.qualifying,
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.4,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 119, 190, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 119, 190, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
};

// Dark theme configuration
const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#4FC3F7',
      light: '#81D4FA',
      dark: '#0277BD',
      contrastText: '#000000',
    },
    secondary: {
      main: '#4DB6AC',
      light: '#80CBC4',
      dark: '#00695C',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    success: {
      main: '#66BB6A',
    },
    text: {
      primary: '#E0E0E0',
      secondary: '#BDBDBD',
    },
  },
  typography: lightThemeOptions.typography,
  shape: lightThemeOptions.shape,
  components: {
    ...lightThemeOptions.components,
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(79, 195, 247, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(79, 195, 247, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
          borderRadius: 12,
          backgroundColor: '#1E1E1E',
        },
      },
    },
  },
};

export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);

// Grid visualization colors for both themes
export const gridColors = {
  light: {
    regular: customColors.regular,
    qualifying: customColors.qualifying,
    pacific: customColors.pacific,
    atlantic: customColors.atlantic,
    border: '#BDBDBD',
    hover: '#F0F0F0',
    elevation: customColors.elevation,
  },
  dark: {
    regular: '#424242',
    qualifying: '#66BB6A',
    pacific: '#4FC3F7',
    atlantic: '#4DB6AC',
    border: '#616161',
    hover: '#333333',
    elevation: {
      low: '#689F38',
      medium: '#F57C00',
      high: '#D84315',
    },
  },
};

export { customColors };