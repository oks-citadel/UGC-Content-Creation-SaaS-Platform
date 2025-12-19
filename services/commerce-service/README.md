# Commerce Service

The Commerce Service is a core microservice of the NEXUS UGC Content Creation SaaS Platform, responsible for managing shoppable UGC galleries, product tagging, e-commerce integrations, attribution tracking, and checkout/order processing.

## Features

### 1. Product Management
- Multi-source product synchronization (Shopify, WooCommerce)
- Manual product creation and management
- Product search and filtering
- Image and variant support
- Inventory tracking

### 2. Shoppable Galleries
- Multiple layout options (grid, masonry, carousel, slider, fullscreen, story)
- Customizable themes and CTA settings
- Embed code generation
- Real-time analytics
- Content and product association

### 3. Product Tagging
- Manual product tagging on images and videos
- Position-based tagging (x, y coordinates)
- Timestamp-based tagging for videos
- AI-powered auto-detection
- Confidence scoring

### 4. Attribution Tracking
- Multiple attribution models:
  - First Touch
  - Last Touch
  - Linear
  - Time Decay
  - Position-Based (U-Shaped)
- Event tracking (view, click, add_to_cart, purchase)
- Content and creator ROI analysis
- Channel attribution
- UTM parameter support

### 5. Checkout & Orders
- Session-based checkout flow
- Order creation and management
- Multiple order statuses
- Customer data management
- Order tracking and fulfillment

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Integrations**: Shopify API, WooCommerce REST API

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
# Server
NODE_ENV=development
PORT=3006

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nexus_commerce

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Shopify (optional)
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_secret

# WooCommerce (optional)
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=your_key
WOOCOMMERCE_CONSUMER_SECRET=your_secret
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Docker

```bash
# Build image
docker build -t nexus-commerce-service .

# Run container
docker run -p 3006:3006 \
  -e DATABASE_URL=postgresql://user:password@host:5432/nexus_commerce \
  -e REDIS_HOST=redis \
  nexus-commerce-service
```

## API Endpoints

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product
- `POST /api/products/sync` - Sync from e-commerce platform

### Galleries
- `GET /api/galleries` - List galleries
- `GET /api/galleries/:id` - Get gallery
- `POST /api/galleries` - Create gallery
- `PUT /api/galleries/:id` - Update gallery
- `DELETE /api/galleries/:id` - Delete gallery
- `POST /api/galleries/:id/content` - Add content
- `GET /api/galleries/:id/analytics` - Get analytics
- `POST /api/galleries/:id/publish` - Publish gallery

### Tagging
- `POST /api/content/:id/tags` - Tag product
- `GET /api/content/:id/tags` - Get tags
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag
- `POST /api/content/:id/detect` - Auto-detect products

### Attribution
- `POST /api/events` - Track event
- `GET /api/attribution/report` - Get attribution report
- `GET /api/attribution/content/:id/roi` - Get content ROI
- `POST /api/attribution/creator/roi` - Get creator ROI

### Checkout & Orders
- `POST /api/checkout` - Initiate checkout
- `GET /api/checkout/:token` - Get checkout session
- `PUT /api/checkout/:token` - Update checkout
- `POST /api/checkout/process` - Process order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get order
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/cancel` - Cancel order

## Database Schema

### Core Models
- **Product** - Product catalog with multi-source support
- **ShoppableGallery** - Shoppable content galleries
- **GalleryContent** - Content items in galleries
- **GalleryProduct** - Products featured in galleries
- **ProductTag** - Product tags on content
- **Order** - Customer orders
- **OrderItem** - Individual order line items
- **AttributionEvent** - Tracking events
- **AttributionModel** - Attribution model configurations
- **CheckoutSession** - Checkout sessions
- **IntegrationConfig** - E-commerce integration settings

## Integrations

### Shopify
```typescript
const shopify = new ShopifyIntegration(tenantId);
await shopify.initialize(config);
await shopify.syncProducts();
```

### WooCommerce
```typescript
const woo = new WooCommerceIntegration(tenantId);
await woo.initialize(config);
await woo.syncProducts();
```

## Attribution Models

### First Touch
100% credit to the first touchpoint in the customer journey.

### Last Touch
100% credit to the last touchpoint before conversion.

### Linear
Equal credit distributed across all touchpoints.

### Time Decay
Exponential decay with configurable half-life (default: 7 days).

### Position-Based (U-Shaped)
40% to first touchpoint, 40% to last, 20% distributed among middle touchpoints.

## Security

- JWT authentication
- Rate limiting
- Helmet security headers
- Input validation with express-validator
- CORS configuration
- Encrypted credentials storage

## Monitoring

### Health Checks
- `GET /health` - Service health status
- `GET /ready` - Readiness check with dependencies

### Metrics
- Request rate and duration
- Error rates
- Database query performance
- Cache hit rates
- Attribution event tracking

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Contributing

1. Follow TypeScript best practices
2. Add validation for all inputs
3. Write unit tests for new features
4. Update documentation
5. Use semantic commit messages

## License

MIT License - see LICENSE file for details
