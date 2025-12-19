# Commerce Service API Documentation

## Base URL
```
http://localhost:3006/api
```

## Authentication
Most endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Products

### List Products
```http
GET /products
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `source` (optional): Filter by source (shopify, woocommerce, manual, api)
- `search` (optional): Search by name or description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "external_id": "123456",
      "name": "Product Name",
      "description": "Product description",
      "price": 29.99,
      "currency": "USD",
      "images": ["url1", "url2"],
      "source": "shopify",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

### Get Product
```http
GET /products/:id
```

### Create Product
```http
POST /products
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "currency": "USD",
  "sku": "PROD-001",
  "images": ["url1", "url2"],
  "inventory": 100
}
```

### Sync Products from E-commerce Platform
```http
POST /products/sync
Content-Type: application/json

{
  "source": "shopify",
  "credentials": {
    "shopName": "mystore",
    "apiKey": "your_api_key",
    "password": "your_password"
  }
}
```

---

## Shoppable Galleries

### List Galleries
```http
GET /galleries?limit=20&offset=0&is_active=true
```

### Get Gallery
```http
GET /galleries/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Spring Collection",
    "layout": "grid",
    "embed_code": "<div>...</div>",
    "is_active": true,
    "content_items": [...],
    "products": [...]
  }
}
```

### Create Gallery
```http
POST /galleries
Content-Type: application/json

{
  "name": "Spring Collection",
  "description": "New spring products",
  "layout": "grid",
  "theme": {
    "primary_color": "#FF6B6B",
    "font_family": "Arial"
  },
  "cta_settings": {
    "button_text": "Shop Now",
    "button_color": "#4ECDC4"
  }
}
```

### Update Gallery
```http
PUT /galleries/:id
Content-Type: application/json

{
  "name": "Updated Gallery Name",
  "is_active": true
}
```

### Delete Gallery
```http
DELETE /galleries/:id
```

### Add Content to Gallery
```http
POST /galleries/:id/content
Content-Type: application/json

{
  "content_id": "content-uuid",
  "position": 0,
  "settings": {
    "autoplay": true
  }
}
```

### Remove Content from Gallery
```http
DELETE /galleries/:id/content/:contentId
```

### Get Gallery Analytics
```http
GET /galleries/:id/analytics?start_date=2024-01-01&end_date=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gallery_id": "uuid",
    "views": 10000,
    "clicks": 500,
    "conversions": 50,
    "revenue": 5000.00,
    "conversion_rate": 0.5,
    "average_order_value": 100.00,
    "top_products": [...],
    "top_content": [...]
  }
}
```

### Publish Gallery
```http
POST /galleries/:id/publish
```

---

## Product Tagging

### Tag Product on Content
```http
POST /content/:id/tags
Content-Type: application/json

{
  "product_id": "product-uuid",
  "position_x": 0.5,
  "position_y": 0.3,
  "label": "Blue Shirt"
}
```

For video content, include timestamp:
```json
{
  "product_id": "product-uuid",
  "timestamp": 15.5,
  "label": "Featured Product"
}
```

### Get Tags for Content
```http
GET /content/:id/tags
```

### Update Tag
```http
PUT /tags/:id
Content-Type: application/json

{
  "position_x": 0.6,
  "position_y": 0.4,
  "is_visible": true
}
```

### Delete Tag
```http
DELETE /tags/:id
```

### Auto-Detect Products
```http
POST /content/:id/detect
Content-Type: application/json

{
  "content_url": "https://example.com/image.jpg",
  "content_type": "image",
  "min_confidence": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-uuid",
      "product_id": "product-uuid",
      "position_x": 0.5,
      "position_y": 0.3,
      "confidence": 0.95,
      "auto_detected": true
    }
  ]
}
```

---

## Attribution Tracking

### Track Event
```http
POST /events
Content-Type: application/json

{
  "type": "view",
  "content_id": "content-uuid",
  "gallery_id": "gallery-uuid",
  "session_id": "session-123",
  "utm_source": "instagram",
  "utm_medium": "social",
  "utm_campaign": "spring2024"
}
```

**Event Types:**
- `view` - Content viewed
- `click` - Product clicked
- `add_to_cart` - Product added to cart
- `purchase` - Purchase completed
- `share` - Content shared
- `like` - Content liked

### Get Attribution Report
```http
GET /attribution/report?start_date=2024-01-01&end_date=2024-12-31&model_type=last_touch
```

**Attribution Models:**
- `first_touch` - 100% to first touchpoint
- `last_touch` - 100% to last touchpoint
- `linear` - Equal distribution
- `time_decay` - Exponential decay
- `position_based` - U-shaped (40/20/40)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    },
    "model_type": "last_touch",
    "total_revenue": 50000.00,
    "total_orders": 500,
    "content_attribution": [...],
    "product_attribution": [...],
    "channel_attribution": [...]
  }
}
```

### Get Content ROI
```http
GET /attribution/content/:id/roi?start_date=2024-01-01&end_date=2024-12-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "content-uuid",
    "total_revenue": 1000.00,
    "total_orders": 10,
    "total_views": 5000,
    "total_clicks": 250,
    "conversion_rate": 0.2,
    "average_order_value": 100.00,
    "roi": 1000.00
  }
}
```

### Get Creator ROI
```http
POST /attribution/creator/roi?start_date=2024-01-01
Content-Type: application/json

{
  "creator_id": "creator-uuid",
  "content_ids": ["content-1", "content-2", "content-3"]
}
```

---

## Checkout & Orders

### Initiate Checkout
```http
POST /checkout
Content-Type: application/json

{
  "items": [
    {
      "product_id": "product-uuid",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "customer_data": {
    "email": "customer@example.com"
  },
  "content_id": "content-uuid",
  "gallery_id": "gallery-uuid",
  "session_id": "session-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "session_token": "unique-token",
    "items": [...],
    "subtotal": 59.98,
    "total": 59.98,
    "expires_at": "2024-01-01T01:00:00Z"
  }
}
```

### Get Checkout Session
```http
GET /checkout/:token
```

### Update Checkout Session
```http
PUT /checkout/:token
Content-Type: application/json

{
  "items": [...],
  "customer_data": {
    "email": "updated@example.com"
  }
}
```

### Process Order
```http
POST /checkout/process
Content-Type: application/json

{
  "session_token": "unique-token",
  "customer_data": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "shipping_address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    },
    "billing_address": {...}
  },
  "payment_method": "credit_card",
  "notes": "Please deliver before 5pm"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "order_number": "NX-ABC123-XYZ",
    "status": "pending",
    "total": 59.98,
    "customer_email": "customer@example.com",
    "items": [...],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### List Orders
```http
GET /orders?limit=20&status=completed&customer_email=user@example.com
```

**Query Parameters:**
- `limit`, `offset` - Pagination
- `status` - Filter by status (pending, processing, completed, cancelled, refunded, failed)
- `customer_email` - Filter by customer
- `start_date`, `end_date` - Date range

### Get Order
```http
GET /orders/:id
```

### Get Order by Number
```http
GET /orders/number/:orderNumber
```

### Update Order Status
```http
PUT /orders/:id/status
Content-Type: application/json

{
  "status": "completed",
  "metadata": {
    "payment_status": "paid",
    "fulfillment_status": "shipped",
    "tracking_number": "TRACK123"
  }
}
```

### Cancel Order
```http
POST /orders/:id/cancel
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Webhooks

### Shopify Webhook Handler
```http
POST /webhooks/shopify
X-Shopify-Topic: products/update
X-Shopify-Hmac-Sha256: signature
Content-Type: application/json

{...shopify payload...}
```

### WooCommerce Webhook Handler
```http
POST /webhooks/woocommerce
X-WC-Webhook-Topic: product.updated
X-WC-Webhook-Signature: signature
Content-Type: application/json

{...woocommerce payload...}
```

---

## Rate Limiting

Default rate limits:
- 100 requests per 15 minutes per IP address
- Configurable via environment variables

Rate limit headers in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit` - Number of results per page (default: 50, max: 100)
- `offset` - Number of items to skip (default: 0)

**Response Meta:**
```json
{
  "meta": {
    "total": 250,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Date Formats

All dates use ISO 8601 format:
```
2024-01-01T00:00:00Z
```

Date query parameters accept:
- ISO 8601 strings
- YYYY-MM-DD format
