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
            description: 'Error message'
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
            example: 'Mindojo API Server - Phase 1'
          }
        }
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: [
    './src/app.js',
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;