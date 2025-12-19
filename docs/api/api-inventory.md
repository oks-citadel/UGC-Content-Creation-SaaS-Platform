# API Inventory
# CreatorBridge Platform

**Version:** 2.0
**Last Updated:** December 18, 2025
**API Gateway URL:** `https://api.creatorbridge.com/v1`
**Documentation:** `https://api.creatorbridge.com/docs`

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [User Management Service](#2-user-management-service)
3. [Creator Service](#3-creator-service)
4. [Campaign Service](#4-campaign-service)
5. [Content Service](#5-content-service)
6. [Asset Service](#6-asset-service) **NEW**
7. [Rights Service](#7-rights-service) **NEW**
8. [Marketplace Service](#8-marketplace-service)
9. [Commerce Service](#9-commerce-service)
10. [Analytics Service](#10-analytics-service)
11. [AI Services](#11-ai-services)
12. [Notification Service](#12-notification-service)
13. [Billing Service](#13-billing-service)
14. [Payout Service](#14-payout-service) **NEW**
15. [Webhooks & Events](#15-webhooks--events)
16. [Rate Limits](#16-rate-limits)

---

## 1. Authentication & Authorization

### Base URL
```
https://api.nexusugc.com/v1/auth
```

### 1.1 Register User
**POST** `/auth/register`

Creates a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd",
  "firstName": "John",
  "lastName": "Doe",
  "role": "brand" | "creator" | "admin",
  "acceptTerms": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "brand",
    "emailVerified": false,
    "createdAt": "2025-01-15T10:00:00Z"
  },
  "meta": {
    "message": "Verification email sent to user@example.com"
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid input
- `409 Conflict` - Email already exists
- `422 Unprocessable Entity` - Validation errors

---

### 1.2 Login
**POST** `/auth/login`

Authenticates a user and returns access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd",
  "mfaCode": "123456" // Optional: if MFA enabled
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "userId": "usr_abc123",
      "email": "user@example.com",
      "role": "brand",
      "permissions": ["campaigns.create", "content.read"]
    }
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account suspended/banned
- `428 Precondition Required` - Email not verified

---

### 1.3 Refresh Token
**POST** `/auth/refresh`

Refreshes an expired access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

### 1.4 Logout
**POST** `/auth/logout`

Invalidates the current session.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "meta": {
    "message": "Successfully logged out"
  }
}
```

---

### 1.5 OAuth Social Login
**GET** `/auth/oauth/{provider}`

Initiates OAuth flow for social login.

**Supported Providers:**
- `google`
- `tiktok`
- `instagram`
- `github`

**Query Parameters:**
- `redirect_uri` - Callback URL after authentication
- `state` - CSRF protection token

**Example:**
```
GET /auth/oauth/google?redirect_uri=https://app.nexusugc.com/callback&state=xyz123
```

**Response:**
Redirects to provider's OAuth consent screen.

---

## 2. User Management Service

### Base URL
```
https://api.nexusugc.com/v1/users
```

### 2.1 Get Current User
**GET** `/users/me`

Retrieves the authenticated user's profile.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "brand",
    "avatar": "https://cdn.nexusugc.com/avatars/usr_abc123.jpg",
    "company": {
      "name": "ACME Corp",
      "website": "https://acme.com",
      "industry": "E-Commerce"
    },
    "preferences": {
      "language": "en",
      "timezone": "America/New_York",
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      }
    },
    "subscription": {
      "plan": "pro",
      "status": "active",
      "billingCycle": "monthly",
      "nextBillingDate": "2025-02-15T00:00:00Z"
    },
    "createdAt": "2025-01-01T10:00:00Z",
    "updatedAt": "2025-01-15T14:30:00Z"
  }
}
```

---

### 2.2 Update User Profile
**PATCH** `/users/me`

Updates the authenticated user's profile.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "company": {
    "name": "New Company Inc"
  },
  "preferences": {
    "language": "es",
    "notifications": {
      "email": false
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "usr_abc123",
    "firstName": "Jane",
    "lastName": "Smith",
    "updatedAt": "2025-01-15T15:00:00Z"
  }
}
```

---

### 2.3 Upload Avatar
**POST** `/users/me/avatar`

Uploads a profile picture.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body:**
```
file: [binary data]
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "avatar": "https://cdn.nexusugc.com/avatars/usr_abc123.jpg",
    "thumbnails": {
      "small": "https://cdn.nexusugc.com/avatars/usr_abc123_sm.jpg",
      "medium": "https://cdn.nexusugc.com/avatars/usr_abc123_md.jpg"
    }
  }
}
```

**Constraints:**
- Max file size: 5MB
- Accepted formats: JPG, PNG, WebP
- Min dimensions: 200x200px

---

### 2.4 List Team Members
**GET** `/users/team`

Retrieves team members for the current workspace.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `page` (int) - Page number (default: 1)
- `limit` (int) - Items per page (default: 20, max: 100)
- `role` (string) - Filter by role: `admin`, `member`, `viewer`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "usr_def456",
      "email": "teammate@example.com",
      "firstName": "Alice",
      "lastName": "Johnson",
      "role": "member",
      "permissions": ["campaigns.read", "campaigns.create"],
      "avatar": "https://cdn.nexusugc.com/avatars/usr_def456.jpg",
      "lastActive": "2025-01-15T12:00:00Z",
      "invitedBy": "usr_abc123",
      "joinedAt": "2025-01-10T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 2.5 Invite Team Member
**POST** `/users/team/invite`

Invites a new team member to the workspace.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "member",
  "permissions": ["campaigns.read", "campaigns.create"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "inviteId": "inv_xyz789",
    "email": "newmember@example.com",
    "role": "member",
    "expiresAt": "2025-01-22T10:00:00Z",
    "inviteUrl": "https://app.nexusugc.com/invite/inv_xyz789"
  },
  "meta": {
    "message": "Invitation sent to newmember@example.com"
  }
}
```

---

## 3. Creator Service

### Base URL
```
https://api.nexusugc.com/v1/creators
```

### 3.1 Get Creator Profile
**GET** `/creators/{creatorId}`

Retrieves a creator's public profile.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "creatorId": "crt_abc123",
    "userId": "usr_xyz789",
    "displayName": "Sarah Creator",
    "bio": "Fashion & lifestyle content creator specializing in UGC",
    "avatar": "https://cdn.nexusugc.com/avatars/crt_abc123.jpg",
    "coverImage": "https://cdn.nexusugc.com/covers/crt_abc123.jpg",
    "location": {
      "city": "Los Angeles",
      "state": "CA",
      "country": "USA"
    },
    "niches": ["fashion", "beauty", "lifestyle"],
    "languages": ["en", "es"],
    "socialProfiles": {
      "tiktok": {
        "username": "@sarahcreates",
        "followers": 125000,
        "verified": true,
        "url": "https://tiktok.com/@sarahcreates"
      },
      "instagram": {
        "username": "@sarahcreates",
        "followers": 85000,
        "verified": false,
        "url": "https://instagram.com/sarahcreates"
      }
    },
    "portfolio": {
      "totalAssets": 42,
      "avgEngagementRate": 4.8,
      "totalReach": 5200000
    },
    "ratings": {
      "overall": 4.9,
      "quality": 4.9,
      "communication": 5.0,
      "delivery": 4.8,
      "totalReviews": 28
    },
    "trustScore": 92,
    "verified": true,
    "availability": {
      "status": "available",
      "responseTime": "< 24 hours",
      "capacity": "3-5 campaigns/month"
    },
    "pricing": {
      "tiktokVideo": {
        "min": 500,
        "max": 1500,
        "currency": "USD"
      },
      "instagramReel": {
        "min": 400,
        "max": 1200,
        "currency": "USD"
      }
    },
    "memberSince": "2024-06-15T00:00:00Z",
    "completedCampaigns": 35
  }
}
```

---

### 3.2 Search Creators
**GET** `/creators/search`

Searches for creators based on filters.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `q` (string) - Search query (name, bio, niche)
- `niches` (string[]) - Filter by niches (comma-separated)
- `platforms` (string[]) - Social platforms (tiktok, instagram, youtube)
- `minFollowers` (int) - Minimum follower count
- `maxFollowers` (int) - Maximum follower count
- `minEngagement` (float) - Minimum engagement rate (%)
- `location` (string) - Location (city, state, or country)
- `languages` (string[]) - Supported languages
- `minRating` (float) - Minimum rating (1-5)
- `verified` (boolean) - Only verified creators
- `availability` (string) - available, busy, unavailable
- `sort` (string) - Sort by: `relevance`, `followers`, `engagement`, `rating`, `price`
- `page` (int) - Page number
- `limit` (int) - Results per page (max 50)

**Example:**
```
GET /creators/search?niches=fashion,beauty&minFollowers=50000&minEngagement=3.5&verified=true&sort=rating&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "creatorId": "crt_abc123",
      "displayName": "Sarah Creator",
      "avatar": "https://cdn.nexusugc.com/avatars/crt_abc123.jpg",
      "niches": ["fashion", "beauty"],
      "followers": {
        "tiktok": 125000,
        "instagram": 85000,
        "total": 210000
      },
      "engagementRate": 4.8,
      "rating": 4.9,
      "trustScore": 92,
      "pricing": {
        "min": 400,
        "max": 1500,
        "currency": "USD"
      },
      "matchScore": 95
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 127,
    "totalPages": 7
  },
  "filters": {
    "applied": {
      "niches": ["fashion", "beauty"],
      "minFollowers": 50000,
      "minEngagement": 3.5,
      "verified": true
    }
  }
}
```

---

### 3.3 Get Creator Portfolio
**GET** `/creators/{creatorId}/portfolio`

Retrieves a creator's portfolio of work.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `platform` (string) - Filter by platform
- `sort` (string) - Sort by: `recent`, `engagement`, `views`
- `page` (int)
- `limit` (int)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "assetId": "ast_123",
      "type": "video",
      "title": "Summer Fashion Haul",
      "thumbnail": "https://cdn.nexusugc.com/thumbnails/ast_123.jpg",
      "videoUrl": "https://cdn.nexusugc.com/videos/ast_123.mp4",
      "platform": "tiktok",
      "duration": 45,
      "publishedAt": "2025-01-10T15:00:00Z",
      "metrics": {
        "views": 250000,
        "likes": 12500,
        "comments": 340,
        "shares": 890,
        "engagementRate": 5.5
      },
      "brands": ["Fashion Nova"],
      "tags": ["fashion", "haul", "summer"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### 3.4 Update Creator Profile
**PATCH** `/creators/me`

Updates the authenticated creator's profile.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "displayName": "Sarah Creates",
  "bio": "Updated bio here",
  "niches": ["fashion", "beauty", "wellness"],
  "languages": ["en", "es", "fr"],
  "pricing": {
    "tiktokVideo": {
      "min": 600,
      "max": 1800
    }
  },
  "availability": {
    "status": "available",
    "capacity": "5-7 campaigns/month"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "creatorId": "crt_abc123",
    "displayName": "Sarah Creates",
    "updatedAt": "2025-01-15T16:00:00Z"
  }
}
```

---

## 4. Campaign Service

### Base URL
```
https://api.nexusugc.com/v1/campaigns
```

### 4.1 Create Campaign
**POST** `/campaigns`

Creates a new campaign.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Summer Product Launch 2025",
  "description": "UGC campaign for new summer collection",
  "type": "ugc_collection" | "influencer" | "ambassador",
  "budget": {
    "total": 10000,
    "currency": "USD",
    "perCreator": {
      "min": 500,
      "max": 1500
    }
  },
  "timeline": {
    "startDate": "2025-02-01T00:00:00Z",
    "endDate": "2025-03-31T23:59:59Z",
    "deadlines": {
      "contentSubmission": "2025-02-15T23:59:59Z",
      "revisions": "2025-02-20T23:59:59Z"
    }
  },
  "deliverables": {
    "totalPieces": 20,
    "platforms": ["tiktok", "instagram"],
    "formats": [
      {
        "type": "video",
        "platform": "tiktok",
        "duration": 30,
        "quantity": 10
      },
      {
        "type": "video",
        "platform": "instagram",
        "duration": 30,
        "quantity": 10
      }
    ]
  },
  "targeting": {
    "niches": ["fashion", "lifestyle"],
    "demographics": {
      "ageRange": "18-35",
      "gender": "all",
      "locations": ["US", "CA", "UK"]
    },
    "creatorRequirements": {
      "minFollowers": 50000,
      "minEngagement": 3.0,
      "verified": false
    }
  },
  "brief": {
    "productName": "Summer Collection 2025",
    "keyMessages": ["Sustainable fashion", "Affordable luxury"],
    "talkingPoints": ["Eco-friendly materials", "Versatile styles"],
    "dos": ["Show product in natural light", "Include styling tips"],
    "donts": ["Don't compare to competitors", "Avoid political topics"],
    "hashtags": ["#SummerStyle", "#SustainableFashion"],
    "callToAction": "Shop the collection at acme.com/summer"
  },
  "approvalWorkflow": {
    "stages": ["creative_review", "legal_review", "final_approval"],
    "maxRevisions": 3
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "campaignId": "cmp_abc123",
    "name": "Summer Product Launch 2025",
    "status": "draft",
    "createdAt": "2025-01-15T10:00:00Z",
    "nextSteps": [
      "Review campaign brief",
      "Invite creators or open to marketplace",
      "Publish campaign"
    ]
  }
}
```

---

### 4.2 List Campaigns
**GET** `/campaigns`

Lists all campaigns for the authenticated user.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (string) - Filter by status: `draft`, `active`, `paused`, `completed`, `archived`
- `search` (string) - Search by campaign name
- `startDate` (date) - Filter by start date
- `endDate` (date) - Filter by end date
- `sort` (string) - Sort by: `created`, `updated`, `deadline`, `budget`
- `page` (int)
- `limit` (int)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "campaignId": "cmp_abc123",
      "name": "Summer Product Launch 2025",
      "status": "active",
      "budget": {
        "total": 10000,
        "spent": 4500,
        "remaining": 5500,
        "currency": "USD"
      },
      "timeline": {
        "startDate": "2025-02-01T00:00:00Z",
        "endDate": "2025-03-31T23:59:59Z",
        "daysRemaining": 45
      },
      "progress": {
        "creatorsApplied": 35,
        "creatorsAccepted": 12,
        "contentSubmitted": 8,
        "contentApproved": 5,
        "completionPercentage": 42
      },
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### 4.3 Get Campaign Details
**GET** `/campaigns/{campaignId}`

Retrieves detailed information about a campaign.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaignId": "cmp_abc123",
    "name": "Summer Product Launch 2025",
    "description": "UGC campaign for new summer collection",
    "status": "active",
    "type": "ugc_collection",
    "budget": {
      "total": 10000,
      "spent": 4500,
      "committed": 3000,
      "remaining": 2500,
      "currency": "USD"
    },
    "timeline": {
      "startDate": "2025-02-01T00:00:00Z",
      "endDate": "2025-03-31T23:59:59Z",
      "deadlines": {
        "contentSubmission": "2025-02-15T23:59:59Z",
        "revisions": "2025-02-20T23:59:59Z"
      },
      "daysRemaining": 45
    },
    "deliverables": {
      "totalPieces": 20,
      "submitted": 8,
      "approved": 5,
      "pending": 3,
      "rejected": 0
    },
    "creators": {
      "applied": 35,
      "accepted": 12,
      "active": 10,
      "completed": 2
    },
    "brief": {
      "productName": "Summer Collection 2025",
      "keyMessages": ["Sustainable fashion", "Affordable luxury"],
      "talkingPoints": ["Eco-friendly materials", "Versatile styles"],
      "brandGuidelines": "https://cdn.nexusugc.com/guidelines/cmp_abc123.pdf"
    },
    "performance": {
      "totalReach": 1250000,
      "totalEngagement": 62000,
      "avgEngagementRate": 4.96,
      "estimatedConversions": 1240
    },
    "createdBy": {
      "userId": "usr_abc123",
      "name": "John Doe"
    },
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T14:00:00Z"
  }
}
```

---

### 4.4 Update Campaign
**PATCH** `/campaigns/{campaignId}`

Updates campaign details.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Summer Product Launch 2025 - Updated",
  "status": "paused",
  "budget": {
    "total": 12000
  },
  "timeline": {
    "endDate": "2025-04-15T23:59:59Z"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaignId": "cmp_abc123",
    "name": "Summer Product Launch 2025 - Updated",
    "status": "paused",
    "updatedAt": "2025-01-15T16:00:00Z"
  }
}
```

---

### 4.5 Delete Campaign
**DELETE** `/campaigns/{campaignId}`

Deletes (archives) a campaign.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "meta": {
    "message": "Campaign archived successfully"
  }
}
```

**Note:** Campaigns with active creators cannot be deleted.

---

## 5. Content Service

### Base URL
```
https://api.nexusugc.com/v1/content
```

### 5.1 Upload Content
**POST** `/content/upload`

Uploads video or image content.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body:**
```
file: [binary data]
campaignId: cmp_abc123
title: My UGC Video
description: Product demo video
platform: tiktok
metadata: {"tags": ["fashion", "summer"]}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "contentId": "cnt_xyz789",
    "campaignId": "cmp_abc123",
    "title": "My UGC Video",
    "type": "video",
    "status": "processing",
    "fileSize": 25600000,
    "duration": 45,
    "originalUrl": "https://cdn.nexusugc.com/uploads/cnt_xyz789_original.mp4",
    "processingStatus": {
      "transcoding": "in_progress",
      "thumbnail": "pending",
      "captions": "pending"
    },
    "uploadedAt": "2025-01-15T10:00:00Z",
    "estimatedProcessingTime": 180
  }
}
```

**Constraints:**
- Max file size: 500MB
- Accepted formats: MP4, MOV, AVI, PNG, JPG, WebP
- Max duration: 10 minutes

---

### 5.2 Get Content Details
**GET** `/content/{contentId}`

Retrieves content metadata and processing status.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "contentId": "cnt_xyz789",
    "campaignId": "cmp_abc123",
    "creatorId": "crt_abc123",
    "title": "My UGC Video",
    "description": "Product demo video",
    "type": "video",
    "status": "approved",
    "platform": "tiktok",
    "files": {
      "original": "https://cdn.nexusugc.com/uploads/cnt_xyz789_original.mp4",
      "hd": "https://cdn.nexusugc.com/videos/cnt_xyz789_1080p.mp4",
      "sd": "https://cdn.nexusugc.com/videos/cnt_xyz789_720p.mp4",
      "thumbnail": "https://cdn.nexusugc.com/thumbnails/cnt_xyz789.jpg"
    },
    "metadata": {
      "duration": 45,
      "resolution": "1080x1920",
      "fps": 30,
      "codec": "H.264",
      "fileSize": 25600000,
      "tags": ["fashion", "summer"]
    },
    "captions": {
      "available": true,
      "languages": ["en"],
      "srtUrl": "https://cdn.nexusugc.com/captions/cnt_xyz789_en.srt"
    },
    "aiAnalysis": {
      "performanceScore": 85,
      "hookScore": 92,
      "qualityScore": 88,
      "brandSafety": "approved",
      "detectedObjects": ["clothing", "person", "outdoor"],
      "sentiment": "positive"
    },
    "approvalHistory": [
      {
        "status": "submitted",
        "timestamp": "2025-01-15T10:30:00Z",
        "by": "crt_abc123"
      },
      {
        "status": "approved",
        "timestamp": "2025-01-15T12:00:00Z",
        "by": "usr_abc123",
        "comment": "Great work! Ready to publish."
      }
    ],
    "uploadedAt": "2025-01-15T10:00:00Z",
    "processedAt": "2025-01-15T10:05:00Z"
  }
}
```

---

### 5.3 List Content
**GET** `/content`

Lists content filtered by various criteria.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `campaignId` (string) - Filter by campaign
- `creatorId` (string) - Filter by creator
- `status` (string) - Filter by status: `processing`, `pending_review`, `approved`, `rejected`, `published`
- `platform` (string) - Filter by platform
- `startDate` (date) - Content uploaded after
- `endDate` (date) - Content uploaded before
- `sort` (string) - Sort by: `uploaded`, `performance`, `engagement`
- `page` (int)
- `limit` (int)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "contentId": "cnt_xyz789",
      "title": "My UGC Video",
      "thumbnail": "https://cdn.nexusugc.com/thumbnails/cnt_xyz789.jpg",
      "type": "video",
      "platform": "tiktok",
      "status": "approved",
      "duration": 45,
      "performanceScore": 85,
      "creator": {
        "creatorId": "crt_abc123",
        "displayName": "Sarah Creator",
        "avatar": "https://cdn.nexusugc.com/avatars/crt_abc123.jpg"
      },
      "campaign": {
        "campaignId": "cmp_abc123",
        "name": "Summer Product Launch 2025"
      },
      "uploadedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### 5.4 Approve/Reject Content
**POST** `/content/{contentId}/review`

Approves or rejects submitted content.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "action": "approve" | "reject" | "request_revision",
  "comment": "Great work! Ready to publish.",
  "feedback": {
    "strengths": ["Good hook", "Clear messaging"],
    "improvements": ["Better lighting needed"]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "contentId": "cnt_xyz789",
    "status": "approved",
    "reviewedBy": "usr_abc123",
    "reviewedAt": "2025-01-15T12:00:00Z"
  },
  "meta": {
    "message": "Content approved successfully"
  }
}
```

---

### 5.5 Generate AI Captions
**POST** `/content/{contentId}/captions`

Generates automated captions for video content.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "language": "en",
  "style": "default" | "bold" | "minimal" | "animated"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "contentId": "cnt_xyz789",
    "captions": {
      "language": "en",
      "srtUrl": "https://cdn.nexusugc.com/captions/cnt_xyz789_en.srt",
      "vttUrl": "https://cdn.nexusugc.com/captions/cnt_xyz789_en.vtt",
      "transcript": "Hey guys! Today I'm showing you...",
      "generatedAt": "2025-01-15T10:10:00Z"
    }
  }
}
```

---

## 6. Asset Service

### Base URL
```
https://api.creatorbridge.com/v1/assets
```

### 6.1 Request Upload URL
**POST** `/assets/upload-url`

Generates a presigned URL for direct upload to Azure Blob Storage.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "filename": "product-video.mp4",
  "contentType": "video/mp4",
  "fileSize": 52428800,
  "category": "content" | "brand-asset" | "portfolio",
  "metadata": {
    "campaignId": "cmp_abc123",
    "tags": ["product", "demo"]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://creatorbridge.blob.core.windows.net/uploads/...",
    "assetId": "ast_xyz789",
    "expiresAt": "2025-01-15T11:00:00Z",
    "headers": {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": "video/mp4"
    }
  }
}
```

**Constraints:**
- Max file size: 500MB (video), 25MB (image)
- Accepted formats: MP4, MOV, AVI, PNG, JPG, WebP, PDF
- Upload URL expires in 1 hour

---

### 6.2 Get Asset Details
**GET** `/assets/{assetId}`

Retrieves asset metadata and CDN URLs.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "assetId": "ast_xyz789",
    "filename": "product-video.mp4",
    "originalFilename": "my-video.mp4",
    "contentType": "video/mp4",
    "fileSize": 52428800,
    "status": "ready",
    "category": "content",
    "urls": {
      "original": "https://cdn.creatorbridge.com/assets/ast_xyz789/original.mp4",
      "hd": "https://cdn.creatorbridge.com/assets/ast_xyz789/1080p.mp4",
      "sd": "https://cdn.creatorbridge.com/assets/ast_xyz789/720p.mp4",
      "thumbnail": "https://cdn.creatorbridge.com/assets/ast_xyz789/thumb.jpg",
      "preview": "https://cdn.creatorbridge.com/assets/ast_xyz789/preview.gif"
    },
    "variants": [
      {
        "variantId": "var_001",
        "name": "1080p",
        "resolution": "1920x1080",
        "fileSize": 45000000,
        "url": "https://cdn.creatorbridge.com/assets/ast_xyz789/1080p.mp4"
      },
      {
        "variantId": "var_002",
        "name": "720p",
        "resolution": "1280x720",
        "fileSize": 28000000,
        "url": "https://cdn.creatorbridge.com/assets/ast_xyz789/720p.mp4"
      }
    ],
    "metadata": {
      "duration": 45,
      "resolution": "1920x1080",
      "fps": 30,
      "codec": "H.264",
      "bitrate": 8000000
    },
    "processing": {
      "status": "completed",
      "transcodingComplete": true,
      "thumbnailsGenerated": true,
      "moderationPassed": true
    },
    "uploadedBy": "usr_abc123",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:05:00Z"
  }
}
```

---

### 6.3 Download Asset
**GET** `/assets/{assetId}/download`

Generates a time-limited download URL for an asset.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `variant` (string) - Variant to download: `original`, `hd`, `sd` (default: original)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.creatorbridge.com/downloads/ast_xyz789?token=...",
    "expiresAt": "2025-01-15T11:00:00Z",
    "filename": "product-video.mp4",
    "fileSize": 52428800
  }
}
```

---

### 6.4 Delete Asset
**DELETE** `/assets/{assetId}`

Deletes an asset and all its variants.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "meta": {
    "message": "Asset deleted successfully"
  }
}
```

**Note:** Assets linked to approved content cannot be deleted.

---

### 6.5 List Brand Asset Library
**GET** `/assets/library`

Lists assets in the brand's asset library.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `folderId` (string) - Filter by folder
- `type` (string) - Filter by type: `video`, `image`, `document`
- `search` (string) - Search by filename or tags
- `page` (int)
- `limit` (int)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "assetId": "ast_xyz789",
        "filename": "brand-guidelines.pdf",
        "contentType": "application/pdf",
        "fileSize": 2500000,
        "thumbnail": "https://cdn.creatorbridge.com/assets/ast_xyz789/thumb.png",
        "folder": {
          "folderId": "fld_abc123",
          "name": "Brand Guidelines"
        },
        "createdAt": "2025-01-10T09:00:00Z"
      }
    ],
    "folders": [
      {
        "folderId": "fld_abc123",
        "name": "Brand Guidelines",
        "assetCount": 12
      },
      {
        "folderId": "fld_def456",
        "name": "Product Images",
        "assetCount": 45
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 57,
    "totalPages": 3
  }
}
```

---

### 6.6 Create Library Folder
**POST** `/assets/library/folders`

Creates a folder in the brand asset library.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Summer Campaign Assets",
  "parentId": "fld_abc123",
  "description": "Assets for Summer 2025 campaigns"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "folderId": "fld_xyz789",
    "name": "Summer Campaign Assets",
    "parentId": "fld_abc123",
    "path": "/Brand Guidelines/Summer Campaign Assets",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 6.7 Trigger Asset Processing
**POST** `/assets/{assetId}/process`

Triggers reprocessing of an asset (transcoding, thumbnail generation, etc.).

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "operations": ["transcode", "thumbnails", "moderation"],
  "variants": [
    {"name": "hd", "resolution": "1920x1080"},
    {"name": "sd", "resolution": "1280x720"}
  ]
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "assetId": "ast_xyz789",
    "operations": ["transcode", "thumbnails", "moderation"],
    "status": "queued",
    "estimatedTime": 120
  }
}
```

---

## 7. Rights Service

### Base URL
```
https://api.creatorbridge.com/v1/rights
```

### 7.1 Create Content Rights
**POST** `/rights/content/{contentId}`

Defines usage rights for approved content.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "exclusive" | "non_exclusive" | "limited",
  "duration": {
    "startDate": "2025-02-01T00:00:00Z",
    "endDate": "2026-02-01T00:00:00Z",
    "perpetual": false
  },
  "territories": ["US", "CA", "UK", "EU"],
  "platforms": ["tiktok", "instagram", "facebook", "youtube", "website", "paid_ads"],
  "usageTypes": [
    "organic_social",
    "paid_social",
    "website",
    "email",
    "display_ads"
  ],
  "restrictions": {
    "noEditing": false,
    "noDerivatives": false,
    "attributionRequired": true,
    "maxImpressions": null
  },
  "compensation": {
    "type": "flat_fee" | "royalty" | "hybrid",
    "amount": 1500,
    "currency": "USD",
    "royaltyPercentage": null
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "rightsId": "rgt_abc123",
    "contentId": "cnt_xyz789",
    "status": "pending_signature",
    "type": "exclusive",
    "duration": {
      "startDate": "2025-02-01T00:00:00Z",
      "endDate": "2026-02-01T00:00:00Z"
    },
    "territories": ["US", "CA", "UK", "EU"],
    "platforms": ["tiktok", "instagram", "facebook", "youtube", "website", "paid_ads"],
    "licenseUrl": "https://app.creatorbridge.com/rights/rgt_abc123/sign",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 7.2 Get Content Rights
**GET** `/rights/content/{contentId}`

Retrieves rights information for content.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "rightsId": "rgt_abc123",
    "contentId": "cnt_xyz789",
    "status": "active",
    "type": "exclusive",
    "duration": {
      "startDate": "2025-02-01T00:00:00Z",
      "endDate": "2026-02-01T00:00:00Z",
      "daysRemaining": 365
    },
    "territories": ["US", "CA", "UK", "EU"],
    "platforms": ["tiktok", "instagram", "facebook", "youtube", "website", "paid_ads"],
    "usageTypes": ["organic_social", "paid_social", "website"],
    "signatures": {
      "creator": {
        "signedBy": "crt_abc123",
        "signedAt": "2025-01-16T14:00:00Z",
        "ipAddress": "192.168.1.1"
      },
      "brand": {
        "signedBy": "usr_def456",
        "signedAt": "2025-01-16T15:00:00Z",
        "ipAddress": "10.0.0.1"
      }
    },
    "documents": {
      "license": "https://cdn.creatorbridge.com/licenses/rgt_abc123.pdf",
      "signedCopy": "https://cdn.creatorbridge.com/licenses/rgt_abc123_signed.pdf"
    },
    "history": [
      {
        "action": "created",
        "timestamp": "2025-01-15T10:00:00Z",
        "by": "usr_def456"
      },
      {
        "action": "creator_signed",
        "timestamp": "2025-01-16T14:00:00Z",
        "by": "crt_abc123"
      },
      {
        "action": "brand_signed",
        "timestamp": "2025-01-16T15:00:00Z",
        "by": "usr_def456"
      }
    ]
  }
}
```

---

### 7.3 Generate License Agreement
**POST** `/rights/{rightsId}/license`

Generates a license agreement document (PDF/HTML).

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "format": "pdf" | "html",
  "templateId": "tpl_standard_exclusive",
  "customClauses": [
    "Content may be used in TV commercials with additional approval"
  ],
  "language": "en"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documentId": "doc_xyz789",
    "rightsId": "rgt_abc123",
    "format": "pdf",
    "url": "https://cdn.creatorbridge.com/licenses/doc_xyz789.pdf",
    "previewUrl": "https://cdn.creatorbridge.com/licenses/doc_xyz789_preview.png",
    "expiresAt": "2025-01-15T11:00:00Z",
    "generatedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 7.4 Sign License Agreement
**POST** `/rights/{rightsId}/sign`

Digitally signs a license agreement.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "signatureType": "electronic" | "typed",
  "signature": "data:image/png;base64,..." | "John Doe",
  "acceptTerms": true,
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "rightsId": "rgt_abc123",
    "status": "active",
    "signedAt": "2025-01-16T14:00:00Z",
    "signedDocument": "https://cdn.creatorbridge.com/licenses/rgt_abc123_signed.pdf",
    "allPartiesSigned": true
  },
  "meta": {
    "message": "License agreement signed successfully"
  }
}
```

---

### 7.5 List License Templates
**GET** `/rights/templates`

Lists available license agreement templates.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "templateId": "tpl_standard_exclusive",
      "name": "Standard Exclusive License",
      "description": "Full exclusive rights for specified duration",
      "type": "exclusive",
      "defaultDuration": 365,
      "platforms": "all",
      "isDefault": true
    },
    {
      "templateId": "tpl_limited_social",
      "name": "Limited Social Media License",
      "description": "Non-exclusive rights for organic social only",
      "type": "non_exclusive",
      "defaultDuration": 180,
      "platforms": ["tiktok", "instagram", "facebook"],
      "isDefault": false
    },
    {
      "templateId": "tpl_paid_ads",
      "name": "Paid Advertising License",
      "description": "Rights for paid advertising campaigns",
      "type": "limited",
      "defaultDuration": 90,
      "platforms": ["paid_social", "display_ads"],
      "isDefault": false
    }
  ]
}
```

---

### 7.6 Transfer Rights
**POST** `/rights/{rightsId}/transfer`

Transfers content rights to another brand/entity.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "transferTo": {
    "brandId": "brnd_xyz789",
    "name": "Partner Brand Inc."
  },
  "transferType": "full" | "sublicense",
  "effectiveDate": "2025-03-01T00:00:00Z",
  "compensation": {
    "amount": 5000,
    "currency": "USD"
  },
  "creatorConsent": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transferId": "xfr_abc123",
    "rightsId": "rgt_abc123",
    "status": "pending_approval",
    "transferTo": "brnd_xyz789",
    "effectiveDate": "2025-03-01T00:00:00Z",
    "requiresCreatorApproval": true
  }
}
```

---

## 8. Marketplace Service

### Base URL
```
https://api.creatorbridge.com/v1/marketplace
```

### 8.1 List Open Opportunities
**GET** `/marketplace/opportunities`

Lists campaign opportunities for creators.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `niches` (string[]) - Filter by niches
- `platforms` (string[]) - Filter by platforms
- `minBudget` (int) - Minimum compensation
- `maxBudget` (int) - Maximum compensation
- `location` (string) - Location preference
- `sort` (string) - Sort by: `recent`, `budget`, `deadline`, `match`
- `page` (int)
- `limit` (int)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "opportunityId": "opp_abc123",
      "campaignId": "cmp_abc123",
      "title": "Summer Fashion UGC",
      "brand": {
        "name": "ACME Fashion",
        "logo": "https://cdn.nexusugc.com/brands/acme_logo.png",
        "verified": true
      },
      "budget": {
        "min": 500,
        "max": 1500,
        "currency": "USD"
      },
      "deliverables": {
        "quantity": 2,
        "type": "video",
        "platform": "tiktok",
        "duration": 30
      },
      "timeline": {
        "deadline": "2025-02-15T23:59:59Z",
        "daysRemaining": 30
      },
      "requirements": {
        "minFollowers": 50000,
        "niches": ["fashion", "lifestyle"],
        "location": "US"
      },
      "matchScore": 92,
      "applicants": 24,
      "postedAt": "2025-01-10T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 8.2 Apply to Opportunity
**POST** `/marketplace/opportunities/{opportunityId}/apply`

Submits an application to a campaign opportunity.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "proposedRate": 1200,
  "coverMessage": "I'd love to work on this campaign! Here's why I'm a great fit...",
  "estimatedDelivery": "2025-02-10T00:00:00Z",
  "portfolioSamples": ["ast_123", "ast_456", "ast_789"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "applicationId": "app_xyz789",
    "opportunityId": "opp_abc123",
    "status": "pending",
    "proposedRate": 1200,
    "submittedAt": "2025-01-15T10:00:00Z",
    "expectedResponse": "within 3-5 business days"
  },
  "meta": {
    "message": "Application submitted successfully"
  }
}
```

---

### 8.3 Get Application Status
**GET** `/marketplace/applications/{applicationId}`

Retrieves the status of a creator's application.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "applicationId": "app_xyz789",
    "opportunityId": "opp_abc123",
    "campaignId": "cmp_abc123",
    "status": "accepted",
    "proposedRate": 1200,
    "negotiatedRate": 1100,
    "brand": {
      "name": "ACME Fashion",
      "logo": "https://cdn.nexusugc.com/brands/acme_logo.png"
    },
    "contract": {
      "contractId": "ctr_abc456",
      "status": "pending_signature",
      "url": "https://app.nexusugc.com/contracts/ctr_abc456"
    },
    "timeline": {
      "contentDue": "2025-02-15T23:59:59Z",
      "revisionsDue": "2025-02-20T23:59:59Z"
    },
    "submittedAt": "2025-01-15T10:00:00Z",
    "respondedAt": "2025-01-16T14:00:00Z"
  }
}
```

---

### 8.4 List My Applications
**GET** `/marketplace/applications`

Lists all applications submitted by the authenticated creator.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (string) - Filter by status: `pending`, `accepted`, `rejected`, `withdrawn`
- `sort` (string) - Sort by: `recent`, `deadline`, `budget`
- `page` (int)
- `limit` (int)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "applicationId": "app_xyz789",
      "campaign": {
        "campaignId": "cmp_abc123",
        "name": "Summer Fashion UGC",
        "brand": "ACME Fashion"
      },
      "status": "accepted",
      "proposedRate": 1200,
      "submittedAt": "2025-01-15T10:00:00Z",
      "respondedAt": "2025-01-16T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

## 9. Commerce Service

### Base URL
```
https://api.creatorbridge.com/v1/commerce
```

### 9.1 Create Shoppable Gallery
**POST** `/commerce/galleries`

Creates a shoppable UGC gallery.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Summer Collection Gallery",
  "description": "Shoppable UGC for summer products",
  "contentIds": ["cnt_123", "cnt_456", "cnt_789"],
  "products": [
    {
      "productId": "prod_abc",
      "name": "Summer Dress",
      "price": 79.99,
      "currency": "USD",
      "imageUrl": "https://cdn.acme.com/products/dress.jpg",
      "shopUrl": "https://acme.com/products/summer-dress"
    }
  ],
  "layout": "grid" | "carousel" | "masonry",
  "theme": "light" | "dark" | "custom",
  "callToAction": "Shop Now"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "galleryId": "gal_xyz789",
    "name": "Summer Collection Gallery",
    "embedCode": "<div data-nexus-gallery='gal_xyz789'></div><script src='https://cdn.nexusugc.com/embed.js'></script>",
    "embedUrl": "https://galleries.nexusugc.com/gal_xyz789",
    "totalContent": 3,
    "totalProducts": 1,
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 9.2 Track Commerce Event
**POST** `/commerce/events`

Tracks a commerce interaction event.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "eventType": "view" | "click" | "add_to_cart" | "purchase",
  "contentId": "cnt_123",
  "productId": "prod_abc",
  "galleryId": "gal_xyz789",
  "sessionId": "ses_unique_id",
  "metadata": {
    "source": "gallery",
    "campaign": "summer2025"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "eventId": "evt_abc123",
    "tracked": true,
    "timestamp": "2025-01-15T10:00:00Z"
  }
}
```

---

### 9.3 Get Attribution Report
**GET** `/commerce/attribution`

Retrieves revenue attribution data for UGC content.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `campaignId` (string)
- `contentId` (string)
- `startDate` (date)
- `endDate` (date)
- `model` (string) - Attribution model: `first_touch`, `last_touch`, `multi_touch`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 125000,
      "totalOrders": 342,
      "avgOrderValue": 365.50,
      "roas": 12.5,
      "conversionRate": 3.8
    },
    "byContent": [
      {
        "contentId": "cnt_123",
        "title": "Product Demo Video",
        "revenue": 45000,
        "orders": 120,
        "roas": 15.0,
        "conversionRate": 4.2
      }
    ],
    "byCreator": [
      {
        "creatorId": "crt_abc123",
        "displayName": "Sarah Creator",
        "revenue": 45000,
        "orders": 120,
        "contentCount": 3
      }
    ],
    "funnel": {
      "impressions": 250000,
      "clicks": 12500,
      "addToCart": 2100,
      "purchases": 342
    }
  }
}
```

---

## 10. Analytics Service

### Base URL
```
https://api.creatorbridge.com/v1/analytics
```

### 10.1 Get Dashboard Metrics
**GET** `/analytics/dashboard`

Retrieves top-level dashboard metrics.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `granularity` (string) - `hour`, `day`, `week`, `month`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-01-31T23:59:59Z"
    },
    "overview": {
      "totalReach": 5200000,
      "totalEngagement": 248000,
      "engagementRate": 4.77,
      "contentPieces": 125,
      "activeCampaigns": 8,
      "activeCreators": 42,
      "revenue": 125000,
      "roas": 12.5
    },
    "trends": {
      "reachGrowth": 15.2,
      "engagementGrowth": 22.8,
      "creatorGrowth": 35.0
    },
    "topPerforming": {
      "content": [
        {
          "contentId": "cnt_123",
          "title": "Product Demo",
          "reach": 250000,
          "engagement": 15000,
          "engagementRate": 6.0
        }
      ],
      "creators": [
        {
          "creatorId": "crt_abc123",
          "displayName": "Sarah Creator",
          "totalReach": 800000,
          "avgEngagement": 5.2
        }
      ],
      "campaigns": [
        {
          "campaignId": "cmp_abc123",
          "name": "Summer Launch",
          "reach": 1500000,
          "roas": 18.5
        }
      ]
    }
  }
}
```

---

### 10.2 Get Campaign Analytics
**GET** `/analytics/campaigns/{campaignId}`

Retrieves detailed analytics for a specific campaign.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "campaignId": "cmp_abc123",
    "name": "Summer Product Launch 2025",
    "period": {
      "startDate": "2025-02-01T00:00:00Z",
      "endDate": "2025-03-31T23:59:59Z"
    },
    "performance": {
      "totalReach": 1500000,
      "totalImpressions": 2100000,
      "totalEngagement": 72000,
      "engagementRate": 4.8,
      "totalViews": 1200000,
      "avgWatchTime": 28.5,
      "shares": 8500,
      "saves": 12000
    },
    "commerce": {
      "revenue": 85000,
      "orders": 234,
      "avgOrderValue": 363.25,
      "roas": 17.0,
      "conversionRate": 4.1
    },
    "content": {
      "totalPieces": 20,
      "published": 18,
      "avgPerformanceScore": 84
    },
    "byPlatform": {
      "tiktok": {
        "reach": 900000,
        "engagement": 45000,
        "engagementRate": 5.0
      },
      "instagram": {
        "reach": 600000,
        "engagement": 27000,
        "engagementRate": 4.5
      }
    },
    "topContent": [
      {
        "contentId": "cnt_123",
        "title": "Product Demo",
        "reach": 250000,
        "engagement": 15000,
        "revenue": 25000
      }
    ]
  }
}
```

---

### 10.3 Get Creator Analytics
**GET** `/analytics/creators/{creatorId}`

Retrieves performance analytics for a specific creator.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "creatorId": "crt_abc123",
    "displayName": "Sarah Creator",
    "period": {
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-01-31T23:59:59Z"
    },
    "performance": {
      "totalReach": 800000,
      "totalEngagement": 42000,
      "avgEngagementRate": 5.25,
      "contentCreated": 15,
      "campaignsCompleted": 5
    },
    "audience": {
      "demographics": {
        "age": {
          "18-24": 35,
          "25-34": 42,
          "35-44": 18,
          "45+": 5
        },
        "gender": {
          "female": 68,
          "male": 30,
          "other": 2
        },
        "topLocations": [
          {"country": "US", "percentage": 45},
          {"country": "UK", "percentage": 18},
          {"country": "CA", "percentage": 12}
        ]
      }
    },
    "earnings": {
      "total": 18000,
      "currency": "USD",
      "avgPerCampaign": 3600
    },
    "ratings": {
      "overall": 4.9,
      "quality": 4.9,
      "communication": 5.0,
      "delivery": 4.8
    }
  }
}
```

---

## 11. AI Services

### Base URL
```
https://api.creatorbridge.com/v1/ai
```

### 11.1 Generate Video
**POST** `/ai/video/generate`

Generates a UGC-style video from product images and script.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body:**
```
images: [file1, file2, file3]  // 3-5 product images
script: "Check out this amazing product..."
style: "ugc" | "testimonial" | "tutorial" | "unboxing"
aspectRatio: "9:16" | "1:1" | "16:9"
duration: 30
voiceId: "voice_123"  // Optional
music: "upbeat" | "calm" | "none"
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_xyz789",
    "status": "processing",
    "estimatedTime": 240,
    "statusUrl": "/ai/video/status/job_xyz789"
  },
  "meta": {
    "message": "Video generation started. Check status at statusUrl."
  }
}
```

---

### 11.2 Get Video Generation Status
**GET** `/ai/video/status/{jobId}`

Checks the status of a video generation job.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_xyz789",
    "status": "completed" | "processing" | "failed",
    "progress": 100,
    "result": {
      "videoUrl": "https://cdn.nexusugc.com/generated/job_xyz789.mp4",
      "thumbnailUrl": "https://cdn.nexusugc.com/thumbnails/job_xyz789.jpg",
      "duration": 30,
      "resolution": "1080x1920",
      "variations": [
        {
          "variationId": "var_001",
          "videoUrl": "https://cdn.nexusugc.com/generated/job_xyz789_var1.mp4",
          "description": "Variation with different hook"
        }
      ]
    },
    "createdAt": "2025-01-15T10:00:00Z",
    "completedAt": "2025-01-15T10:04:00Z"
  }
}
```

---

### 11.3 Generate Script
**POST** `/ai/script/generate`

Generates platform-optimized video scripts.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "productName": "Summer Collection Dress",
  "productDescription": "Eco-friendly, versatile summer dress",
  "platform": "tiktok" | "instagram" | "youtube",
  "tone": "casual" | "professional" | "funny" | "educational",
  "duration": 30,
  "keyMessages": ["Sustainable fashion", "Affordable luxury"],
  "callToAction": "Shop now at acme.com/summer"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "primary": {
      "script": "Hey guys! You won't believe how amazing this summer dress is...",
      "hooks": [
        "Stop scrolling! I found the perfect summer dress",
        "You need to see this sustainable fashion find",
        "This dress is going viral for a reason"
      ],
      "structure": [
        {"timestamp": "0-3s", "text": "Hook: Stop scrolling!", "purpose": "Grab attention"},
        {"timestamp": "3-10s", "text": "Introduce product", "purpose": "Context"},
        {"timestamp": "10-25s", "text": "Key benefits and features", "purpose": "Value"},
        {"timestamp": "25-30s", "text": "CTA: Shop now!", "purpose": "Conversion"}
      ],
      "hashtags": ["#SummerStyle", "#SustainableFashion", "#OOTD"],
      "caption": "The perfect summer dress is here! 🌞 #SummerStyle"
    },
    "variations": [
      {
        "variationId": "var_001",
        "hook": "This sustainable dress is trending everywhere!",
        "script": "..."
      }
    ]
  }
}
```

---

### 11.4 Predict Performance
**POST** `/ai/predict/performance`

Predicts content performance before publishing.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "contentId": "cnt_123",
  "platform": "tiktok",
  "publishTime": "2025-01-20T15:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "contentId": "cnt_123",
    "overall": {
      "score": 85,
      "rating": "excellent",
      "confidence": 0.87
    },
    "breakdown": {
      "hook": {
        "score": 92,
        "analysis": "Strong attention-grabbing opening in first 3 seconds"
      },
      "retention": {
        "score": 81,
        "analysis": "Good pacing, may benefit from faster cuts"
      },
      "engagement": {
        "score": 88,
        "analysis": "Clear CTA and relatable content"
      },
      "quality": {
        "score": 86,
        "analysis": "Good lighting and audio quality"
      }
    },
    "predictions": {
      "views": {
        "low": 50000,
        "mid": 120000,
        "high": 250000
      },
      "engagementRate": {
        "low": 3.5,
        "mid": 4.8,
        "high": 6.2
      },
      "conversionRate": {
        "low": 2.1,
        "mid": 3.8,
        "high": 5.5
      }
    },
    "recommendations": [
      {
        "type": "improvement",
        "priority": "high",
        "suggestion": "Add faster cuts at 12s mark to maintain retention"
      },
      {
        "type": "optimization",
        "priority": "medium",
        "suggestion": "Post at 3pm EST for maximum engagement"
      }
    ],
    "optimalTiming": {
      "recommendedTime": "2025-01-20T15:00:00Z",
      "timezone": "America/New_York",
      "expectedMultiplier": 1.3
    }
  }
}
```

---

### 11.5 Generate Voiceover
**POST** `/ai/voiceover/generate`

Generates AI voiceover from text.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Hey guys! Today I'm showing you the most amazing summer dress...",
  "voiceId": "voice_sarah_casual",
  "language": "en-US",
  "emotion": "excited" | "neutral" | "serious" | "friendly",
  "speed": 1.0,
  "pitch": 0
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "audioUrl": "https://cdn.nexusugc.com/voiceovers/vo_xyz789.mp3",
    "duration": 15.5,
    "format": "mp3",
    "sampleRate": 48000,
    "bitrate": 320,
    "generatedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

## 12. Notification Service

### Base URL
```
https://api.creatorbridge.com/v1/notifications
```

### 12.1 Get Notifications
**GET** `/notifications`

Retrieves user notifications.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (string) - Filter by: `unread`, `read`, `all`
- `type` (string) - Filter by type: `campaign`, `payment`, `message`, `system`
- `page` (int)
- `limit` (int)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "notificationId": "ntf_abc123",
      "type": "campaign",
      "title": "New campaign application",
      "message": "Sarah Creator applied to your Summer Launch campaign",
      "status": "unread",
      "actionUrl": "/campaigns/cmp_abc123/applications/app_xyz789",
      "metadata": {
        "campaignId": "cmp_abc123",
        "applicationId": "app_xyz789"
      },
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### 12.2 Mark as Read
**POST** `/notifications/{notificationId}/read`

Marks a notification as read.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notificationId": "ntf_abc123",
    "status": "read",
    "readAt": "2025-01-15T14:00:00Z"
  }
}
```

---

### 12.3 Mark All as Read
**POST** `/notifications/read-all`

Marks all notifications as read.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "meta": {
    "message": "All notifications marked as read",
    "count": 12
  }
}
```

---

## 13. Billing Service

### Base URL
```
https://api.creatorbridge.com/v1/billing
```

### 13.1 Get Current Subscription
**GET** `/billing/subscription`

Retrieves current subscription details.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_abc123",
    "plan": {
      "id": "plan_pro",
      "name": "Pro",
      "price": 499,
      "currency": "USD",
      "billingCycle": "monthly",
      "features": [
        "Unlimited campaigns",
        "50 creators per campaign",
        "Advanced analytics",
        "Priority support"
      ]
    },
    "status": "active",
    "currentPeriod": {
      "startDate": "2025-01-15T00:00:00Z",
      "endDate": "2025-02-15T00:00:00Z"
    },
    "nextBillingDate": "2025-02-15T00:00:00Z",
    "cancelAtPeriodEnd": false,
    "paymentMethod": {
      "type": "card",
      "last4": "4242",
      "brand": "Visa",
      "expiryMonth": 12,
      "expiryYear": 2027
    }
  }
}
```

---

### 13.2 Update Subscription
**POST** `/billing/subscription/update`

Updates subscription plan.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "plan_enterprise",
  "billingCycle": "annual"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_abc123",
    "plan": {
      "id": "plan_enterprise",
      "name": "Enterprise",
      "price": 2499,
      "currency": "USD",
      "billingCycle": "monthly"
    },
    "prorationAmount": 2000,
    "nextBillingDate": "2025-02-15T00:00:00Z"
  },
  "meta": {
    "message": "Subscription updated successfully. Prorated amount charged."
  }
}
```

---

### 13.3 Get Invoices
**GET** `/billing/invoices`

Retrieves billing invoices.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `startDate` (date)
- `endDate` (date)
- `status` (string) - `paid`, `pending`, `failed`
- `page` (int)
- `limit` (int)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "invoiceId": "inv_abc123",
      "number": "INV-2025-001234",
      "status": "paid",
      "amount": 499,
      "currency": "USD",
      "description": "Pro Plan - Monthly",
      "period": {
        "startDate": "2025-01-15T00:00:00Z",
        "endDate": "2025-02-15T00:00:00Z"
      },
      "pdfUrl": "https://cdn.nexusugc.com/invoices/inv_abc123.pdf",
      "paidAt": "2025-01-15T00:05:00Z",
      "createdAt": "2025-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

## 14. Payout Service

### Base URL
```
https://api.creatorbridge.com/v1/payouts
```

### 14.1 Get Creator Balance
**GET** `/payouts/balance`

Retrieves the current balance and available payout amount for a creator.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "creatorId": "crt_abc123",
    "balances": {
      "available": 2450.00,
      "pending": 850.00,
      "lifetime": 45000.00,
      "currency": "USD"
    },
    "minimumPayout": 100.00,
    "nextPayoutDate": "2025-02-01T00:00:00Z",
    "payoutSchedule": "bi_weekly",
    "lastPayout": {
      "amount": 1200.00,
      "date": "2025-01-15T00:00:00Z",
      "status": "completed"
    }
  }
}
```

---

### 14.2 Get Earnings History
**GET** `/payouts/earnings`

Retrieves detailed earnings history.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `startDate` (date) - Filter earnings from this date
- `endDate` (date) - Filter earnings until this date
- `campaignId` (string) - Filter by campaign
- `status` (string) - Filter by: `pending`, `cleared`, `paid`
- `page` (int)
- `limit` (int)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "earnings": [
      {
        "earningId": "ern_abc123",
        "contentId": "cnt_xyz789",
        "campaignId": "cmp_def456",
        "campaign": {
          "name": "Summer Product Launch",
          "brand": "ACME Fashion"
        },
        "amount": {
          "gross": 1500.00,
          "platformFee": 225.00,
          "net": 1275.00,
          "currency": "USD"
        },
        "feePercentage": 15,
        "status": "cleared",
        "clearedAt": "2025-01-20T00:00:00Z",
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ],
    "summary": {
      "totalGross": 15000.00,
      "totalFees": 2250.00,
      "totalNet": 12750.00,
      "currency": "USD"
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 14.3 Request Payout
**POST** `/payouts/request`

Requests a payout to the creator's connected payout method.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 1000.00,
  "method": "stripe_connect" | "paypal" | "bank_transfer",
  "currency": "USD",
  "note": "January earnings withdrawal"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "payoutId": "pay_xyz789",
    "amount": 1000.00,
    "currency": "USD",
    "method": "stripe_connect",
    "status": "processing",
    "estimatedArrival": "2025-01-22T00:00:00Z",
    "createdAt": "2025-01-20T10:00:00Z"
  },
  "meta": {
    "message": "Payout request submitted successfully"
  }
}
```

**Errors:**
- `400 Bad Request` - Amount below minimum or exceeds available balance
- `403 Forbidden` - Payout method not configured or account not verified

---

### 14.4 Get Payout History
**GET** `/payouts/history`

Retrieves history of all payout requests.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
- `status` (string) - Filter by: `processing`, `completed`, `failed`, `cancelled`
- `startDate` (date)
- `endDate` (date)
- `page` (int)
- `limit` (int)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "payoutId": "pay_xyz789",
      "amount": 1000.00,
      "currency": "USD",
      "method": "stripe_connect",
      "status": "completed",
      "fee": 2.50,
      "netAmount": 997.50,
      "reference": "po_1234567890",
      "createdAt": "2025-01-20T10:00:00Z",
      "completedAt": "2025-01-22T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 24,
    "totalPages": 2
  }
}
```

---

### 14.5 Get Payout Account
**GET** `/payouts/account`

Retrieves the creator's payout account configuration.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "accountId": "acc_abc123",
        "type": "stripe_connect",
        "status": "verified",
        "isDefault": true,
        "details": {
          "accountId": "acct_1234567890",
          "email": "creator@example.com",
          "country": "US",
          "currency": "USD",
          "payoutsEnabled": true
        },
        "createdAt": "2025-01-01T10:00:00Z"
      },
      {
        "accountId": "acc_def456",
        "type": "paypal",
        "status": "verified",
        "isDefault": false,
        "details": {
          "email": "creator@paypal.com"
        },
        "createdAt": "2025-01-05T10:00:00Z"
      }
    ],
    "taxStatus": {
      "w9Submitted": true,
      "w8Submitted": false,
      "taxFormStatus": "verified"
    }
  }
}
```

---

### 14.6 Connect Payout Method
**POST** `/payouts/account/connect`

Initiates the connection flow for a new payout method.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "stripe_connect" | "paypal" | "bank_transfer",
  "returnUrl": "https://app.creatorbridge.com/payouts/callback",
  "country": "US"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "connectUrl": "https://connect.stripe.com/oauth/authorize?...",
    "expiresAt": "2025-01-15T11:00:00Z",
    "state": "state_token_xyz"
  }
}
```

---

### 14.7 Submit Tax Document
**POST** `/payouts/tax-documents`

Submits tax documentation (W-9/W-8) for payout compliance.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body:**
```
documentType: "w9" | "w8ben" | "w8ben_e"
file: [PDF binary]
taxId: "123-45-6789"
name: "John Doe"
address: {"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001", "country": "US"}
signature: "John Doe"
signatureDate: "2025-01-15"
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "documentId": "tax_abc123",
    "type": "w9",
    "status": "pending_review",
    "submittedAt": "2025-01-15T10:00:00Z",
    "estimatedReviewTime": "1-2 business days"
  },
  "meta": {
    "message": "Tax document submitted for review"
  }
}
```

---

### 14.8 Get Tax Documents
**GET** `/payouts/tax-documents`

Retrieves submitted tax documents and their status.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "documentId": "tax_abc123",
        "type": "w9",
        "status": "verified",
        "taxYear": 2025,
        "submittedAt": "2025-01-15T10:00:00Z",
        "verifiedAt": "2025-01-16T14:00:00Z",
        "expiresAt": "2026-12-31T23:59:59Z"
      }
    ],
    "forms1099": [
      {
        "formId": "1099_2024",
        "taxYear": 2024,
        "totalEarnings": 45000.00,
        "status": "available",
        "downloadUrl": "https://cdn.creatorbridge.com/tax/1099_2024_crt_abc123.pdf",
        "generatedAt": "2025-01-31T00:00:00Z"
      }
    ]
  }
}
```

---

### 14.9 Download 1099 Form
**GET** `/payouts/tax-documents/1099/{taxYear}`

Downloads the 1099 tax form for a specific year.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.creatorbridge.com/tax/1099_2024_crt_abc123.pdf?token=...",
    "expiresAt": "2025-01-15T11:00:00Z",
    "taxYear": 2024,
    "totalEarnings": 45000.00
  }
}
```

---

### 14.10 Update Payout Preferences
**PATCH** `/payouts/preferences`

Updates payout schedule and preferences.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "schedule": "weekly" | "bi_weekly" | "monthly" | "manual",
  "minimumPayout": 100.00,
  "defaultMethod": "acc_abc123",
  "holdPayouts": false,
  "notifications": {
    "onEarning": true,
    "onPayout": true,
    "onTaxForm": true
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "schedule": "bi_weekly",
    "minimumPayout": 100.00,
    "defaultMethod": "acc_abc123",
    "nextScheduledPayout": "2025-02-01T00:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

## 15. Webhooks & Events

### Webhook Configuration
**POST** `/webhooks`

Register a webhook endpoint to receive real-time events.

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhooks/nexus",
  "events": [
    "campaign.created",
    "campaign.updated",
    "content.uploaded",
    "content.approved",
    "payment.succeeded",
    "application.submitted"
  ],
  "secret": "your_webhook_secret"
}
```

---

### Webhook Events

All webhook payloads follow this structure:

```json
{
  "eventId": "evt_abc123",
  "eventType": "campaign.created",
  "timestamp": "2025-01-15T10:00:00Z",
  "data": {
    // Event-specific payload
  }
}
```

**Available Events:**

| Event | Description |
|-------|-------------|
| `user.created` | New user registered |
| `campaign.created` | New campaign created |
| `campaign.updated` | Campaign details updated |
| `campaign.completed` | Campaign marked as complete |
| `content.uploaded` | New content uploaded |
| `content.approved` | Content approved by brand |
| `content.rejected` | Content rejected |
| `content.published` | Content published to social platform |
| `application.submitted` | Creator applied to campaign |
| `application.accepted` | Application accepted |
| `application.rejected` | Application rejected |
| `payment.succeeded` | Payment processed successfully |
| `payment.failed` | Payment failed |
| `subscription.updated` | Subscription plan changed |
| `subscription.cancelled` | Subscription cancelled |

---

## 16. Rate Limits

### Standard Rate Limits

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| **Authentication** | 10 requests | per minute |
| **Read Operations (GET)** | 100 requests | per minute |
| **Write Operations (POST/PATCH/PUT)** | 50 requests | per minute |
| **File Uploads** | 10 requests | per minute |
| **AI Generation** | 20 requests | per hour |
| **Webhook Configuration** | 5 requests | per hour |

### Enterprise Rate Limits

Enterprise plans have higher rate limits:

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| **Read Operations** | 1,000 requests | per minute |
| **Write Operations** | 500 requests | per minute |
| **AI Generation** | 200 requests | per hour |

### Rate Limit Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320000
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "retryAfter": 42
  }
}
```

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `BAD_REQUEST` | Invalid request parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (e.g., duplicate) |
| 422 | `VALIDATION_ERROR` | Request validation failed |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

## Authentication

All API requests (except `/auth/login` and `/auth/register`) require authentication using Bearer tokens.

**Header Format:**
```
Authorization: Bearer {accessToken}
```

**Token Expiry:**
- Access tokens expire after 1 hour
- Refresh tokens expire after 30 days
- Use `/auth/refresh` to get new access token

---

## Pagination

All list endpoints support pagination using these query parameters:

- `page` (int) - Page number (default: 1)
- `limit` (int) - Items per page (default: 20, max: 100)

**Response includes pagination metadata:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 127,
    "totalPages": 7,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## Versioning

API version is included in the base URL:
```
https://api.nexusugc.com/v1/...
```

Major version changes will be announced 6 months in advance.

---

**End of API Inventory**

For detailed examples and SDKs, visit: https://docs.creatorbridge.com
