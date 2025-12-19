# NEXUS Analytics Service

Comprehensive analytics and reporting microservice for the NEXUS UGC Content Creation Platform.

## Features

- **Real-time Metrics**: Track content, campaign, creator, and commerce metrics in real-time
- **Advanced Analytics**: Performance trends, comparisons, and aggregations
- **Custom Dashboards**: Create and customize analytics dashboards with flexible widgets
- **Automated Reporting**: Schedule reports in PDF, Excel, or CSV formats
- **Anomaly Detection**: Statistical anomaly detection with configurable alerts
- **Creative Fatigue Analysis**: Detect when content performance is declining
- **WebSocket Support**: Real-time metric updates via WebSocket connections
- **Multi-Entity Support**: Analyze content, campaigns, creators, and commerce data
- **Whitelabel Reports**: Custom branding for client reports

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **WebSocket**: ws library
- **Report Generation**: PDFKit, ExcelJS, json2csv
- **Statistics**: simple-statistics

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- RabbitMQ 3.12+

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
RABBITMQ_URL=amqp://...
PORT=3007
WS_PORT=3017
```

## API Endpoints

### Metrics

- `GET /api/metrics/:entityType/:entityId` - Get metrics
- `POST /api/metrics` - Record metrics
- `GET /api/metrics/:entityType/:entityId/trend` - Get metric trends
- `GET /api/metrics/:entityType/:entityId/compare` - Compare periods
- `GET /api/metrics/:entityType/top` - Get top performers

### Dashboards

- `GET /api/dashboards` - List dashboards
- `POST /api/dashboards` - Create dashboard
- `GET /api/dashboards/:id` - Get dashboard
- `PUT /api/dashboards/:id` - Update dashboard
- `DELETE /api/dashboards/:id` - Delete dashboard
- `GET /api/dashboards/:id/data` - Get dashboard data
- `GET /api/dashboards/unified/overview` - Unified cross-platform dashboard

### Reports

- `GET /api/reports` - List reports
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/:id/generate` - Generate report
- `GET /api/reports/:id/download` - Download report
- `GET /api/reports/:id/history` - Report execution history

### Real-time

- `GET /api/realtime/:entityType` - Get real-time stats
- `GET /api/realtime/status` - WebSocket server status
- WebSocket connection: `ws://localhost:3017`

### Anomalies

- `GET /api/anomalies` - List anomalies
- `POST /api/anomalies/detect` - Detect anomalies
- `PUT /api/anomalies/:id/resolve` - Resolve anomaly

### Alerts

- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `GET /api/alerts/:id` - Get alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert
- `GET /api/alerts/:id/triggers` - Alert trigger history

### Creative Fatigue

- `GET /api/fatigue/:contentId/:platformId` - Detect creative fatigue
- `GET /api/fatigue` - List fatigued content
- `POST /api/fatigue/:id/action` - Mark action taken

### Aggregators

- `POST /api/aggregate/content/:contentId` - Aggregate content metrics
- `POST /api/aggregate/campaign/:campaignId` - Aggregate campaign metrics
- `POST /api/aggregate/creator/:creatorId` - Aggregate creator metrics
- `POST /api/aggregate/commerce/product/:productId` - Aggregate product metrics

## WebSocket Usage

```javascript
const ws = new WebSocket('ws://localhost:3017');

// Subscribe to metrics
ws.send(JSON.stringify({
  type: 'subscribe',
  payload: {
    entityType: 'content',
    entityId: 'content-123',
    metrics: ['views', 'engagementRate']
  }
}));

// Receive updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Metric update:', data);
};
```

## Scheduled Tasks

The service supports scheduled report generation using cron expressions:

```javascript
{
  "schedule": {
    "cron": "0 9 * * 1",  // Every Monday at 9 AM
    "timezone": "America/New_York"
  }
}
```

## Anomaly Detection

Statistical anomaly detection using standard deviation:

- Analyzes historical data (default: 30 days)
- Calculates baseline and standard deviation
- Triggers alerts when deviation exceeds threshold (default: 2.5σ)
- Severity levels: low, medium, high, critical

## Creative Fatigue Detection

Detects when content performance is declining:

- Analyzes performance trends using linear regression
- Calculates fatigue score (0-100)
- Recommendations: continue, boost, refresh, retire
- Configurable thresholds per content piece

## Docker

```bash
# Build image
docker build -t nexus-analytics-service .

# Run container
docker run -p 3007:3007 -p 3017:3017 nexus-analytics-service
```

## Architecture

```
src/
├── config/           # Configuration
├── services/         # Business logic
│   ├── metrics.service.ts
│   ├── dashboard.service.ts
│   ├── reporting.service.ts
│   ├── realtime.service.ts
│   ├── anomaly.service.ts
│   └── fatigue.service.ts
├── aggregators/      # Data aggregators
│   ├── content.aggregator.ts
│   ├── campaign.aggregator.ts
│   ├── creator.aggregator.ts
│   └── commerce.aggregator.ts
├── routes/           # API routes
└── index.ts          # Entry point
```

## Performance

- Metrics are cached in Redis for fast access
- Aggregations run on scheduled intervals
- WebSocket for real-time updates without polling
- Database indexes on frequently queried fields

## License

MIT
