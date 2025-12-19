# Billing Service Quick Start Guide

Get the NEXUS Billing Service up and running in minutes!

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- Stripe account

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/nexus_billing"
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
REDIS_URL=redis://localhost:6379
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed plans
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The service will be running at `http://localhost:3004`

## Quick Start (Docker)

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Stripe keys
```

### 2. Start with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Billing service

### 3. View Logs

```bash
docker-compose logs -f billing-service
```

## Testing the API

### Health Check

```bash
curl http://localhost:3004/health
```

### Get Available Plans

```bash
curl http://localhost:3004/api/plans
```

### Subscribe to a Plan

```bash
curl -X POST http://localhost:3004/api/billing/subscribe \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{
    "planName": "STARTER",
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

## Stripe Webhook Setup

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
```

### 2. Login to Stripe

```bash
stripe login
```

### 3. Forward Webhooks to Local Server

```bash
stripe listen --forward-to http://localhost:3004/api/billing/webhooks/stripe
```

Copy the webhook secret (whsec_...) and add it to your `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Common Tasks

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

### Run Tests

```bash
npm test
```

### Lint Code

```bash
npm run lint
```

### Build for Production

```bash
npm run build
npm start
```

## Available Plans

After seeding, the following plans are available:

1. **FREE** - $0/month
   - 10 AI generations
   - 100 views
   - 1 GB storage

2. **STARTER** - $29/month
   - 100 AI generations
   - 10,000 views
   - 10 GB storage
   - 14-day trial

3. **GROWTH** - $99/month
   - 500 AI generations
   - 100,000 views
   - 50 GB storage
   - Team collaboration

4. **PRO** - $299/month
   - 2,000 AI generations
   - 1,000,000 views
   - 200 GB storage
   - Advanced features

5. **ENTERPRISE** - $999/month
   - Unlimited everything
   - Custom features

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U nexus -d nexus_billing
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### Stripe Issues

```bash
# Verify Stripe keys
stripe status

# Test webhook
stripe trigger payment_intent.succeeded
```

### Port Already in Use

```bash
# Find process using port 3004
lsof -i :3004

# Kill the process
kill -9 <PID>
```

## Next Steps

1. Review the [API Documentation](./API.md)
2. Check out the [README](./README.md) for detailed information
3. Explore the code in `src/`
4. Customize plans in `prisma/seed.ts`
5. Set up production Stripe account
6. Configure production database

## Support

For issues or questions:
- Check logs: `docker-compose logs billing-service`
- Review Prisma Studio: `npm run prisma:studio`
- Check Stripe Dashboard for payment issues
- Review Winston logs in development

## Production Checklist

Before deploying to production:

- [ ] Update environment variables with production credentials
- [ ] Set up production PostgreSQL database
- [ ] Set up production Redis instance
- [ ] Configure Stripe production keys
- [ ] Set up Stripe production webhooks
- [ ] Configure proper CORS settings
- [ ] Set up SSL/TLS
- [ ] Configure logging to external service
- [ ] Set up monitoring and alerts
- [ ] Review and adjust rate limiting
- [ ] Test dunning flow
- [ ] Test all payment scenarios
- [ ] Set up backup strategy
- [ ] Configure CDN for invoice PDFs
- [ ] Review security headers
- [ ] Enable production error tracking
