# =============================================================================
# ECS Cluster Module - Fargate Only
# =============================================================================
# This module creates an ECS cluster configured for Fargate (serverless)
# with support for both on-demand and Spot capacity providers.
# =============================================================================

# -----------------------------------------------------------------------------
# ECS Cluster
# -----------------------------------------------------------------------------
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.execute_command.name
      }
    }
  }

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-cluster"
    Environment = var.environment
    Project     = var.project
  })
}

# -----------------------------------------------------------------------------
# Capacity Providers (Fargate + Fargate Spot)
# -----------------------------------------------------------------------------
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = var.default_fargate_weight
    base              = var.default_fargate_base
  }

  dynamic "default_capacity_provider_strategy" {
    for_each = var.enable_spot_default ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight            = var.default_spot_weight
    }
  }
}

# -----------------------------------------------------------------------------
# Service Connect Namespace
# -----------------------------------------------------------------------------
resource "aws_service_discovery_http_namespace" "main" {
  name        = "${var.project}-${var.environment}"
  description = "Service Connect namespace for ${var.project} ${var.environment}"

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-namespace"
    Environment = var.environment
    Project     = var.project
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Log Group for Execute Command
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "execute_command" {
  name              = "/ecs/${var.project}-${var.environment}/execute-command"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-execute-command-logs"
    Environment = var.environment
    Project     = var.project
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Log Group for Container Logs (shared)
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "services" {
  for_each = toset(var.service_names)

  name              = "/ecs/${var.project}-${var.environment}/${each.value}"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-${each.value}-logs"
    Environment = var.environment
    Project     = var.project
    Service     = each.value
  })
}

# -----------------------------------------------------------------------------
# ECS Security Group (for tasks)
# -----------------------------------------------------------------------------
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project}-${var.environment}-ecs-tasks"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = var.vpc_id

  # Allow inbound from ALB
  ingress {
    description     = "Allow traffic from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
  }

  # Allow inbound from self (service-to-service via Service Connect)
  ingress {
    description = "Allow traffic from other ECS tasks"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  # Allow all outbound
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-ecs-tasks-sg"
    Environment = var.environment
    Project     = var.project
  })

  lifecycle {
    create_before_destroy = true
  }
}
