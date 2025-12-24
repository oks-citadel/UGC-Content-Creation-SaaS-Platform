# Rights Service

## Overview

The Rights Service manages content licensing, usage rights, digital contracts, and signature workflows for the NEXUS UGC platform. It handles the complete rights lifecycle from draft agreements through execution and usage tracking.

**Port:** 3014 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Azure Blob Storage

## Responsibilities

- Content rights and licensing management
- License template creation and management
- Digital signature collection
- Rights transfer between parties
- Usage tracking and verification
- Rights expiration management
- Dispute tracking and resolution

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/version` | Service version |

### Rights Routes (`/api/v1/rights`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create rights agreement | Required |
| GET | `/:id` | Get rights details | Required |
| PUT | `/:id` | Update rights | Required |
| DELETE | `/:id` | Delete rights | Required |
| GET | `/content/:contentId` | Get content rights | Required |
| GET | `/creator/:creatorId` | Get creator rights | Required |
| GET | `/brand/:brandId` | Get brand rights | Required |
| POST | `/:id/sign` | Sign agreement | Required |
| POST | `/:id/activate` | Activate rights | Required |
| POST | `/:id/terminate` | Terminate rights | Required |
| POST | `/:id/transfer` | Transfer rights | Required |

### Template Routes (`/api/v1/templates`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List templates | Required |
| POST | `/` | Create template | Required |
| GET | `/:id` | Get template | Required |
| PUT | `/:id` | Update template | Required |
| DELETE | `/:id` | Delete template | Required |
| POST | `/:id/generate` | Generate document | Required |

### Usage Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/rights/:id/usage` | Get usage records | Required |
| POST | `/usage` | Record usage | Required |
| GET | `/verify/:contentId/:brandId/:usageType` | Verify usage rights | Required |

### Dispute Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/disputes` | List disputes | Required |
| POST | `/disputes` | Create dispute | Required |
| GET | `/disputes/:id` | Get dispute | Required |
| PUT | `/disputes/:id` | Update dispute | Required |
| POST | `/disputes/:id/resolve` | Resolve dispute | Admin |

### Request/Response Examples

#### Create Rights Agreement
```json
POST /api/v1/rights
{
  "contentId": "uuid",
  "creatorId": "uuid",
  "brandId": "uuid",
  "type": "EXCLUSIVE",
  "startDate": "2024-01-15",
  "endDate": "2025-01-15",
  "territories": ["US", "CA", "GB"],
  "platforms": ["instagram", "tiktok", "facebook"],
  "usageTypes": ["ORGANIC_SOCIAL", "PAID_SOCIAL"],
  "compensationType": "flat_fee",
  "flatFeeAmount": 1500.00,
  "templateId": "uuid"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "DRAFT",
    "documentUrl": "https://storage.example.com/...",
    "signatures": []
  }
}
```

#### Sign Agreement
```json
POST /api/v1/rights/uuid/sign
{
  "signerId": "uuid",
  "signerType": "creator",
  "signerName": "John Doe",
  "signerEmail": "john@example.com",
  "signatureType": "ELECTRONIC",
  "acceptedTerms": true
}
```

#### Verify Usage Rights
```json
GET /api/v1/verify/content-uuid/brand-uuid/PAID_SOCIAL

Response:
{
  "success": true,
  "data": {
    "hasRights": true,
    "rightsId": "uuid",
    "type": "EXCLUSIVE",
    "expiresAt": "2025-01-15T00:00:00Z",
    "restrictions": {
      "maxImpressions": 1000000,
      "currentImpressions": 250000
    }
  }
}
```

## Data Models

### ContentRights
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| contentId | UUID | Content reference |
| campaignId | UUID | Campaign reference |
| creatorId | UUID | Creator reference |
| brandId | UUID | Brand reference |
| type | Enum | Rights type |
| status | Enum | Rights status |
| startDate | DateTime | Rights start |
| endDate | DateTime | Rights end |
| isPerpetual | Boolean | No end date |
| autoRenew | Boolean | Auto-renewal |
| renewalTermDays | Int | Renewal period |
| territories | String[] | Geographic territories |
| excludedTerritories | String[] | Excluded territories |
| platforms | String[] | Allowed platforms |
| usageTypes | Enum[] | Allowed usage types |
| noEditing | Boolean | No editing allowed |
| noDerivatives | Boolean | No derivatives allowed |
| attributionRequired | Boolean | Attribution required |
| maxImpressions | BigInt | Impression limit |
| maxUsageCount | Int | Usage count limit |
| customRestrictions | Text | Custom restrictions |
| compensationType | String | flat_fee, royalty, hybrid |
| flatFeeAmount | Decimal | Flat fee amount |
| royaltyPercentage | Float | Royalty percentage |
| royaltyCap | Decimal | Royalty cap |
| templateId | UUID | Source template |
| documentUrl | String | Agreement document |
| signedDocumentUrl | String | Signed document |

### RightsType Enum
- `EXCLUSIVE` - Exclusive rights
- `NON_EXCLUSIVE` - Non-exclusive rights
- `LIMITED` - Limited rights
- `WORK_FOR_HIRE` - Work for hire

### RightsStatus Enum
- `DRAFT` - In draft
- `PENDING_CREATOR_SIGNATURE` - Awaiting creator signature
- `PENDING_BRAND_SIGNATURE` - Awaiting brand signature
- `ACTIVE` - Rights active
- `EXPIRED` - Rights expired
- `TERMINATED` - Rights terminated
- `DISPUTED` - Under dispute

### UsageType Enum
- `ORGANIC_SOCIAL` - Organic social media
- `PAID_SOCIAL` - Paid social ads
- `WEBSITE` - Website usage
- `EMAIL` - Email marketing
- `DISPLAY_ADS` - Display advertising
- `TV_COMMERCIAL` - Television
- `PRINT` - Print media
- `OOH` - Out of home
- `PODCAST` - Podcast
- `STREAMING` - Streaming platforms
- `ALL` - All usage types

### RightsSignature
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| rightsId | UUID | Rights reference |
| signerId | UUID | Signer reference |
| signerType | String | creator, brand, witness |
| signerName | String | Signer name |
| signerEmail | String | Signer email |
| signerTitle | String | Signer title |
| signatureType | Enum | ELECTRONIC, TYPED, DRAWN |
| signatureData | Text | Signature data |
| signatureHash | String | Signature hash |
| ipAddress | String | Signing IP |
| userAgent | Text | Browser info |
| geoLocation | JSON | Location data |
| acceptedTerms | Boolean | Terms accepted |
| signedAt | DateTime | Signature timestamp |

### LicenseTemplate
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Owner organization |
| name | String | Template name |
| description | Text | Description |
| type | Enum | Template type |
| version | String | Version number |
| defaultType | Enum | Default rights type |
| defaultDuration | Int | Default duration (days) |
| defaultPlatforms | String[] | Default platforms |
| defaultUsageTypes | Enum[] | Default usage types |
| defaultTerritories | String[] | Default territories |
| defaultRestrictions | JSON | Default restrictions |
| htmlTemplate | Text | HTML template |
| pdfTemplate | Text | PDF template |
| variables | String[] | Template variables |
| optionalClauses | JSON | Optional clauses |
| legalApproved | Boolean | Legal review status |
| isActive | Boolean | Active status |
| isDefault | Boolean | Default template |
| isPublic | Boolean | Public availability |

### LicenseTemplateType Enum
- `STANDARD_EXCLUSIVE` - Standard exclusive
- `STANDARD_NON_EXCLUSIVE` - Standard non-exclusive
- `LIMITED_SOCIAL` - Limited social media
- `PAID_ADVERTISING` - Paid advertising rights
- `FULL_BUYOUT` - Full buyout
- `CUSTOM` - Custom template

### RightsTransfer
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| rightsId | UUID | Rights reference |
| fromBrandId | UUID | Transferring brand |
| toBrandId | UUID | Receiving brand |
| toBrandName | String | Receiving brand name |
| transferType | String | full, sublicense |
| status | Enum | Transfer status |
| effectiveDate | DateTime | Effective date |
| transferFee | Decimal | Transfer fee |
| creatorConsent | Boolean | Creator approved |
| approvedBy | UUID | Approver |
| approvedAt | DateTime | Approval timestamp |

### TransferStatus Enum
- `PENDING_APPROVAL` - Awaiting approval
- `APPROVED` - Transfer approved
- `REJECTED` - Transfer rejected
- `COMPLETED` - Transfer complete

### UsageTracking
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| rightsId | UUID | Rights reference |
| usageType | Enum | Usage type |
| platform | String | Platform used |
| territory | String | Territory used |
| impressions | BigInt | Impressions |
| clicks | BigInt | Clicks |
| conversions | BigInt | Conversions |
| usageDate | DateTime | Usage date |
| reportedBy | UUID | Reporter |
| verifiedBy | UUID | Verifier |
| verifiedAt | DateTime | Verification timestamp |

### RightsDispute
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| rightsId | UUID | Rights reference |
| raisedBy | UUID | Dispute raiser |
| raisedByType | String | creator, brand |
| category | String | Dispute category |
| description | Text | Dispute description |
| status | String | open, investigating, resolved, escalated |
| priority | String | low, medium, high, urgent |
| assignedTo | UUID | Assigned handler |
| resolution | Text | Resolution description |
| resolvedBy | UUID | Resolver |
| resolvedAt | DateTime | Resolution timestamp |
| evidenceUrls | String[] | Evidence files |

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| user-service | User information |
| content-service | Content metadata |
| notification-service | Signature notifications |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | Data storage |
| Azure Blob Storage | Document storage |
| Redis | Caching |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3014 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | No | - | Redis connection |
| `AZURE_STORAGE_CONNECTION_STRING` | No | - | Document storage |
| `AZURE_STORAGE_CONTAINER` | No | rights-documents | Storage container |
| `CORS_ORIGINS` | No | - | Allowed origins |

## Database Schema

### Tables

- `content_rights` - Rights agreements
- `rights_signatures` - Digital signatures
- `rights_history` - Status change history
- `rights_transfers` - Transfer records
- `license_templates` - Agreement templates
- `generated_documents` - Generated PDFs
- `usage_tracking` - Usage records
- `rights_disputes` - Dispute tracking

### Indexes
- `content_rights`: (content_id), (creator_id), (brand_id), (status)
- `rights_signatures`: (rights_id), (signer_id)
- `license_templates`: (organization_id), (type), (is_active)
- `usage_tracking`: (rights_id), (usage_date)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `rights.created` | Rights agreement created |
| `rights.signed` | Agreement signed |
| `rights.activated` | Rights activated |
| `rights.expired` | Rights expired |
| `rights.terminated` | Rights terminated |
| `rights.transferred` | Rights transferred |
| `dispute.created` | Dispute created |
| `dispute.resolved` | Dispute resolved |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `content.created` | content-service | Enable rights creation |
| `campaign.completed` | campaign-service | Update rights status |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RIGHTS_NOT_FOUND` | 404 | Rights agreement not found |
| `TEMPLATE_NOT_FOUND` | 404 | Template not found |
| `ALREADY_SIGNED` | 400 | Already signed by this party |
| `NOT_AUTHORIZED` | 403 | Not authorized to sign |
| `RIGHTS_EXPIRED` | 403 | Rights have expired |
| `USAGE_EXCEEDED` | 403 | Usage limit exceeded |
| `TERRITORY_NOT_ALLOWED` | 403 | Territory not in agreement |
| `PLATFORM_NOT_ALLOWED` | 403 | Platform not in agreement |
| `TRANSFER_NOT_ALLOWED` | 403 | Transfer not permitted |
| `DISPUTE_EXISTS` | 409 | Active dispute exists |

## Template Variables

License templates support dynamic variables:

- `{{creator_name}}` - Creator's legal name
- `{{brand_name}}` - Brand's legal name
- `{{content_title}}` - Content title
- `{{start_date}}` - Rights start date
- `{{end_date}}` - Rights end date
- `{{territories}}` - Territory list
- `{{platforms}}` - Platform list
- `{{compensation}}` - Compensation details
- `{{restrictions}}` - Usage restrictions
