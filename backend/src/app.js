const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  `http://localhost:${process.env.PORT || 3001}` // Include server's own URL for Swagger UI
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/sheets', require('./routes/sheets'));
app.use('/api/water-flow', require('./routes/waterFlow'));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current health status of the server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information endpoint
 *     description: Returns basic information about the API
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Mindojo API Server - Phase 3 Complete ✅', 
    phase: 3,
    status: 'completed',
    features: [
      'Google Sheets API Integration',
      'Service Account Authentication', 
      'Shared URL Support',
      'Pacific-Atlantic Water Flow Algorithm',
      'Optimized BFS Implementation',
      'Batch Processing Support',
      'Comprehensive API Documentation'
    ],
    algorithms: {
      waterFlow: {
        complexity: 'O(m × n)',
        method: 'Reverse BFS from ocean borders',
        supported: ['Direct grid analysis', 'Google Sheets integration', 'Batch processing']
      }
    },
    endpoints: {
      sheets: [
        'GET /api/sheets/{id}/metadata',
        'GET /api/sheets/{id}/tabs', 
        'GET /api/sheets/{id}/tabs/{name}/content',
        'POST /api/sheets/validate',
        'POST /api/sheets/parse-url',
        'POST /api/sheets/by-url',
        'POST /api/sheets/tabs-from-url',
        'POST /api/sheets/content-by-url'
      ],
      waterFlow: [
        'POST /api/water-flow/analyze',
        'POST /api/water-flow/from-sheet',
        'POST /api/water-flow/from-sheet-url',
        'POST /api/water-flow/analyze-sheet-url',
        'POST /api/water-flow/batch',
        'GET /api/water-flow/stats/{id}'
      ]
    },
    documentation: '/api-docs'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

module.exports = app;