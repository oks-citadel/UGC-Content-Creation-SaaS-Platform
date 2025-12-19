# Marketplace Service API Documentation

## Base URL
```
http://localhost:3006/api/marketplace
```

## Authentication
All endpoints (except public ones) require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Opportunities

### Create Opportunity
Create a new creator opportunity.

**Endpoint:** `POST /opportunities`

**Auth:** Brand required

**Request Body:**
```json
{
  "campaignId": "campaign_123",
  "brandId": "brand_456",
  "title": "Instagram Reels for Product Launch",
  "description": "Looking for 5 creators to create engaging reels...",
  "requirements": [
    { "type": "followers", "min": 10000 },
    { "type": "engagement", "min": 3.5 },
    { "type": "niche", "values": ["fashion", "lifestyle"] }
  ],
  "budget": 500,
  "currency": "USD",
  "deadline": "2024-12-31T23:59:59Z",
  "targetNiche": ["fashion", "lifestyle"],
  "minFollowers": 10000,
  "maxFollowers": 100000,
  "locations": ["US", "CA", "GB"],
  "deliverables": [
    { "type": "reel", "count": 3, "duration": "15-30s" },
    { "type": "story", "count": 5 }
  ],
  "slots": 5
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "opp_789",
    "campaignId": "campaign_123",
    "brandId": "brand_456",
    "title": "Instagram Reels for Product Launch",
    "status": "OPEN",
    "budget": 500,
    "currency": "USD",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### List Opportunities
Get a paginated list of opportunities with filters.

**Endpoint:** `GET /opportunities`

**Auth:** Optional

**Query Parameters:**
- `status` - Filter by status (DRAFT, OPEN, IN_PROGRESS, FILLED, CLOSED, CANCELLED)
- `brandId` - Filter by brand
- `campaignId` - Filter by campaign
- `minBudget` - Minimum budget filter
- `maxBudget` - Maximum budget filter
- `niche` - Filter by niche
- `location` - Filter by location
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Example:** `GET /opportunities?status=OPEN&niche=fashion&page=1&limit=20`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "opportunities": [...],
    "total": 45,
    "page": 1,
    "totalPages": 3
  }
}
```

---

### Get Opportunity Matches (AI)
Get AI-powered opportunity matches for a creator.

**Endpoint:** `GET /opportunities/matches/:creatorId`

**Auth:** Creator required

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "opp_123",
      "title": "Fashion Content Creator Needed",
      "matchScore": 0.95,
      "reasons": [
        "Niche alignment: fashion, lifestyle",
        "Follower count matches requirement",
        "Strong engagement rate"
      ]
    }
  ]
}
```

---

## Bids

### Submit Bid
Submit a bid for an opportunity.

**Endpoint:** `POST /bids`

**Auth:** Creator required

**Request Body:**
```json
{
  "opportunityId": "opp_123",
  "creatorId": "creator_456",
  "proposedRate": 450,
  "currency": "USD",
  "pitch": "I'm excited about this opportunity because... [at least 50 characters]",
  "portfolioItems": [
    { "type": "instagram_reel", "url": "https://instagram.com/p/xyz" },
    { "type": "youtube_video", "url": "https://youtube.com/watch?v=abc" }
  ],
  "estimatedDays": 7,
  "additionalNotes": "I can start immediately and deliver within a week"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "bid_789",
    "opportunityId": "opp_123",
    "creatorId": "creator_456",
    "proposedRate": 450,
    "status": "PENDING",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Accept Bid
Accept a creator's bid.

**Endpoint:** `POST /bids/:id/accept`

**Auth:** Brand required

**Request Body:**
```json
{
  "brandId": "brand_123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "bid_789",
    "status": "ACCEPTED",
    "respondedAt": "2024-01-15T12:00:00Z"
  }
}
```

---

### Negotiate Bid
Submit a counter offer for a bid.

**Endpoint:** `POST /bids/:id/negotiate`

**Auth:** Brand or Creator

**Request Body:**
```json
{
  "counterOffer": 475,
  "counterOfferedBy": "brand_123"
}
```

**Response:** `200 OK`

---

## Contracts

### Generate Contract
Generate a contract from accepted bid.

**Endpoint:** `POST /contracts`

**Auth:** Brand required

**Request Body:**
```json
{
  "opportunityId": "opp_123",
  "creatorId": "creator_456",
  "brandId": "brand_789",
  "terms": {
    "scope": "Creation of 3 Instagram Reels and 5 Stories",
    "exclusivity": false,
    "usageRights": ["social_media", "website", "ads"],
    "revisions": 2,
    "contentOwnership": "Brand retains full rights",
    "confidentiality": true
  },
  "paymentTerms": {
    "schedule": "milestone",
    "milestones": [
      {
        "description": "First reel delivery",
        "amount": 150,
        "dueDate": "2024-01-20T00:00:00Z"
      },
      {
        "description": "Final deliverables",
        "amount": 300,
        "dueDate": "2024-01-27T00:00:00Z"
      }
    ],
    "paymentMethod": "stripe_connect"
  },
  "totalAmount": 450,
  "currency": "USD",
  "deliverables": [
    { "type": "reel", "count": 3, "specs": "15-30s vertical video" },
    { "type": "story", "count": 5 }
  ],
  "startDate": "2024-01-15T00:00:00Z",
  "endDate": "2024-01-30T00:00:00Z"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "contract_abc",
    "contractNumber": "CNT-2024-XYZ123",
    "status": "DRAFT",
    "totalAmount": 450,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Send Contract for Signature
Send contract to DocuSign for e-signatures.

**Endpoint:** `POST /contracts/:id/send-for-signature`

**Auth:** Brand required

**Request Body:**
```json
{
  "senderId": "brand_123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "contract_abc",
    "status": "PENDING_SIGNATURES",
    "docusignEnvelopeId": "envelope_123"
  }
}
```

---

### Sign Contract
Sign a contract electronically.

**Endpoint:** `POST /contracts/:id/sign`

**Auth:** Brand or Creator

**Request Body:**
```json
{
  "signerId": "creator_456",
  "role": "creator"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "contract_abc",
    "creatorSigned": true,
    "brandSigned": false,
    "status": "PENDING_SIGNATURES"
  }
}
```

---

## Payouts

### Request Payout
Request a payout for completed work.

**Endpoint:** `POST /payouts`

**Auth:** Creator required

**Request Body:**
```json
{
  "creatorId": "creator_456",
  "amount": 450,
  "currency": "USD",
  "contractId": "contract_abc",
  "method": "STRIPE_CONNECT",
  "description": "Payment for Instagram Reels campaign"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "payout_xyz",
    "amount": 450,
    "platformFee": 11.25,
    "processingFee": 0.30,
    "netAmount": 438.45,
    "status": "PENDING",
    "requestedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Get Payout History
Get creator's payout history.

**Endpoint:** `GET /payouts/:creatorId`

**Auth:** Creator required

**Query Parameters:**
- `status` - Filter by status
- `startDate` - Filter by date range
- `endDate` - Filter by date range
- `page` - Page number
- `limit` - Items per page

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "payouts": [...],
    "total": 15,
    "totalAmount": 6750.50,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### Add Payout Method
Add a new payout method for creator.

**Endpoint:** `POST /payout-methods`

**Auth:** Creator required

**Request Body (Stripe Connect):**
```json
{
  "creatorId": "creator_456",
  "type": "STRIPE_CONNECT",
  "details": {
    "country": "US",
    "email": "creator@example.com"
  },
  "isDefault": true
}
```

**Request Body (Bank Transfer):**
```json
{
  "creatorId": "creator_456",
  "type": "BANK_TRANSFER",
  "details": {
    "accountHolderName": "John Doe",
    "accountNumber": "1234567890",
    "routingNumber": "110000000",
    "bankName": "Chase Bank",
    "accountType": "checking"
  },
  "isDefault": false
}
```

**Response:** `201 Created`

---

## Disputes

### Raise Dispute
Raise a dispute for a contract.

**Endpoint:** `POST /disputes`

**Auth:** Brand or Creator

**Request Body:**
```json
{
  "contractId": "contract_abc",
  "raisedBy": "creator_456",
  "raisedByRole": "CREATOR",
  "reason": "Deliverables not accepted",
  "description": "I submitted all deliverables as per contract but brand is not accepting them without clear feedback...",
  "evidence": [
    { "type": "screenshot", "url": "https://s3.../evidence1.png" },
    { "type": "email", "url": "https://s3.../email.pdf" }
  ],
  "priority": "MEDIUM"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "dispute_123",
    "contractId": "contract_abc",
    "status": "OPEN",
    "priority": "MEDIUM",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Respond to Dispute
Add a response/message to a dispute.

**Endpoint:** `POST /disputes/:id/respond`

**Auth:** Brand, Creator, or Admin

**Request Body:**
```json
{
  "message": "I have reviewed the deliverables and here is my feedback...",
  "senderId": "brand_123",
  "senderRole": "BRAND",
  "attachments": [
    { "type": "feedback_doc", "url": "https://s3.../feedback.pdf" }
  ]
}
```

**Response:** `201 Created`

---

### Resolve Dispute
Resolve a dispute (Admin only).

**Endpoint:** `POST /disputes/:id/resolve`

**Auth:** Admin required

**Request Body:**
```json
{
  "resolvedBy": "admin_789",
  "resolution": "After reviewing evidence from both parties, the decision is that the creator will revise deliverables according to feedback provided. Payment will be released upon acceptance of revised work."
}
```

**Response:** `200 OK`

---

## Ambassador Programs

### Create Ambassador Program
Create a new brand ambassador program.

**Endpoint:** `POST /ambassador-programs`

**Auth:** Brand required

**Request Body:**
```json
{
  "brandId": "brand_123",
  "name": "Elite Creator Network",
  "description": "Exclusive program for top-performing creators",
  "tiers": [
    {
      "name": "bronze",
      "minCampaigns": 1,
      "commissionRate": 5,
      "benefits": ["Early access to campaigns"]
    },
    {
      "name": "silver",
      "minCampaigns": 5,
      "commissionRate": 7.5,
      "benefits": ["Early access", "Priority support", "Quarterly bonus"]
    },
    {
      "name": "gold",
      "minCampaigns": 10,
      "commissionRate": 10,
      "benefits": ["All silver benefits", "Exclusive campaigns", "Annual retreat"]
    }
  ],
  "benefits": {
    "baseCommission": 5,
    "exclusiveCampaigns": true,
    "prioritySupport": true
  },
  "requirements": {
    "minEngagementRate": 3.5,
    "minFollowers": 10000,
    "contentQualityScore": 4.5
  },
  "commissionRate": 5,
  "paymentSchedule": "monthly",
  "isPublic": false,
  "maxAmbassadors": 50
}
```

**Response:** `201 Created`

---

### Invite Ambassador
Invite a creator to join ambassador program.

**Endpoint:** `POST /ambassador-programs/:id/invite`

**Auth:** Brand required

**Request Body:**
```json
{
  "creatorId": "creator_456",
  "tier": "bronze"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "ambassador_789",
    "programId": "program_123",
    "creatorId": "creator_456",
    "tier": "bronze",
    "status": "INVITED",
    "invitedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Accept Ambassador Invitation
Accept an invitation to join ambassador program.

**Endpoint:** `POST /ambassadors/:id/accept`

**Auth:** Creator required

**Request Body:**
```json
{
  "creatorId": "creator_456"
}
```

**Response:** `200 OK`

---

### Track Ambassador Performance
Update ambassador performance metrics.

**Endpoint:** `POST /ambassadors/:id/track-performance`

**Auth:** System/Brand

**Request Body:**
```json
{
  "metrics": {
    "campaignsCompleted": 12,
    "totalEarnings": 6000,
    "avgRating": 4.8,
    "onTimeDelivery": 0.95,
    "clientSatisfaction": 4.9
  }
}
```

**Response:** `200 OK`

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "body.proposedRate",
      "message": "Expected number, received string"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "error": "Opportunity not found",
  "statusCode": 404
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

---

## Rate Limiting

All endpoints are rate-limited to 100 requests per 15 minutes per IP address.

When rate limit is exceeded:
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 900
}
```

---

## Webhooks

The service can send webhooks for various events to configured endpoints.

### Webhook Events

- `bid.submitted` - New bid submitted
- `bid.accepted` - Bid accepted
- `bid.rejected` - Bid rejected
- `contract.signed` - Contract fully signed
- `contract.completed` - Contract completed
- `payout.completed` - Payout successfully processed
- `payout.failed` - Payout failed
- `dispute.raised` - New dispute raised
- `dispute.resolved` - Dispute resolved

### Webhook Payload Example
```json
{
  "event": "bid.accepted",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "bidId": "bid_789",
    "opportunityId": "opp_123",
    "creatorId": "creator_456",
    "brandId": "brand_123"
  }
}
```
