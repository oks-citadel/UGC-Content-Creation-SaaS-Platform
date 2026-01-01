# =============================================================================
# AWS CloudWatch Module - NEXUS Platform
# Replaces: Azure Monitor / Application Insights (modules/monitoring)
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

  common_tags = merge(var.tags, {
    Module      = "cloudwatch"
    Environment = var.environment
  })
}

# -----------------------------------------------------------------------------
# SNS Topic for Alerts
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  for_each = toset(var.alarm_email_endpoints)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# -----------------------------------------------------------------------------
# Log Groups
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${local.name_prefix}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "eks" {
  count = var.eks_cluster_name != null ? 1 : 0

  name              = "/aws/eks/${var.eks_cluster_name}/application"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# EKS Cluster Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "eks_cpu" {
  count = var.eks_cluster_name != null ? 1 : 0

  alarm_name          = "${local.name_prefix}-eks-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "node_cpu_utilization"
  namespace           = "ContainerInsights"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "EKS node CPU utilization is above 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.eks_cluster_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "eks_memory" {
  count = var.eks_cluster_name != null ? 1 : 0

  alarm_name          = "${local.name_prefix}-eks-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "node_memory_utilization"
  namespace           = "ContainerInsights"
  period              = 300
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "EKS node memory utilization is above 85%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.eks_cluster_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "eks_pod_restart" {
  count = var.eks_cluster_name != null ? 1 : 0

  alarm_name          = "${local.name_prefix}-eks-pod-restarts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "pod_number_of_container_restarts"
  namespace           = "ContainerInsights"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "EKS pods are restarting frequently"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.eks_cluster_name
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# RDS Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  count = var.rds_identifier != null ? 1 : 0

  alarm_name          = "${local.name_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is above 80%"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  count = var.rds_identifier != null ? 1 : 0

  alarm_name          = "${local.name_prefix}-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.rds_max_connections * 0.9
  alarm_description   = "RDS connections are above 90% of max"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  count = var.rds_identifier != null ? 1 : 0

  alarm_name          = "${local.name_prefix}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240  # 10 GB
  alarm_description   = "RDS free storage space is below 10 GB"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_identifier
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Application Alarms (Custom Metrics)
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "api_error_rate" {
  alarm_name          = "${local.name_prefix}-api-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = 5

  metric_query {
    id          = "error_rate"
    expression  = "(errors / requests) * 100"
    label       = "Error Rate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "5XXError"
      namespace   = "${local.name_prefix}/API"
      period      = 300
      stat        = "Sum"
    }
  }

  metric_query {
    id = "requests"
    metric {
      metric_name = "RequestCount"
      namespace   = "${local.name_prefix}/API"
      period      = 300
      stat        = "Sum"
    }
  }

  alarm_description = "API error rate is above 5%"
  alarm_actions     = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${local.name_prefix}-api-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "${local.name_prefix}/API"
  period              = 300
  extended_statistic  = "p95"
  threshold           = 1000  # 1 second
  alarm_description   = "API p95 latency is above 1 second"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CloudWatch Dashboard
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_dashboard" "main" {
  count = var.create_dashboard ? 1 : 0

  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = concat(
      # Header
      [
        {
          type   = "text"
          x      = 0
          y      = 0
          width  = 24
          height = 1
          properties = {
            markdown = "# ${upper(var.project)} - ${upper(var.environment)} Environment Dashboard"
          }
        }
      ],
      # EKS Metrics
      var.eks_cluster_name != null ? [
        {
          type   = "metric"
          x      = 0
          y      = 1
          width  = 8
          height = 6
          properties = {
            title  = "EKS CPU Utilization"
            region = data.aws_region.current.name
            metrics = [
              ["ContainerInsights", "node_cpu_utilization", "ClusterName", var.eks_cluster_name]
            ]
            period = 300
            stat   = "Average"
          }
        },
        {
          type   = "metric"
          x      = 8
          y      = 1
          width  = 8
          height = 6
          properties = {
            title  = "EKS Memory Utilization"
            region = data.aws_region.current.name
            metrics = [
              ["ContainerInsights", "node_memory_utilization", "ClusterName", var.eks_cluster_name]
            ]
            period = 300
            stat   = "Average"
          }
        },
        {
          type   = "metric"
          x      = 16
          y      = 1
          width  = 8
          height = 6
          properties = {
            title  = "EKS Pod Count"
            region = data.aws_region.current.name
            metrics = [
              ["ContainerInsights", "pod_number_of_running_pods", "ClusterName", var.eks_cluster_name]
            ]
            period = 300
            stat   = "Average"
          }
        }
      ] : [],
      # RDS Metrics
      var.rds_identifier != null ? [
        {
          type   = "metric"
          x      = 0
          y      = 7
          width  = 8
          height = 6
          properties = {
            title  = "RDS CPU Utilization"
            region = data.aws_region.current.name
            metrics = [
              ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_identifier]
            ]
            period = 300
            stat   = "Average"
          }
        },
        {
          type   = "metric"
          x      = 8
          y      = 7
          width  = 8
          height = 6
          properties = {
            title  = "RDS Database Connections"
            region = data.aws_region.current.name
            metrics = [
              ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.rds_identifier]
            ]
            period = 300
            stat   = "Average"
          }
        },
        {
          type   = "metric"
          x      = 16
          y      = 7
          width  = 8
          height = 6
          properties = {
            title  = "RDS Free Storage Space"
            region = data.aws_region.current.name
            metrics = [
              ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", var.rds_identifier]
            ]
            period = 300
            stat   = "Average"
          }
        }
      ] : [],
      # API Metrics
      [
        {
          type   = "metric"
          x      = 0
          y      = 13
          width  = 12
          height = 6
          properties = {
            title  = "API Request Count"
            region = data.aws_region.current.name
            metrics = [
              ["${local.name_prefix}/API", "RequestCount"]
            ]
            period = 300
            stat   = "Sum"
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 13
          width  = 12
          height = 6
          properties = {
            title  = "API Latency (p95)"
            region = data.aws_region.current.name
            metrics = [
              ["${local.name_prefix}/API", "Latency"]
            ]
            period = 300
            stat   = "p95"
          }
        }
      ]
    )
  })
}

# -----------------------------------------------------------------------------
# Metric Filters (for log-based metrics)
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_metric_filter" "error_logs" {
  name           = "${local.name_prefix}-error-logs"
  pattern        = "ERROR"
  log_group_name = aws_cloudwatch_log_group.application.name

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "${local.name_prefix}/Logs"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "error_logs" {
  alarm_name          = "${local.name_prefix}-error-logs-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "${local.name_prefix}/Logs"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "Application error logs are increasing"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Composite Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_composite_alarm" "critical" {
  alarm_name = "${local.name_prefix}-critical-composite"

  alarm_rule = join(" OR ", compact([
    var.eks_cluster_name != null ? "ALARM(${aws_cloudwatch_metric_alarm.eks_cpu[0].alarm_name})" : "",
    var.rds_identifier != null ? "ALARM(${aws_cloudwatch_metric_alarm.rds_cpu[0].alarm_name})" : "",
    "ALARM(${aws_cloudwatch_metric_alarm.api_error_rate.alarm_name})"
  ]))

  alarm_description = "Critical composite alarm - multiple services affected"
  alarm_actions     = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_region" "current" {}
