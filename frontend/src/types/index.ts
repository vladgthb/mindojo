// TypeScript type definitions for the Water Flow Analysis application

export interface SheetTab {
  id: number;
  name: string;
  rowCount: number;
  columnCount: number;
  gridProperties?: {
    rowCount: number;
    columnCount: number;
  };
}

export interface FlowCell {
  x: number;
  y: number;
  elevation: number;
  coordinate: string;
}

export interface WaterFlowStatistics {
  totalCells: number;
  flowCells: number;
  coverage: number;
  processingTime: number;
  efficiency: {
    cellsPerMs: number;
    algorithmsComplexity: string;
  };
  oceanReachability: {
    pacific: number;
    atlantic: number;
    intersection: number;
    pacificOnlyPercent: number;
    atlanticOnlyPercent: number;
    bothOceansPercent: number;
  };
}

export interface WaterFlowOptions {
  pacificEdges?: string[];
  atlanticEdges?: string[];
  includeStats?: boolean;
  includePaths?: boolean;
  includeVisualization?: boolean;
}

export interface WaterFlowMetadata {
  gridDimensions: {
    rows: number;
    cols: number;
  };
  algorithm: string;
  timestamp: string;
  processingTime: number;
  pacificReachable: number;
  atlanticReachable: number;
  intersection: number;
  configuration: WaterFlowOptions;
}

export interface WaterFlowResult {
  cells: FlowCell[];
  stats: WaterFlowStatistics;
  metadata: WaterFlowMetadata;
  input?: {
    url: string;
    sheetId: string;
    tabName: string;
    urlInfo: UrlInfo;
  };
  sheetInfo?: {
    sheetId: string;
    tabName: string;
    originalRange: string;
    extractedGrid: {
      originalRows: number;
      originalCols: number;
      processedRows: number;
      processedCols: number;
      totalCells: number;
    };
  };
  performance?: {
    requestId: string;
    sheetExtractionTime: number;
    gridConversionTime: number;
    algorithmProcessingTime: number;
    totalTime: number;
    timestamp: string;
  };
  // Additional properties from backend response
  requestInfo?: {
    requestId: string;
    totalProcessingTime: number;
    timestamp: string;
    inputSize: {
      rows: number;
      cols: number;
      totalCells: number;
    };
  };
  processingInfo?: {
    requestId: string;
    dataExtractionTime: number;
    dataConversionTime: number;
    algorithmTime: number;
    totalTime: number;
    timestamp: string;
  };
  accessMethod?: string;
  urlInfo?: UrlInfo;
}

export interface UrlInfo {
  isValid: boolean;
  sheetId: string;
  originalUrl: string;
  isPublicLink: boolean;
  accessType: string;
  tabName?: string;
  generatedUrls?: {
    edit: string;
    view: string;
    share: string;
    csv: string;
  };
}

export interface ApiError {
  error: string;
  code: string;
  details: {
    timestamp: string;
    type?: string;
    [key: string]: any;
  };
}

export interface AppState {
  sheetUrl: string | null;
  selectedTab: string | null;
  isLoading: boolean;
  tabs: SheetTab[];
  analysisResults: WaterFlowResult | null;
  error: string | null;
  urlValidation: {
    isValid: boolean | null;
    isValidating: boolean;
    error: string | null;
  };
}

export interface GridVisualizationProps {
  grid: number[][];
  qualifyingCells: FlowCell[];
  onCellHover?: (cell: { x: number; y: number; elevation: number } | null) => void;
  onCellClick?: (cell: { x: number; y: number; elevation: number }) => void;
}

export interface SheetMetadata {
  sheetId: string;
  title: string;
  tabs: SheetTab[];
  lastUpdated: string;
  urlInfo?: UrlInfo;
  accessMethod?: string;
}

// Mock data types
export interface MockGrid {
  name: string;
  size: string;
  grid: number[][];
  expectedCells?: FlowCell[];
}

export interface MockSheetData {
  tabs: SheetTab[];
  grids: { [tabName: string]: MockGrid };
}

// Component prop types
export interface LoadingStateProps {
  isLoading: boolean;
  loadingText?: string;
}

export interface ValidationFeedbackProps {
  isValid: boolean | null;
  isValidating: boolean;
  error: string | null;
  successMessage?: string;
}

export interface StatsSummaryProps {
  stats: WaterFlowStatistics;
  metadata: WaterFlowMetadata;
}

export interface ResultsTableProps {
  cells: FlowCell[];
  isLoading?: boolean;
}

// Theme types
export interface CustomTheme {
  palette: {
    mode: 'light' | 'dark';
    primary: {
      main: string;
      light: string;
      dark: string;
    };
    secondary: {
      main: string;
    };
    background: {
      default: string;
      paper: string;
    };
    grid: {
      regular: string;
      qualifying: string;
      border: string;
      hover: string;
    };
  };
}