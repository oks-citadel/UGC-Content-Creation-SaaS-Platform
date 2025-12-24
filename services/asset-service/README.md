# Asset Service

## Overview

The Asset Service manages digital asset storage, organization, and delivery for the NEXUS UGC platform. It handles file uploads, asset versioning, transformation pipelines, and CDN integration for optimal content delivery.

**Port:** 3011 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Azure Blob Storage

## Responsibilities

- Upload and store digital assets (images, videos, documents)
- Generate thumbnails and variants
- Manage asset versions and metadata
- Provide secure asset URLs with CDN integration
- Organize assets into folders/collections
- Handle asset transformations and optimization

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/ready` | Readiness check |

### Asset Routes (`/assets`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/upload` | Upload single asset | Required |
| POST | `/upload/multiple` | Upload multiple assets | Required |
| GET | `/` | List assets | Required |
| GET | `/:id` | Get asset by ID | Required |
| GET | `/:id/download` | Get download URL | Required |
| DELETE | `/:id` | Delete asset | Required |
| PUT | `/:id` | Update asset metadata | Required |
| POST | `/:id/copy` | Copy asset | Required |
| POST | `/:id/move` | Move asset to folder | Required |

### Folder Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/folders` | Create folder | Required |
| GET | `/folders` | List folders | Required |
| GET | `/folders/:id` | Get folder contents | Required |
| PUT | `/folders/:id` | Update folder | Required |
| DELETE | `/folders/:id` | Delete folder | Required |

### Transformation Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/:id/transform` | Get transformed asset | Required |
| POST | `/:id/process` | Queue asset processing | Required |

### Request/Response Examples

#### Upload Asset
```http
POST /assets/upload
Content-Type: multipart/form-data

file: [binary]
folderId: "uuid" (optional)
metadata: {"alt": "Description"}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "image.jpg",
    "originalFilename": "my-photo.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "width": 1920,
    "height": 1080,
    "url": "https://cdn.example.com/assets/...",
    "thumbnailUrl": "https://cdn.example.com/assets/.../thumb",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## Data Models

### Asset
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Owner organization |
| folderId | UUID | Parent folder (nullable) |
| filename | String | Stored filename |
| originalFilename | String | Original upload name |
| mimeType | String | MIME type |
| size | BigInt | File size in bytes |
| width | Int | Width (images/videos) |
| height | Int | Height (images/videos) |
| duration | Float | Duration (videos/audio) |
| url | String | Primary storage URL |
| cdnUrl | String | CDN delivery URL |
| thumbnailUrl | String | Thumbnail URL |
| blurhash | String | BlurHash placeholder |
| metadata | JSON | Custom metadata |
| status | Enum | UPLOADING, PROCESSING, READY, ERROR |
| uploadedBy | UUID | User who uploaded |
| createdAt | DateTime | Upload timestamp |
| updatedAt | DateTime | Last modification |

### AssetVersion
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| assetId | UUID | Parent asset |
| version | Int | Version number |
| url | String | Version URL |
| size | BigInt | Version size |
| changes | JSON | Change description |
| createdBy | UUID | User who created version |
| createdAt | DateTime | Version timestamp |

### Folder
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Owner organization |
| parentId | UUID | Parent folder (nullable) |
| name | String | Folder name |
| path | String | Full path |
| createdBy | UUID | Creator |
| createdAt | DateTime | Created timestamp |

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| user-service | User authorization |
| content-service | Asset-content relationships |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | Metadata storage |
| Azure Blob Storage | File storage |
| Azure CDN | Content delivery |
| Redis | Upload session management |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3011 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | Yes | - | Redis connection |
| `AZURE_STORAGE_CONNECTION_STRING` | Yes | - | Azure Storage connection |
| `AZURE_STORAGE_CONTAINER` | Yes | - | Blob container name |
| `CDN_BASE_URL` | No | - | CDN base URL |
| `MAX_FILE_SIZE` | No | 100MB | Maximum upload size |
| `ALLOWED_MIME_TYPES` | No | image/*,video/*,audio/*,application/pdf | Allowed file types |

## Database Schema

### Tables

- `assets` - Asset metadata and references
- `asset_versions` - Version history
- `folders` - Folder hierarchy
- `asset_tags` - Asset tagging

### Indexes
- `assets`: (organization_id), (folder_id), (uploaded_by), (status), (mime_type)
- `folders`: (organization_id), (parent_id), (path)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `asset.uploaded` | New asset uploaded |
| `asset.processed` | Asset processing complete |
| `asset.deleted` | Asset removed |
| `asset.moved` | Asset moved to different folder |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `organization.deleted` | user-service | Clean up organization assets |
| `content.deleted` | content-service | Clean up associated assets |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `FILE_TOO_LARGE` | 413 | File exceeds maximum size |
| `INVALID_FILE_TYPE` | 400 | File type not allowed |
| `UPLOAD_FAILED` | 500 | Storage upload failed |
| `ASSET_NOT_FOUND` | 404 | Asset ID not found |
| `FOLDER_NOT_FOUND` | 404 | Folder ID not found |
| `PROCESSING_FAILED` | 500 | Asset processing failed |
| `QUOTA_EXCEEDED` | 403 | Storage quota exceeded |
| `UNAUTHORIZED` | 401 | Authentication required |

## Background Jobs

| Job | Trigger | Description |
|-----|---------|-------------|
| Thumbnail Generation | On upload | Generate image/video thumbnails |
| Video Transcoding | On upload | Transcode videos to web formats |
| Metadata Extraction | On upload | Extract EXIF/media metadata |
| Cleanup Orphans | Daily | Remove orphaned asset files |
| CDN Purge | On delete | Purge deleted assets from CDN |

## File Processing Pipeline

1. **Upload** - File received and stored in temp location
2. **Validation** - MIME type and size validation
3. **Storage** - Move to permanent Azure Blob Storage
4. **Processing** - Generate thumbnails, extract metadata
5. **CDN Sync** - Sync to CDN edge locations
6. **Ready** - Asset available for use
