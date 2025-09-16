// Google Sheets API service

import { apiClient, type ApiResponse } from './api';
import type {SheetMetadata, UrlInfo} from '../types';

export interface ParseUrlRequest {
  url: string;
}

export interface TabsFromUrlRequest {
  url: string;
}

export interface ContentByUrlRequest {
  url: string;
  tabName: string;
}

export interface TabContentResponse {
  tabName: string;
  range: string;
  data: any[][];
  metadata: {
    rowCount: number;
    columnCount: number;
    actualRowCount: number;
    actualColumnCount: number;
    lastUpdated: string;
    hasHeaders: boolean;
  };
}

class SheetsService {
  
  /**
   * Parse a Google Sheets URL to extract metadata
   */
  async parseUrl(url: string): Promise<ApiResponse<UrlInfo>> {
    return apiClient.post<UrlInfo>('/api/sheets/parse-url', { url });
  }

  /**
   * Get sheet metadata and tabs from URL
   */
  async getSheetFromUrl(url: string): Promise<ApiResponse<SheetMetadata>> {
    return apiClient.post<SheetMetadata>('/api/sheets/by-url', { url });
  }

  /**
   * Get tabs list from URL
   */
  async getTabsFromUrl(url: string): Promise<ApiResponse<SheetMetadata>> {
    return apiClient.post<SheetMetadata>('/api/sheets/tabs-from-url', { url });
  }

  /**
   * Get tab content from URL
   */
  async getContentByUrl(
    url: string, 
    tabName: string
  ): Promise<ApiResponse<TabContentResponse>> {
    return apiClient.post<TabContentResponse>('/api/sheets/content-by-url', {
      url,
      tabName,
    });
  }

  /**
   * Validate sheet access
   */
  async validateSheet(url: string): Promise<ApiResponse<{ isValid: boolean; message: string }>> {
    const parseResult = await this.parseUrl(url);
    
    if (parseResult.error) {
      return {
        data: {
          isValid: false,
          message: parseResult.error.message,
        },
      };
    }

    if (!parseResult.data?.isValid) {
      return {
        data: {
          isValid: false,
          message: 'Invalid Google Sheets URL format',
        },
      };
    }

    // Try to fetch sheet metadata to verify access
    const sheetResult = await this.getSheetFromUrl(url);
    
    if (sheetResult.error) {
      return {
        data: {
          isValid: false,
          message: sheetResult.error.message,
        },
      };
    }

    return {
      data: {
        isValid: true,
        message: 'Sheet is accessible',
      },
    };
  }
}

export const sheetsService = new SheetsService();