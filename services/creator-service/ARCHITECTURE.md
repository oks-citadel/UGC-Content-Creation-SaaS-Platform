# Creator Service Architecture

## Overview

The Creator Service is a microservice built with Node.js, Express, TypeScript, and PostgreSQL. It manages all creator-related functionality including profiles, portfolios, metrics, earnings, verification, and intelligent matching.

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+ with Prisma ORM 5.x
- **Authentication**: JWT (jsonwebtoken)

### Libraries & Tools
- **Validation**: Zod 3.x
- **Logging**: Pino 8.x
- **Security**: Helmet, CORS
- **Rate Limiting**: express-rate-limit
- **Testing**: Jest
- **Code Quality**: ESLint, Prettier
- **Containerization**: Docker

## Architecture Pattern

The service follows a **layered architecture**:

```
┌─────────────────────────────────────┐
│         API Layer (Routes)          │
│  - creator.routes.ts                │
│  - Request validation               │
│  - Response formatting              │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       Middleware Layer              │
│  - Authentication                   │
│  - Authorization                    │
│  - Validation                       │
│  - Error handling                   │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       Service Layer                 │
│  - creator.service.ts               │
│  - matching.service.ts              │
│  - Business logic                   │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       Data Layer (Prisma)           │
│  - Database operations              │
│  - Query optimization               │
│  - Transaction management           │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│       PostgreSQL Database           │
│  - Data persistence                 │
│  - Relational integrity             │
└─────────────────────────────────────┘
```

## Directory Structure

```
creator-service/
├── src/
│   ├── config/           # Environment configuration
│   │   └── index.ts      # Config singleton with validation
│   ├── constants/        # Application constants
│   │   └── index.ts      # Enums, defaults, error codes
│   ├── lib/              # Shared libraries
│   │   ├── logger.ts     # Pino logger instance
│   │   └── prisma.ts     # Prisma client singleton
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication
│   │   ├── error-handler.ts  # Error handling
│   │   └── validate.ts   # Request validation
│   ├── routes/           # API routes
│   │   └── creator.routes.ts  # All creator endpoints
│   ├── services/         # Business logic
│   │   ├── creator.service.ts  # Creator operations
│   │   └── matching.service.ts # Matching algorithm
│   ├── types/            # TypeScript types
│   │   └── index.ts      # Shared type definitions
│   ├── utils/            # Utility functions
│   │   ├── pagination.ts # Pagination helpers
│   │   └── validation.ts # Validation utilities
│   ├── tests/            # Test files
│   │   ├── setup.ts      # Test configuration
│   │   └── *.test.ts     # Unit tests
│   └── index.ts          # Application entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── .env.example          # Environment template
├── docker-compose.yml    # Local development setup
├── Dockerfile            # Production container
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── jest.config.js        # Test configuration
├── Makefile              # Common commands
├── README.md             # Main documentation
├── API.md                # API documentation
├── QUICKSTART.md         # Quick start guide
└── CHANGELOG.md          # Version history
```

## Data Model

### Core Entities

#### Creator
The main entity representing a content creator.

**Key Fields:**
- Profile: name, bio, avatar, location
- Niches: primary and secondary categories
- Social: platform handles and links
- Status: active, suspended, banned
- Verification: verification status
- Reputation: calculated score (0-5)

**Relations:**
- One-to-Many: Portfolio, Reviews
- One-to-One: Metrics, Earnings, Verification
- One-to-Many: Payouts

#### CreatorPortfolio
Work samples and previous content.

**Key Fields:**
- Media: URL, type, thumbnail
- Metadata: title, description, tags
- Metrics: views, likes, comments
- Featured: boolean flag

#### CreatorMetrics
Performance and audience data.

**Key Fields:**
- Followers: total and per platform
- Engagement: rates, averages
- Performance: campaigns, success rate
- Audience: demographics (JSON)

#### CreatorEarnings
Financial tracking.

**Key Fields:**
- Balances: total, available, pending, withdrawn
- Lifetime: total earnings, payout count
- Settings: minimum amount, method

#### CreatorVerification
Identity and account verification.

**Key Fields:**
- Identity: status, document type, URL
- Social: platform verification flags
- Business: name, tax ID (optional)
- Address: full address details

#### CreatorReview
Brand feedback and ratings.

**Key Fields:**
- Rating: overall and category-specific
- Content: title, comment
- Response: creator response
- Verification: verified flag

#### Payout
Payout request tracking.

**Key Fields:**
- Amount: requested, fees, net
- Status: pending, processing, completed, failed
- Method: payment provider
- Timestamps: created, processed, completed

## Service Layers

### 1. API Layer (Routes)

**Responsibilities:**
- Define HTTP endpoints
- Request/response handling
- Input validation (Zod schemas)
- Authentication/authorization checks
- Response formatting

**Pattern:**
```typescript
router.post(
  '/creators',
  authenticate,           // Auth middleware
  validate(createSchema), // Validation middleware
  asyncHandler(async (req, res) => {
    const creator = await creatorService.createCreator(req.body);
    res.status(201).json({ status: 'success', data: { creator } });
  })
);
```

### 2. Service Layer

**Responsibilities:**
- Business logic
- Data transformation
- Cross-entity operations
- Error handling
- Transaction management

**Example:**
```typescript
async createCreator(data: CreateCreatorInput): Promise<Creator> {
  // Validate business rules
  // Check for conflicts
  // Create with transactions
  // Return normalized data
}
```

### 3. Data Layer (Prisma)

**Responsibilities:**
- Database queries
- Relation management
- Type safety
- Query optimization

**Features:**
- Type-safe queries
- Auto-generated client
- Migration management
- Connection pooling

## Matching Algorithm

### Overview
The matching service implements a weighted scoring system to match creators with campaigns.

### Scoring Weights
```typescript
{
  NICHE: 0.30,        // 30% - Niche alignment
  FOLLOWERS: 0.25,    // 25% - Follower count match
  ENGAGEMENT: 0.25,   // 25% - Engagement rate
  REPUTATION: 0.15,   // 15% - Reputation score
  LOCATION: 0.10,     // 10% - Geographic match
  BUDGET: 0.05        // 5% - Budget compatibility
}
```

### Algorithm Flow

1. **Filter Phase**
   - Apply hard filters (niche, location, followers)
   - Remove excluded creators
   - Verify status and verification

2. **Scoring Phase**
   - Calculate score for each dimension
   - Apply weights
   - Generate breakdown

3. **Ranking Phase**
   - Sort by total score
   - Apply minimum threshold
   - Limit results

4. **Return Phase**
   - Include creator data
   - Include scores (optional)
   - Include breakdown (optional)

## Reputation System

### Calculation Formula

```
Reputation = (
  (AvgRating × 0.40) +
  (SuccessRate × 0.30) +
  (ResponseRate × 0.20) +
  (VerificationBonus × 0.10)
)
```

### Components
- **Average Rating**: Mean of all verified reviews (0-5)
- **Success Rate**: Completed campaigns / Total campaigns (0-100%)
- **Response Rate**: Responses / Messages (0-100%)
- **Verification**: Bonus for verified creators

### Update Triggers
- New review added
- Campaign completed
- Verification status changed
- Manual recalculation

## Authentication & Authorization

### JWT Authentication
- Bearer token in Authorization header
- Token contains: userId, email, role, creatorId
- Expiration: 7 days (configurable)

### Authorization Levels
1. **Public**: No auth required
   - GET /creators (list)
   - GET /creators/:id (view)
   - GET /creators/:id/portfolio

2. **Authenticated**: JWT required
   - GET /creators/match
   - POST /creators (create)

3. **Self or Admin**: Owner or admin role
   - PUT /creators/:id
   - DELETE /creators/:id
   - GET /creators/:id/earnings

4. **Admin Only**: Admin role
   - POST /creators/:id/verify
   - PUT /creators/:id/metrics

## Error Handling

### Error Types
```typescript
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
```

### Custom Errors
- ValidationError (400)
- UnauthorizedError (401)
- ForbiddenError (403)
- NotFoundError (404)
- ConflictError (409)

### Error Response
```json
{
  "status": "error",
  "message": "Human-readable message",
  "code": "ERROR_CODE",
  "details": { ... },
  "stack": "..." // Development only
}
```

## Logging

### Log Levels
- **fatal**: System crash
- **error**: Application errors
- **warn**: Warnings
- **info**: General information
- **debug**: Debug information
- **trace**: Very detailed

### Log Format
Structured JSON logging with:
- Timestamp (ISO 8601)
- Level
- Service name
- Request ID
- User ID
- Message
- Additional context

### Example
```json
{
  "level": "info",
  "time": "2024-01-15T10:00:00.000Z",
  "service": "creator-service",
  "msg": "Creator profile created",
  "creatorId": "creator-123",
  "userId": "user-123"
}
```

## Security

### Implemented Measures
1. **Helmet.js**: Security headers
2. **CORS**: Cross-origin restrictions
3. **Rate Limiting**: 100 req/15min
4. **Input Validation**: Zod schemas
5. **SQL Injection**: Prisma protection
6. **XSS Prevention**: Input sanitization
7. **JWT**: Secure authentication
8. **HTTPS**: Enforced in production

### Best Practices
- Secrets in environment variables
- No sensitive data in logs
- Encrypted payout details
- Principle of least privilege
- Regular dependency updates

## Performance

### Optimization Strategies
1. **Database**
   - Indexed fields (status, niche, country)
   - Connection pooling
   - Selective field loading
   - Pagination on all lists

2. **Caching**
   - No caching currently (future enhancement)

3. **Queries**
   - Parallel queries with Promise.all
   - Selective includes
   - Count optimization

4. **API**
   - Compression middleware
   - Response streaming (large data)
   - Efficient JSON serialization

## Testing Strategy

### Unit Tests
- Service layer testing
- Mock Prisma client
- Business logic validation

### Integration Tests
- API endpoint testing
- Database integration
- Authentication flow

### Test Coverage Goals
- Service layer: >80%
- Routes: >70%
- Overall: >75%

## Deployment

### Development
```bash
docker-compose up
```

### Production
```bash
docker build -t creator-service .
docker run -p 3003:3003 creator-service
```

### Environment Variables
- DATABASE_URL: PostgreSQL connection
- JWT_SECRET: Token signing key
- PORT: Service port
- LOG_LEVEL: Logging level

## Monitoring

### Health Checks
- `/health`: Basic health
- `/metrics`: Service metrics

### Metrics Tracked
- Total creators
- Verified creators
- Active creators
- Uptime
- Memory usage

## Future Enhancements

### Planned Features
1. Redis caching
2. Social media API integration
3. Real-time metrics sync
4. Advanced analytics
5. AI recommendations
6. Multi-currency payouts
7. GraphQL API
8. Event-driven architecture
9. Message queue integration
10. Performance monitoring (APM)

### Scalability
- Horizontal scaling ready
- Stateless design
- Database read replicas
- CDN for media
- Message queues for async tasks

## Dependencies

### Production
- express: Web framework
- @prisma/client: Database ORM
- pino: Logging
- zod: Validation
- helmet: Security
- cors: CORS handling
- jsonwebtoken: JWT auth

### Development
- typescript: Type safety
- ts-node-dev: Hot reload
- jest: Testing
- eslint: Linting
- prettier: Formatting
- prisma: Schema management
