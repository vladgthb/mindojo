import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Link as LinkIcon,
  Clear as ClearIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  ContentPaste as PasteIcon
} from '@mui/icons-material';
import type { ValidationFeedbackProps } from '../../types';

interface UrlInputFormProps {
  url: string;
  onUrlChange: (url: string) => void;
  onUrlSubmit: (url: string) => void;
  validation: ValidationFeedbackProps;
  isLoading?: boolean;
  disabled?: boolean;
}

// Demo URLs for quick testing
const demoUrls = [
  {
    label: 'Demo Sheet 1',
    url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing'
  },
  {
    label: 'Demo Sheet 2', 
    url: 'https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3/edit'
  },
];

export const UrlInputForm: React.FC<UrlInputFormProps> = ({
  url,
  onUrlChange,
  onUrlSubmit,
  validation,
  isLoading = false,
  disabled = false
}) => {
  const [localUrl, setLocalUrl] = useState(url);

  useEffect(() => {
    setLocalUrl(url);
  }, [url]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value;
    setLocalUrl(newUrl);
    onUrlChange(newUrl);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (localUrl.trim()) {
      onUrlSubmit(localUrl.trim());
    }
  };

  const handleClear = () => {
    setLocalUrl('');
    onUrlChange('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLocalUrl(text);
        onUrlChange(text);
      }
    } catch (err) {
      console.warn('Unable to read clipboard:', err);
    }
  };

  const handleDemoUrlClick = (demoUrl: string) => {
    setLocalUrl(demoUrl);
    onUrlChange(demoUrl);
  };

  const getValidationIcon = () => {
    if (validation.isValidating) {
      return <CircularProgress size={20} />;
    }
    if (validation.isValid === true) {
      return <CheckIcon color="success" />;
    }
    if (validation.isValid === false) {
      return <ErrorIcon color="error" />;
    }
    return null;
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon />
            Google Sheets URL
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a public Google Sheets URL to analyze the water flow patterns
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Google Sheets URL"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={localUrl}
              onChange={handleInputChange}
              disabled={disabled}
              error={validation.isValid === false}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {getValidationIcon()}
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {localUrl && (
                        <Tooltip title="Clear URL">
                          <IconButton
                            size="small"
                            onClick={handleClear}
                            disabled={disabled}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Paste from clipboard">
                        <IconButton
                          size="small"
                          onClick={handlePaste}
                          disabled={disabled}
                        >
                          <PasteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </InputAdornment>
                )
              }}
              helperText={
                validation.error ? validation.error : 
                validation.isValid === true ? 'Valid Google Sheets URL' :
                'Paste a Google Sheets sharing link'
              }
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!localUrl.trim() || validation.isValid === false || isLoading || disabled}
              startIcon={isLoading ? <CircularProgress size={20} /> : <LinkIcon />}
              sx={{ mr: 2 }}
            >
              {isLoading ? 'Loading Sheet...' : 'Load Sheet'}
            </Button>
          </Box>
        </form>

        {/* Demo URLs */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Try with demo data:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {demoUrls.map((demo, index) => (
              <Chip
                key={index}
                label={demo.label}
                variant="outlined"
                size="small"
                clickable
                disabled={disabled}
                onClick={() => handleDemoUrlClick(demo.url)}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>

        {/* Validation Feedback */}
        {validation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {validation.error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};