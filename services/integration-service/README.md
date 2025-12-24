# Integration Service

## Overview

The Integration Service manages third-party platform connections for the NEXUS UGC platform. It handles OAuth authentication flows, webhook management, data synchronization, and provides a unified interface for external service integrations.

**Port:** 3008 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis

## Responsibilities

- OAuth 2.0 authentication with third-party platforms
- Secure token storage and refresh management
- Webhook configuration and event delivery
- Integration health monitoring and sync logging
- Social media platform connections
- E-commerce platform connections
- Marketing tool integrations

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |

### OAuth Routes (`/integrations`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/oauth/initiate` | Start OAuth flow | Required |
| GET | `/oauth/callback/:provider` | OAuth callback | Public |
| POST | `/:id/refresh` | Refresh access token | Required |

### Integration Management Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/user/:userId` | Get user integrations | Required |
| GET | `/:id` | Get integration details | Required |
| PATCH | `/:id` | Update integration | Required |
| DELETE | `/:id` | Delete integration | Required |
| GET | `/:id/sync-logs` | Get sync history | Required |

### Webhook Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/webhooks` | Create webhook | Required |
| GET | `/webhooks/:webhookId/deliveries` | Get delivery history | Required |
| PATCH | `/webhooks/:webhookId` | Update webhook | Required |
| DELETE | `/webhooks/:webhookId` | Delete webhook | Required |

### Request/Response Examples

#### Initiate OAuth
```json
POST /integrations/oauth/initiate
{
  "userId": "uuid",
  "provider": "INSTAGRAM",
  "redirectUri": "https://app.example.com/callback",
  "metadata": {
    "source": "settings"
  }
}

Response:
{
  "success": true,
  "data": {
    "authorizationUrl": "https://api.instagram.com/oauth/authorize?...",
    "state": "random-state-token"
  }
}
```

#### Get User Integrations
```json
GET /integrations/user/uuid?provider=INSTAGRAM&isActive=true

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "INSTAGRAM",
      "name": "@username",
      "isActive": true,
      "scope": ["basic", "publish_content"],
      "lastSyncAt": "2024-01-15T10:30:00Z",
      "lastError": null
    }
  ]
}
```

#### Create Webhook
```json
POST /integrations/webhooks
{
  "integrationId": "uuid",
  "url": "https://api.example.com/webhooks/instagram",
  "events": ["media.created", "media.updated"]
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://api.example.com/webhooks/instagram",
    "events": ["media.created", "media.updated"],
    "secret": "whsec_xxx",
    "isActive": true
  }
}
```

## Data Models

### Integration
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Owner user |
| organizationId | UUID | Owner organization |
| provider | Enum | Integration provider |
| name | String | Display name (e.g., @username) |
| isActive | Boolean | Active status |
| accessToken | String | Encrypted access token |
| refreshToken | String | Encrypted refresh token |
| tokenType | String | Token type (Bearer, etc.) |
| expiresAt | DateTime | Token expiration |
| scope | String[] | Granted permissions |
| metadata | JSON | Provider-specific data |
| lastSyncAt | DateTime | Last successful sync |
| lastError | String | Last error message |

### IntegrationProvider Enum
- `TIKTOK` - TikTok
- `INSTAGRAM` - Instagram
- `FACEBOOK` - Facebook
- `YOUTUBE` - YouTube
- `TWITTER` - Twitter/X
- `LINKEDIN` - LinkedIn
- `HUBSPOT` - HubSpot CRM
- `SALESFORCE` - Salesforce
- `SHOPIFY` - Shopify
- `WOOCOMMERCE` - WooCommerce
- `META_ADS` - Meta Ads
- `GOOGLE_ADS` - Google Ads
- `TIKTOK_ADS` - TikTok Ads
- `MAILCHIMP` - Mailchimp
- `SENDGRID` - SendGrid
- `STRIPE` - Stripe
- `PAYPAL` - PayPal
- `ZAPIER` - Zapier
- `SLACK` - Slack
- `DISCORD` - Discord

### Webhook
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| integrationId | UUID | Parent integration |
| url | String | Delivery endpoint |
| events | String[] | Subscribed events |
| secret | String | Signing secret |
| isActive | Boolean | Active status |
| lastTriggeredAt | DateTime | Last delivery |
| metadata | JSON | Additional config |

### WebhookDelivery
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| webhookId | UUID | Parent webhook |
| event | String | Event type |
| payload | JSON | Delivered payload |
| status | Enum | PENDING, DELIVERED, FAILED, RETRYING |
| attempts | Int | Delivery attempts |
| response | JSON | Endpoint response |
| error | String | Error message |
| deliveredAt | DateTime | Delivery timestamp |

### IntegrationSyncLog
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| integrationId | UUID | Parent integration |
| action | String | Sync action (e.g., "fetch_posts") |
| resourceType | String | Resource type synced |
| resourceId | String | Resource ID synced |
| status | Enum | PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED |
| itemsProcessed | Int | Items processed |
| itemsFailed | Int | Items failed |
| error | String | Error message |
| metadata | JSON | Additional details |
| startedAt | DateTime | Start time |
| completedAt | DateTime | Completion time |

### OAuthState
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| state | String | OAuth state parameter |
| provider | Enum | Provider |
| userId | UUID | Initiating user |
| redirectUri | String | Callback redirect |
| metadata | JSON | Additional context |
| expiresAt | DateTime | State expiration |

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| user-service | User authentication |
| notification-service | Integration alerts |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | Data storage |
| Redis | OAuth state, caching |
| Various OAuth providers | Authentication |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3008 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | Yes | - | Redis connection |
| `ENCRYPTION_KEY` | Yes | - | Token encryption key |
| `FRONTEND_URL` | Yes | - | Frontend redirect base |
| `TIKTOK_CLIENT_ID` | No | - | TikTok OAuth client |
| `TIKTOK_CLIENT_SECRET` | No | - | TikTok OAuth secret |
| `INSTAGRAM_CLIENT_ID` | No | - | Instagram OAuth client |
| `INSTAGRAM_CLIENT_SECRET` | No | - | Instagram OAuth secret |
| `FACEBOOK_CLIENT_ID` | No | - | Facebook OAuth client |
| `FACEBOOK_CLIENT_SECRET` | No | - | Facebook OAuth secret |
| `YOUTUBE_CLIENT_ID` | No | - | YouTube OAuth client |
| `YOUTUBE_CLIENT_SECRET` | No | - | YouTube OAuth secret |
| `SHOPIFY_CLIENT_ID` | No | - | Shopify OAuth client |
| `SHOPIFY_CLIENT_SECRET` | No | - | Shopify OAuth secret |

## Database Schema

### Tables

- `integrations` - Connected integrations
- `webhooks` - Webhook configurations
- `webhook_deliveries` - Delivery history
- `integration_sync_logs` - Sync operation logs
- `oauth_states` - OAuth flow state

### Indexes
- `integrations`: (user_id), (provider), (organization_id)
- `webhooks`: (integration_id)
- `webhook_deliveries`: (webhook_id), (status), (created_at)
- `oauth_states`: (state), (expires_at)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `integration.connected` | New integration connected |
| `integration.disconnected` | Integration removed |
| `integration.error` | Integration error occurred |
| `integration.synced` | Sync completed |
| `webhook.delivered` | Webhook delivered |
| `webhook.failed` | Webhook delivery failed |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `user.deleted` | user-service | Remove integrations |
| `content.published` | content-service | Trigger platform sync |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `OAUTH_FAILED` | 400 | OAuth authentication failed |
| `INVALID_PROVIDER` | 400 | Unknown provider |
| `TOKEN_EXPIRED` | 401 | Access token expired |
| `REFRESH_FAILED` | 401 | Token refresh failed |
| `INTEGRATION_NOT_FOUND` | 404 | Integration not found |
| `WEBHOOK_NOT_FOUND` | 404 | Webhook not found |
| `RATE_LIMITED` | 429 | Provider rate limit hit |
| `SYNC_FAILED` | 500 | Sync operation failed |
| `PROVIDER_ERROR` | 502 | Provider API error |

## Supported Providers

### Social Media
| Provider | Capabilities |
|----------|--------------|
| TikTok | Publish, Analytics, Comments |
| Instagram | Publish, Stories, Analytics |
| Facebook | Pages, Publish, Analytics |
| YouTube | Upload, Analytics, Comments |
| Twitter/X | Publish, Analytics |
| LinkedIn | Posts, Analytics |

### E-commerce
| Provider | Capabilities |
|----------|--------------|
| Shopify | Products, Orders, Inventory |
| WooCommerce | Products, Orders |

### Marketing
| Provider | Capabilities |
|----------|--------------|
| HubSpot | Contacts, Campaigns |
| Mailchimp | Lists, Campaigns |
| Meta Ads | Campaigns, Analytics |
| Google Ads | Campaigns, Analytics |

### Communication
| Provider | Capabilities |
|----------|--------------|
| Slack | Notifications, Commands |
| Discord | Webhooks, Notifications |

## Security

- **Token Encryption:** All OAuth tokens encrypted at rest using AES-256
- **State Validation:** OAuth state parameter prevents CSRF attacks
- **Scope Limiting:** Request only necessary permissions
- **Webhook Signing:** All webhooks signed with HMAC-SHA256
- **Automatic Refresh:** Tokens refreshed before expiration
