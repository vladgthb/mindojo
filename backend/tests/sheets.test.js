const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/config/googleAuth');
jest.mock('../src/services/googleSheetsService');

const mockGoogleAuth = require('../src/config/googleAuth');
const mockSheetsService = require('../src/services/googleSheetsService');

describe('Google Sheets API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGoogleAuth.validateCredentials.mockReturnValue(true);
  });

  describe('GET /api/sheets/:sheetId/metadata', () => {
    it('should return sheet metadata successfully', async () => {
      const mockMetadata = {
        id: 'test-sheet-id',
        title: 'Test Sheet',
        locale: 'en_US',
        timeZone: 'America/New_York',
        lastUpdated: '2024-01-15T10:30:00Z'
      };

      mockSheetsService.getSheetMetadata.mockResolvedValue(mockMetadata);

      const response = await request(app)
        .get('/api/sheets/test-sheet-id/metadata')
        .expect(200);

      expect(response.body).toEqual(mockMetadata);
      expect(mockSheetsService.getSheetMetadata).toHaveBeenCalledWith('test-sheet-id');
    });

    it('should return 400 for missing sheet ID', async () => {
      const response = await request(app)
        .get('/api/sheets/ /metadata')
        .expect(400);

      expect(response.body.error).toContain('Valid sheet ID is required');
      expect(response.body.code).toBe('INVALID_SHEET_ID');
    });

    it('should return 400 for invalid sheet ID format', async () => {
      const response = await request(app)
        .get('/api/sheets/invalid@sheet#id/metadata')
        .expect(400);

      expect(response.body.error).toContain('Sheet ID contains invalid characters');
      expect(response.body.code).toBe('MALFORMED_SHEET_ID');
    });

    it('should handle Google API errors', async () => {
      const error = new Error('Sheet not found');
      error.code = 'SHEET_NOT_FOUND';
      error.statusCode = 404;
      
      mockSheetsService.getSheetMetadata.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/sheets/nonexistent-sheet/metadata')
        .expect(404);

      expect(response.body.error).toBe('Sheet not found');
      expect(response.body.code).toBe('SHEET_NOT_FOUND');
    });
  });

  describe('GET /api/sheets/:sheetId/tabs', () => {
    it('should return sheet tabs successfully', async () => {
      const mockTabs = {
        sheetId: 'test-sheet-id',
        title: 'Test Sheet',
        tabs: [
          {
            id: 0,
            name: 'Sheet1',
            index: 0,
            rowCount: 100,
            columnCount: 26,
            gridProperties: { rowCount: 100, columnCount: 26 }
          }
        ],
        lastUpdated: '2024-01-15T10:30:00Z'
      };

      mockSheetsService.getSheetTabs.mockResolvedValue(mockTabs);

      const response = await request(app)
        .get('/api/sheets/test-sheet-id/tabs')
        .expect(200);

      expect(response.body).toEqual(mockTabs);
      expect(mockSheetsService.getSheetTabs).toHaveBeenCalledWith('test-sheet-id');
    });
  });

  describe('GET /api/sheets/:sheetId/tabs/:tabName/content', () => {
    it('should return tab content successfully', async () => {
      const mockContent = {
        tabName: 'Sheet1',
        range: 'Sheet1!A1:C3',
        data: [
          ['Header1', 'Header2', 'Header3'],
          ['Row1Col1', 'Row1Col2', 'Row1Col3'],
          ['Row2Col1', 'Row2Col2', 'Row2Col3']
        ],
        metadata: {
          rowCount: 100,
          columnCount: 26,
          actualRowCount: 3,
          actualColumnCount: 3,
          lastUpdated: '2024-01-15T10:30:00Z',
          hasHeaders: true
        }
      };

      mockSheetsService.getTabContent.mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/sheets/test-sheet-id/tabs/Sheet1/content')
        .expect(200);

      expect(response.body).toEqual(mockContent);
      expect(mockSheetsService.getTabContent).toHaveBeenCalledWith('test-sheet-id', 'Sheet1');
    });

    it('should handle URL encoded tab names', async () => {
      const mockContent = {
        tabName: 'Sheet With Spaces',
        range: 'Sheet With Spaces!A1:C3',
        data: [],
        metadata: {
          rowCount: 0,
          columnCount: 0,
          actualRowCount: 0,
          actualColumnCount: 0,
          lastUpdated: '2024-01-15T10:30:00Z',
          hasHeaders: false
        }
      };

      mockSheetsService.getTabContent.mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/sheets/test-sheet-id/tabs/Sheet%20With%20Spaces/content')
        .expect(200);

      expect(response.body).toEqual(mockContent);
      expect(mockSheetsService.getTabContent).toHaveBeenCalledWith('test-sheet-id', 'Sheet With Spaces');
    });

    it('should return 400 for empty tab name', async () => {
      const response = await request(app)
        .get('/api/sheets/test-sheet-id/tabs/%20/content')
        .expect(400);

      expect(response.body.error).toContain('Tab name cannot be empty');
      expect(response.body.code).toBe('EMPTY_TAB_NAME');
    });
  });

  describe('POST /api/sheets/validate', () => {
    it('should validate sheet access successfully', async () => {
      const mockValidation = {
        hasAccess: true,
        sheetId: 'test-sheet-id',
        timestamp: '2024-01-15T10:30:00Z'
      };

      mockSheetsService.validateSheetAccess.mockResolvedValue(mockValidation);

      const response = await request(app)
        .post('/api/sheets/validate')
        .send({ sheetId: 'test-sheet-id' })
        .expect(200);

      expect(response.body).toEqual(mockValidation);
      expect(mockSheetsService.validateSheetAccess).toHaveBeenCalledWith('test-sheet-id');
    });

    it('should return 404 for sheet without access', async () => {
      const mockValidation = {
        hasAccess: false,
        sheetId: 'private-sheet-id',
        error: 'Sheet not found or access denied',
        timestamp: '2024-01-15T10:30:00Z'
      };

      mockSheetsService.validateSheetAccess.mockResolvedValue(mockValidation);

      const response = await request(app)
        .post('/api/sheets/validate')
        .send({ sheetId: 'private-sheet-id' })
        .expect(404);

      expect(response.body.error).toBe('Sheet not found or access denied');
      expect(response.body.code).toBe('SHEET_ACCESS_ERROR');
    });

    it('should return 400 for missing sheet ID', async () => {
      const response = await request(app)
        .post('/api/sheets/validate')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Sheet ID is required');
      expect(response.body.code).toBe('MISSING_SHEET_ID');
    });
  });

  describe('Middleware tests', () => {
    it('should return 500 when Google credentials are not configured', async () => {
      mockGoogleAuth.validateCredentials.mockReturnValue(false);

      const response = await request(app)
        .get('/api/sheets/test-sheet-id/metadata')
        .expect(500);

      expect(response.body.error).toContain('Google service account credentials not properly configured');
      expect(response.body.code).toBe('MISSING_GOOGLE_CREDENTIALS');
    });

    it('should include required environment variables in credentials error', async () => {
      mockGoogleAuth.validateCredentials.mockReturnValue(false);

      const response = await request(app)
        .get('/api/sheets/test-sheet-id/tabs')
        .expect(500);

      expect(response.body.details.requiredEnvVars).toEqual([
        'GOOGLE_SERVICE_ACCOUNT_EMAIL',
        'GOOGLE_PRIVATE_KEY',
        'GOOGLE_PROJECT_ID'
      ]);
    });
  });

  describe('Error handling', () => {
    it('should handle internal server errors', async () => {
      const error = new Error('Internal error');
      mockSheetsService.getSheetMetadata.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/sheets/test-sheet-id/metadata')
        .expect(500);

      expect(response.body.error).toBe('Internal error');
      expect(response.body.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Authentication failed');
      error.code = 'AUTH_ERROR';
      error.statusCode = 401;
      
      mockSheetsService.getSheetTabs.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/sheets/test-sheet-id/tabs')
        .expect(401);

      expect(response.body.error).toBe('Authentication failed');
      expect(response.body.code).toBe('AUTH_ERROR');
    });

    it('should handle rate limiting errors', async () => {
      const error = new Error('Rate limit exceeded');
      error.code = 'RATE_LIMIT_EXCEEDED';
      error.statusCode = 429;
      
      mockSheetsService.getTabContent.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/sheets/test-sheet-id/tabs/Sheet1/content')
        .expect(429);

      expect(response.body.error).toBe('Rate limit exceeded');
      expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});