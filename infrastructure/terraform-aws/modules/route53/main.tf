# =============================================================================
# AWS Route 53 Module - NEXUS Platform
# Replaces: Azure DNS (modules/dns)
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
  common_tags = merge(var.tags, {
    Module      = "route53"
    Environment = var.environment
  })
}

# -----------------------------------------------------------------------------
# Hosted Zone
# -----------------------------------------------------------------------------

resource "aws_route53_zone" "main" {
  count = var.create_zone ? 1 : 0

  name    = var.domain_name
  comment = "Hosted zone for ${var.domain_name}"

  dynamic "vpc" {
    for_each = var.private_zone ? [1] : []

    content {
      vpc_id = var.vpc_id
    }
  }

  tags = merge(local.common_tags, {
    Name = var.domain_name
  })
}

# -----------------------------------------------------------------------------
# Data Source for Existing Zone
# -----------------------------------------------------------------------------

data "aws_route53_zone" "existing" {
  count = var.create_zone ? 0 : 1

  name         = var.domain_name
  private_zone = var.private_zone
}

locals {
  zone_id = var.create_zone ? aws_route53_zone.main[0].zone_id : data.aws_route53_zone.existing[0].zone_id
}

# -----------------------------------------------------------------------------
# DNS Records
# -----------------------------------------------------------------------------

resource "aws_route53_record" "main" {
  for_each = var.records

  zone_id = local.zone_id
  name    = each.key == "@" ? var.domain_name : "${each.key}.${var.domain_name}"
  type    = each.value.type

  # Simple routing (no alias)
  ttl     = lookup(each.value, "alias", null) == null ? lookup(each.value, "ttl", 300) : null
  records = lookup(each.value, "alias", null) == null ? each.value.records : null

  # Alias record (for CloudFront, ALB, S3, etc.)
  dynamic "alias" {
    for_each = lookup(each.value, "alias", null) != null ? [each.value.alias] : []

    content {
      name                   = alias.value.name
      zone_id                = alias.value.zone_id
      evaluate_target_health = lookup(alias.value, "evaluate_target_health", true)
    }
  }

  # Geolocation routing
  dynamic "geolocation_routing_policy" {
    for_each = lookup(each.value, "geolocation", null) != null ? [each.value.geolocation] : []

    content {
      continent   = lookup(geolocation_routing_policy.value, "continent", null)
      country     = lookup(geolocation_routing_policy.value, "country", null)
      subdivision = lookup(geolocation_routing_policy.value, "subdivision", null)
    }
  }

  # Latency routing
  dynamic "latency_routing_policy" {
    for_each = lookup(each.value, "latency", null) != null ? [each.value.latency] : []

    content {
      region = latency_routing_policy.value.region
    }
  }

  # Weighted routing
  dynamic "weighted_routing_policy" {
    for_each = lookup(each.value, "weighted", null) != null ? [each.value.weighted] : []

    content {
      weight = weighted_routing_policy.value.weight
    }
  }

  # Failover routing
  dynamic "failover_routing_policy" {
    for_each = lookup(each.value, "failover", null) != null ? [each.value.failover] : []

    content {
      type = failover_routing_policy.value.type
    }
  }

  set_identifier = lookup(each.value, "set_identifier", null)

  health_check_id = lookup(each.value, "health_check_id", null)
}

# -----------------------------------------------------------------------------
# Health Checks
# -----------------------------------------------------------------------------

resource "aws_route53_health_check" "main" {
  for_each = var.health_checks

  fqdn              = lookup(each.value, "fqdn", null)
  ip_address        = lookup(each.value, "ip_address", null)
  port              = lookup(each.value, "port", 443)
  type              = lookup(each.value, "type", "HTTPS")
  resource_path     = lookup(each.value, "resource_path", "/health")
  failure_threshold = lookup(each.value, "failure_threshold", 3)
  request_interval  = lookup(each.value, "request_interval", 30)

  measure_latency = lookup(each.value, "measure_latency", true)

  regions = lookup(each.value, "regions", [
    "us-east-1",
    "us-west-1",
    "us-west-2",
    "eu-west-1",
    "ap-southeast-1"
  ])

  enable_sni = lookup(each.value, "type", "HTTPS") == "HTTPS" ? true : null

  tags = merge(local.common_tags, {
    Name = each.key
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms for Health Checks
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "health_check" {
  for_each = { for k, v in var.health_checks : k => v if lookup(v, "create_alarm", true) }

  alarm_name          = "route53-health-${each.key}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = 60
  statistic           = "Minimum"
  threshold           = 1
  alarm_description   = "Health check failed for ${each.key}"
  alarm_actions       = var.alarm_actions

  dimensions = {
    HealthCheckId = aws_route53_health_check.main[each.key].id
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# DNSSEC (optional)
# -----------------------------------------------------------------------------

resource "aws_route53_key_signing_key" "main" {
  count = var.enable_dnssec && var.create_zone ? 1 : 0

  hosted_zone_id             = aws_route53_zone.main[0].id
  key_management_service_arn = var.dnssec_kms_key_arn
  name                       = "${replace(var.domain_name, ".", "-")}-ksk"
}

resource "aws_route53_hosted_zone_dnssec" "main" {
  count = var.enable_dnssec && var.create_zone ? 1 : 0

  hosted_zone_id = aws_route53_zone.main[0].id

  depends_on = [aws_route53_key_signing_key.main]
}

# -----------------------------------------------------------------------------
# Query Logging (optional)
# -----------------------------------------------------------------------------

resource "aws_route53_query_log" "main" {
  count = var.enable_query_logging && var.create_zone ? 1 : 0

  cloudwatch_log_group_arn = var.query_log_group_arn
  zone_id                  = aws_route53_zone.main[0].zone_id

  depends_on = [aws_cloudwatch_log_resource_policy.route53]
}

resource "aws_cloudwatch_log_resource_policy" "route53" {
  count = var.enable_query_logging && var.create_zone ? 1 : 0

  policy_name = "route53-query-logging-${replace(var.domain_name, ".", "-")}"

  policy_document = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Route53LogsToCloudWatchLogs"
        Effect = "Allow"
        Principal = {
          Service = "route53.amazonaws.com"
        }
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${var.query_log_group_arn}:*"
      }
    ]
  })
}
