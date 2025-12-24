# Payout Service

## Overview

The Payout Service manages creator payments, earnings tracking, and financial operations for the NEXUS UGC platform. It handles balance management, payout processing via multiple methods, tax documentation, and earnings reporting.

**Port:** 3013 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis

## Responsibilities

- Creator earnings tracking and balance management
- Payout request processing and status tracking
- Multiple payout method support (Stripe Connect, PayPal, bank transfer, Wise)
- Tax document management (W-9, W-8BEN, 1099)
- Earnings clearing and hold periods
- Automatic payout scheduling
- Fee calculation and deduction

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |

### Balance Routes (`/payouts`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/balance` | Get current balance | Required |
| GET | `/earnings` | Get earnings history | Required |
| GET | `/pending` | Get pending payouts | Required |

### Payout Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/history` | Get payout history | Required |
| POST | `/request` | Request a payout | Required |
| GET | `/:payoutId` | Get payout details | Required |
| POST | `/:payoutId/cancel` | Cancel payout request | Required |

### Account Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/accounts` | List payout accounts | Required |
| POST | `/accounts` | Add payout account | Required |
| PUT | `/accounts/:id` | Update account | Required |
| DELETE | `/accounts/:id` | Remove account | Required |
| POST | `/accounts/:id/verify` | Verify account | Required |
| POST | `/accounts/:id/default` | Set as default | Required |

### Tax Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tax/documents` | List tax documents | Required |
| POST | `/tax/documents` | Submit tax document | Required |
| GET | `/tax/documents/:id` | Get document details | Required |
| GET | `/tax/1099` | Get 1099 forms | Required |
| GET | `/tax/1099/:year/download` | Download 1099 | Required |

### Request/Response Examples

#### Get Balance
```json
GET /payouts/balance

Response:
{
  "success": true,
  "data": {
    "available": 1250.00,
    "pending": 350.00,
    "reserved": 0.00,
    "lifetimeEarnings": 15000.00,
    "lifetimePayouts": 13400.00,
    "currency": "USD",
    "minimumPayout": 100.00,
    "schedule": "BI_WEEKLY",
    "nextScheduledPayout": "2024-01-15T00:00:00Z"
  }
}
```

#### Request Payout
```json
POST /payouts/request
{
  "amount": 500.00,
  "currency": "USD"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": 500.00,
    "processingFee": 0.00,
    "netAmount": 500.00,
    "status": "PENDING",
    "method": "STRIPE_CONNECT",
    "estimatedArrival": "2024-01-18T00:00:00Z"
  }
}
```

#### Add Payout Account
```json
POST /payouts/accounts
{
  "method": "BANK_TRANSFER",
  "bankName": "Chase Bank",
  "accountType": "checking",
  "routingNumber": "021000021",
  "accountNumber": "123456789",
  "country": "US"
}
```

## Data Models

### CreatorBalance
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| creatorId | UUID | Creator reference |
| availableBalance | BigInt | Available for payout (cents) |
| pendingBalance | BigInt | Pending clearance (cents) |
| reservedBalance | BigInt | Reserved for disputes (cents) |
| lifetimeEarnings | BigInt | Total earnings (cents) |
| lifetimePayouts | BigInt | Total payouts (cents) |
| currency | String | Currency code |
| minimumPayout | BigInt | Minimum payout amount |
| schedule | Enum | MANUAL, WEEKLY, BI_WEEKLY, MONTHLY |
| holdPayouts | Boolean | Payouts on hold |
| taxVerified | Boolean | Tax documents verified |
| taxCountry | String | Tax residence country |
| lastPayoutAt | DateTime | Last payout timestamp |
| nextScheduledPayout | DateTime | Next scheduled payout |

### Earning
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| creatorId | UUID | Creator reference |
| balanceId | UUID | Balance reference |
| type | Enum | Earning type |
| contentId | UUID | Related content |
| campaignId | UUID | Related campaign |
| brandId | UUID | Paying brand |
| grossAmount | BigInt | Gross amount (cents) |
| platformFee | BigInt | Platform fee (cents) |
| processingFee | BigInt | Processing fee (cents) |
| taxWithholding | BigInt | Tax withheld (cents) |
| netAmount | BigInt | Net amount (cents) |
| feePercentage | Float | Platform fee % |
| status | Enum | Earning status |
| clearingDays | Int | Days until cleared |
| clearsAt | DateTime | Clearing date |
| payoutId | UUID | Associated payout |

### EarningType Enum
- `CONTENT_PAYMENT` - Content creation payment
- `BONUS` - Performance bonus
- `REFERRAL` - Referral bonus
- `ROYALTY` - Usage royalty
- `ADJUSTMENT` - Manual adjustment

### EarningStatus Enum
- `PENDING` - Not yet cleared
- `CLEARED` - Available for payout
- `PAID` - Included in payout
- `REFUNDED` - Refunded to brand
- `DISPUTED` - Under dispute

### Payout
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| creatorId | UUID | Creator reference |
| balanceId | UUID | Balance reference |
| accountId | UUID | Payout account |
| grossAmount | BigInt | Gross amount (cents) |
| processingFee | BigInt | Processing fee (cents) |
| netAmount | BigInt | Net amount (cents) |
| currency | String | Currency code |
| method | Enum | Payout method |
| status | Enum | Payout status |
| externalId | String | Provider transaction ID |
| transactionId | String | Internal transaction ID |
| destinationMask | String | Masked destination |
| requestedAt | DateTime | Request timestamp |
| processedAt | DateTime | Processing start |
| completedAt | DateTime | Completion timestamp |
| failedAt | DateTime | Failure timestamp |
| failureCode | String | Failure code |
| failureMessage | String | Failure message |
| estimatedArrival | DateTime | Estimated arrival |

### PayoutStatus Enum
- `PENDING` - Awaiting processing
- `PROCESSING` - Being processed
- `COMPLETED` - Successfully completed
- `FAILED` - Processing failed
- `CANCELLED` - Cancelled by user
- `REFUNDED` - Refunded

### PayoutMethod Enum
- `STRIPE_CONNECT` - Stripe Connect
- `PAYPAL` - PayPal
- `BANK_TRANSFER` - Bank transfer (ACH)
- `WISE` - Wise (TransferWise)
- `CHECK` - Paper check

### PayoutAccount
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| creatorId | UUID | Creator reference |
| method | Enum | Account method |
| status | Enum | Account status |
| isDefault | Boolean | Default account |
| stripeAccountId | String | Stripe account ID |
| paypalEmail | String | PayPal email |
| bankName | String | Bank name |
| bankCountry | String | Bank country |
| accountLastFour | String | Last 4 digits |
| routingLastFour | String | Routing last 4 |
| accountType | String | checking, savings |
| wiseRecipientId | String | Wise recipient ID |
| verifiedAt | DateTime | Verification date |
| dailyLimit | BigInt | Daily payout limit |
| monthlyLimit | BigInt | Monthly payout limit |

### PayoutAccountStatus Enum
- `PENDING_SETUP` - Setup incomplete
- `PENDING_VERIFICATION` - Awaiting verification
- `VERIFIED` - Verified and active
- `SUSPENDED` - Temporarily suspended
- `CLOSED` - Permanently closed

### TaxDocument
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| creatorId | UUID | Creator reference |
| type | Enum | Document type |
| status | Enum | Document status |
| taxYear | Int | Tax year |
| documentUrl | String | Encrypted document URL |
| tinLastFour | String | Last 4 of TIN/SSN |
| legalName | String | Legal name |
| businessName | String | Business name |
| signedAt | DateTime | Signature timestamp |
| expiresAt | DateTime | Expiration date |
| reviewedAt | DateTime | Review timestamp |
| rejectionReason | String | Rejection reason |

### TaxDocumentType Enum
- `W9` - US individuals/businesses
- `W8BEN` - Foreign individuals
- `W8BEN_E` - Foreign entities
- `FORM_1099` - Annual earnings statement
- `FORM_1042S` - Foreign person's income

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| user-service | Creator information |
| campaign-service | Campaign earnings |
| notification-service | Payout notifications |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | Data storage |
| Redis | Queue management |
| Stripe Connect | Payout processing |
| PayPal Payouts | PayPal payments |
| Wise API | International transfers |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3013 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | No | - | Redis connection |
| `STRIPE_SECRET_KEY` | Yes | - | Stripe secret key |
| `STRIPE_CONNECT_CLIENT_ID` | No | - | Stripe Connect client |
| `PAYPAL_CLIENT_ID` | No | - | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | No | - | PayPal secret |
| `PAYPAL_MODE` | No | sandbox | PayPal mode |
| `WISE_API_KEY` | No | - | Wise API key |
| `ENCRYPTION_KEY` | Yes | - | Sensitive data encryption |
| `DEFAULT_CLEARING_DAYS` | No | 7 | Default clearing period |
| `PLATFORM_FEE_PERCENTAGE` | No | 15 | Platform fee % |
| `MINIMUM_PAYOUT_AMOUNT` | No | 10000 | Min payout (cents) |

## Database Schema

### Tables

- `creator_balances` - Creator balance tracking
- `earnings` - Earning records
- `payouts` - Payout records
- `payout_events` - Payout status events
- `payout_accounts` - Payout destinations
- `tax_documents` - Tax documentation
- `form_1099s` - Generated 1099 forms
- `payout_webhook_events` - Provider webhooks
- `payout_settings` - Platform settings

### Indexes
- `creator_balances`: (creator_id)
- `earnings`: (creator_id), (balance_id), (campaign_id), (status)
- `payouts`: (creator_id), (status), (external_id)
- `payout_accounts`: (creator_id), (method), (status)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `payout.requested` | Payout requested |
| `payout.processing` | Payout processing |
| `payout.completed` | Payout successful |
| `payout.failed` | Payout failed |
| `earning.created` | New earning recorded |
| `earning.cleared` | Earning available |
| `tax.document.submitted` | Tax doc submitted |
| `tax.document.verified` | Tax doc verified |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `content.approved` | content-service | Create earning |
| `campaign.completed` | campaign-service | Finalize earnings |
| `user.deleted` | user-service | Handle creator deletion |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INSUFFICIENT_BALANCE` | 400 | Not enough available balance |
| `BELOW_MINIMUM` | 400 | Below minimum payout |
| `NO_PAYOUT_ACCOUNT` | 400 | No verified payout account |
| `TAX_NOT_VERIFIED` | 403 | Tax documents not verified |
| `PAYOUT_NOT_FOUND` | 404 | Payout not found |
| `ACCOUNT_NOT_VERIFIED` | 400 | Account not verified |
| `PAYOUT_ON_HOLD` | 403 | Payouts on hold |
| `ALREADY_CANCELLED` | 400 | Already cancelled |
| `CANNOT_CANCEL` | 400 | Cannot cancel (processing) |
| `TRANSFER_FAILED` | 500 | Provider transfer failed |

## Payout Flow

1. **Request** - Creator requests payout
2. **Validation** - Check balance, account, tax status
3. **Deduction** - Deduct from available balance
4. **Processing** - Submit to payment provider
5. **Confirmation** - Provider confirms transfer
6. **Completion** - Mark as completed, notify creator

## Tax Compliance

- US creators: W-9 required before first payout
- Non-US creators: W-8BEN or W-8BEN-E required
- 1099-NEC generated for US creators earning $600+
- Tax withholding applied based on treaty status
