# Creator Service API Documentation

Base URL: `http://localhost:3003/api`

## Authentication

Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Creator Profile Endpoints

### Create Creator Profile
**POST** `/creators`

Creates a new creator profile.

**Request Body:**
```json
{
  "userId": "user-123",
  "email": "creator@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "JohnDoe",
  "bio": "Fashion and lifestyle creator",
  "avatar": "https://example.com/avatar.jpg",
  "location": "Los Angeles, CA",
  "country": "US",
  "primaryNiche": "fashion",
  "secondaryNiches": ["beauty", "lifestyle"],
  "instagramHandle": "johndoe",
  "tiktokHandle": "johndoe",
  "languages": ["en", "es"],
  "contentTypes": ["photo", "video", "reel"]
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "creator": { ... }
  }
}
```

---

### Get Creator Profile
**GET** `/creators/:id`

Get creator profile by ID.

**Query Parameters:**
- `include` - Include related data (values: `all`, `true`)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "creator": {
      "id": "creator-123",
      "email": "creator@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "JohnDoe",
      "bio": "Fashion and lifestyle creator",
      "verificationStatus": "VERIFIED",
      "reputationScore": 4.5,
      "metrics": { ... },
      "earnings": { ... }
    }
  }
}
```

---

### Update Creator Profile
**PUT** `/creators/:id`

Update creator profile (requires authentication and ownership).

**Request Body:**
```json
{
  "bio": "Updated bio",
  "avatar": "https://example.com/new-avatar.jpg",
  "primaryNiche": "beauty",
  "minCampaignBudget": 500
}
```

**Response:** `200 OK`

---

### Delete Creator Profile
**DELETE** `/creators/:id`

Delete creator profile (requires authentication and ownership).

**Response:** `204 No Content`

---

### List Creators
**GET** `/creators`

List all creators with filtering and pagination.

**Query Parameters:**
- `status` - Filter by status (ACTIVE, INACTIVE, SUSPENDED, BANNED)
- `verificationStatus` - Filter by verification (VERIFIED, PENDING, UNVERIFIED)
- `primaryNiche` - Filter by niche
- `country` - Filter by country code
- `minReputationScore` - Minimum reputation score (0-5)
- `search` - Search by name or email
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### Get Creator by User ID
**GET** `/creators/user/:userId`

Get creator profile by user ID (requires authentication).

**Response:** `200 OK`

---

## Portfolio Endpoints

### Get Portfolio
**GET** `/creators/:id/portfolio`

Get creator's portfolio items.

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "portfolio": [
      {
        "id": "portfolio-123",
        "title": "Fashion Campaign 2024",
        "description": "Spring collection showcase",
        "mediaType": "VIDEO",
        "mediaUrl": "https://example.com/video.mp4",
        "thumbnailUrl": "https://example.com/thumb.jpg",
        "platform": "INSTAGRAM",
        "views": 50000,
        "likes": 5000,
        "isFeatured": true
      }
    ]
  }
}
```

---

### Add Portfolio Item
**POST** `/creators/:id/portfolio`

Add new portfolio item (requires authentication and ownership).

**Request Body:**
```json
{
  "title": "Fashion Campaign 2024",
  "description": "Spring collection showcase",
  "mediaType": "VIDEO",
  "mediaUrl": "https://example.com/video.mp4",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "platform": "INSTAGRAM",
  "tags": ["fashion", "spring", "campaign"],
  "niche": "fashion",
  "isFeatured": true
}
```

**Response:** `201 Created`

---

### Update Portfolio Item
**PUT** `/creators/:id/portfolio/:itemId`

Update portfolio item (requires authentication and ownership).

**Response:** `200 OK`

---

### Delete Portfolio Item
**DELETE** `/creators/:id/portfolio/:itemId`

Delete portfolio item (requires authentication and ownership).

**Response:** `204 No Content`

---

## Metrics Endpoints

### Get Creator Metrics
**GET** `/creators/:id/metrics`

Get creator performance metrics.

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "metrics": {
      "totalFollowers": 50000,
      "instagramFollowers": 30000,
      "tiktokFollowers": 20000,
      "avgEngagementRate": 0.05,
      "avgLikesPerPost": 2500,
      "completedCampaigns": 25,
      "successRate": 96.5,
      "responseRate": 98.0,
      "audienceAge": { "18-24": 0.3, "25-34": 0.5 },
      "audienceGender": { "male": 0.4, "female": 0.6 },
      "audienceLocation": { "US": 0.6, "UK": 0.2 }
    }
  }
}
```

---

### Update Creator Metrics
**PUT** `/creators/:id/metrics`

Update creator metrics (admin or system only).

**Request Body:**
```json
{
  "totalFollowers": 55000,
  "avgEngagementRate": 0.055,
  "completedCampaigns": 26,
  "successRate": 96.8
}
```

**Response:** `200 OK`

---

## Earnings Endpoints

### Get Creator Earnings
**GET** `/creators/:id/earnings`

Get creator earnings (requires authentication and ownership).

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "earnings": {
      "totalEarned": 10000.00,
      "availableBalance": 2500.00,
      "pendingBalance": 1500.00,
      "withdrawnBalance": 6000.00,
      "lifetimeEarnings": 10000.00,
      "minPayoutAmount": 50.00
    }
  }
}
```

---

### Request Payout
**POST** `/creators/:id/payout`

Request a payout (requires authentication and ownership).

**Request Body:**
```json
{
  "amount": 500.00
}
```

**Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "payout": {
      "id": "payout-123",
      "amount": 500.00,
      "processingFee": 2.50,
      "netAmount": 497.50,
      "status": "PENDING",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

---

### Get Payout History
**GET** `/creators/:id/payouts`

Get payout history (requires authentication and ownership).

**Response:** `200 OK`

---

## Verification Endpoints

### Get Verification Status
**GET** `/creators/:id/verification`

Get verification status (requires authentication and ownership).

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "verification": {
      "identityStatus": "VERIFIED",
      "instagramVerified": true,
      "tiktokVerified": true,
      "youtubeVerified": false,
      "addressVerified": true
    }
  }
}
```

---

### Verify Creator
**POST** `/creators/:id/verify`

Verify creator (admin only).

**Response:** `200 OK`

---

### Update Verification Details
**PUT** `/creators/:id/verification`

Update verification details (requires authentication and ownership).

**Request Body:**
```json
{
  "idDocumentType": "passport",
  "addressLine1": "123 Main St",
  "city": "Los Angeles",
  "state": "CA",
  "postalCode": "90001",
  "country": "US"
}
```

**Response:** `200 OK`

---

## Review Endpoints

### Get Creator Reviews
**GET** `/creators/:id/reviews`

Get creator reviews.

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "reviews": [
      {
        "id": "review-123",
        "rating": 4.5,
        "title": "Great to work with!",
        "comment": "Professional and delivered on time",
        "qualityRating": 5.0,
        "communicationRating": 4.5,
        "timelinessRating": 4.5,
        "createdAt": "2024-01-10T10:00:00Z"
      }
    ]
  }
}
```

---

### Respond to Review
**POST** `/creators/:id/reviews/:reviewId/respond`

Respond to a review (requires authentication and ownership).

**Request Body:**
```json
{
  "response": "Thank you for the feedback!"
}
```

**Response:** `200 OK`

---

### Recalculate Reputation Score
**POST** `/creators/:id/calculate-reputation`

Recalculate reputation score (admin or system only).

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "reputationScore": 4.5
  }
}
```

---

## Matching Endpoints

### Find Matching Creators
**GET** `/creators/match`

Find creators matching specific criteria (requires authentication).

**Query Parameters:**
- `niche` - Primary niche to match
- `niches` - Additional niches (comma-separated)
- `minFollowers` - Minimum follower count
- `maxFollowers` - Maximum follower count
- `minEngagementRate` - Minimum engagement rate (0-1)
- `location` - Location filter
- `country` - Country code
- `platforms` - Required platforms (comma-separated)
- `minReputationScore` - Minimum reputation (0-5)
- `budget` - Campaign budget
- `languages` - Required languages (comma-separated)
- `limit` - Max results (default: 20)

**Example:**
```
GET /creators/match?niche=fashion&minFollowers=10000&platforms=INSTAGRAM,TIKTOK&budget=1000
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "creators": [ ... ]
  },
  "count": 15
}
```

---

### Get Recommended Creators
**GET** `/creators/recommend`

Get recommended creators with compatibility scores (requires authentication).

**Query Parameters:** (same as match endpoint, plus:)
- `minScore` - Minimum compatibility score (0-100, default: 50)
- `includeScores` - Include score breakdown (true/false)

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "recommendations": [
      {
        "creator": { ... },
        "score": 87.5,
        "breakdown": {
          "nicheMatch": 30,
          "followerMatch": 22,
          "engagementMatch": 20,
          "reputationMatch": 12.5,
          "locationMatch": 3,
          "budgetMatch": 0
        }
      }
    ]
  },
  "count": 10
}
```

---

### Find Similar Creators
**GET** `/creators/:id/similar`

Find creators similar to a specific creator.

**Query Parameters:**
- `limit` - Max results (default: 10)

**Response:** `200 OK`

---

### Analyze Compatibility
**GET** `/creators/:id/compatibility/:brandId`

Analyze creator-brand compatibility (requires authentication).

**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "compatibility": {
      "compatible": true,
      "score": 78.5,
      "factors": {
        "reputation": 4.5,
        "engagement": 0.05,
        "successRate": 96.5
      }
    }
  }
}
```

---

### Get Trending Creators
**GET** `/creators/trending/:niche`

Get trending creators in a specific niche.

**Query Parameters:**
- `limit` - Max results (default: 20)

**Response:** `200 OK`

---

## Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Invalid input data
- `NOT_FOUND` (404) - Resource not found
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `CONFLICT` (409) - Resource already exists
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests

---

## Rate Limits

- General endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- Strict endpoints: 20 requests per 15 minutes

---

## Health & Metrics

### Health Check
**GET** `/health`

Check service health.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "creator-service",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Service Metrics
**GET** `/metrics`

Get service metrics.

**Response:** `200 OK`
```json
{
  "status": "success",
  "metrics": {
    "totalCreators": 1000,
    "verifiedCreators": 750,
    "activeCreators": 900,
    "uptime": 3600
  }
}
```
