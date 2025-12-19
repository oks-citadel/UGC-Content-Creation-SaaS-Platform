# NEXUS Workers

Background job workers for the NEXUS UGC Content Creation Platform using Node.js, TypeScript, and BullMQ.

## Workers

### 1. Video Processor (`video-processor/`)
Handles video processing operations including transcoding, thumbnail generation, and optimization.

**Capabilities:**
- Transcode videos to HLS, DASH, and MP4 formats
- Generate multiple thumbnail sizes
- Extract video metadata (duration, resolution, codec, etc.)
- Optimize videos for web delivery
- Add watermarks to videos

**Technologies:**
- FFmpeg for video processing
- Sharp for image manipulation
- BullMQ for job queue management

**Health Check:** `http://localhost:3001/health`

### 2. Social Publisher (`social-publisher/`)
Manages publishing content to social media platforms with OAuth, rate limiting, and retry logic.

**Capabilities:**
- Publish to TikTok, Instagram, YouTube, and Facebook
- Schedule posts for future publishing
- Handle platform-specific rate limits
- Retry failed publishes with exponential backoff
- Track publishing status

**Platform Adapters:**
- TikTok API integration
- Instagram Graph API
- YouTube Data API v3
- Facebook Graph API

**Health Check:** `http://localhost:3002/health`

### 3. Analytics Aggregator (`analytics-aggregator/`)
Collects and aggregates analytics data from social platforms.

**Capabilities:**
- Collect metrics from all supported platforms
- Aggregate daily and weekly statistics
- Calculate engagement rates
- Detect anomalies in performance
- Generate analytics reports with insights and recommendations

**Collectors:**
- TikTok metrics collector
- Instagram insights collector
- YouTube analytics collector
- Facebook insights collector

**Health Check:** `http://localhost:3003/health`

### 4. Notification Dispatcher (`notification-dispatcher/`)
Dispatches notifications through multiple channels.

**Capabilities:**
- Send emails via SendGrid
- Send SMS via Twilio
- Send push notifications via Firebase
- Send Slack messages
- Send webhooks with signature verification

**Providers:**
- Email (SendGrid)
- SMS (Twilio)
- Push (Firebase Cloud Messaging)
- Slack (Slack Web API)
- Webhook (HTTP with HMAC signatures)

**Templates:**
- Welcome email
- Video processing complete
- Publishing success

**Health Check:** `http://localhost:3004/health`

## Architecture

All workers share the following features:

- **BullMQ Integration:** Redis-backed job queue with priority, delayed jobs, and retries
- **Graceful Shutdown:** Proper cleanup of connections and in-flight jobs
- **Health Checks:** HTTP endpoints for health monitoring
- **Structured Logging:** JSON logging with Pino
- **Retry Logic:** Exponential backoff for failed operations
- **Event Emission:** Job completion and failure events
- **Docker Support:** Production-ready Dockerfiles
- **TypeScript:** Type-safe code with strict mode enabled

## Setup

### Prerequisites

- Node.js 18+
- Redis 6+
- FFmpeg (for video-processor)
- Platform API credentials (for social-publisher)
- Notification service credentials (for notification-dispatcher)

### Installation

Each worker can be installed independently:

```bash
cd workers/video-processor
npm install
npm run build

cd ../social-publisher
npm install
npm run build

cd ../analytics-aggregator
npm install
npm run build

cd ../notification-dispatcher
npm install
npm run build
```

### Environment Variables

#### Shared (All Workers)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
WORKER_CONCURRENCY=5
MAX_RETRIES=3
BACKOFF_DELAY=5000
LOG_LEVEL=info
NODE_ENV=production
```

#### Video Processor
```env
HEALTH_CHECK_PORT=3001
TEMP_DIR=/tmp/video-processing
WATERMARK_ENABLED=false
WATERMARK_PATH=/assets/watermark.png
WATERMARK_POSITION=bottomright
VIDEO_BITRATE=2000k
AUDIO_BITRATE=128k
FFMPEG_PRESET=medium
STORAGE_PROVIDER=s3
STORAGE_BUCKET=nexus-videos
AWS_REGION=us-east-1
```

#### Social Publisher
```env
HEALTH_CHECK_PORT=3002
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=
```

#### Analytics Aggregator
```env
HEALTH_CHECK_PORT=3003
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=
```

#### Notification Dispatcher
```env
HEALTH_CHECK_PORT=3004
SENDGRID_API_KEY=
EMAIL_FROM=noreply@nexus.com
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
FIREBASE_SERVICE_ACCOUNT={}
SLACK_BOT_TOKEN=
```

## Running Workers

### Development

```bash
# Video Processor
cd workers/video-processor
npm run dev

# Social Publisher
cd workers/social-publisher
npm run dev

# Analytics Aggregator
cd workers/analytics-aggregator
npm run dev

# Notification Dispatcher
cd workers/notification-dispatcher
npm run dev
```

### Production

```bash
# Build
npm run build

# Start
npm start
```

### Docker

```bash
# Build all workers
docker-compose build

# Start all workers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all workers
docker-compose down
```

## Job Queue Usage

### Video Processing Job

```typescript
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis();
const videoQueue = new Queue('video-processing', { connection });

await videoQueue.add('process-video', {
  videoId: 'video-123',
  inputPath: '/path/to/video.mp4',
  userId: 'user-456',
  options: {
    formats: ['hls', 'mp4'],
    watermark: true,
    thumbnails: true,
  },
});
```

### Social Publishing Job

```typescript
const publishQueue = new Queue('social-publishing', { connection });

await publishQueue.add('publish-to-tiktok', {
  platform: 'tiktok',
  credentials: {
    accessToken: 'token',
  },
  content: {
    videoPath: '/path/to/video.mp4',
    title: 'My Video',
    description: 'Check this out!',
  },
  settings: {
    privacy: 'PUBLIC',
    allowComments: true,
  },
});
```

### Analytics Collection Job

```typescript
const analyticsQueue = new Queue('analytics-aggregation', { connection });

await analyticsQueue.add('collect-metrics', {
  type: 'collect',
  platform: 'tiktok',
  accessToken: 'token',
  postId: 'post-123',
});
```

### Notification Job

```typescript
const notificationQueue = new Queue('notifications', { connection });

await notificationQueue.add('send-email', {
  type: 'email',
  template: 'email-welcome',
  templateData: {
    name: 'John Doe',
    dashboardUrl: 'https://nexus.com/dashboard',
  },
  email: {
    to: 'user@example.com',
    subject: 'Welcome to NEXUS',
  },
});
```

## Monitoring

Each worker exposes health check and metrics endpoints:

- `GET /health` - Health status
- `GET /metrics` - Job metrics

Example response:

```json
{
  "status": "healthy",
  "worker": "video-processor",
  "uptime": 12345.67,
  "memory": {
    "rss": 123456789,
    "heapTotal": 98765432,
    "heapUsed": 87654321,
    "external": 1234567
  }
}
```

## Error Handling

Workers implement comprehensive error handling:

1. **Retry Logic:** Failed jobs are retried with exponential backoff
2. **Dead Letter Queue:** Jobs that exceed max retries are moved to failed queue
3. **Error Logging:** All errors are logged with context
4. **Event Emission:** Failed jobs emit events for monitoring

## Scaling

Workers can be horizontally scaled by running multiple instances:

```bash
docker-compose up -d --scale video-processor=3 --scale social-publisher=2
```

BullMQ automatically distributes jobs across worker instances.

## Development

### Project Structure

```
workers/
├── video-processor/
│   ├── src/
│   │   ├── index.ts          # Worker entry point
│   │   ├── processor.ts      # Processing logic
│   │   └── config.ts         # Configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── social-publisher/
│   ├── src/
│   │   ├── index.ts
│   │   ├── publisher.ts
│   │   └── platforms/        # Platform adapters
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── analytics-aggregator/
│   ├── src/
│   │   ├── index.ts
│   │   ├── aggregator.ts
│   │   └── collectors/       # Platform collectors
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
└── notification-dispatcher/
    ├── src/
    │   ├── index.ts
    │   ├── dispatcher.ts
    │   ├── templates/        # Email templates
    │   └── providers/        # Notification providers
    ├── package.json
    ├── tsconfig.json
    └── Dockerfile
```

## License

MIT
