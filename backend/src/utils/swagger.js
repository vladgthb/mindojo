const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Mindojo Backend API',
    version: '1.0.0',
    description: 'API documentation for Mindojo Backend Server',
    contact: {
      name: 'Mindojo Team'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.mindojo.com' 
        : `http://localhost:${process.env.PORT || 3001}`,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Sheet not found or access denied'
          },
          code: {
            type: 'string',
            description: 'Error code',
            example: 'SHEET_ACCESS_ERROR'
          },
          details: {
            type: 'object',
            description: 'Additional error details',
            properties: {
              sheetId: {
                type: 'string',
                example: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
              },
              timestamp: {
                type: 'string',
                format: 'date-time'
              }
            }
          }
        }
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'OK'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          uptime: {
            type: 'number',
            description: 'Server uptime in seconds'
          },
          environment: {
            type: 'string',
            example: 'development'
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Mindojo API Server - Phase 3 Complete ✅'
          },
          phase: {
            type: 'number',
            example: 3
          },
          status: {
            type: 'string',
            example: 'completed'
          },
          features: {
            type: 'array',
            items: {
              type: 'string'
            },
            example: ['Google Sheets API Integration', 'Pacific-Atlantic Water Flow Algorithm']
          }
        }
      },
      SheetTab: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Sheet ID',
            example: 0
          },
          gid: {
            type: 'string', 
            description: 'Sheet GID as string',
            example: '0'
          },
          name: {
            type: 'string',
            description: 'Sheet tab name',
            example: 'Topography Data'
          },
          index: {
            type: 'integer',
            description: 'Sheet index position',
            example: 0
          },
          rowCount: {
            type: 'integer',
            description: 'Total number of rows',
            example: 1000
          },
          columnCount: {
            type: 'integer',
            description: 'Total number of columns', 
            example: 26
          },
          accessible: {
            type: 'boolean',
            description: 'Whether the tab is accessible',
            example: true
          },
          detectionMethod: {
            type: 'string',
            enum: ['service_account', 'api_key'],
            description: 'Method used to detect tab information',
            example: 'api_key'
          },
          gridProperties: {
            type: 'object',
            description: 'Grid properties of the sheet'
          }
        },
        required: ['id', 'name', 'index', 'accessible']
      },
      SheetTabsResponse: {
        type: 'object',
        properties: {
          sheetId: {
            type: 'string',
            description: 'Google Sheets ID',
            example: '1guE4DI4wQpBXPlXRKXVEeb3nH84Phq6YqgYK9M4NUT0'
          },
          title: {
            type: 'string',
            description: 'Sheet title',
            example: 'Island Topography Data'
          },
          tabs: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SheetTab'
            }
          },
          isPublic: {
            type: 'boolean',
            description: 'Whether the sheet is publicly accessible',
            example: true
          },
          accessMethod: {
            type: 'string',
            enum: ['service_account', 'api_key'],
            description: 'Authentication method used',
            example: 'api_key'
          },
          lastUpdated: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          },
          note: {
            type: 'string',
            description: 'Additional information about access method',
            example: 'Enhanced public sheet access with full tab metadata'
          },
          notice: {
            type: 'string',
            description: 'Notice about authentication method',
            example: 'Accessed using Google Sheets API with proper authentication'
          }
        },
        required: ['sheetId', 'title', 'tabs', 'accessMethod', 'lastUpdated']
      },
      UrlParseRequest: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Google Sheets URL to parse',
            example: 'https://docs.google.com/spreadsheets/d/1guE4DI4wQpBXPlXRKXVEeb3nH84Phq6YqgYK9M4NUT0/edit?usp=sharing'
          }
        },
        required: ['url']
      },
      UrlParseResponse: {
        type: 'object',
        properties: {
          isValid: {
            type: 'boolean',
            description: 'Whether the URL is valid',
            example: true
          },
          sheetId: {
            type: 'string',
            description: 'Extracted sheet ID',
            example: '1guE4DI4wQpBXPlXRKXVEeb3nH84Phq6YqgYK9M4NUT0'
          },
          tabName: {
            type: 'string',
            nullable: true,
            description: 'Specific tab name if included in URL',
            example: null
          },
          originalUrl: {
            type: 'string',
            description: 'Original URL provided',
            example: 'https://docs.google.com/spreadsheets/d/1guE4DI4wQpBXPlXRKXVEeb3nH84Phq6YqgYK9M4NUT0/edit?usp=sharing'
          },
          isPublicLink: {
            type: 'boolean',
            description: 'Whether the URL appears to be a public sharing link',
            example: true
          },
          accessType: {
            type: 'string',
            description: 'Type of access detected from URL',
            example: 'public_sharing'
          }
        },
        required: ['isValid', 'sheetId', 'originalUrl']
      },
      SheetContentResponse: {
        type: 'object',
        properties: {
          tabName: {
            type: 'string',
            description: 'Name of the sheet tab',
            example: 'Topography Data'
          },
          range: {
            type: 'string',
            description: 'Data range retrieved',
            example: 'Topography Data!A1:Z1000'
          },
          data: {
            type: 'array',
            description: '2D array of cell values',
            items: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' },
                  { type: 'boolean' }
                ]
              }
            },
            example: [
              ['X', 'Y', 'Elevation'],
              [0, 0, 100],
              [0, 1, 95],
              [1, 0, 105]
            ]
          },
          authMethod: {
            type: 'string',
            enum: ['service_account', 'api_key'],
            description: 'Authentication method used',
            example: 'api_key'
          },
          isPublic: {
            type: 'boolean',
            description: 'Whether the sheet is publicly accessible',
            example: true
          },
          metadata: {
            type: 'object',
            properties: {
              rowCount: {
                type: 'integer',
                description: 'Total rows in sheet'
              },
              columnCount: {
                type: 'integer',
                description: 'Total columns in sheet'
              },
              actualRowCount: {
                type: 'integer',
                description: 'Actual rows with data'
              },
              actualColumnCount: {
                type: 'integer',
                description: 'Actual columns with data'
              },
              hasHeaders: {
                type: 'boolean',
                description: 'Whether first row appears to contain headers'
              },
              lastUpdated: {
                type: 'string',
                format: 'date-time'
              }
            }
          }
        },
        required: ['tabName', 'data', 'authMethod', 'metadata']
      },
      ValidationResponse: {
        type: 'object',
        properties: {
          hasAccess: {
            type: 'boolean',
            description: 'Whether access to the sheet is available',
            example: true
          },
          sheetId: {
            type: 'string',
            description: 'Google Sheets ID',
            example: '1guE4DI4wQpBXPlXRKXVEeb3nH84Phq6YqgYK9M4NUT0'
          },
          title: {
            type: 'string',
            description: 'Sheet title if accessible',
            example: 'Island Topography Data'
          },
          authMethod: {
            type: 'string',
            enum: ['service_account', 'api_key'],
            description: 'Authentication method used',
            example: 'api_key'
          },
          isPublic: {
            type: 'boolean',
            description: 'Whether the sheet is publicly accessible',
            example: true
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Validation timestamp'
          },
          error: {
            type: 'string',
            description: 'Error message if access failed',
            example: 'Sheet not found or access denied'
          }
        },
        required: ['hasAccess', 'sheetId', 'timestamp']
      },
      WaterFlowResult: {
        type: 'object',
        properties: {
          cells: {
            type: 'array',
            description: 'Array of qualifying cell coordinates',
            items: {
              type: 'object',
              properties: {
                x: { type: 'integer', example: 0 },
                y: { type: 'integer', example: 4 }
              }
            }
          },
          stats: {
            type: 'object',
            properties: {
              totalCells: {
                type: 'integer',
                description: 'Total cells in grid',
                example: 25
              },
              flowCells: {
                type: 'integer', 
                description: 'Cells where water reaches both oceans',
                example: 7
              },
              coverage: {
                type: 'number',
                description: 'Coverage percentage',
                example: 0.28
              },
              processingTime: {
                type: 'integer',
                description: 'Processing time in milliseconds',
                example: 15
              }
            }
          },
          metadata: {
            type: 'object',
            properties: {
              gridDimensions: {
                type: 'object',
                properties: {
                  rows: { type: 'integer', example: 5 },
                  cols: { type: 'integer', example: 5 }
                }
              },
              algorithm: {
                type: 'string',
                example: 'optimized-bfs'
              },
              timestamp: {
                type: 'string',
                format: 'date-time'
              }
            }
          }
        }
      }
    },
    securitySchemes: {
      ApiKey: {
        type: 'apiKey',
        in: 'query',
        name: 'key',
        description: 'Google API Key for public sheet access'
      },
      ServiceAccount: {
        type: 'oauth2',
        description: 'Google Service Account authentication for private sheets',
        flows: {
          clientCredentials: {
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: {
              'https://www.googleapis.com/auth/spreadsheets.readonly': 'Read-only access to Google Sheets'
            }
          }
        }
      }
    }
  },
  security: [
    {
      ApiKey: []
    },
    {
      ServiceAccount: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: [
    './src/app.js',
    './src/routes/*.js',
    './src/controllers/*.js'
  ],
  tags: [
    {
      name: 'Health',
      description: 'System health and status endpoints'
    },
    {
      name: 'Google Sheets',
      description: 'Google Sheets API integration with dual authentication (Service Account + API Key)'
    },
    {
      name: 'Water Flow',
      description: 'Pacific-Atlantic water flow analysis algorithms'
    }
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;