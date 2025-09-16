import React, { useState, useEffect, useCallback } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Grid2 as Grid,
  Button,
  Alert,
  Snackbar,
  Paper,
  Typography,
  Stack,
  Fab
} from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { PlayArrow as PlayIcon, Refresh as RefreshIcon } from '@mui/icons-material';

// Theme
import { lightTheme, darkTheme } from './theme';

// Components
import { AppHeader } from './components/layout/AppHeader';
import { UrlInputForm } from './components/forms/UrlInputForm';
import { TabSelector } from './components/forms/TabSelector';
import { GridVisualization } from './components/visualization/GridVisualization';
import { StatsSummary } from './components/common/StatsSummary';
import { ResultsTable } from './components/common/ResultsTable';
import { LoadingState, AnalysisLoadingState } from './components/common/LoadingState';

// Hooks
import { useAppState } from './hooks/useAppState';
import { useSheetData } from './hooks/useSheetData';
import { useWaterFlowAnalysis } from './hooks/useWaterFlowAnalysis';

// Utils
import { mockService } from './services/mockService';

function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Main application state
  const {
    sheetUrl,
    selectedTab,
    isLoading: appLoading,
    setSheetUrl,
    setSelectedTab,
    setLoading: setAppLoading,
    setError: setAppError,
    setUrlValidation,
    canAnalyze,
    resetState
  } = useAppState();

  // Sheet data management
  const {
    isValidating,
    isLoadingTabs,
    urlValidation,
    tabs,
    sheetMetadata,
    error: sheetError,
    validateUrl,
    loadTabs,
    clearError: clearSheetError,
    isUsingMockData: useSheetMockData
  } = useSheetData();

  // Water flow analysis
  const {
    isAnalyzing,
    results: analysisResults,
    error: analysisError,
    analyzeFromUrl,
    clearError: clearAnalysisError,
    exportResultsAsJson,
    isUsingMockData: useAnalysisMockData
  } = useWaterFlowAnalysis();

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Theme persistence
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Sync URL validation state
  useEffect(() => {
    setUrlValidation(urlValidation);
  }, [urlValidation, setUrlValidation]);

  // URL change handler
  const handleUrlChange = useCallback((url: string) => {
    setSheetUrl(url);
    if (url) {
      validateUrl(url);
    }
  }, [setSheetUrl, validateUrl]);

  // URL submit handler
  const handleUrlSubmit = useCallback(async (url: string) => {
    if (!url) return;
    
    setAppLoading(true);
    clearSheetError();
    clearAnalysisError();
    
    try {
      const loadedTabs = await loadTabs(url);
      if (loadedTabs.length > 0) {
        setSnackbar({
          open: true,
          message: `Successfully loaded ${loadedTabs.length} sheet tabs`,
          severity: 'success'
        });
      }
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Failed to load sheet');
      setSnackbar({
        open: true,
        message: 'Failed to load sheet. Please check the URL and try again.',
        severity: 'error'
      });
    } finally {
      setAppLoading(false);
    }
  }, [loadTabs, setAppLoading, setAppError, clearSheetError, clearAnalysisError]);

  // Analysis handler
  const handleRunAnalysis = useCallback(async () => {
    if (!sheetUrl || !selectedTab) return;

    setAppLoading(true);
    clearAnalysisError();

    try {
      const result = await analyzeFromUrl(sheetUrl, selectedTab);
      
      if (result) {
        setSnackbar({
          open: true,
          message: `Analysis complete! Found ${result.cells.length} qualifying cells.`,
          severity: 'success'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Analysis failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setAppLoading(false);
    }
  }, [sheetUrl, selectedTab, analyzeFromUrl, setAppLoading, clearAnalysisError]);

  // Reset handler
  const handleReset = useCallback(() => {
    resetState();
    clearSheetError();
    clearAnalysisError();
    setSnackbar({
      open: true,
      message: 'Application reset successfully',
      severity: 'info'
    });
  }, [resetState, clearSheetError, clearAnalysisError]);

  // Demo mode notification
  const usingMockData = useSheetMockData || useAnalysisMockData;

  return (
    <BrowserRouter>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        
        {/* Demo Mode Banner */}
        {usingMockData && (
          <Paper 
            square 
            sx={{ 
              bgcolor: 'warning.main', 
              color: 'warning.contrastText', 
              p: 1, 
              textAlign: 'center' 
            }}
          >
            <Typography variant="body2">
              🚧 Demo Mode: Using mock data for development
            </Typography>
          </Paper>
        )}

        {/* Header */}
        <AppHeader 
          darkMode={darkMode} 
          onToggleTheme={() => setDarkMode(!darkMode)} 
        />

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Grid container spacing={3}>
            {/* URL Input Section */}
            <Grid xs={12}>
              <UrlInputForm
                url={sheetUrl || ''}
                onUrlChange={handleUrlChange}
                onUrlSubmit={handleUrlSubmit}
                validation={{
                  isValid: urlValidation.isValid,
                  isValidating: urlValidation.isValidating,
                  error: urlValidation.error
                }}
                isLoading={isLoadingTabs}
                disabled={appLoading}
              />
            </Grid>

            {/* Tab Selection */}
            {tabs.length > 0 && (
              <Grid xs={12}>
                <TabSelector
                  tabs={tabs}
                  selectedTab={selectedTab}
                  onTabSelect={setSelectedTab}
                  isLoading={isLoadingTabs}
                  disabled={appLoading}
                  error={sheetError}
                />
              </Grid>
            )}

            {/* Analysis Button */}
            {canAnalyze && (
              <Grid xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayIcon />}
                      onClick={handleRunAnalysis}
                      disabled={isAnalyzing || appLoading}
                      sx={{ minWidth: 200 }}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Run Water Flow Analysis'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<RefreshIcon />}
                      onClick={handleReset}
                      disabled={isAnalyzing || appLoading}
                    >
                      Reset
                    </Button>
                  </Stack>
                  
                  {selectedTab && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Ready to analyze "{selectedTab}" tab
                    </Typography>
                  )}
                </Paper>
              </Grid>
            )}

            {/* Analysis Loading State */}
            {isAnalyzing && (
              <Grid xs={12}>
                <AnalysisLoadingState />
              </Grid>
            )}

            {/* Results Section */}
            {analysisResults && !isAnalyzing && (
              <>
                {/* Statistics Summary */}
                <Grid xs={12}>
                  <StatsSummary 
                    stats={analysisResults.stats} 
                    metadata={analysisResults.metadata}
                  />
                </Grid>

                {/* Grid Visualization and Results Table */}
                <Grid xs={12} lg={6}>
                  <GridVisualization
                    grid={analysisResults.input ? 
                      mockService.getGridData(analysisResults.input.tabName) || [[1]] :
                      [[1]]
                    }
                    qualifyingCells={analysisResults.cells}
                    title="Water Flow Visualization"
                    showElevation={true}
                    enableZoom={true}
                  />
                </Grid>

                <Grid xs={12} lg={6}>
                  <ResultsTable 
                    cells={analysisResults.cells}
                    isLoading={false}
                  />
                </Grid>
              </>
            )}

            {/* Error Messages */}
            {(sheetError || analysisError) && (
              <Grid xs={12}>
                <Alert 
                  severity="error" 
                  onClose={() => {
                    clearSheetError();
                    clearAnalysisError();
                  }}
                >
                  {sheetError || analysisError}
                </Alert>
              </Grid>
            )}

            {/* Empty State */}
            {!sheetUrl && !isLoadingTabs && (
              <Grid xs={12}>
                <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'background.paper' }}>
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    Welcome to Island Water Flow Analysis
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Enter a Google Sheets URL above to get started with analyzing water flow patterns.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This tool determines which grid cells allow water to flow to both Pacific and Atlantic oceans
                    using an optimized reverse BFS algorithm.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Container>

        {/* Export FAB */}
        {analysisResults && (
          <Fab
            color="primary"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={exportResultsAsJson}
          >
            <PlayIcon />
          </Fab>
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;