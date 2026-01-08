# =============================================================================
# AWS WAF Module - NEXUS Platform
# Replaces: Azure Front Door WAF (modules/waf)
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
    Module      = "waf"
    Environment = var.environment
  })
}

# -----------------------------------------------------------------------------
# WAF Web ACL
# -----------------------------------------------------------------------------

resource "aws_wafv2_web_acl" "main" {
  name        = "${local.name_prefix}-waf"
  description = "WAF Web ACL for ${local.name_prefix}"
  scope       = var.scope # REGIONAL or CLOUDFRONT

  default_action {
    allow {}
  }

  # AWS Managed Rules - Common Rule Set
  dynamic "rule" {
    for_each = var.enable_aws_managed_rules ? [1] : []

    content {
      name     = "AWSManagedRulesCommonRuleSet"
      priority = 1

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesCommonRuleSet"
          vendor_name = "AWS"

          dynamic "rule_action_override" {
            for_each = var.common_ruleset_excluded_rules

            content {
              name = rule_action_override.value
              action_to_use {
                count {}
              }
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "AWSManagedRulesCommonRuleSet"
        sampled_requests_enabled   = true
      }
    }
  }

  # AWS Managed Rules - Known Bad Inputs
  dynamic "rule" {
    for_each = var.enable_aws_managed_rules ? [1] : []

    content {
      name     = "AWSManagedRulesKnownBadInputsRuleSet"
      priority = 2

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesKnownBadInputsRuleSet"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "AWSManagedRulesKnownBadInputsRuleSet"
        sampled_requests_enabled   = true
      }
    }
  }

  # AWS Managed Rules - SQL Injection
  dynamic "rule" {
    for_each = var.enable_sql_injection_protection ? [1] : []

    content {
      name     = "AWSManagedRulesSQLiRuleSet"
      priority = 3

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesSQLiRuleSet"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "AWSManagedRulesSQLiRuleSet"
        sampled_requests_enabled   = true
      }
    }
  }

  # AWS Managed Rules - Linux OS
  dynamic "rule" {
    for_each = var.enable_linux_protection ? [1] : []

    content {
      name     = "AWSManagedRulesLinuxRuleSet"
      priority = 4

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesLinuxRuleSet"
          vendor_name = "AWS"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "AWSManagedRulesLinuxRuleSet"
        sampled_requests_enabled   = true
      }
    }
  }

  # AWS Managed Rules - Bot Control
  dynamic "rule" {
    for_each = var.enable_bot_control ? [1] : []

    content {
      name     = "AWSManagedRulesBotControlRuleSet"
      priority = 5

      override_action {
        none {}
      }

      statement {
        managed_rule_group_statement {
          name        = "AWSManagedRulesBotControlRuleSet"
          vendor_name = "AWS"

          managed_rule_group_configs {
            aws_managed_rules_bot_control_rule_set {
              inspection_level = var.bot_control_inspection_level
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "AWSManagedRulesBotControlRuleSet"
        sampled_requests_enabled   = true
      }
    }
  }

  # Rate Limiting Rule
  dynamic "rule" {
    for_each = var.enable_rate_limiting ? [1] : []

    content {
      name     = "RateLimitRule"
      priority = 10

      action {
        block {}
      }

      statement {
        rate_based_statement {
          limit              = var.rate_limit
          aggregate_key_type = "IP"
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "RateLimitRule"
        sampled_requests_enabled   = true
      }
    }
  }

  # IP Block List
  dynamic "rule" {
    for_each = length(var.blocked_ip_addresses) > 0 ? [1] : []

    content {
      name     = "IPBlockList"
      priority = 0

      action {
        block {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.blocked[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "IPBlockList"
        sampled_requests_enabled   = true
      }
    }
  }

  # IP Allow List
  dynamic "rule" {
    for_each = length(var.allowed_ip_addresses) > 0 ? [1] : []

    content {
      name     = "IPAllowList"
      priority = 15

      action {
        allow {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.allowed[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "IPAllowList"
        sampled_requests_enabled   = true
      }
    }
  }

  # Geo Blocking
  dynamic "rule" {
    for_each = length(var.blocked_countries) > 0 ? [1] : []

    content {
      name     = "GeoBlockRule"
      priority = 20

      action {
        block {}
      }

      statement {
        geo_match_statement {
          country_codes = var.blocked_countries
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "GeoBlockRule"
        sampled_requests_enabled   = true
      }
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-waf"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-waf"
  })
}

# -----------------------------------------------------------------------------
# IP Sets
# -----------------------------------------------------------------------------

resource "aws_wafv2_ip_set" "blocked" {
  count = length(var.blocked_ip_addresses) > 0 ? 1 : 0

  name               = "${local.name_prefix}-blocked-ips"
  description        = "Blocked IP addresses"
  scope              = var.scope
  ip_address_version = "IPV4"
  addresses          = var.blocked_ip_addresses

  tags = local.common_tags
}

resource "aws_wafv2_ip_set" "allowed" {
  count = length(var.allowed_ip_addresses) > 0 ? 1 : 0

  name               = "${local.name_prefix}-allowed-ips"
  description        = "Allowed IP addresses"
  scope              = var.scope
  ip_address_version = "IPV4"
  addresses          = var.allowed_ip_addresses

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# WAF Logging Configuration
# -----------------------------------------------------------------------------

resource "aws_wafv2_web_acl_logging_configuration" "main" {
  count = var.log_destination_arn != null ? 1 : 0

  log_destination_configs = [var.log_destination_arn]
  resource_arn            = aws_wafv2_web_acl.main.arn

  dynamic "logging_filter" {
    for_each = var.enable_logging_filter ? [1] : []

    content {
      default_behavior = "DROP"

      filter {
        behavior    = "KEEP"
        requirement = "MEETS_ANY"

        condition {
          action_condition {
            action = "BLOCK"
          }
        }

        condition {
          action_condition {
            action = "COUNT"
          }
        }
      }
    }
  }

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "blocked_requests" {
  alarm_name          = "${local.name_prefix}-waf-blocked-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 300
  statistic           = "Sum"
  threshold           = var.blocked_requests_threshold
  alarm_description   = "WAF is blocking more requests than expected"
  alarm_actions       = var.alarm_actions

  dimensions = {
    WebACL = aws_wafv2_web_acl.main.name
    Region = var.scope == "CLOUDFRONT" ? "Global" : data.aws_region.current.name
    Rule   = "ALL"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rate_limit_triggers" {
  count = var.enable_rate_limiting ? 1 : 0

  alarm_name          = "${local.name_prefix}-waf-rate-limit-triggered"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = 60
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "Rate limiting is actively blocking requests"
  alarm_actions       = var.alarm_actions

  dimensions = {
    WebACL = aws_wafv2_web_acl.main.name
    Region = var.scope == "CLOUDFRONT" ? "Global" : data.aws_region.current.name
    Rule   = "RateLimitRule"
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_region" "current" {}
