# ECS Fargate Architecture Design
## NEXUS Platform Migration

**Version:** 1.0
**Date:** 2026-01-07
**Author:** Platform Architect Agent

---

## 1. Architecture Overview

### 1.1 Target State Diagram

```
                                   ┌─────────────────────────────────────────────────────────────────┐
                                   │                         AWS Cloud                                │
                                   │  ┌─────────────────────────────────────────────────────────────┐│
                                   │  │                    VPC (10.1.0.0/16)                        ││
                                   │  │                                                              ││
     Users ────► CloudFront ───────│──│──► ALB ─────────┬────────────────────────────────────────────││
                    │              │  │        │        │                                            ││
                    │              │  │  ┌─────┴─────┐  │     Private Subnets (3 AZs)                ││
                    ▼              │  │  │   WAF     │  │  ┌─────────────────────────────────────┐   ││
                Route 53          │  │  └───────────┘  │  │                                      │   ││
                                   │  │                 │  │  ┌─────────────────────────────────┐│   ││
                                   │  │  Public Subnets │  │  │     ECS Fargate Cluster        ││   ││
                                   │  │  ┌───────────┐  │  │  │                                 ││   ││
                                   │  │  │ NAT GW x3 │  │  │  │  ┌─────────┐ ┌─────────┐       ││   ││
                                   │  │  └───────────┘  │  │  │  │ Service │ │ Service │ ...   ││   ││
                                   │  │                 │  │  │  │  Task   │ │  Task   │       ││   ││
                                   │  │                 │  │  │  └────┬────┘ └────┬────┘       ││   ││
                                   │  │                 │  │  │       │           │            ││   ││
                                   │  │                 │  │  │  ┌────┴───────────┴────┐       ││   ││
                                   │  │                 │  │  │  │   Service Connect   │       ││   ││
                                   │  │                 │  │  │  └─────────────────────┘       ││   ││
                                   │  │                 │  │  └─────────────────────────────────┘│   ││
                                   │  │                 │  │                                      │   ││
                                   │  │                 │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐│   ││
                                   │  │                 │  │  │   RDS   │ │  Redis  │ │   S3    ││   ││
                                   │  │                 │  │  │ Postgres│ │ Cluster │ │ Buckets ││   ││
                                   │  │                 │  │  └─────────┘ └─────────┘ └─────────┘│   ││
                                   │  │                 │  └─────────────────────────────────────┘   ││
                                   │  └─────────────────────────────────────────────────────────────┘│
                                   └─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Compute | Fargate (serverless) | Zero EC2 management, pay-per-use |
| Networking | AWS VPC | Existing VPC preserved |
| Load Balancing | ALB (shared) | Cost optimization, path-based routing |
| Service Discovery | ECS Service Connect | Native AWS, no external dependencies |
| Secrets | AWS Secrets Manager | Already implemented |
| Logging | CloudWatch Logs | Native integration |
| Scaling | Application Auto Scaling | CPU/memory-based scaling |

---

## 2. ECS Cluster Design

### 2.1 Cluster Configuration

```hcl
resource "aws_ecs_cluster" "main" {
  name = "nexus-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = "/ecs/nexus-${var.environment}/execute-command"
      }
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}
```

### 2.2 Service Groupings

| Group | Services | Capacity Provider | Notes |
|-------|----------|-------------------|-------|
| **Core API** | api-gateway, auth-service, user-service | FARGATE (On-Demand) | Critical path |
| **Business Logic** | creator, campaign, content, commerce | FARGATE (On-Demand) | User-facing |
| **Support Services** | analytics, billing, notification | FARGATE (70% Spot) | Fault-tolerant |
| **Background Workers** | video-processor, social-publisher, etc. | FARGATE_SPOT (100%) | Async, retryable |
| **AI Services** | ai-center, moderation, recommendation | FARGATE (50% Spot) | Stateless inference |
| **Frontend Apps** | web, creator-portal, admin, brand-portal | FARGATE (On-Demand) | User-facing |

---

## 3. Application Load Balancer Design

### 3.1 ALB Configuration

```hcl
resource "aws_lb" "main" {
  name               = "nexus-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "prod"
  enable_http2               = true

  access_logs {
    bucket  = var.logs_bucket
    prefix  = "alb"
    enabled = true
  }
}
```

### 3.2 Routing Strategy (Path-Based)

| Path Pattern | Target Service | Priority |
|--------------|----------------|----------|
| `/api/v1/auth/*` | auth-service | 100 |
| `/api/v1/users/*` | user-service | 110 |
| `/api/v1/creators/*` | creator-service | 120 |
| `/api/v1/campaigns/*` | campaign-service | 130 |
| `/api/v1/content/*` | content-service | 140 |
| `/api/v1/commerce/*` | commerce-service | 150 |
| `/api/v1/analytics/*` | analytics-service | 160 |
| `/api/v1/billing/*` | billing-service | 170 |
| `/api/v1/marketplace/*` | marketplace-service | 180 |
| `/api/v1/notifications/*` | notification-service | 190 |
| `/api/v1/workflows/*` | workflow-service | 200 |
| `/api/v1/compliance/*` | compliance-service | 210 |
| `/api/v1/integrations/*` | integration-service | 220 |
| `/api/v1/payouts/*` | payout-service | 230 |
| `/api/v1/rights/*` | rights-service | 240 |
| `/api/v1/assets/*` | asset-service | 250 |
| `/api/v1/ai/*` | ai-service | 260 |
| `/api/*` | api-gateway | 900 (default) |
| `/*` | web | 999 (fallback) |

### 3.3 Host-Based Routing (Subdomains)

| Host | Target | Notes |
|------|--------|-------|
| `api.nexus.com` | Backend services | API routing |
| `app.nexus.com` | web | Main app |
| `creator.nexus.com` | creator-portal | Creator dashboard |
| `admin.nexus.com` | admin | Admin panel |
| `brand.nexus.com` | brand-portal | Brand interface |

---

## 4. Task Definition Patterns

### 4.1 Standard Backend Service

```hcl
resource "aws_ecs_task_definition" "service" {
  family                   = "nexus-${var.service_name}-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = var.service_name
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = var.environment_variables

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = var.database_url_secret_arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = var.jwt_secret_arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/nexus-${var.environment}/${var.service_name}"
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:${var.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}
```

### 4.2 Resource Sizing Matrix

| Service Type | CPU | Memory | Min Tasks | Max Tasks |
|--------------|-----|--------|-----------|-----------|
| api-gateway | 512 | 1024 | 2 | 10 |
| Backend Services | 256 | 512 | 2 | 8 |
| AI Services | 512 | 1024 | 1 | 4 |
| Frontend Apps | 256 | 512 | 2 | 6 |
| Workers | 256 | 512 | 1 | 10 |

---

## 5. Service-to-Service Communication

### 5.1 ECS Service Connect

```hcl
resource "aws_service_discovery_http_namespace" "main" {
  name        = "nexus-${var.environment}"
  description = "Service Connect namespace for NEXUS platform"
}

resource "aws_ecs_service" "service" {
  # ... other config ...

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.main.arn

    service {
      port_name      = var.service_name
      discovery_name = var.service_name

      client_alias {
        port     = var.container_port
        dns_name = var.service_name
      }
    }
  }
}
```

### 5.2 Internal DNS Names

Services communicate using simple hostnames:
- `auth-service:3001`
- `user-service:3002`
- `content-service:3005`
- etc.

---

## 6. Auto Scaling Design

### 6.1 Scaling Policies

```hcl
resource "aws_appautoscaling_target" "service" {
  max_capacity       = var.max_tasks
  min_capacity       = var.min_tasks
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.service_name}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.service.resource_id
  scalable_dimension = aws_appautoscaling_target.service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.service.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

resource "aws_appautoscaling_policy" "memory" {
  name               = "${var.service_name}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.service.resource_id
  scalable_dimension = aws_appautoscaling_target.service.scalable_dimension
  service_namespace  = aws_appautoscaling_target.service.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }
}
```

---

## 7. Security Architecture

### 7.1 Network Security

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │    ALB    │  ◄── Security Group: Allow 443 from 0.0.0.0/0
                    └─────┬─────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
     │ Service │    │ Service │    │ Service │  ◄── Security Group: Allow from ALB SG only
     │  Task   │    │  Task   │    │  Task   │
     └────┬────┘    └────┬────┘    └────┬────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
               ┌──────────┴──────────┐
               │                     │
          ┌────┴────┐          ┌────┴────┐
          │   RDS   │          │  Redis  │  ◄── Security Group: Allow from ECS Tasks SG only
          └─────────┘          └─────────┘
```

### 7.2 IAM Roles

| Role | Purpose | Key Permissions |
|------|---------|-----------------|
| Task Execution Role | Pull images, write logs | ecr:GetAuthorizationToken, logs:CreateLogStream |
| Task Role (per service) | App access to AWS | secretsmanager:GetSecretValue, s3:GetObject |
| CI/CD Role | Deploy services | ecs:UpdateService, ecr:PutImage |

---

## 8. Observability

### 8.1 Logging

All services log to CloudWatch Logs:
- Log Group: `/ecs/nexus-{environment}/{service-name}`
- Retention: 30 days (dev), 90 days (prod)

### 8.2 Metrics

CloudWatch Container Insights provides:
- CPU/Memory utilization
- Network I/O
- Task count
- Service-level aggregations

### 8.3 Alarms

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU > 85% | 5 min | SNS Alert |
| Memory > 90% | 5 min | SNS Alert |
| 5xx Errors > 1% | 1 min | SNS Alert + PagerDuty |
| Healthy Hosts < min | Immediate | SNS Alert + PagerDuty |

---

## 9. Deployment Strategy

### 9.1 Rolling Updates

```hcl
resource "aws_ecs_service" "service" {
  # ... other config ...

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
}
```

### 9.2 Deployment Flow

```
1. Build new image → Push to ECR
2. Create new Task Definition revision
3. Update ECS Service with new task definition
4. ECS starts new tasks (200% max)
5. ALB health checks pass
6. ECS drains old tasks
7. Deployment complete

On failure:
- Circuit breaker triggers
- Automatic rollback to previous revision
```

---

## 10. Migration Phases

### Phase 3: Terraform Foundation
- Create ECS cluster module
- Create ECS service module
- Create ALB module
- Create IAM module for ECS
- Update VPC module for ECS security groups

### Phase 4: Service Migration
- Deploy services to ECS one at a time
- Start with non-critical services
- Validate each service before proceeding
- Final cutover for critical services

### Phase 5: Pipeline Migration
- Remove kubectl/helm from pipelines
- Implement ECS deployment workflow
- Add rollback capabilities
- Update deployment gates

---

**Document Status:** APPROVED
**Next Action:** Phase 3 - Terraform Foundation
