# Security Baseline

> **Production Security Standards**
> No Cloudflare - Platform-Native Security Controls

---

## Table of Contents

1. [Security Principles](#security-principles)
2. [Transport Security (TLS)](#transport-security-tls)
3. [Rate Limiting and Abuse Protection](#rate-limiting-and-abuse-protection)
4. [Authentication Security](#authentication-security)
5. [Session Management](#session-management)
6. [CORS Configuration](#cors-configuration)
7. [Secret Management](#secret-management)
8. [Request Validation](#request-validation)
9. [Security Headers](#security-headers)
10. [Audit and Compliance](#audit-and-compliance)

---

## Security Principles

### Core Requirements

| Requirement | Implementation |
|-------------|----------------|
| **TLS Everywhere** | All traffic encrypted, no HTTP fallback |
| **Defense in Depth** | Multiple security layers, no single point of failure |
| **Least Privilege** | Minimal permissions, scoped access |
| **Fail Secure** | Deny by default, explicit allow |
| **Secrets Never in Git** | Environment variables, secret managers only |

### Security Responsibility Matrix

| Layer | Responsible Party | Controls |
|-------|-------------------|----------|
| **DNS** | GoDaddy | DNSSEC (if available) |
| **Edge/CDN** | Vercel | DDoS protection, TLS termination |
| **Application** | Your Code | Auth, validation, rate limiting |
| **Database** | Railway | Encryption at rest, access control |
| **Secrets** | Railway/Vercel | Environment variable encryption |

---

## Transport Security (TLS)

### Requirements

- **TLS 1.2+** minimum (prefer TLS 1.3)
- **Strong cipher suites** only
- **HSTS** enabled with long max-age
- **No mixed content** (all resources over HTTPS)

### Vercel TLS (Automatic)

Vercel automatically provisions and manages TLS certificates:

```
✓ Let's Encrypt certificates (auto-renewed)
✓ TLS 1.2 and 1.3 support
✓ Strong cipher suites
✓ HTTP → HTTPS redirect (automatic)
```

### Railway TLS (Automatic)

Railway automatically provisions TLS for custom domains:

```
✓ Let's Encrypt certificates (auto-renewed)
✓ TLS termination at Railway edge
✓ HTTP → HTTPS redirect (configure in app)
```

### HTTPS Redirect Middleware

```javascript
// middleware/https-redirect.js
function httpsRedirect(req, res, next) {
  // Railway/Vercel set x-forwarded-proto
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}

// Apply in production only
if (process.env.NODE_ENV === 'production') {
  app.use(httpsRedirect);
}
```

### HSTS Configuration

```javascript
// middleware/security-headers.js
const helmet = require('helmet');

app.use(helmet.hsts({
  maxAge: 31536000,       // 1 year in seconds
  includeSubDomains: true,
  preload: true
}));
```

**HSTS Header:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## Rate Limiting and Abuse Protection

### Backend Rate Limiting

```javascript
// middleware/rate-limit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

// Global rate limit
const globalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for']?.split(',')[0];
  }
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    error: 'Too many login attempts',
    retryAfter: 900
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Rate limit by IP + username to prevent credential stuffing
    const username = req.body?.email || req.body?.username || '';
    return `${req.ip}:${username}`;
  }
});

// API endpoint limits
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated
    return req.user?.id || req.ip;
  }
});

// Apply limiters
app.use(globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', apiLimiter);

module.exports = { globalLimiter, authLimiter, apiLimiter };
```

### Request Throttling

```javascript
// middleware/throttle.js
const slowDown = require('express-slow-down');

const speedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 50,      // Allow 50 requests per minute at full speed
  delayMs: (hits) => hits * 100, // Add 100ms delay per request above threshold
  maxDelayMs: 2000,    // Maximum delay of 2 seconds
});

app.use('/api', speedLimiter);
```

### IP Blocking

```javascript
// middleware/ip-block.js
const blockedIPs = new Set();
const suspiciousIPs = new Map(); // IP -> violation count

function ipBlockMiddleware(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0];

  // Check if IP is blocked
  if (blockedIPs.has(ip)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
}

// Track suspicious activity
function trackSuspiciousIP(ip, reason) {
  const count = (suspiciousIPs.get(ip) || 0) + 1;
  suspiciousIPs.set(ip, count);

  console.warn(`Suspicious activity from ${ip}: ${reason} (count: ${count})`);

  // Auto-block after 10 violations
  if (count >= 10) {
    blockedIPs.add(ip);
    console.error(`IP blocked: ${ip}`);
  }
}

// Manual block/unblock
function blockIP(ip) {
  blockedIPs.add(ip);
}

function unblockIP(ip) {
  blockedIPs.delete(ip);
  suspiciousIPs.delete(ip);
}

app.use(ipBlockMiddleware);

module.exports = { trackSuspiciousIP, blockIP, unblockIP };
```

### Fail2Ban-Style Protection

```javascript
// middleware/fail2ban.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const FAIL_WINDOW = 600; // 10 minutes
const MAX_FAILURES = 5;
const BAN_DURATION = 3600; // 1 hour

async function checkBan(ip) {
  const banned = await redis.get(`ban:${ip}`);
  return !!banned;
}

async function recordFailure(ip, reason) {
  const key = `fail:${ip}`;
  const failures = await redis.incr(key);

  if (failures === 1) {
    await redis.expire(key, FAIL_WINDOW);
  }

  if (failures >= MAX_FAILURES) {
    await redis.setex(`ban:${ip}`, BAN_DURATION, reason);
    await redis.del(key);
    console.error(`IP banned: ${ip} (reason: ${reason})`);
    return true; // banned
  }

  return false;
}

async function fail2banMiddleware(req, res, next) {
  const ip = req.ip;

  if (await checkBan(ip)) {
    return res.status(403).json({
      error: 'Access temporarily blocked',
      retryAfter: BAN_DURATION
    });
  }

  // Track failed auth attempts
  res.on('finish', async () => {
    if (req.path.includes('/auth') && res.statusCode === 401) {
      await recordFailure(ip, 'auth_failure');
    }
  });

  next();
}

app.use(fail2banMiddleware);
```

---

## Authentication Security

### JWT Configuration

```javascript
// config/jwt.js
const jwt = require('jsonwebtoken');

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  accessTokenExpiry: '15m',     // Short-lived access token
  refreshTokenExpiry: '7d',      // Longer refresh token
  algorithm: 'HS256',
  issuer: process.env.JWT_ISSUER || 'your-platform',
  audience: process.env.JWT_AUDIENCE || 'your-platform-api',
};

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      algorithm: JWT_CONFIG.algorithm,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }
  );
}

function generateRefreshToken(user) {
  const token = jwt.sign(
    { sub: user.id, type: 'refresh' },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      algorithm: JWT_CONFIG.algorithm,
    }
  );

  // Store refresh token hash in Redis for revocation
  storeRefreshToken(user.id, token);

  return token;
}

function verifyToken(token) {
  return jwt.verify(token, JWT_CONFIG.secret, {
    algorithms: [JWT_CONFIG.algorithm],
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });
}

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
```

### Password Security

```javascript
// utils/password.js
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');

const SALT_ROUNDS = 12;
const MIN_PASSWORD_SCORE = 3; // zxcvbn score (0-4)

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function validatePasswordStrength(password) {
  const result = zxcvbn(password);

  if (result.score < MIN_PASSWORD_SCORE) {
    return {
      valid: false,
      message: 'Password too weak',
      suggestions: result.feedback.suggestions,
      score: result.score,
    };
  }

  return { valid: true, score: result.score };
}

// Password requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // zxcvbn handles complexity
};

module.exports = { hashPassword, verifyPassword, validatePasswordStrength };
```

### MFA Implementation

```javascript
// utils/mfa.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

function generateMFASecret(userEmail) {
  const secret = speakeasy.generateSecret({
    name: `YourPlatform:${userEmail}`,
    issuer: 'YourPlatform',
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
}

async function generateQRCode(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl);
}

function verifyMFAToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1, // Allow 1 step tolerance for clock drift
  });
}

// Recovery codes
function generateRecoveryCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

module.exports = { generateMFASecret, generateQRCode, verifyMFAToken, generateRecoveryCodes };
```

---

## Session Management

### Secure Cookie Configuration

```javascript
// config/session.js
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

const sessionConfig = {
  store: new RedisStore({ client: redis }),
  name: '__session', // Don't use default 'connect.sid'
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true, // Extend session on activity
  cookie: {
    httpOnly: true,       // Not accessible via JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',   // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.COOKIE_DOMAIN, // e.g., '.example.com'
    path: '/',
  }
};

app.use(session(sessionConfig));
```

### Session Hardening

```javascript
// middleware/session-security.js

// Regenerate session ID on privilege change
async function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Call after login
app.post('/api/auth/login', async (req, res) => {
  // ... verify credentials ...

  // Regenerate session to prevent fixation
  await regenerateSession(req);

  req.session.userId = user.id;
  req.session.loginTime = Date.now();

  // ... continue with login response ...
});

// Session validation middleware
function validateSession(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Check session age (force re-auth after 8 hours)
  const sessionAge = Date.now() - req.session.loginTime;
  if (sessionAge > 8 * 60 * 60 * 1000) {
    req.session.destroy();
    return res.status(401).json({ error: 'Session expired' });
  }

  next();
}
```

### Token Revocation

```javascript
// utils/token-revocation.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

// Add token to blocklist
async function revokeToken(token, expiresIn) {
  const key = `revoked:${token}`;
  await redis.setex(key, expiresIn, '1');
}

// Check if token is revoked
async function isTokenRevoked(token) {
  const revoked = await redis.get(`revoked:${token}`);
  return !!revoked;
}

// Revoke all tokens for a user
async function revokeAllUserTokens(userId) {
  const key = `user:${userId}:token_version`;
  await redis.incr(key);
}

// Check token version in JWT validation
async function validateTokenVersion(userId, tokenVersion) {
  const currentVersion = await redis.get(`user:${userId}:token_version`) || 0;
  return parseInt(tokenVersion) >= parseInt(currentVersion);
}
```

---

## CORS Configuration

### Production CORS

```javascript
// config/cors.js
const cors = require('cors');

const ALLOWED_ORIGINS = [
  'https://example.com',
  'https://app.example.com',
  'https://admin.example.com',
];

// Add staging origins in non-production
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push(
    'https://staging.example.com',
    'http://localhost:3000',
    'http://localhost:3001',
  );
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
  ],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
```

### Vercel Preview CORS

For Vercel preview deployments:

```javascript
// Dynamic origin check for preview URLs
const VERCEL_PREVIEW_REGEX = /^https:\/\/.*\.vercel\.app$/;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      ALLOWED_ORIGINS.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && VERCEL_PREVIEW_REGEX.test(origin))
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  // ... rest of options
};
```

---

## Secret Management

### Secret Handling Policy

| Secret Type | Storage Location | Rotation Frequency |
|-------------|------------------|-------------------|
| JWT Secret | Railway/Vercel env vars | 90 days |
| Database URL | Railway (auto-injected) | On compromise |
| API Keys (third-party) | Railway/Vercel env vars | Per provider policy |
| OAuth Secrets | Railway/Vercel env vars | 90 days |
| Encryption Keys | Railway/Vercel env vars | 180 days |

### Environment Variable Security

```bash
# NEVER do this:
# - Commit .env files to git
# - Log environment variables
# - Expose secrets in client-side code

# ALWAYS do this:
# - Use NEXT_PUBLIC_ prefix ONLY for client-safe values
# - Audit env vars before deployment
# - Use secret scanning in CI (TruffleHog, GitLeaks)
```

### Secret Rotation Runbook

#### JWT Secret Rotation

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 64)

# 2. Add new secret as secondary (supports both during transition)
# In Railway/Vercel:
# JWT_SECRET_NEW=$NEW_SECRET

# 3. Deploy code that accepts both secrets
# 4. Wait for all sessions to refresh (24 hours)
# 5. Remove old secret, rename new to primary
# JWT_SECRET=$NEW_SECRET
# (remove JWT_SECRET_NEW)
```

**Code for dual-secret support:**

```javascript
const JWT_SECRETS = [
  process.env.JWT_SECRET,
  process.env.JWT_SECRET_NEW,
].filter(Boolean);

function verifyToken(token) {
  for (const secret of JWT_SECRETS) {
    try {
      return jwt.verify(token, secret);
    } catch (e) {
      continue;
    }
  }
  throw new Error('Invalid token');
}
```

---

## Request Validation

### Input Sanitization

```javascript
// middleware/sanitize.js
const sanitizeHtml = require('sanitize-html');
const validator = require('validator');

function sanitizeInput(obj) {
  if (typeof obj === 'string') {
    // Remove HTML tags
    return sanitizeHtml(obj, { allowedTags: [], allowedAttributes: {} });
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return obj;
}

function sanitizeMiddleware(req, res, next) {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  next();
}

app.use(sanitizeMiddleware);
```

### Request Validation (Zod)

```javascript
// validation/schemas.js
const { z } = require('zod');

const userRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).max(128),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Validation middleware
function validate(schema) {
  return (req, res, next) => {
    try {
      req.validated = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
  };
}

// Usage
app.post('/api/auth/register', validate(userRegistrationSchema), registerHandler);
app.post('/api/auth/login', validate(loginSchema), loginHandler);
```

### SQL Injection Prevention

```javascript
// ALWAYS use parameterized queries

// ❌ NEVER do this:
// db.query(`SELECT * FROM users WHERE email = '${email}'`)

// ✅ DO this (with Prisma):
const user = await prisma.user.findUnique({ where: { email } });

// ✅ DO this (with Knex):
const user = await knex('users').where('email', email).first();

// ✅ DO this (with raw SQL):
const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
```

---

## Security Headers

### Helmet Configuration

```javascript
// config/helmet.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust based on needs
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));
```

### Response Headers Summary

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## Audit and Compliance

### Security Audit Checklist

```markdown
## Weekly Security Checklist

### Access Control
- [ ] Review new user accounts
- [ ] Check for inactive accounts (>90 days)
- [ ] Audit admin access logs
- [ ] Verify MFA adoption rate

### Infrastructure
- [ ] Check SSL certificate expiry
- [ ] Review rate limiting effectiveness
- [ ] Audit blocked IPs
- [ ] Check for security updates

### Code
- [ ] Run dependency audit (npm audit)
- [ ] Review security alerts (GitHub/Snyk)
- [ ] Check for exposed secrets (TruffleHog)

### Logs
- [ ] Review auth failure logs
- [ ] Check for suspicious patterns
- [ ] Audit API access logs
```

### Audit Logging

```javascript
// utils/audit-log.js
const auditLog = async (event) => {
  const log = {
    timestamp: new Date().toISOString(),
    action: event.action,
    userId: event.userId,
    ip: event.ip,
    userAgent: event.userAgent,
    resource: event.resource,
    details: event.details,
    outcome: event.outcome,
  };

  // Log to structured logging
  console.log(JSON.stringify({ type: 'audit', ...log }));

  // Optionally persist to database
  await db.auditLogs.create({ data: log });
};

// Usage examples
auditLog({
  action: 'user.login',
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  outcome: 'success',
});

auditLog({
  action: 'user.password_change',
  userId: user.id,
  ip: req.ip,
  outcome: 'success',
});

auditLog({
  action: 'admin.user_delete',
  userId: admin.id,
  resource: `user:${targetUserId}`,
  ip: req.ip,
  outcome: 'success',
});
```

### Compliance Considerations

| Standard | Relevant Controls |
|----------|-------------------|
| **GDPR** | Data encryption, consent management, audit logs |
| **SOC 2** | Access control, monitoring, incident response |
| **PCI DSS** | Payment data handling (defer to Stripe) |
| **HIPAA** | N/A unless handling health data |

---

## Quick Reference

### Security Headers Test

```bash
# Test security headers
curl -I https://api.example.com

# Expected headers:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy: ...
```

### Rate Limit Test

```bash
# Test rate limiting
for i in {1..110}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://api.example.com/health
done

# Should see 429 responses after limit exceeded
```

### SSL Test

```bash
# Check SSL configuration
openssl s_client -connect api.example.com:443 -tls1_2
openssl s_client -connect api.example.com:443 -tls1_3

# Online tools:
# - https://www.ssllabs.com/ssltest/
# - https://securityheaders.com/
```
