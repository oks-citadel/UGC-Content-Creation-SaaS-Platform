# Compliance Service

## Overview

The Compliance Service ensures regulatory compliance and legal requirements for the NEXUS UGC platform. It handles GDPR data requests, consent management, content rights tracking, disclosure requirements, and comprehensive audit logging.

**Port:** 3012 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis

## Responsibilities

- User consent collection and management
- GDPR data export and deletion requests
- Content rights and licensing tracking
- Advertising disclosure compliance (FTC, ASA)
- Audit logging for security and compliance
- Right to be forgotten implementation
- Data retention policy enforcement

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |

### Consent Routes (`/compliance/consent`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/grant` | Grant consent | Required |
| POST | `/revoke` | Revoke consent | Required |
| GET | `/check/:userId/:type` | Check consent status | Required |
| GET | `/user/:userId` | Get all user consents | Required |

### GDPR Routes (`/compliance/gdpr`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/export` | Request data export | Required |
| POST | `/delete` | Request data deletion | Required |
| POST | `/delete/:requestId/process` | Process deletion request | Admin |
| GET | `/requests/:userId` | Get user's GDPR requests | Required |

### Content Rights Routes (`/compliance/rights`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create content rights | Required |
| GET | `/content/:contentId` | Get content rights | Required |
| POST | `/:rightsId/transfer` | Transfer rights | Required |
| POST | `/:rightsId/revoke` | Revoke rights | Required |
| GET | `/verify/:contentId/:brandId/:usageType` | Verify usage rights | Required |

### Disclosure Routes (`/compliance/disclosure`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create disclosure | Required |
| POST | `/:disclosureId/review` | Review disclosure | Required |
| GET | `/content/:contentId` | Get content disclosures | Required |
| GET | `/non-compliant` | List non-compliant disclosures | Required |
| POST | `/check-compliance` | Check disclosure compliance | Required |
| POST | `/generate` | Generate disclosure text | Required |

### Audit Routes (`/compliance/audit`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create audit log entry | Internal |
| GET | `/:userId` | Get user audit logs | Required |

### Request/Response Examples

#### Grant Consent
```json
POST /compliance/consent/grant
{
  "userId": "uuid",
  "type": "MARKETING",
  "purpose": "Receive promotional emails and updates",
  "version": "1.0",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "MARKETING",
    "granted": true,
    "grantedAt": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

#### Request Data Export
```json
POST /compliance/gdpr/export
{
  "userId": "uuid"
}

Response:
{
  "success": true,
  "data": {
    "requestId": "uuid",
    "message": "Data export requested"
  }
}
```

#### Create Disclosure
```json
POST /compliance/disclosure
{
  "contentId": "uuid",
  "userId": "uuid",
  "type": "SPONSORED_CONTENT",
  "platform": "instagram",
  "text": "#ad #sponsored"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "isCompliant": true,
    "text": "#ad #sponsored"
  }
}
```

## Data Models

### Consent
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | User reference |
| type | Enum | Consent type |
| purpose | String | Consent purpose description |
| version | String | Terms version |
| granted | Boolean | Consent status |
| grantedAt | DateTime | Grant timestamp |
| revokedAt | DateTime | Revocation timestamp |
| ipAddress | String | Client IP |
| userAgent | String | Browser info |
| metadata | JSON | Additional data |

### ConsentType Enum
- `MARKETING` - Marketing communications
- `ANALYTICS` - Analytics tracking
- `THIRD_PARTY` - Third-party data sharing
- `DATA_PROCESSING` - General data processing
- `COOKIES` - Cookie consent
- `TERMS_OF_SERVICE` - ToS acceptance
- `PRIVACY_POLICY` - Privacy policy acceptance
- `CONTENT_USAGE` - Content usage rights

### DataRequest
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Requesting user |
| type | Enum | EXPORT, DELETE, RECTIFY, RESTRICT, PORTABILITY |
| status | Enum | PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED |
| requestedAt | DateTime | Request timestamp |
| processedAt | DateTime | Processing start |
| completedAt | DateTime | Completion timestamp |
| expiresAt | DateTime | Download link expiry |
| downloadUrl | String | Export download URL |
| notes | String | Admin notes |

### ContentRights
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| contentId | UUID | Content reference |
| creatorId | UUID | Creator reference |
| brandId | UUID | Brand reference |
| licenseType | Enum | EXCLUSIVE, NON_EXCLUSIVE, ROYALTY_FREE, RIGHTS_MANAGED, CREATIVE_COMMONS, CUSTOM |
| usageRights | String[] | Allowed usage types |
| territory | String[] | Geographic territories |
| duration | String | License duration |
| exclusivity | Boolean | Exclusive rights |
| canModify | Boolean | Modification allowed |
| canResell | Boolean | Resale allowed |
| attribution | String | Required attribution |
| restrictions | JSON | Additional restrictions |
| startsAt | DateTime | Rights start date |
| endsAt | DateTime | Rights end date |
| documentUrl | String | Signed agreement URL |

### Disclosure
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| contentId | UUID | Content reference |
| userId | UUID | Creator reference |
| type | Enum | Disclosure type |
| platform | String | Social platform |
| text | String | Disclosure text |
| isCompliant | Boolean | Compliance status |
| reviewedAt | DateTime | Review timestamp |
| reviewedBy | UUID | Reviewer |
| notes | String | Review notes |

### DisclosureType Enum
- `SPONSORED_CONTENT` - Sponsored/paid content
- `PAID_PARTNERSHIP` - Paid partnership
- `GIFTED_PRODUCT` - Gifted/free product
- `AFFILIATE_LINK` - Affiliate links
- `BRAND_AMBASSADOR` - Brand ambassador
- `EMPLOYEE` - Employee relationship
- `OTHER` - Other disclosure types

### AuditLog
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Acting user |
| action | String | Action performed |
| resource | String | Resource type |
| resourceId | String | Resource ID |
| changes | JSON | Before/after values |
| ipAddress | String | Client IP |
| userAgent | String | Browser info |
| metadata | JSON | Additional context |
| createdAt | DateTime | Event timestamp |

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| user-service | User data for exports |
| content-service | Content data for exports |
| notification-service | Request status notifications |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | Data storage |
| Redis | Caching, rate limiting |
| Azure Blob Storage | Export file storage |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3012 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | No | - | Redis connection |
| `AZURE_STORAGE_CONNECTION_STRING` | No | - | Export file storage |
| `EXPORT_EXPIRY_DAYS` | No | 7 | Export download expiry |
| `USER_SERVICE_URL` | No | - | User service URL |
| `CONTENT_SERVICE_URL` | No | - | Content service URL |

## Database Schema

### Tables

- `consents` - User consent records
- `data_requests` - GDPR request tracking
- `content_rights` - Content licensing
- `disclosures` - Advertising disclosures
- `audit_logs` - System audit trail

### Indexes
- `consents`: (user_id), (type)
- `data_requests`: (user_id), (type), (status)
- `content_rights`: (content_id), (creator_id), (brand_id)
- `disclosures`: (content_id), (user_id), (type)
- `audit_logs`: (user_id), (resource), (created_at)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `compliance.consent.granted` | Consent granted |
| `compliance.consent.revoked` | Consent revoked |
| `compliance.gdpr.export.requested` | Export requested |
| `compliance.gdpr.export.completed` | Export ready |
| `compliance.gdpr.deletion.requested` | Deletion requested |
| `compliance.gdpr.deletion.completed` | Deletion complete |
| `compliance.disclosure.flagged` | Non-compliant disclosure |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `content.published` | content-service | Check disclosure compliance |
| `user.deleted` | user-service | Process data deletion |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CONSENT_NOT_FOUND` | 404 | Consent record not found |
| `INVALID_CONSENT_TYPE` | 400 | Invalid consent type |
| `REQUEST_ALREADY_PENDING` | 409 | GDPR request already exists |
| `REQUEST_NOT_FOUND` | 404 | GDPR request not found |
| `EXPORT_EXPIRED` | 410 | Export download expired |
| `RIGHTS_NOT_FOUND` | 404 | Content rights not found |
| `RIGHTS_EXPIRED` | 403 | Content rights expired |
| `USAGE_NOT_PERMITTED` | 403 | Usage type not allowed |
| `NON_COMPLIANT_DISCLOSURE` | 400 | Disclosure doesn't meet requirements |

## Disclosure Compliance Rules

### Platform-Specific Requirements

**Instagram/TikTok:**
- Must include #ad, #sponsored, or #paid
- Must be visible without expanding caption

**YouTube:**
- Must use built-in paid promotion checkbox
- Verbal disclosure in first 30 seconds

**Twitter/X:**
- Must include #ad or #sponsored
- Cannot be buried in hashtag list

**Facebook:**
- Must use Branded Content tag
- Clear disclosure in post text

## GDPR Compliance Features

- **Right to Access:** Data export in machine-readable format
- **Right to Erasure:** Complete data deletion
- **Right to Rectification:** Data correction requests
- **Right to Restrict:** Processing limitation
- **Right to Portability:** Data transfer support
- **Consent Records:** Full audit trail of consents
