# Creator Service

The Creator Service manages creator profiles, portfolios, metrics, earnings, and creator-brand matching for the NEXUS UGC Content Creation Platform.

## Features

- **Creator Profile Management**: Create, update, and manage creator profiles
- **Portfolio Management**: Upload and showcase work samples and previous content
- **Metrics Tracking**: Track follower counts, engagement rates, and performance metrics
- **Earnings Management**: Handle creator earnings, balances, and payout requests
- **Verification System**: Identity and social account verification
- **Review System**: Collect and manage brand reviews and ratings
- **Creator Matching**: Intelligent matching algorithm to connect creators with relevant campaigns
- **Reputation Scoring**: Automated reputation score calculation based on performance

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **Logging**: Pino
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Environment variables configured

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=development
PORT=3003
DATABASE_URL=postgresql://user:password@localhost:5432/nexus_creators
JWT_SECRET=your-secret-key
```

## Running the Service

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Production mode
npm start

# Prisma Studio (Database GUI)
npm run prisma:studio
```

## Docker

```bash
# Build image
docker build -t nexus-creator-service .

# Run container
docker run -p 3003:3003 --env-file .env nexus-creator-service
```

## API Endpoints

### Creator Profile
- `POST /api/creators` - Create creator profile
- `GET /api/creators/:id` - Get creator profile
- `PUT /api/creators/:id` - Update creator profile
- `DELETE /api/creators/:id` - Delete creator profile
- `GET /api/creators` - List creators with filters
- `GET /api/creators/user/:userId` - Get creator by user ID

### Portfolio
- `GET /api/creators/:id/portfolio` - Get portfolio
- `POST /api/creators/:id/portfolio` - Add portfolio item
- `PUT /api/creators/:id/portfolio/:itemId` - Update portfolio item
- `DELETE /api/creators/:id/portfolio/:itemId` - Delete portfolio item

### Metrics
- `GET /api/creators/:id/metrics` - Get creator metrics
- `PUT /api/creators/:id/metrics` - Update metrics (admin only)

### Earnings
- `GET /api/creators/:id/earnings` - Get earnings
- `POST /api/creators/:id/payout` - Request payout
- `GET /api/creators/:id/payouts` - Get payout history

### Verification
- `GET /api/creators/:id/verification` - Get verification status
- `POST /api/creators/:id/verify` - Verify creator (admin only)
- `PUT /api/creators/:id/verification` - Update verification details

### Reviews
- `GET /api/creators/:id/reviews` - Get reviews
- `POST /api/creators/:id/reviews/:reviewId/respond` - Respond to review
- `POST /api/creators/:id/calculate-reputation` - Recalculate reputation

### Matching
- `GET /api/creators/match` - Find matching creators
- `GET /api/creators/recommend` - Get recommended creators with scores
- `GET /api/creators/:id/similar` - Find similar creators
- `GET /api/creators/:id/compatibility/:brandId` - Check compatibility
- `GET /api/creators/trending/:niche` - Get trending creators

## Database Schema

### Models
- **Creator**: Main creator profile with personal and professional information
- **CreatorPortfolio**: Work samples and previous content
- **CreatorMetrics**: Performance metrics and analytics
- **CreatorEarnings**: Financial data and balances
- **CreatorReview**: Brand reviews and ratings
- **CreatorVerification**: Identity and account verification
- **Payout**: Payout requests and history

## Matching Algorithm

The matching service uses a weighted scoring system:

- **Niche Match** (30%): Primary and secondary niche alignment
- **Follower Match** (25%): Follower count within target range
- **Engagement Match** (25%): Engagement rate performance
- **Reputation Match** (15%): Overall reputation score
- **Location Match** (10%): Geographic alignment
- **Budget Match** (5%): Budget compatibility

## Reputation Score Calculation

Reputation scores (0-5) are calculated using:

- Average review rating (40% weight)
- Campaign success rate (30% weight)
- Response rate (20% weight)
- Verification status (10% weight)

## Security

- JWT authentication required for protected endpoints
- Role-based access control (RBAC)
- Rate limiting: 100 requests per 15 minutes
- Input validation with Zod schemas
- SQL injection protection via Prisma
- Helmet.js security headers

## Error Handling

Standardized error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Logging

Structured JSON logging with Pino:
- Request/response logging
- Error tracking
- Performance metrics
- Database query logging (development)

## Health Checks

- `GET /health` - Service health and database connectivity
- `GET /metrics` - Service metrics and statistics

## Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Contributing

1. Follow TypeScript best practices
2. Validate inputs with Zod schemas
3. Use async/await with proper error handling
4. Write descriptive commit messages
5. Add tests for new features

## License

MIT
