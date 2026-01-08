# =============================================================================
# AWS ElastiCache Redis Module - NEXUS Platform
# Replaces: Azure Cache for Redis (modules/redis)
# =============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# -----------------------------------------------------------------------------
# Local Variables
# -----------------------------------------------------------------------------

locals {
  name_prefix = "${var.project}-${var.environment}"
  cluster_id  = "${local.name_prefix}-redis"

  common_tags = merge(var.tags, {
    Module      = "elasticache"
    Environment = var.environment
  })
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

# -----------------------------------------------------------------------------
# KMS Key for Encryption
# -----------------------------------------------------------------------------

resource "aws_kms_key" "redis" {
  count = var.at_rest_encryption_enabled && var.kms_key_arn == null ? 1 : 0

  description             = "KMS key for ElastiCache ${local.cluster_id} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow ElastiCache to use the key"
        Effect = "Allow"
        Principal = {
          Service = "elasticache.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.cluster_id}-kms"
  })
}

resource "aws_kms_alias" "redis" {
  count = var.at_rest_encryption_enabled && var.kms_key_arn == null ? 1 : 0

  name          = "alias/${local.cluster_id}"
  target_key_id = aws_kms_key.redis[0].key_id
}

# -----------------------------------------------------------------------------
# ElastiCache Parameter Group
# -----------------------------------------------------------------------------

resource "aws_elasticache_parameter_group" "main" {
  name        = "${local.cluster_id}-params"
  family      = "redis${split(".", var.engine_version)[0]}"
  description = "Parameter group for ${local.cluster_id}"

  # Match Azure Redis configurations
  parameter {
    name  = "maxmemory-policy"
    value = var.maxmemory_policy
  }

  parameter {
    name  = "notify-keyspace-events"
    value = var.notify_keyspace_events
  }

  parameter {
    name  = "timeout"
    value = var.connection_timeout
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ElastiCache Replication Group (Redis Cluster)
# -----------------------------------------------------------------------------

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = local.cluster_id
  description          = "Redis cluster for ${local.name_prefix}"

  # Engine
  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  parameter_group_name = aws_elasticache_parameter_group.main.name
  port                 = 6379

  # Cluster Configuration
  num_cache_clusters         = var.num_cache_clusters
  automatic_failover_enabled = var.automatic_failover_enabled && var.num_cache_clusters > 1
  multi_az_enabled           = var.multi_az_enabled && var.num_cache_clusters > 1

  # Network
  subnet_group_name  = var.subnet_group_name
  security_group_ids = var.security_group_ids

  # Encryption
  at_rest_encryption_enabled = var.at_rest_encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  kms_key_id                 = var.at_rest_encryption_enabled ? (var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.redis[0].arn) : null
  auth_token                 = var.transit_encryption_enabled ? var.auth_token : null

  # Snapshots
  snapshot_retention_limit  = var.snapshot_retention_limit
  snapshot_window           = var.snapshot_window
  final_snapshot_identifier = var.environment == "prod" ? "${local.cluster_id}-final" : null

  # Maintenance
  maintenance_window         = var.maintenance_window
  auto_minor_version_upgrade = true
  apply_immediately          = var.environment != "prod"

  # Notifications
  notification_topic_arn = var.notification_topic_arn

  tags = merge(local.common_tags, {
    Name = local.cluster_id
  })

  lifecycle {
    ignore_changes = [num_cache_clusters]
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${local.cluster_id}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ElastiCache CPU utilization is above 80%"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "memory_usage" {
  alarm_name          = "${local.cluster_id}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ElastiCache memory usage is above 85%"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "evictions" {
  alarm_name          = "${local.cluster_id}-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "ElastiCache is evicting keys"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "connection_count" {
  alarm_name          = "${local.cluster_id}-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = var.max_connections_threshold
  alarm_description   = "ElastiCache connection count is high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.main.id
  }

  tags = local.common_tags
}
