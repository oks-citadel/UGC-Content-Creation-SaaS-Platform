# NEXUS Billing Service

A comprehensive billing and subscription management microservice for the NEXUS platform, built with Node.js, Express, TypeScript, Prisma, and Stripe.

## Features

- **Subscription Management**: Create, upgrade, downgrade, and cancel subscriptions
- **Multi-tier Plans**: Support for Free, Starter, Growth, Pro, and Enterprise plans
- **Usage-based Billing**: Track and bill based on resource usage
- **Entitlement Management**: Feature access control and usage limits
- **Invoice Generation**: Automated invoice creation and management
- **Payment Processing**: Stripe integration for payments
- **Dunning Management**: Automated retry logic for failed payments
- **Webhook Handling**: Real-time updates from Stripe
- **Usage Tracking**: Record and monitor usage across different metrics

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Payment Gateway**: Stripe
- **Queue**: Bull with Redis
- **Scheduling**: node-cron
- **Logging**: Winston

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher
- Stripe account with API keys

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

## Configuration

Create a `.env` file with the following variables:

```env
# Server
PORT=3004
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nexus_billing"

# Stripe
STRIPE_SECRET_KEY=YOUR_STRIPE_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Redis
REDIS_URL=redis://localhost:6379

# Services
USER_SERVICE_URL=http://localhost:3001
NOTIFICATION_SERVICE_URL=http://localhost:3007

# Billing Configuration
TRIAL_PERIOD_DAYS=14
DUNNING_MAX_RETRIES=3
DUNNING_RETRY_INTERVAL_HOURS=72
INVOICE_DUE_DAYS=7
```

## Database Schema

### Plans
- Free, Starter, Growth, Pro, Enterprise tiers
- Configurable pricing and billing periods
- Feature flags and usage limits

### Subscriptions
- User subscription management
- Status tracking (Active, Trialing, Past Due, Canceled, etc.)
- Stripe integration

### Invoices
- Invoice generation and tracking
- Payment status management
- Dunning workflow

### Usage Records
- Track views, renders, AI generations, workflow runs, etc.
- Usage-based billing support
- Overage calculation

### Entitlements
- Feature access control
- Usage limit enforcement
- Automatic reset periods

## API Endpoints

### Subscription Management

#### Get Current Subscription
```http
GET /api/billing/subscription
Headers: x-user-id: {userId}
```

#### Subscribe to a Plan
```http
POST /api/billing/subscribe
Headers: x-user-id: {userId}
Body: {
  "planName": "PRO",
  "email": "user@example.com",
  "name": "John Doe",
  "paymentMethodId": "pm_xxx"
}
```

#### Upgrade Subscription
```http
POST /api/billing/upgrade
Headers: x-user-id: {userId}
Body: {
  "planName": "ENTERPRISE"
}
```

#### Cancel Subscription
```http
POST /api/billing/cancel
Headers: x-user-id: {userId}
Body: {
  "cancelAtPeriodEnd": true
}
```

### Invoice Management

#### Get Invoices
```http
GET /api/billing/invoices?status=PAID&limit=10&offset=0
Headers: x-user-id: {userId}
```

#### Get Invoice by ID
```http
GET /api/billing/invoices/:id
Headers: x-user-id: {userId}
```

#### Download Invoice
```http
GET /api/billing/invoices/:id/download
Headers: x-user-id: {userId}
```

### Usage Tracking

#### Get Usage
```http
GET /api/billing/usage?type=AI_GENERATIONS&startDate=2024-01-01&endDate=2024-01-31
Headers: x-user-id: {userId}
```

### Payment Methods

#### Add Payment Method
```http
POST /api/billing/payment-methods
Headers: x-user-id: {userId}
Body: {
  "paymentMethodId": "pm_xxx"
}
```

#### Delete Payment Method
```http
DELETE /api/billing/payment-methods/:id
Headers: x-user-id: {userId}
```

### Webhooks

#### Stripe Webhook
```http
POST /api/billing/webhooks/stripe
Headers: stripe-signature: {signature}
Body: {Raw Stripe Event}
```

## Subscription Plans

### Free
- Basic features
- Limited usage
- Community support

### Starter ($29/month)
- Enhanced features
- Moderate usage limits
- Email support

### Growth ($99/month)
- Advanced features
- Higher usage limits
- Priority support

### Pro ($299/month)
- Professional features
- Very high usage limits
- 24/7 support

### Enterprise (Custom)
- All features
- Unlimited usage
- Dedicated support
- Custom SLA

## Dunning Management

The service implements an automated dunning process for failed payments:

1. **First Attempt**: Immediate retry
2. **Second Attempt**: Retry after 72 hours
3. **Third Attempt**: Retry after 144 hours
4. **Final Action**: Mark as uncollectible after 3 failed attempts

Each attempt triggers:
- Automated payment retry
- Email notification to user
- Subscription status update

## Usage Tracking

Track the following metrics:
- **VIEWS**: Content views
- **RENDERS**: Video/media renders
- **AI_GENERATIONS**: AI content generations
- **WORKFLOW_RUNS**: Workflow executions
- **STORAGE_GB**: Storage usage
- **BANDWIDTH_GB**: Bandwidth usage
- **API_CALLS**: API request count

## Entitlement Checks

Middleware functions for access control:

```typescript
import { checkEntitlement, requireActiveSubscription, requirePlan } from './middleware/entitlement';

// Check specific feature entitlement
router.post('/generate',
  checkEntitlement('AI_GENERATIONS'),
  generateContent
);

// Require active subscription
router.get('/premium-feature',
  requireActiveSubscription,
  getPremiumFeature
);

// Require specific plan
router.post('/enterprise-feature',
  requirePlan(['PRO', 'ENTERPRISE']),
  getEnterpriseFeature
);
```

## Development

Run in development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Testing

```bash
npm test
```

## Docker

Build Docker image:
```bash
docker build -t nexus-billing-service .
```

Run container:
```bash
docker run -p 3004:3004 --env-file .env nexus-billing-service
```

## Scheduled Jobs

The service runs the following cron jobs:

- **Dunning Retries**: Every hour, processes failed payment retries
- **Usage Reset**: First day of each month, resets monthly usage counters

## Monitoring

Health check endpoint:
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "billing-service",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Handling

The service implements comprehensive error handling:
- Request validation
- Payment failures
- Subscription errors
- Database errors
- Stripe API errors

All errors are logged with context for debugging.

## Security

- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- CORS enabled
- Stripe webhook signature verification
- Environment variable validation

## Logging

Winston logger with multiple transports:
- Console output (development)
- File output (production)
- Structured JSON logging
- Different log levels (error, warn, info, debug)

## Integration

### With User Service
- User information retrieval
- User notification triggers

### With Notification Service
- Payment confirmations
- Failed payment alerts
- Subscription changes
- Trial expiry warnings

### With Stripe
- Customer management
- Subscription lifecycle
- Payment processing
- Webhook events

## Contributing

1. Follow TypeScript best practices
2. Write unit tests for new features
3. Update documentation
4. Follow the existing code style

## License

MIT
