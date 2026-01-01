# =============================================================================
# AWS CloudFront Module - NEXUS Platform
# Replaces: Azure Front Door (modules/frontdoor)
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
    Module      = "cloudfront"
    Environment = var.environment
  })
}

# -----------------------------------------------------------------------------
# Origin Access Control (OAC) for S3
# -----------------------------------------------------------------------------

resource "aws_cloudfront_origin_access_control" "s3" {
  count = var.web_origin_domain != null ? 1 : 0

  name                              = "${local.name_prefix}-s3-oac"
  description                       = "OAC for S3 origin"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# -----------------------------------------------------------------------------
# Cache Policies
# -----------------------------------------------------------------------------

resource "aws_cloudfront_cache_policy" "api" {
  name        = "${local.name_prefix}-api-cache-policy"
  comment     = "Cache policy for API requests"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "all"
    }
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Authorization", "Host", "Accept", "Accept-Language"]
      }
    }
    query_strings_config {
      query_string_behavior = "all"
    }
  }
}

resource "aws_cloudfront_cache_policy" "static" {
  name        = "${local.name_prefix}-static-cache-policy"
  comment     = "Cache policy for static assets"
  min_ttl     = 1
  default_ttl = 86400      # 1 day
  max_ttl     = 31536000   # 1 year

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true
  }
}

# -----------------------------------------------------------------------------
# Origin Request Policies
# -----------------------------------------------------------------------------

resource "aws_cloudfront_origin_request_policy" "api" {
  name    = "${local.name_prefix}-api-origin-policy"
  comment = "Origin request policy for API"

  cookies_config {
    cookie_behavior = "all"
  }
  headers_config {
    header_behavior = "allViewerAndWhitelistCloudFront"
    headers {
      items = ["CloudFront-Viewer-Country", "CloudFront-Is-Mobile-Viewer"]
    }
  }
  query_strings_config {
    query_string_behavior = "all"
  }
}

# -----------------------------------------------------------------------------
# Response Headers Policy
# -----------------------------------------------------------------------------

resource "aws_cloudfront_response_headers_policy" "security" {
  name    = "${local.name_prefix}-security-headers"
  comment = "Security headers policy"

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }

  cors_config {
    access_control_allow_credentials = false
    access_control_max_age_sec       = 600
    origin_override                  = true

    access_control_allow_headers {
      items = ["Authorization", "Content-Type", "X-Requested-With"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    }
    access_control_allow_origins {
      items = var.cors_allowed_origins
    }
  }
}

# -----------------------------------------------------------------------------
# CloudFront Distribution
# -----------------------------------------------------------------------------

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${local.name_prefix}"
  default_root_object = var.default_root_object
  price_class         = var.price_class
  aliases             = var.aliases
  web_acl_id          = var.waf_web_acl_arn

  # API Origin
  dynamic "origin" {
    for_each = var.api_origin_domain != null ? [1] : []

    content {
      domain_name = var.api_origin_domain
      origin_id   = "api"

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
        origin_read_timeout    = 60
      }

      custom_header {
        name  = "X-Origin-Verify"
        value = var.origin_verify_header
      }
    }
  }

  # S3 Origin (Static Assets)
  dynamic "origin" {
    for_each = var.web_origin_domain != null ? [1] : []

    content {
      domain_name              = var.web_origin_domain
      origin_id                = "s3-assets"
      origin_access_control_id = aws_cloudfront_origin_access_control.s3[0].id
    }
  }

  # Default Cache Behavior (API)
  default_cache_behavior {
    target_origin_id       = var.api_origin_domain != null ? "api" : "s3-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = var.enable_compression

    cache_policy_id            = aws_cloudfront_cache_policy.api.id
    origin_request_policy_id   = aws_cloudfront_origin_request_policy.api.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
  }

  # Static Assets Cache Behavior
  dynamic "ordered_cache_behavior" {
    for_each = var.web_origin_domain != null ? [1] : []

    content {
      path_pattern           = "/assets/*"
      target_origin_id       = "s3-assets"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD", "OPTIONS"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true

      cache_policy_id            = aws_cloudfront_cache_policy.static.id
      response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
    }
  }

  # Images Cache Behavior
  dynamic "ordered_cache_behavior" {
    for_each = var.web_origin_domain != null ? [1] : []

    content {
      path_pattern           = "*.{jpg,jpeg,png,gif,webp,svg,ico}"
      target_origin_id       = "s3-assets"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true

      cache_policy_id = aws_cloudfront_cache_policy.static.id
    }
  }

  # Custom Error Responses
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  # SSL/TLS Configuration
  viewer_certificate {
    acm_certificate_arn            = var.certificate_arn
    ssl_support_method             = var.certificate_arn != null ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = var.certificate_arn == null
  }

  # Geo Restrictions
  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  # Logging
  dynamic "logging_config" {
    for_each = var.logging_bucket != null ? [1] : []

    content {
      bucket          = var.logging_bucket
      prefix          = "${local.name_prefix}/"
      include_cookies = false
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-distribution"
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "${local.name_prefix}-cloudfront-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "CloudFront 5xx error rate is above 5%"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
    Region         = "Global"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "origin_latency" {
  alarm_name          = "${local.name_prefix}-cloudfront-origin-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "OriginLatency"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5000  # 5 seconds
  alarm_description   = "CloudFront origin latency is above 5 seconds"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
    Region         = "Global"
  }

  tags = local.common_tags
}
