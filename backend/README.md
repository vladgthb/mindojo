# Mindojo Backend

A Node.js + Express backend server for the Mindojo project.

## Requirements

- Node.js >= 22.0.0
- npm

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Visit health check: http://localhost:3001/health
5. View API documentation: http://localhost:3001/api-docs

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## Project Structure

```
backend/
├── src/
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── routes/         # Route definitions
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── app.js          # Express app setup
├── tests/              # Test files
├── server.js           # Server entry point
└── package.json        # Dependencies and scripts
```

## Development Phases

### Phase 1 ✅
- Basic Express server setup
- Health check endpoint
- Development tooling (ESLint, Prettier, Jest)
- Environment configuration

### Phase 2 (Planned)
- Google Sheets API integration
- Read all tabs content from Google Sheets
- Data processing and validation

## API Endpoints

### Health Check
- `GET /health` - Returns server health status

### API Info
- `GET /api` - Returns API information

### Documentation
- `GET /api-docs` - Swagger API documentation interface