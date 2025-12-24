# Content Service

## Overview

The Content Service manages all content lifecycle operations for the NEXUS UGC platform. It handles media uploads, content metadata, versioning, AI-powered generation, templates, and collaborative commenting features.

**Port:** 3005 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Azure Blob Storage

## Responsibilities

- Media file upload and management (images, videos, audio, documents)
- Content metadata and versioning
- AI-powered content generation (images, videos, scripts, captions)
- Template management for reusable content
- Collaborative commenting and feedback
- Content analytics tracking
- Processing pipeline for media optimization

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |

### Media Routes (`/media`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/upload` | Upload single file | Required |
| POST | `/upload-multiple` | Upload multiple files | Required |
| GET | `/` | List media files | Required |
| GET | `/:id` | Get media by ID | Required |
| DELETE | `/:id` | Delete media | Required |

### Content Routes (`/content`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List content | Required |
| POST | `/` | Create content | Required |
| GET | `/:id` | Get content details | Required |
| PATCH | `/:id` | Update content | Required |
| DELETE | `/:id` | Delete content | Required |
| GET | `/:id/versions` | Get content versions | Required |
| POST | `/:id/versions` | Create new version | Required |

### AI Generation Routes (`/ai`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/generate/image` | Generate AI image | Required |
| POST | `/generate/video` | Generate AI video | Required |
| POST | `/generate/script` | Generate script/copy | Required |
| POST | `/generate/caption` | Generate captions | Required |
| POST | `/generate/hashtags` | Generate hashtags | Required |
| GET | `/generations` | List generation history | Required |
| GET | `/generations/:id` | Get generation status | Required |

### Template Routes (`/templates`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List templates | Required |
| POST | `/` | Create template | Required |
| GET | `/:id` | Get template | Required |
| PUT | `/:id` | Update template | Required |
| DELETE | `/:id` | Delete template | Required |

### Comment Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/content/:id/comments` | Get comments | Required |
| POST | `/content/:id/comments` | Add comment | Required |
| PUT | `/comments/:id` | Update comment | Required |
| DELETE | `/comments/:id` | Delete comment | Required |
| POST | `/comments/:id/resolve` | Resolve comment | Required |

### Request/Response Examples

#### Upload Media
```http
POST /media/upload
Content-Type: multipart/form-data

file: [binary]
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "VIDEO",
    "originalFilename": "campaign-video.mp4",
    "mimeType": "video/mp4",
    "size": 52428800,
    "width": 1920,
    "height": 1080,
    "duration": 45.5,
    "url": "https://storage.example.com/...",
    "thumbnailUrl": "https://storage.example.com/.../thumb",
    "status": "PROCESSING"
  }
}
```

#### Generate AI Image
```json
POST /ai/generate/image
{
  "prompt": "A modern minimalist product shot of a skincare bottle",
  "negativePrompt": "blurry, low quality",
  "model": "stable-diffusion-xl",
  "parameters": {
    "width": 1024,
    "height": 1024,
    "steps": 50
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "estimatedTime": 30
  }
}
```

## Data Models

### Media
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Owner organization |
| uploadedBy | UUID | Uploader user |
| type | Enum | IMAGE, VIDEO, AUDIO, DOCUMENT |
| originalFilename | String | Original filename |
| filename | String | Stored filename |
| mimeType | String | MIME type |
| size | BigInt | Size in bytes |
| width | Int | Width (media) |
| height | Int | Height (media) |
| duration | Float | Duration (video/audio) |
| url | String | Storage URL |
| thumbnailUrl | String | Thumbnail URL |
| cdnUrl | String | CDN URL |
| blurhash | String | BlurHash placeholder |
| status | Enum | UPLOADING, PROCESSING, READY, ERROR |
| metadata | JSON | Additional metadata |

### Content
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Owner organization |
| creatorId | UUID | Creator reference |
| campaignId | UUID | Associated campaign |
| mediaId | UUID | Primary media |
| title | String | Content title |
| description | String | Description |
| caption | String | Social caption |
| type | Enum | VIDEO, IMAGE, CAROUSEL, STORY, REEL, TIKTOK, YOUTUBE, BLOG |
| status | Enum | DRAFT, PENDING_REVIEW, REVISION_REQUESTED, APPROVED, SCHEDULED, PUBLISHED, ARCHIVED |
| platform | String | Target platform |
| scheduledAt | DateTime | Scheduled publish time |
| publishedAt | DateTime | Actual publish time |
| externalUrl | String | Published URL |
| externalId | String | Platform content ID |
| hashtags | String[] | Associated hashtags |
| mentions | String[] | Mentioned accounts |

### ContentVersion
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| contentId | UUID | Parent content |
| version | Int | Version number |
| title | String | Version title |
| description | String | Version description |
| caption | String | Version caption |
| mediaUrl | String | Version media URL |
| changes | JSON | Change description |
| createdBy | UUID | Version creator |

### AIGeneration
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Organization |
| userId | UUID | Requesting user |
| type | Enum | IMAGE, VIDEO, SCRIPT, CAPTION, HASHTAG, THUMBNAIL, AVATAR, VOICE |
| prompt | String | Input prompt |
| negativePrompt | String | Negative prompt |
| model | String | AI model used |
| parameters | JSON | Generation parameters |
| status | Enum | PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED |
| resultUrl | String | Result file URL |
| thumbnailUrl | String | Result thumbnail |
| cost | Decimal | Generation cost |
| processingTime | Int | Time in milliseconds |
| error | String | Error message |

### Template
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Owner (null = public) |
| createdBy | UUID | Creator |
| name | String | Template name |
| description | String | Description |
| type | Enum | VIDEO, IMAGE, STORY, CAROUSEL, CAPTION |
| category | String | Template category |
| thumbnailUrl | String | Preview image |
| config | JSON | Template configuration |
| isPublic | Boolean | Public availability |
| usageCount | Int | Times used |

### ContentComment
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| contentId | UUID | Target content |
| userId | UUID | Commenter |
| parentId | UUID | Parent comment (for threads) |
| text | String | Comment text |
| timestamp | Float | Video timestamp (if applicable) |
| resolved | Boolean | Resolved status |

### ContentAnalytics
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| contentId | UUID | Target content |
| views | BigInt | View count |
| likes | BigInt | Like count |
| comments | BigInt | Comment count |
| shares | BigInt | Share count |
| saves | BigInt | Save count |
| reach | BigInt | Reach/impressions |
| engagementRate | Float | Engagement percentage |
| clickThroughRate | Float | CTR percentage |
| lastSyncedAt | DateTime | Last sync from platform |

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| user-service | User information |
| campaign-service | Campaign association |
| analytics-service | Performance tracking |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | Data storage |
| Azure Blob Storage | Media file storage |
| Azure CDN | Content delivery |
| Redis | Processing queues, caching |
| OpenAI/Stability AI | AI generation |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3005 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | No | - | Redis connection |
| `AZURE_STORAGE_CONNECTION_STRING` | Yes | - | Azure Storage |
| `AZURE_STORAGE_CONTAINER` | Yes | - | Storage container |
| `CDN_BASE_URL` | No | - | CDN base URL |
| `OPENAI_API_KEY` | No | - | OpenAI API key |
| `STABILITY_API_KEY` | No | - | Stability AI key |
| `MAX_FILE_SIZE` | No | 100MB | Max upload size |

## Database Schema

### Tables

- `media` - Media files metadata
- `media_versions` - Media version history
- `content` - Content items
- `content_versions` - Content versions
- `content_comments` - Comments and feedback
- `content_analytics` - Performance metrics
- `ai_generations` - AI generation requests
- `templates` - Reusable templates

### Indexes
- `media`: (organization_id), (uploaded_by), (type), (status)
- `content`: (organization_id), (creator_id), (campaign_id), (status)
- `ai_generations`: (organization_id), (user_id), (type), (status)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `content.created` | New content created |
| `content.updated` | Content updated |
| `content.published` | Content published |
| `content.deleted` | Content deleted |
| `media.uploaded` | Media file uploaded |
| `media.processed` | Media processing complete |
| `ai.generation.started` | AI generation started |
| `ai.generation.completed` | AI generation complete |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `campaign.created` | campaign-service | Enable content creation |
| `user.deleted` | user-service | Clean up user content |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `INVALID_FILE_TYPE` | 400 | File type not allowed |
| `UPLOAD_FAILED` | 500 | File upload failed |
| `MEDIA_NOT_FOUND` | 404 | Media ID not found |
| `CONTENT_NOT_FOUND` | 404 | Content ID not found |
| `GENERATION_FAILED` | 500 | AI generation failed |
| `QUOTA_EXCEEDED` | 403 | AI generation quota exceeded |
| `PROCESSING_ERROR` | 500 | Media processing failed |
| `UNAUTHORIZED` | 401 | Authentication required |

## Media Processing Pipeline

1. **Upload** - Receive file, validate type/size
2. **Store** - Save to Azure Blob Storage
3. **Process** - Generate thumbnails, extract metadata
4. **Optimize** - Compress, transcode as needed
5. **CDN** - Push to CDN edge nodes
6. **Ready** - Mark as available
