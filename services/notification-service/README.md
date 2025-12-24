# Notification Service

## Overview

The Notification Service handles all notification delivery for the NEXUS UGC platform. It supports multiple channels (email, SMS, push, Slack, webhooks), notification scheduling, template management, and user preference handling.

**Port:** 3009 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis

## Responsibilities

- Multi-channel notification delivery
- Notification scheduling and queuing
- Template management for consistent messaging
- User notification preferences
- Delivery tracking and retry logic
- Batch notification support
- Real-time notification via WebSockets

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |

### Notification Routes (`/notifications`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/send` | Send notification | Required |
| POST | `/send/batch` | Send batch notifications | Required |
| GET | `/:id` | Get notification status | Required |
| GET | `/user/:userId` | Get user notifications | Required |
| POST | `/:id/cancel` | Cancel scheduled notification | Required |

### Preference Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/preferences/:userId` | Get user preferences | Required |
| PUT | `/preferences/:userId` | Update preferences | Required |

### Template Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/templates/list` | List templates | Required |
| POST | `/templates` | Create template | Admin |
| GET | `/templates/:id` | Get template | Required |
| PUT | `/templates/:id` | Update template | Admin |
| DELETE | `/templates/:id` | Delete template | Admin |

### Stats Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/stats/:userId` | Get notification stats | Required |

### Request/Response Examples

#### Send Notification
```json
POST /notifications/send
{
  "userId": "uuid",
  "type": "CAMPAIGN_CREATED",
  "channel": ["EMAIL", "PUSH"],
  "priority": "NORMAL",
  "subject": "New Campaign Created",
  "template": "campaign-created",
  "data": {
    "campaignName": "Summer Sale",
    "creatorName": "John Doe"
  },
  "scheduledFor": "2024-01-15T10:00:00Z"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "SCHEDULED",
    "scheduledFor": "2024-01-15T10:00:00Z"
  }
}
```

#### Send Batch Notifications
```json
POST /notifications/send/batch
{
  "notifications": [
    {
      "userId": "uuid1",
      "type": "CONTENT_APPROVED",
      "channel": ["EMAIL"],
      "template": "content-approved",
      "data": { "contentTitle": "Product Video" }
    },
    {
      "userId": "uuid2",
      "type": "PAYMENT_RECEIVED",
      "channel": ["EMAIL", "PUSH"],
      "template": "payment-received",
      "data": { "amount": 500.00 }
    }
  ]
}
```

#### Update Preferences
```json
PUT /notifications/preferences/uuid
{
  "type": "CAMPAIGN_UPDATES",
  "email": true,
  "sms": false,
  "push": true,
  "slack": false,
  "webhook": false
}
```

## Data Models

### Notification
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Target user |
| type | Enum | Notification type |
| channel | Enum[] | Delivery channels |
| priority | Enum | LOW, NORMAL, HIGH, URGENT |
| subject | String | Notification subject |
| template | String | Template name |
| data | JSON | Template variables |
| status | Enum | Delivery status |
| scheduledFor | DateTime | Scheduled delivery |
| sentAt | DateTime | Actual send time |
| failedAt | DateTime | Failure timestamp |
| error | String | Error message |
| retryCount | Int | Retry attempts |
| metadata | JSON | Additional data |

### NotificationType Enum
- `WELCOME` - Welcome message
- `EMAIL_VERIFICATION` - Email verification
- `PASSWORD_RESET` - Password reset
- `CAMPAIGN_CREATED` - Campaign created
- `CAMPAIGN_UPDATED` - Campaign updated
- `CAMPAIGN_COMPLETED` - Campaign completed
- `CONTENT_UPLOADED` - Content uploaded
- `CONTENT_APPROVED` - Content approved
- `CONTENT_REJECTED` - Content rejected
- `PAYMENT_RECEIVED` - Payment received
- `PAYMENT_FAILED` - Payment failed
- `SUBSCRIPTION_CREATED` - Subscription started
- `SUBSCRIPTION_RENEWED` - Subscription renewed
- `SUBSCRIPTION_CANCELLED` - Subscription cancelled
- `CREATOR_APPLICATION` - Creator application
- `CREATOR_APPROVED` - Creator approved
- `CREATOR_REJECTED` - Creator rejected
- `MESSAGE_RECEIVED` - New message
- `TASK_ASSIGNED` - Task assignment
- `TASK_COMPLETED` - Task completed
- `REVIEW_REQUESTED` - Review request
- `REVIEW_RECEIVED` - Review received
- `SYSTEM_ALERT` - System notification
- `CUSTOM` - Custom notification

### NotificationChannel Enum
- `EMAIL` - Email delivery
- `SMS` - SMS/text message
- `PUSH` - Push notification
- `SLACK` - Slack message
- `WEBHOOK` - Webhook delivery

### NotificationStatus Enum
- `PENDING` - Awaiting processing
- `SCHEDULED` - Scheduled for future
- `SENDING` - Currently sending
- `SENT` - Successfully sent
- `DELIVERED` - Confirmed delivered
- `FAILED` - Delivery failed
- `CANCELLED` - Cancelled

### NotificationLog
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| notificationId | UUID | Parent notification |
| channel | Enum | Delivery channel |
| status | String | Delivery status |
| provider | String | Delivery provider |
| providerId | String | Provider message ID |
| response | JSON | Provider response |
| error | String | Error message |
| sentAt | DateTime | Send timestamp |
| deliveredAt | DateTime | Delivery confirmation |
| openedAt | DateTime | Open tracking |
| clickedAt | DateTime | Click tracking |

### NotificationPreference
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | User reference |
| type | Enum | Notification type |
| email | Boolean | Email enabled |
| sms | Boolean | SMS enabled |
| push | Boolean | Push enabled |
| slack | Boolean | Slack enabled |
| webhook | Boolean | Webhook enabled |

### NotificationTemplate
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Template name |
| type | Enum | Notification type |
| channel | Enum | Target channel |
| subject | String | Subject line |
| body | String | Template body |
| variables | String[] | Available variables |
| isActive | Boolean | Active status |
| metadata | JSON | Additional config |

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| user-service | User contact information |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | Data storage |
| Redis | Queue management, caching |
| SendGrid/SES | Email delivery |
| Twilio | SMS delivery |
| Firebase | Push notifications |
| Slack API | Slack messages |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3009 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | Yes | - | Redis connection |
| `SENDGRID_API_KEY` | No | - | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | No | - | SendGrid sender |
| `AWS_SES_REGION` | No | - | AWS SES region |
| `AWS_SES_ACCESS_KEY` | No | - | AWS access key |
| `AWS_SES_SECRET_KEY` | No | - | AWS secret key |
| `TWILIO_ACCOUNT_SID` | No | - | Twilio SID |
| `TWILIO_AUTH_TOKEN` | No | - | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No | - | Twilio sender number |
| `FIREBASE_PROJECT_ID` | No | - | Firebase project |
| `FIREBASE_PRIVATE_KEY` | No | - | Firebase private key |
| `SLACK_BOT_TOKEN` | No | - | Slack bot token |
| `SLACK_WEBHOOK_URL` | No | - | Slack webhook URL |

## Database Schema

### Tables

- `notifications` - Notification records
- `notification_logs` - Delivery logs per channel
- `notification_preferences` - User preferences
- `notification_templates` - Message templates

### Indexes
- `notifications`: (user_id), (status), (scheduled_for), (created_at)
- `notification_logs`: (notification_id), (channel), (status)
- `notification_preferences`: (user_id), (type)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `notification.sent` | Notification sent |
| `notification.delivered` | Delivery confirmed |
| `notification.failed` | Delivery failed |
| `notification.opened` | Email/push opened |
| `notification.clicked` | Link clicked |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `user.registered` | auth-service | Send welcome email |
| `campaign.created` | campaign-service | Notify stakeholders |
| `content.approved` | content-service | Notify creator |
| `payment.completed` | billing-service | Payment confirmation |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOTIFICATION_NOT_FOUND` | 404 | Notification not found |
| `TEMPLATE_NOT_FOUND` | 404 | Template not found |
| `INVALID_CHANNEL` | 400 | Invalid notification channel |
| `MISSING_RECIPIENT` | 400 | No recipient specified |
| `DELIVERY_FAILED` | 500 | All channels failed |
| `RATE_LIMITED` | 429 | Too many notifications |
| `ALREADY_SENT` | 400 | Cannot cancel sent notification |

## Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| Every minute | Process Scheduled | Send scheduled notifications |
| Every 5 minutes | Retry Failed | Retry failed deliveries |
| Daily | Clean Old Logs | Remove old delivery logs |

## Template Variables

Templates support Handlebars-style variables:

```handlebars
Hello {{firstName}},

Your campaign "{{campaignName}}" has been created successfully!

Best regards,
The NEXUS Team
```

Common variables:
- `{{firstName}}`, `{{lastName}}` - User name
- `{{email}}` - User email
- `{{campaignName}}` - Campaign name
- `{{contentTitle}}` - Content title
- `{{amount}}` - Payment amount
- `{{actionUrl}}` - CTA link
