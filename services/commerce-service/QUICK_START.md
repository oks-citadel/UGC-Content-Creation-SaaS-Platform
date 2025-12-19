# Commerce Service - Quick Start Guide

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 16+
- Redis 7+
- Docker and Docker Compose (optional)

## Option 1: Quick Start with Docker Compose

The fastest way to get started:

```bash
# 1. Clone or navigate to the service directory
cd commerce-service

# 2. Copy environment file
cp .env.example .env

# 3. Start all services with Docker Compose
docker-compose up -d

# 4. Check service health
curl http://localhost:3006/health
```

That's it! The service is running with PostgreSQL, Redis, and RabbitMQ.

## Option 2: Manual Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update these required variables:
# - DATABASE_URL
# - REDIS_HOST
# - JWT_SECRET
```

### Step 3: Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed sample data
# npm run seed
```

### Step 4: Start the Service

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## Verify Installation

### 1. Check Health
```bash
curl http://localhost:3006/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "commerce-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### 2. Check Readiness
```bash
curl http://localhost:3006/ready
```

### 3. Test API
```bash
# Get service info
curl http://localhost:3006/

# List products (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3006/api/products
```

## Quick Configuration Guide

### Shopify Integration

1. Create a Shopify app in your store
2. Get API credentials
3. Update `.env`:
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
```

4. Sync products:
```bash
curl -X POST http://localhost:3006/api/products/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "shopify",
    "credentials": {
      "shopName": "your-store",
      "apiKey": "your_api_key",
      "password": "your_password"
    }
  }'
```

### WooCommerce Integration

1. Generate REST API keys in WooCommerce
2. Update `.env`:
```env
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx
```

3. Sync products (same API as Shopify, just change source to "woocommerce")

## Common Operations

### Create a Shoppable Gallery

```bash
curl -X POST http://localhost:3006/api/galleries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Collection",
    "layout": "grid",
    "theme": {
      "primary_color": "#FF6B6B"
    }
  }'
```

### Tag a Product on Content

```bash
curl -X POST http://localhost:3006/api/content/CONTENT_ID/tags \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "PRODUCT_UUID",
    "position_x": 0.5,
    "position_y": 0.3,
    "label": "Featured Product"
  }'
```

### Track Attribution Event

```bash
curl -X POST http://localhost:3006/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "view",
    "content_id": "CONTENT_ID",
    "gallery_id": "GALLERY_ID",
    "session_id": "SESSION_123",
    "tenant_id": "TENANT_ID"
  }'
```

### Process a Checkout

```bash
# 1. Initiate checkout
curl -X POST http://localhost:3006/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": "PRODUCT_UUID",
        "quantity": 2
      }
    ],
    "tenant_id": "TENANT_ID"
  }'

# 2. Process order with session token from step 1
curl -X POST http://localhost:3006/api/checkout/process \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "SESSION_TOKEN",
    "customer_data": {
      "email": "customer@example.com",
      "name": "John Doe"
    }
  }'
```

## Development Tools

### Prisma Studio
View and edit database data:
```bash
npm run prisma:studio
```
Opens at http://localhost:5555

### Logs
Application logs are stored in `./logs/`:
- `error.log` - Error messages only
- `all.log` - All log messages

### RabbitMQ Management (if using Docker Compose)
Access at http://localhost:15672
- Username: guest
- Password: guest

## Troubleshooting

### Database Connection Error
```
Error: Can't reach database server
```
**Solution:** Ensure PostgreSQL is running and DATABASE_URL is correct.

### Redis Connection Error
```
Error: Redis connection failed
```
**Solution:** Check Redis is running on the configured host/port.

### Port Already in Use
```
Error: Port 3006 is already in use
```
**Solution:** Change PORT in `.env` or kill the process using port 3006.

### Prisma Client Not Generated
```
Error: Cannot find module '@prisma/client'
```
**Solution:** Run `npm run prisma:generate`

## Next Steps

1. Review the full API documentation in `API.md`
2. Configure e-commerce integrations
3. Set up AI service for auto-product detection
4. Review the database schema in `prisma/schema.prisma`
5. Customize attribution models
6. Add webhook endpoints for your e-commerce platform
7. Set up monitoring and alerts
8. Configure CORS for your frontend domains

## Support

- Check `README.md` for detailed documentation
- Review `API.md` for complete API reference
- See `PROJECT_STRUCTURE.md` for architecture details

## Useful Commands

```bash
# View logs in real-time
tail -f logs/all.log

# Check service status
curl http://localhost:3006/health

# View database schema
npx prisma studio

# Run linter
npm run lint

# Build for production
npm run build

# Run tests (when implemented)
npm test

# Stop Docker Compose services
docker-compose down

# View Docker logs
docker-compose logs -f commerce-service
```
