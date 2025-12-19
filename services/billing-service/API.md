# Billing Service API Documentation

Base URL: `http://localhost:3004/api`

All endpoints require the `x-user-id` header unless otherwise specified.

## Authentication

All endpoints (except webhooks and health check) require authentication via the `x-user-id` header:

```
x-user-id: {userId}
```

## Plans

### Get All Plans

Retrieve all available subscription plans.

```http
GET /plans
```

**Query Parameters:**
- `includeInactive` (boolean, optional): Include inactive plans

**Response:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "FREE",
      "displayName": "Free",
      "description": "Perfect for individuals just getting started",
      "price": "0.00",
      "billingPeriod": "monthly",
      "features": [...],
      "limits": {...},
      "isActive": true,
      "trialPeriodDays": null
    }
  ]
}
```

### Get Plan by Name

```http
GET /plans/:name
```

**Parameters:**
- `name`: Plan name (FREE, STARTER, GROWTH, PRO, ENTERPRISE)

**Response:**
```json
{
  "plan": {
    "id": "uuid",
    "name": "PRO",
    "displayName": "Pro",
    "price": "299.00",
    ...
  }
}
```

### Compare Plans

```http
POST /plans/compare
```

**Request Body:**
```json
{
  "currentPlan": "STARTER",
  "targetPlan": "PRO"
}
```

**Response:**
```json
{
  "comparison": {
    "isUpgrade": true,
    "isDowngrade": false,
    "priceDifference": 270.00,
    "featureChanges": {
      "added": ["24/7 support", "Advanced API access"],
      "removed": []
    }
  }
}
```

### Get Plan Recommendation

```http
POST /plans/recommend
```

**Request Body:**
```json
{
  "currentUsage": {
    "VIEWS": 50000,
    "AI_GENERATIONS": 300,
    "RENDERS": 100
  }
}
```

**Response:**
```json
{
  "recommendation": {
    "recommendedPlan": {
      "name": "GROWTH",
      "displayName": "Growth",
      ...
    },
    "reasons": [
      "Your VIEWS usage (50000) is approaching the limit (100000)"
    ]
  }
}
```

## Subscriptions

### Get Current Subscription

```http
GET /billing/subscription
Headers: x-user-id: {userId}
```

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "plan": {...},
    "status": "ACTIVE",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "cancelAt": null,
    "canceledAt": null,
    "cancelAtPeriodEnd": false,
    "trialStart": null,
    "trialEnd": null,
    "entitlements": [...]
  }
}
```

### Subscribe to a Plan

```http
POST /billing/subscribe
Headers: x-user-id: {userId}
```

**Request Body:**
```json
{
  "planName": "PRO",
  "email": "user@example.com",
  "name": "John Doe",
  "paymentMethodId": "pm_xxx"
}
```

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "plan": {...},
    "status": "TRIALING",
    "currentPeriodStart": "2024-01-01T00:00:00Z",
    "currentPeriodEnd": "2024-02-01T00:00:00Z",
    "trialStart": "2024-01-01T00:00:00Z",
    "trialEnd": "2024-01-15T00:00:00Z"
  }
}
```

### Upgrade Subscription

```http
POST /billing/upgrade
Headers: x-user-id: {userId}
```

**Request Body:**
```json
{
  "planName": "ENTERPRISE"
}
```

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "plan": {...},
    "status": "ACTIVE",
    ...
  }
}
```

### Cancel Subscription

```http
POST /billing/cancel
Headers: x-user-id: {userId}
```

**Request Body:**
```json
{
  "cancelAtPeriodEnd": true
}
```

**Response:**
```json
{
  "subscription": {
    "id": "uuid",
    "status": "ACTIVE",
    "cancelAt": "2024-02-01T00:00:00Z",
    "canceledAt": "2024-01-15T12:00:00Z",
    "cancelAtPeriodEnd": true
  }
}
```

## Invoices

### Get Invoices

```http
GET /billing/invoices?status=PAID&limit=10&offset=0
Headers: x-user-id: {userId}
```

**Query Parameters:**
- `status` (string, optional): Filter by status (DRAFT, OPEN, PAID, UNCOLLECTIBLE, VOID)
- `limit` (number, optional): Number of results (default: 10)
- `offset` (number, optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-202401-000001",
      "amount": "299.00",
      "tax": "0.00",
      "total": "299.00",
      "status": "PAID",
      "paidAt": "2024-01-01T12:00:00Z",
      "dueDate": "2024-01-08T00:00:00Z",
      ...
    }
  ],
  "total": 50,
  "limit": 10,
  "offset": 0
}
```

### Get Invoice by ID

```http
GET /billing/invoices/:id
Headers: x-user-id: {userId}
```

**Response:**
```json
{
  "invoice": {
    "id": "uuid",
    "invoiceNumber": "INV-202401-000001",
    "amount": "299.00",
    "tax": "0.00",
    "total": "299.00",
    "status": "PAID",
    "subscription": {...},
    ...
  }
}
```

### Download Invoice

```http
GET /billing/invoices/:id/download
Headers: x-user-id: {userId}
```

**Response:**
```json
{
  "pdfUrl": "https://stripe.com/invoices/xxx.pdf"
}
```

## Usage

### Get Usage

```http
GET /billing/usage?type=AI_GENERATIONS&startDate=2024-01-01&endDate=2024-01-31
Headers: x-user-id: {userId}
```

**Query Parameters:**
- `type` (string, optional): Filter by usage type
- `startDate` (ISO date, optional): Start date
- `endDate` (ISO date, optional): End date

**Response:**
```json
{
  "usage": [
    {
      "id": "uuid",
      "type": "AI_GENERATIONS",
      "quantity": "10.0000",
      "unit": "unit",
      "recordedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "summary": {
    "AI_GENERATIONS": {
      "quantity": 150,
      "unit": "unit"
    },
    "VIEWS": {
      "quantity": 25000,
      "unit": "unit"
    }
  }
}
```

## Payment Methods

### Add Payment Method

```http
POST /billing/payment-methods
Headers: x-user-id: {userId}
```

**Request Body:**
```json
{
  "paymentMethodId": "pm_xxx"
}
```

**Response:**
```json
{
  "paymentMethod": {
    "id": "uuid",
    "type": "CARD",
    "brand": "visa",
    "last4": "4242",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "isDefault": false
  }
}
```

### Delete Payment Method

```http
DELETE /billing/payment-methods/:id
Headers: x-user-id: {userId}
```

**Response:**
```json
{
  "message": "Payment method deleted successfully"
}
```

## Webhooks

### Stripe Webhook

```http
POST /billing/webhooks/stripe
Headers: stripe-signature: {signature}
Content-Type: application/json
```

**Request Body:** Raw Stripe event payload

**Response:**
```json
{
  "received": true
}
```

**Supported Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.paid`
- `invoice.payment_failed`

## Health Check

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "billing-service",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "User ID not found in request"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Feature limit exceeded for AI_GENERATIONS",
  "details": {
    "feature": "AI_GENERATIONS",
    "limit": 100,
    "used": 100
  }
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Usage Types

The following usage types are tracked:

- `VIEWS` - Content views
- `RENDERS` - Video/media renders
- `AI_GENERATIONS` - AI content generations
- `WORKFLOW_RUNS` - Workflow executions
- `STORAGE_GB` - Storage usage in GB
- `BANDWIDTH_GB` - Bandwidth usage in GB
- `API_CALLS` - API request count

## Subscription Statuses

- `ACTIVE` - Active subscription
- `TRIALING` - Trial period
- `PAST_DUE` - Payment past due
- `CANCELED` - Canceled subscription
- `UNPAID` - Unpaid after max dunning attempts
- `INCOMPLETE` - Incomplete setup
- `INCOMPLETE_EXPIRED` - Incomplete setup expired

## Invoice Statuses

- `DRAFT` - Draft invoice
- `OPEN` - Open for payment
- `PAID` - Successfully paid
- `UNCOLLECTIBLE` - Marked as uncollectible
- `VOID` - Voided invoice

## Rate Limiting

API is rate-limited to 100 requests per 15 minutes per IP address.

When rate limit is exceeded:
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```
