const googleAuthClient = require('../config/googleAuth');

const validateGoogleCredentials = (req, res, next) => {
  if (!googleAuthClient.validateCredentials()) {
    return res.status(500).json({
      error: 'Google service account credentials not properly configured',
      code: 'MISSING_GOOGLE_CREDENTIALS',
      details: {
        timestamp: new Date().toISOString(),
        requiredEnvVars: [
          'GOOGLE_SERVICE_ACCOUNT_EMAIL',
          'GOOGLE_PRIVATE_KEY', 
          'GOOGLE_PROJECT_ID'
        ]
      }
    });
  }
  next();
};

const validateSheetId = (req, res, next) => {
  const { sheetId } = req.params;
  
  if (!sheetId || typeof sheetId !== 'string' || sheetId.trim().length === 0) {
    return res.status(400).json({
      error: 'Valid sheet ID is required',
      code: 'INVALID_SHEET_ID',
      details: {
        provided: sheetId,
        timestamp: new Date().toISOString()
      }
    });
  }

  const sheetIdPattern = /^[a-zA-Z0-9-_]+$/;
  if (!sheetIdPattern.test(sheetId)) {
    return res.status(400).json({
      error: 'Sheet ID contains invalid characters',
      code: 'MALFORMED_SHEET_ID',
      details: {
        provided: sheetId,
        allowedPattern: 'alphanumeric, hyphens, and underscores only',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

const validateTabName = (req, res, next) => {
  const { tabName } = req.params;
  
  if (!tabName || typeof tabName !== 'string') {
    return res.status(400).json({
      error: 'Valid tab name is required',
      code: 'INVALID_TAB_NAME',
      details: {
        provided: tabName,
        timestamp: new Date().toISOString()
      }
    });
  }

  const decodedTabName = decodeURIComponent(tabName);
  if (decodedTabName.trim().length === 0) {
    return res.status(400).json({
      error: 'Tab name cannot be empty',
      code: 'EMPTY_TAB_NAME', 
      details: {
        provided: tabName,
        decoded: decodedTabName,
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

const rateLimitMiddleware = () => {
  const requests = new Map();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // per window

  return (req, res, next) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    if (!requests.has(clientId)) {
      requests.set(clientId, []);
    }
    
    const clientRequests = requests.get(clientId);
    const windowStart = now - windowMs;
    
    const recentRequests = clientRequests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit: maxRequests,
          window: `${windowMs / 1000} seconds`,
          retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
          timestamp: new Date().toISOString()
        }
      });
    }
    
    recentRequests.push(now);
    requests.set(clientId, recentRequests);
    
    next();
  };
};

module.exports = {
  validateGoogleCredentials,
  validateSheetId,
  validateTabName,
  rateLimitMiddleware
};