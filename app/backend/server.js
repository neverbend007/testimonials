const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to PostgreSQL database');
  release();
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Testimonials API',
      version: '1.0.0',
      description: 'API for managing testimonials and users',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://your-domain.com/api' : 'http://localhost:3001/api',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./server.js'],
};

const specs = swaggerJsdoc(swaggerOptions);

// Security middleware with widget-friendly CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for widget testing
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3001"], // Allow API calls to self
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      frameAncestors: ["'self'", "http://localhost:3002", "http://localhost:3001"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration with special handling for widget endpoints
app.use((req, res, next) => {
  const isWidgetEndpoint = req.path === '/api/testimonials' && (req.method === 'GET' || req.method === 'OPTIONS');
  
  if (isWidgetEndpoint) {
    // Allow widgets to be embedded on any domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'false'); // Must be false when origin is *
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
  } else {
    // Restricted CORS for admin and other endpoints
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com', 'https://admin.your-domain.com']
      : ['http://localhost:3000', 'http://localhost:3002', 'http://frontend', 'http://admin'];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Allow widget files and admin previews to be embedded, deny everything else
  const isWidgetFile = req.path.startsWith('/widgets/');
  const isAdminPreview = req.path.includes('admin-preview.html');
  
  if (isWidgetFile || isAdminPreview) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  } else {
    res.setHeader('X-Frame-Options', 'DENY');
  }
  
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate limiting configuration
const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 3;

const submitLimiter = RATE_LIMIT_ENABLED ? rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: { error: `Too many submissions. Please try again in ${Math.ceil(RATE_LIMIT_WINDOW_MS / (1000 * 60))} minutes.` },
  standardHeaders: true,
  legacyHeaders: false,
}) : (req, res, next) => next();

console.log(`Rate limiting: ${RATE_LIMIT_ENABLED ? `ENABLED (${RATE_LIMIT_MAX} requests per ${Math.ceil(RATE_LIMIT_WINDOW_MS / (1000 * 60))} minutes)` : 'DISABLED'}`);

// Body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve widget files with permissive CORS
app.use('/widgets', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin loading
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // No cache for development
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}, express.static('./dist'));

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Input validation schemas
const testimonialSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  testimonial_text: Joi.string().min(50).max(500).required(),
  star_rating: Joi.number().integer().min(1).max(5).required(),
  source_type: Joi.string().valid('Agency Client', 'Skool Community Member').required(),
  website: Joi.string().allow('').optional(),
  url: Joi.string().allow('').optional(),
});

const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// CSRF token storage (in production, use Redis or database)
const csrfTokens = new Map();

// Generate CSRF token
const generateCSRFToken = (userId) => {
  const token = uuidv4();
  csrfTokens.set(userId, token);
  // Clean up old tokens (keep last 100)
  if (csrfTokens.size > 100) {
    const firstKey = csrfTokens.keys().next().value;
    csrfTokens.delete(firstKey);
  }
  return token;
};

// CSRF protection middleware
const validateCSRF = (req, res, next) => {
  // Skip CSRF for GET requests and public endpoints
  if (req.method === 'GET' || (req.path.startsWith('/api/testimonials') && req.method === 'GET')) {
    return next();
  }
  
  // Skip CSRF for login endpoint
  if (req.path === '/api/auth/login') {
    return next();
  }
  
  const csrfToken = req.headers['x-csrf-token'];
  const userId = req.user?.id;
  
  if (!csrfToken || !userId) {
    return res.status(403).json({ error: 'CSRF token required' });
  }
  
  const validToken = csrfTokens.get(userId);
  if (!validToken || validToken !== csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
};

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Input sanitization
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Honeypot spam protection
const checkHoneypot = (req, res, next) => {
  if (req.body.website || req.body.url) {
    return res.status(400).json({ error: 'Spam detected' });
  }
  next();
};

// API Key validation middleware (required)
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const query = `
      SELECT id, key_id, name, domain_restrictions, rate_limit_per_hour, is_active
      FROM api_keys 
      WHERE key_secret = $1 AND is_active = true
    `;
    
    const result = await pool.query(query, [apiKey]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const keyData = result.rows[0];
    
    // Check domain restrictions if they exist
    if (keyData.domain_restrictions && keyData.domain_restrictions.length > 0) {
      const origin = req.headers.origin || req.headers.referer;
      if (!origin) {
        return res.status(403).json({ error: 'Origin required for this API key' });
      }
      
      const originDomain = new URL(origin).hostname;
      const allowed = keyData.domain_restrictions.some(domain => 
        originDomain === domain || originDomain.endsWith('.' + domain)
      );
      
      if (!allowed) {
        return res.status(403).json({ error: 'Domain not allowed for this API key' });
      }
    }

    // Update usage statistics
    await pool.query(
      'UPDATE api_keys SET last_used_at = NOW(), usage_count = usage_count + 1 WHERE id = $1',
      [keyData.id]
    );

    req.apiKey = keyData;
    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    res.status(500).json({ error: 'API key validation failed' });
  }
};

// Domain validation middleware (for widgets)
const validateDomain = async (req, res, next) => {
  const origin = req.headers.origin || req.headers.referer;
  
  // Allow localhost requests without Origin in development
  if (!origin) {
    const host = req.headers.host;
    if (host && (host.startsWith('localhost') || host.startsWith('127.0.0.1'))) {
      return next();
    }
    return res.status(403).json({ error: 'Origin header required for widget access' });
  }

  try {
    let originDomain;
    try {
      originDomain = new URL(origin).hostname;
    } catch (error) {
      return res.status(400).json({ error: 'Invalid origin format' });
    }

    // Check if domain is allowed by any active API key
    const query = `
      SELECT id, key_id, name, domain_restrictions, rate_limit_per_hour, is_active
      FROM api_keys 
      WHERE is_active = true AND domain_restrictions IS NOT NULL AND array_length(domain_restrictions, 1) > 0
    `;
    
    const result = await pool.query(query);
    
    let matchedKey = null;
    
    // Check if the origin domain matches any API key's domain restrictions
    for (const keyData of result.rows) {
      const allowed = keyData.domain_restrictions.some(domain => 
        originDomain === domain || originDomain.endsWith('.' + domain)
      );
      
      if (allowed) {
        matchedKey = keyData;
        break;
      }
    }
    
    if (!matchedKey) {
      return res.status(403).json({ 
        error: `Domain '${originDomain}' is not authorized for widget access. Please add this domain to an API key's allowed domains.` 
      });
    }

    // Update usage statistics for the matched API key
    await pool.query(
      'UPDATE api_keys SET last_used_at = NOW(), usage_count = usage_count + 1 WHERE id = $1',
      [matchedKey.id]
    );

    req.apiKey = matchedKey;
    next();
  } catch (error) {
    console.error('Error in domain validation:', error);
    res.status(500).json({ error: 'Domain validation failed' });
  }
};

/**
 * @swagger
 * /api/testimonials:
 *   get:
 *     summary: Get approved testimonials
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of testimonials to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of testimonials to skip
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured testimonials
 *     responses:
 *       200:
 *         description: List of testimonials
 */
app.get('/api/testimonials', validateDomain, async (req, res) => {
  try {
    // Set cache headers for public testimonials
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    res.setHeader('ETag', `"testimonials-${Date.now()}"`);
    
    const { limit = 50, offset = 0, featured } = req.query;
    
    let query = `
      SELECT id, full_name, testimonial_text, star_rating, source_type, approved_at, is_featured
      FROM testimonials 
      WHERE status = 'approved' AND is_visible = true AND deleted_at IS NULL
    `;
    
    const params = [];
    if (featured !== undefined) {
      query += ` AND is_featured = $${params.length + 1}`;
      params.push(featured === 'true');
    }
    
    query += ` ORDER BY is_featured DESC, approved_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM testimonials WHERE status = \'approved\' AND is_visible = true AND deleted_at IS NULL';
    let countParams = [];
    if (featured !== undefined) {
      countQuery += ' AND is_featured = $1';
      countParams.push(featured === 'true');
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({ 
      testimonials: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

/**
 * @swagger
 * /api/testimonials:
 *   post:
 *     summary: Submit a new testimonial
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - testimonial_text
 *               - star_rating
 *               - source_type
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               testimonial_text:
 *                 type: string
 *               star_rating:
 *                 type: integer
 *               source_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Testimonial submitted successfully
 */
app.post('/api/testimonials', validateDomain, submitLimiter, checkHoneypot, async (req, res) => {
  try {
    const { error, value } = testimonialSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const sanitizedData = {
      full_name: sanitizeInput(value.full_name),
      email: sanitizeInput(value.email),
      testimonial_text: sanitizeInput(value.testimonial_text),
      star_rating: value.star_rating,
      source_type: sanitizeInput(value.source_type),
      ip_address: req.ip
    };
    
    const query = `
      INSERT INTO testimonials (full_name, email, testimonial_text, star_rating, source_type, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const values = [
      sanitizedData.full_name,
      sanitizedData.email,
      sanitizedData.testimonial_text,
      sanitizedData.star_rating,
      sanitizedData.source_type,
      sanitizedData.ip_address
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({ 
      message: 'Testimonial submitted successfully! It will be reviewed before publication.',
      id: result.rows[0].id 
    });
    
  } catch (error) {
    console.error('Error submitting testimonial:', error);
    res.status(500).json({ error: 'Failed to submit testimonial' });
  }
});

// Authentication routes

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to admin panel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;
    
    const query = 'SELECT id, name, email, password_hash FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Generate CSRF token for this user
    const csrfToken = generateCSRFToken(user.id);
    
    res.json({
      message: 'Login successful',
      token,
      csrfToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 */
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT id, name, email FROM users WHERE id = $1';
    const result = await pool.query(query, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate new CSRF token on verification
    const csrfToken = generateCSRFToken(req.user.id);
    
    res.json({
      valid: true,
      csrfToken,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Admin routes

/**
 * @swagger
 * /api/admin/testimonials/pending:
 *   get:
 *     summary: Get pending testimonials
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending testimonials
 */
app.get('/api/admin/testimonials/pending', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT id, full_name, email, testimonial_text, star_rating, source_type, submitted_at
      FROM testimonials 
      WHERE status = 'pending' AND deleted_at IS NULL
      ORDER BY submitted_at DESC
    `;
    
    const result = await pool.query(query);
    res.json({ testimonials: result.rows });
  } catch (error) {
    console.error('Error fetching pending testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch pending testimonials' });
  }
});

/**
 * @swagger
 * /api/admin/testimonials:
 *   get:
 *     summary: Get all testimonials (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all testimonials with status
 */
app.get('/api/admin/testimonials', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT id, full_name, email, testimonial_text, star_rating, source_type, 
             status, submitted_at, approved_at, is_featured, is_visible, deleted_at, updated_at
      FROM testimonials 
      WHERE deleted_at IS NULL
      ORDER BY submitted_at DESC
    `;
    
    const result = await pool.query(query);
    res.json({ testimonials: result.rows });
  } catch (error) {
    console.error('Error fetching all testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

/**
 * @swagger
 * /api/admin/testimonials/{id}/approve:
 *   post:
 *     summary: Approve a testimonial
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Testimonial approved
 */
app.post('/api/admin/testimonials/:id/approve', authenticateToken, validateCSRF, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE testimonials 
      SET status = 'approved', approved_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING id, full_name
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found or already processed' });
    }
    
    res.json({ 
      message: `Testimonial by ${result.rows[0].full_name} approved successfully`,
      id: result.rows[0].id 
    });
    
  } catch (error) {
    console.error('Error approving testimonial:', error);
    res.status(500).json({ error: 'Failed to approve testimonial' });
  }
});

/**
 * @swagger
 * /api/admin/testimonials/{id}/reject:
 *   post:
 *     summary: Reject a testimonial
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Testimonial rejected
 */
app.post('/api/admin/testimonials/:id/reject', authenticateToken, validateCSRF, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE testimonials 
      SET status = 'rejected', updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING id, full_name
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found or already processed' });
    }
    
    res.json({ 
      message: `Testimonial by ${result.rows[0].full_name} rejected`,
      id: result.rows[0].id 
    });
    
  } catch (error) {
    console.error('Error rejecting testimonial:', error);
    res.status(500).json({ error: 'Failed to reject testimonial' });
  }
});

/**
 * @swagger
 * /api/admin/testimonials/{id}/featured:
 *   patch:
 *     summary: Update featured status of testimonial
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               featured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Featured status updated
 */
app.patch('/api/admin/testimonials/:id/featured', authenticateToken, validateCSRF, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    const query = `
      UPDATE testimonials 
      SET is_featured = $1, updated_at = NOW()
      WHERE id = $2 AND status = 'approved'
      RETURNING id, full_name, is_featured
    `;
    
    const result = await pool.query(query, [featured, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found or not approved' });
    }
    
    res.json({ 
      message: `Testimonial ${featured ? 'featured' : 'unfeatured'} successfully`,
      testimonial: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating featured status:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

/**
 * @swagger
 * /api/admin/testimonials/{id}/visibility:
 *   patch:
 *     summary: Toggle testimonial visibility
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Visibility updated
 */
app.patch('/api/admin/testimonials/:id/visibility', authenticateToken, validateCSRF, async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;
    
    const query = `
      UPDATE testimonials 
      SET is_visible = $1, updated_at = NOW()
      WHERE id = $2 AND status = 'approved' AND deleted_at IS NULL
      RETURNING id, full_name, is_visible
    `;
    
    const result = await pool.query(query, [visible, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found or not approved' });
    }
    
    res.json({ 
      message: `Testimonial ${visible ? 'shown' : 'hidden'} successfully`,
      testimonial: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating visibility:', error);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

/**
 * @swagger
 * /api/admin/testimonials/{id}:
 *   delete:
 *     summary: Soft delete a testimonial
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Testimonial deleted
 */
app.delete('/api/admin/testimonials/:id', authenticateToken, validateCSRF, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE testimonials 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, full_name
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Testimonial not found or already deleted' });
    }
    
    res.json({ 
      message: `Testimonial by ${result.rows[0].full_name} deleted successfully`,
      id: result.rows[0].id 
    });
    
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});


// User management routes

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT id, name, email, created_at, last_login
      FROM users 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
app.post('/api/admin/users', authenticateToken, validateCSRF, async (req, res) => {
  try {
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, password } = value;
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
    `;
    
    const result = await pool.query(query, [name, email, password_hash]);
    
    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
app.delete('/api/admin/users/:id', authenticateToken, validateCSRF, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const query = 'DELETE FROM users WHERE id = $1 RETURNING name, email';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: `User ${result.rows[0].name} deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// API Key Management routes

/**
 * @swagger
 * /api/admin/api-keys:
 *   get:
 *     summary: Get all API keys
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 */
app.get('/api/admin/api-keys', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT id, key_id, name, description, domain_restrictions, 
             rate_limit_per_hour, is_active, created_at, last_used_at, usage_count
      FROM api_keys 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json({ apiKeys: result.rows });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

/**
 * @swagger
 * /api/admin/api-keys:
 *   post:
 *     summary: Create new API key
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               domainRestrictions:
 *                 type: array
 *                 items:
 *                   type: string
 *               rateLimitPerHour:
 *                 type: integer
 *     responses:
 *       201:
 *         description: API key created successfully
 */
app.post('/api/admin/api-keys', authenticateToken, validateCSRF, async (req, res) => {
  try {
    const { error, value } = Joi.object({
      name: Joi.string().min(1).max(100).required(),
      description: Joi.string().max(500).allow('').optional(),
      domainRestrictions: Joi.array().items(Joi.string()).optional(),
      rateLimitPerHour: Joi.number().integer().min(1).max(10000).default(1000)
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description, domainRestrictions, rateLimitPerHour } = value;
    
    // Generate unique API key
    const keyId = `key_${uuidv4().replace(/-/g, '').substr(0, 16)}`;
    const keySecret = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').substr(0, 16);
    
    const query = `
      INSERT INTO api_keys (key_id, key_secret, name, description, domain_restrictions, rate_limit_per_hour, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, key_id, name, description, domain_restrictions, rate_limit_per_hour, is_active, created_at
    `;
    
    const result = await pool.query(query, [
      keyId, keySecret, name, description, 
      domainRestrictions || null, rateLimitPerHour, req.user.id
    ]);
    
    res.status(201).json({
      message: 'API key created successfully',
      apiKey: {
        ...result.rows[0],
        key_secret: keySecret // Only return secret on creation
      }
    });
    
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

/**
 * @swagger
 * /api/admin/api-keys/{id}:
 *   patch:
 *     summary: Update API key
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               domainRestrictions:
 *                 type: array
 *                 items:
 *                   type: string
 *               rateLimitPerHour:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: API key updated successfully
 */
app.patch('/api/admin/api-keys/:id', authenticateToken, validateCSRF, async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      description: Joi.string().max(500).allow('').optional(),
      domainRestrictions: Joi.array().items(Joi.string()).optional(),
      rateLimitPerHour: Joi.number().integer().min(1).max(10000).optional(),
      isActive: Joi.boolean().optional()
    }).validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updates = [];
    const values = [];
    let valueIndex = 1;

    Object.entries(value).forEach(([key, val]) => {
      if (val !== undefined) {
        const columnName = key === 'isActive' ? 'is_active' : 
                          key === 'domainRestrictions' ? 'domain_restrictions' :
                          key === 'rateLimitPerHour' ? 'rate_limit_per_hour' : key;
        updates.push(`${columnName} = $${valueIndex}`);
        values.push(val);
        valueIndex++;
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE api_keys 
      SET ${updates.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id, key_id, name, description, domain_restrictions, rate_limit_per_hour, is_active, updated_at
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({ 
      message: 'API key updated successfully',
      apiKey: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

/**
 * @swagger
 * /api/admin/api-keys/{id}:
 *   delete:
 *     summary: Delete API key
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: API key deleted successfully
 */
app.delete('/api/admin/api-keys/:id', authenticateToken, validateCSRF, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM api_keys WHERE id = $1 RETURNING name';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({
      message: `API key "${result.rows[0].name}" deleted successfully`
    });
    
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Testimonials API server running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api/docs`);
});