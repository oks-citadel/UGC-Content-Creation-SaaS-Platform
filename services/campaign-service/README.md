# Campaign Service

## Overview

The Campaign Service manages marketing campaigns, creator applications, content deliverables, and campaign workflows for the NEXUS UGC platform. It provides comprehensive campaign lifecycle management from creation through completion.

**Port:** 3003 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL

## Responsibilities

- Campaign creation and management
- Campaign brief and requirements definition
- Deliverable specification and tracking
- Creator application management
- Milestone and timeline tracking
- Content submission and review workflows
- Campaign analytics and reporting

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |

### Campaign Routes (`/campaigns`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create campaign | Required |
| GET | `/` | List campaigns | Required |
| GET | `/stats` | Get campaign statistics | Required |
| GET | `/:id` | Get campaign details | Required |
| PATCH | `/:id` | Update campaign | Required |
| DELETE | `/:id` | Delete campaign | Required |

### Brief Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| PUT | `/:id/brief` | Create/update brief | Required |
| GET | `/:id/brief` | Get campaign brief | Required |

### Deliverable Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/:id/deliverables` | Add deliverable | Required |
| PATCH | `/:id/deliverables/:deliverableId` | Update deliverable | Required |
| DELETE | `/:id/deliverables/:deliverableId` | Delete deliverable | Required |

### Application Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/:id/apply` | Apply to campaign | Required |
| GET | `/:id/applications` | List applications | Required |
| PATCH | `/:id/applications/:applicationId` | Update application status | Required |

### Milestone Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/:id/milestones` | Add milestone | Required |
| POST | `/:id/milestones/:milestoneId/complete` | Complete milestone | Required |

### Request/Response Examples

#### Create Campaign
```json
POST /campaigns
Headers:
  x-user-id: uuid
  x-organization-id: uuid

Body:
{
  "name": "Summer Product Launch",
  "description": "UGC campaign for summer product line",
  "type": "UGC",
  "startDate": "2024-06-01",
  "endDate": "2024-08-31",
  "budget": 50000.00,
  "currency": "USD",
  "targetAudience": {
    "ageRange": "18-35",
    "interests": ["fashion", "lifestyle"]
  },
  "goals": {
    "contentPieces": 100,
    "reach": 1000000
  },
  "tags": ["summer", "product-launch"]
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Summer Product Launch",
    "slug": "summer-product-launch",
    "status": "DRAFT",
    "type": "UGC",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Create Brief
```json
PUT /campaigns/uuid/brief
{
  "overview": "We're looking for authentic UGC showcasing our summer collection...",
  "objectives": {
    "primary": "Brand awareness",
    "secondary": ["Engagement", "Product showcase"]
  },
  "targetPlatforms": ["instagram", "tiktok"],
  "contentTypes": ["video", "image"],
  "brandGuidelines": {
    "colors": ["#FF6B6B", "#4ECDC4"],
    "tone": "Fun, authentic, summery"
  },
  "doAndDonts": {
    "do": ["Show product in use", "Natural lighting"],
    "dont": ["Competitor products", "Explicit content"]
  },
  "keyMessages": ["Summer vibes", "Quality materials"],
  "hashtags": ["#SummerStyle", "#BrandName"],
  "mentions": ["@brandhandle"]
}
```

#### Add Deliverable
```json
POST /campaigns/uuid/deliverables
{
  "name": "Instagram Reel",
  "description": "15-60 second product showcase reel",
  "type": "REEL",
  "platform": "instagram",
  "quantity": 2,
  "requirements": {
    "minDuration": 15,
    "maxDuration": 60,
    "aspectRatio": "9:16"
  },
  "dueDate": "2024-07-15",
  "compensation": 250.00
}
```

#### Apply to Campaign
```json
POST /campaigns/uuid/apply
{
  "pitch": "I'm a lifestyle content creator with 50K followers...",
  "proposedRate": 300.00
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

## Data Models

### Campaign
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Owner organization |
| name | String | Campaign name |
| slug | String | URL-friendly slug |
| description | String | Description |
| status | Enum | Campaign status |
| type | Enum | Campaign type |
| startDate | DateTime | Start date |
| endDate | DateTime | End date |
| budget | Decimal | Total budget |
| currency | String | Currency code |
| targetAudience | JSON | Target audience definition |
| goals | JSON | Campaign goals |
| tags | String[] | Campaign tags |
| createdBy | UUID | Creator user |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update |

### CampaignStatus Enum
- `DRAFT` - In draft mode
- `PENDING_APPROVAL` - Awaiting approval
- `ACTIVE` - Currently active
- `PAUSED` - Temporarily paused
- `COMPLETED` - Successfully completed
- `CANCELLED` - Cancelled

### CampaignType Enum
- `UGC` - User-generated content
- `INFLUENCER` - Influencer marketing
- `AFFILIATE` - Affiliate marketing
- `AMBASSADOR` - Brand ambassador
- `PRODUCT_SEEDING` - Product seeding

### CampaignBrief
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| campaignId | UUID | Campaign reference |
| overview | String | Brief overview |
| objectives | JSON | Campaign objectives |
| targetPlatforms | String[] | Target platforms |
| contentTypes | String[] | Required content types |
| brandGuidelines | JSON | Brand guidelines |
| doAndDonts | JSON | Do's and don'ts |
| keyMessages | String[] | Key messages |
| hashtags | String[] | Required hashtags |
| mentions | String[] | Required mentions |
| references | JSON | Reference materials |
| attachments | JSON | Attached files |

### Deliverable
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| campaignId | UUID | Campaign reference |
| name | String | Deliverable name |
| description | String | Description |
| type | Enum | Deliverable type |
| platform | String | Target platform |
| quantity | Int | Required quantity |
| requirements | JSON | Specifications |
| dueDate | DateTime | Due date |
| compensation | Decimal | Payment amount |
| status | Enum | Deliverable status |

### DeliverableType Enum
- `VIDEO` - Video content
- `IMAGE` - Image content
- `STORY` - Story format
- `REEL` - Short-form reel
- `TIKTOK` - TikTok video
- `BLOG_POST` - Blog post
- `REVIEW` - Product review
- `TESTIMONIAL` - Testimonial
- `OTHER` - Other content

### DeliverableStatus Enum
- `PENDING` - Not started
- `IN_PROGRESS` - Being worked on
- `SUBMITTED` - Submitted for review
- `APPROVED` - Approved
- `REJECTED` - Rejected

### CreatorApplication
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| campaignId | UUID | Campaign reference |
| creatorId | UUID | Applying creator |
| status | Enum | Application status |
| pitch | String | Creator's pitch |
| proposedRate | Decimal | Proposed rate |
| portfolio | JSON | Portfolio samples |
| notes | String | Internal notes |
| reviewedBy | UUID | Reviewer |
| reviewedAt | DateTime | Review timestamp |
| createdAt | DateTime | Application timestamp |

### ApplicationStatus Enum
- `PENDING` - Awaiting review
- `UNDER_REVIEW` - Being reviewed
- `SHORTLISTED` - Shortlisted
- `ACCEPTED` - Accepted
- `REJECTED` - Rejected
- `WITHDRAWN` - Withdrawn by creator

### Milestone
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| campaignId | UUID | Campaign reference |
| name | String | Milestone name |
| description | String | Description |
| dueDate | DateTime | Due date |
| completedAt | DateTime | Completion timestamp |
| order | Int | Display order |

### Content (within campaign context)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| campaignId | UUID | Campaign reference |
| creatorId | UUID | Content creator |
| title | String | Content title |
| description | String | Description |
| type | Enum | Content type |
| status | Enum | Content status |
| mediaUrl | String | Media URL |
| thumbnailUrl | String | Thumbnail URL |
| publishedAt | DateTime | Publish timestamp |

### ContentStatus Enum
- `DRAFT` - In draft
- `PENDING_REVIEW` - Awaiting review
- `REVISION_REQUESTED` - Needs revision
- `APPROVED` - Approved
- `PUBLISHED` - Published
- `ARCHIVED` - Archived

### ContentReview
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| contentId | UUID | Content reference |
| reviewerId | UUID | Reviewer |
| status | Enum | Review status |
| feedback | String | Review feedback |
| rating | Int | Rating (1-5) |

### ReviewStatus Enum
- `PENDING` - Awaiting review
- `APPROVED` - Approved
- `REJECTED` - Rejected
- `REVISION_REQUESTED` - Needs revision

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| user-service | User/organization info |
| content-service | Content management |
| notification-service | Notifications |
| payout-service | Creator payments |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | Data storage |
| Redis | Caching (optional) |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3003 | Server port |
| `SERVICE_NAME` | No | campaign-service | Service name |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | No | - | Redis connection |
| `CORS_ORIGINS` | No | http://localhost:3000 | CORS origins |
| `USER_SERVICE_URL` | No | - | User service URL |
| `CONTENT_SERVICE_URL` | No | - | Content service URL |
| `NOTIFICATION_SERVICE_URL` | No | - | Notification service URL |

## Database Schema

### Tables

- `campaigns` - Campaign records
- `campaign_briefs` - Campaign briefs
- `deliverables` - Deliverable specifications
- `milestones` - Campaign milestones
- `creator_applications` - Creator applications
- `content` - Campaign content
- `content_submissions` - Deliverable submissions
- `content_reviews` - Content reviews
- `workflows` - Campaign workflows

### Indexes
- `campaigns`: (organization_id), (status), (created_by)
- `deliverables`: (campaign_id)
- `creator_applications`: (campaign_id), (creator_id), (status)
- `content`: (campaign_id), (creator_id), (status)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `campaign.created` | Campaign created |
| `campaign.updated` | Campaign updated |
| `campaign.started` | Campaign started |
| `campaign.completed` | Campaign completed |
| `campaign.cancelled` | Campaign cancelled |
| `application.received` | New application |
| `application.accepted` | Application accepted |
| `application.rejected` | Application rejected |
| `content.submitted` | Content submitted |
| `content.approved` | Content approved |
| `content.rejected` | Content rejected |
| `milestone.completed` | Milestone completed |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `user.deleted` | user-service | Clean up applications |
| `content.published` | content-service | Update campaign stats |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CAMPAIGN_NOT_FOUND` | 404 | Campaign not found |
| `BRIEF_NOT_FOUND` | 404 | Brief not found |
| `DELIVERABLE_NOT_FOUND` | 404 | Deliverable not found |
| `APPLICATION_NOT_FOUND` | 404 | Application not found |
| `MILESTONE_NOT_FOUND` | 404 | Milestone not found |
| `ALREADY_APPLIED` | 409 | Already applied to campaign |
| `CAMPAIGN_CLOSED` | 400 | Campaign not accepting applications |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid request data |

## Query Parameters

### List Campaigns
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | String | Filter by status |
| `type` | String | Filter by type |
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 20) |
| `search` | String | Search by name |
| `sortBy` | String | Sort field |
| `sortOrder` | String | asc or desc |
