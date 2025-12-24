# Workflow Service

## Overview

The Workflow Service provides workflow automation capabilities for the NEXUS UGC platform. It enables users to create automated workflows triggered by events, schedules, or webhooks, with a visual workflow builder and comprehensive execution tracking.

**Port:** 3015 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis

## Responsibilities

- Workflow definition and management
- Multiple trigger types (manual, scheduled, webhook, event)
- Workflow execution engine
- Step-by-step execution tracking
- Execution history and debugging
- Schedule management (cron-based)
- Integration with platform services

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |

### Workflow Routes (`/workflows`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create workflow | Required |
| GET | `/user/:userId` | Get user workflows | Required |
| GET | `/:id` | Get workflow by ID | Required |
| PATCH | `/:id` | Update workflow | Required |
| DELETE | `/:id` | Delete workflow | Required |
| POST | `/:id/execute` | Execute workflow | Required |
| POST | `/:id/activate` | Activate workflow | Required |
| POST | `/:id/deactivate` | Deactivate workflow | Required |
| GET | `/:id/executions` | Get execution history | Required |

### Execution Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/executions/:executionId` | Get execution details | Required |
| POST | `/executions/:executionId/cancel` | Cancel execution | Required |

### Schedule Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/:id/schedules` | Create schedule | Required |
| GET | `/:id/schedules` | Get schedules | Required |
| PUT | `/schedules/:scheduleId` | Update schedule | Required |
| DELETE | `/schedules/:scheduleId` | Delete schedule | Required |

### Request/Response Examples

#### Create Workflow
```json
POST /workflows
{
  "userId": "uuid",
  "name": "Auto-Publish Content",
  "description": "Publish approved content to social platforms",
  "trigger": "EVENT",
  "triggerConfig": {
    "event": "content.approved",
    "filters": {
      "platform": "instagram"
    }
  },
  "definition": {
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger",
        "event": "content.approved"
      },
      {
        "id": "publish",
        "type": "action",
        "action": "publish_content",
        "config": {
          "platform": "{{trigger.platform}}"
        }
      },
      {
        "id": "notify",
        "type": "action",
        "action": "send_notification",
        "config": {
          "type": "EMAIL",
          "template": "content-published"
        }
      }
    ],
    "edges": [
      { "from": "trigger", "to": "publish" },
      { "from": "publish", "to": "notify" }
    ]
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Auto-Publish Content",
    "trigger": "EVENT",
    "isActive": false,
    "version": 1,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Execute Workflow
```json
POST /workflows/uuid/execute
{
  "input": {
    "contentId": "uuid",
    "platform": "instagram"
  }
}

Response:
{
  "success": true,
  "data": {
    "executionId": "uuid"
  }
}
```

#### Get Execution Details
```json
GET /workflows/executions/uuid

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "workflowId": "uuid",
    "status": "COMPLETED",
    "trigger": "MANUAL",
    "input": { "contentId": "uuid" },
    "output": { "publishedUrl": "https://..." },
    "stepsExecuted": 3,
    "stepsFailed": 0,
    "duration": 2500,
    "startedAt": "2024-01-15T10:00:00Z",
    "completedAt": "2024-01-15T10:00:02.500Z",
    "steps": [
      {
        "id": "uuid",
        "stepId": "trigger",
        "name": "Trigger",
        "type": "trigger",
        "status": "COMPLETED",
        "duration": 10
      },
      {
        "id": "uuid",
        "stepId": "publish",
        "name": "Publish Content",
        "type": "action",
        "status": "COMPLETED",
        "duration": 2000,
        "output": { "publishedUrl": "https://..." }
      },
      {
        "id": "uuid",
        "stepId": "notify",
        "name": "Send Notification",
        "type": "action",
        "status": "COMPLETED",
        "duration": 500
      }
    ]
  }
}
```

## Data Models

### Workflow
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Owner user |
| name | String | Workflow name |
| description | String | Description |
| definition | JSON | Workflow definition (nodes, edges) |
| trigger | Enum | Trigger type |
| triggerConfig | JSON | Trigger configuration |
| isActive | Boolean | Active status |
| version | Int | Version number |
| tags | String[] | Tags for organization |
| metadata | JSON | Additional metadata |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update |

### TriggerType Enum
- `MANUAL` - Manually triggered
- `SCHEDULE` - Cron schedule
- `WEBHOOK` - HTTP webhook
- `EVENT` - Platform event
- `EMAIL` - Email trigger
- `DATABASE` - Database change

### WorkflowExecution
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| workflowId | UUID | Workflow reference |
| status | Enum | Execution status |
| trigger | String | Trigger that started execution |
| input | JSON | Input data |
| output | JSON | Final output |
| error | String | Error message |
| stepsExecuted | Int | Steps completed |
| stepsFailed | Int | Steps failed |
| duration | Int | Duration in milliseconds |
| startedAt | DateTime | Start timestamp |
| completedAt | DateTime | Completion timestamp |

### ExecutionStatus Enum
- `PENDING` - Awaiting execution
- `RUNNING` - Currently executing
- `COMPLETED` - Successfully completed
- `FAILED` - Execution failed
- `CANCELLED` - Cancelled by user
- `TIMEOUT` - Execution timed out

### ExecutionStep
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| executionId | UUID | Execution reference |
| stepId | String | Step ID from definition |
| name | String | Step name |
| type | String | Step type (trigger, action, condition) |
| status | Enum | Step status |
| input | JSON | Step input |
| output | JSON | Step output |
| error | String | Error message |
| duration | Int | Duration in milliseconds |
| startedAt | DateTime | Start timestamp |
| completedAt | DateTime | Completion timestamp |

### WorkflowSchedule
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| workflowId | UUID | Workflow reference |
| cronExpression | String | Cron expression |
| timezone | String | Timezone (default: UTC) |
| isActive | Boolean | Active status |
| lastRunAt | DateTime | Last execution |
| nextRunAt | DateTime | Next scheduled run |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update |

## Workflow Definition Schema

```json
{
  "nodes": [
    {
      "id": "string",
      "type": "trigger | action | condition | loop | delay",
      "name": "string",
      "config": {}
    }
  ],
  "edges": [
    {
      "from": "nodeId",
      "to": "nodeId",
      "condition": "optional expression"
    }
  ],
  "variables": {
    "varName": "value"
  }
}
```

## Available Node Types

### Triggers
| Type | Description |
|------|-------------|
| `manual` | Manual execution |
| `schedule` | Cron-based schedule |
| `webhook` | HTTP webhook |
| `event` | Platform event |

### Actions
| Type | Description |
|------|-------------|
| `http_request` | Make HTTP request |
| `send_email` | Send email notification |
| `send_notification` | Send platform notification |
| `create_content` | Create content item |
| `publish_content` | Publish to platform |
| `create_campaign` | Create campaign |
| `update_record` | Update database record |
| `run_script` | Execute custom script |

### Control Flow
| Type | Description |
|------|-------------|
| `condition` | If/else branching |
| `switch` | Multi-way branching |
| `loop` | Iterate over collection |
| `delay` | Wait for duration |
| `wait_for` | Wait for condition |

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| content-service | Content operations |
| campaign-service | Campaign operations |
| notification-service | Notifications |
| integration-service | External integrations |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | Data storage |
| Redis | Job queue, caching |
| Bull | Job processing |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3015 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | Yes | - | Redis connection |
| `MAX_EXECUTION_TIME` | No | 300000 | Max execution time (5 min) |
| `MAX_CONCURRENT_EXECUTIONS` | No | 10 | Max concurrent executions |
| `CONTENT_SERVICE_URL` | No | - | Content service URL |
| `CAMPAIGN_SERVICE_URL` | No | - | Campaign service URL |
| `NOTIFICATION_SERVICE_URL` | No | - | Notification service URL |

## Database Schema

### Tables

- `workflows` - Workflow definitions
- `workflow_executions` - Execution records
- `execution_steps` - Step-by-step execution
- `workflow_schedules` - Cron schedules

### Indexes
- `workflows`: (user_id), (is_active)
- `workflow_executions`: (workflow_id), (status), (started_at)
- `execution_steps`: (execution_id)
- `workflow_schedules`: (workflow_id), (next_run_at)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `workflow.created` | Workflow created |
| `workflow.updated` | Workflow updated |
| `workflow.activated` | Workflow activated |
| `workflow.deactivated` | Workflow deactivated |
| `workflow.deleted` | Workflow deleted |
| `execution.started` | Execution started |
| `execution.completed` | Execution completed |
| `execution.failed` | Execution failed |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `content.created` | content-service | Trigger workflows |
| `content.approved` | content-service | Trigger workflows |
| `campaign.created` | campaign-service | Trigger workflows |
| `campaign.completed` | campaign-service | Trigger workflows |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `WORKFLOW_NOT_FOUND` | 404 | Workflow not found |
| `EXECUTION_NOT_FOUND` | 404 | Execution not found |
| `SCHEDULE_NOT_FOUND` | 404 | Schedule not found |
| `INVALID_DEFINITION` | 400 | Invalid workflow definition |
| `INVALID_CRON` | 400 | Invalid cron expression |
| `WORKFLOW_INACTIVE` | 400 | Workflow is inactive |
| `EXECUTION_RUNNING` | 400 | Execution already running |
| `EXECUTION_TIMEOUT` | 408 | Execution timed out |
| `STEP_FAILED` | 500 | Workflow step failed |
| `UNAUTHORIZED` | 401 | Authentication required |

## Cron Expression Examples

| Expression | Description |
|------------|-------------|
| `0 * * * *` | Every hour |
| `0 9 * * *` | Every day at 9 AM |
| `0 9 * * 1` | Every Monday at 9 AM |
| `0 0 1 * *` | First of every month |
| `*/15 * * * *` | Every 15 minutes |

## Execution Limits

- Maximum execution time: 5 minutes
- Maximum concurrent executions per user: 10
- Maximum workflow steps: 50
- Maximum nested loops: 3
- Webhook request timeout: 30 seconds
