# =============================================================================
# AWS S3 Module - NEXUS Platform
# Replaces: Azure Blob Storage (modules/storage)
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
    Module      = "s3"
    Environment = var.environment
  })
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# KMS Key for Encryption
# -----------------------------------------------------------------------------

resource "aws_kms_key" "s3" {
  count = var.create_kms_key ? 1 : 0

  description             = "KMS key for S3 bucket encryption"
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
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudFront to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-kms"
  })
}

resource "aws_kms_alias" "s3" {
  count = var.create_kms_key ? 1 : 0

  name          = "alias/${local.name_prefix}-s3"
  target_key_id = aws_kms_key.s3[0].key_id
}

# -----------------------------------------------------------------------------
# S3 Buckets
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "main" {
  for_each = var.buckets

  bucket = "${local.name_prefix}-${each.key}"

  tags = merge(local.common_tags, {
    Name   = each.key
    Bucket = each.key
  })
}

# -----------------------------------------------------------------------------
# Bucket Versioning
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_versioning" "main" {
  for_each = var.buckets

  bucket = aws_s3_bucket.main[each.key].id

  versioning_configuration {
    status = lookup(each.value, "versioning", false) ? "Enabled" : "Disabled"
  }
}

# -----------------------------------------------------------------------------
# Server-Side Encryption
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  for_each = var.buckets

  bucket = aws_s3_bucket.main[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.create_kms_key ? "aws:kms" : "AES256"
      kms_master_key_id = var.create_kms_key ? aws_kms_key.s3[0].arn : null
    }
    bucket_key_enabled = var.create_kms_key
  }
}

# -----------------------------------------------------------------------------
# Block Public Access
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_public_access_block" "main" {
  for_each = var.block_public_access ? var.buckets : {}

  bucket = aws_s3_bucket.main[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------------
# Lifecycle Rules
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  for_each = { for k, v in var.buckets : k => v if lookup(v, "lifecycle_rules", null) != null }

  bucket = aws_s3_bucket.main[each.key].id

  dynamic "rule" {
    for_each = each.value.lifecycle_rules

    content {
      id     = rule.value.id
      status = "Enabled"

      filter {
        prefix = lookup(rule.value, "prefix", "")
      }

      dynamic "transition" {
        for_each = lookup(rule.value, "transition", [])

        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      dynamic "expiration" {
        for_each = lookup(rule.value, "expiration", null) != null ? [rule.value.expiration] : []

        content {
          days = expiration.value.days
        }
      }

      dynamic "noncurrent_version_expiration" {
        for_each = lookup(rule.value, "noncurrent_version_expiration", null) != null ? [rule.value.noncurrent_version_expiration] : []

        content {
          noncurrent_days = noncurrent_version_expiration.value.days
        }
      }
    }
  }
}

# -----------------------------------------------------------------------------
# CORS Configuration
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_cors_configuration" "main" {
  for_each = { for k, v in var.buckets : k => v if lookup(v, "cors_enabled", false) }

  bucket = aws_s3_bucket.main[each.key].id

  cors_rule {
    allowed_headers = lookup(each.value, "cors_allowed_headers", ["*"])
    allowed_methods = lookup(each.value, "cors_allowed_methods", ["GET", "HEAD"])
    allowed_origins = lookup(each.value, "cors_allowed_origins", ["*"])
    expose_headers  = lookup(each.value, "cors_expose_headers", ["ETag"])
    max_age_seconds = lookup(each.value, "cors_max_age", 3600)
  }
}

# -----------------------------------------------------------------------------
# Bucket Policy for CloudFront OAC
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_policy" "cloudfront_oac" {
  for_each = { for k, v in var.buckets : k => v if lookup(v, "cloudfront_oac_enabled", false) }

  bucket = aws_s3_bucket.main[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.main[each.key].arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = lookup(each.value, "cloudfront_distribution_arn", "")
          }
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Replication Configuration (for production)
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_replication_configuration" "main" {
  for_each = { for k, v in var.buckets : k => v if lookup(v, "replication_enabled", false) }

  depends_on = [aws_s3_bucket_versioning.main]

  role   = aws_iam_role.replication[0].arn
  bucket = aws_s3_bucket.main[each.key].id

  rule {
    id     = "replication-${each.key}"
    status = "Enabled"

    destination {
      bucket        = lookup(each.value, "replication_destination_bucket", "")
      storage_class = lookup(each.value, "replication_storage_class", "STANDARD")
    }
  }
}

# -----------------------------------------------------------------------------
# Replication IAM Role
# -----------------------------------------------------------------------------

resource "aws_iam_role" "replication" {
  count = length([for k, v in var.buckets : k if lookup(v, "replication_enabled", false)]) > 0 ? 1 : 0

  name = "${local.name_prefix}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "replication" {
  count = length([for k, v in var.buckets : k if lookup(v, "replication_enabled", false)]) > 0 ? 1 : 0

  name = "${local.name_prefix}-s3-replication-policy"
  role = aws_iam_role.replication[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [for k, v in var.buckets : aws_s3_bucket.main[k].arn if lookup(v, "replication_enabled", false)]
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect   = "Allow"
        Resource = [for k, v in var.buckets : "${aws_s3_bucket.main[k].arn}/*" if lookup(v, "replication_enabled", false)]
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect   = "Allow"
        Resource = [for k, v in var.buckets : "${lookup(v, "replication_destination_bucket", "")}/*" if lookup(v, "replication_enabled", false)]
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Metrics
# -----------------------------------------------------------------------------

resource "aws_s3_bucket_metric" "main" {
  for_each = var.enable_metrics ? var.buckets : {}

  bucket = aws_s3_bucket.main[each.key].id
  name   = "EntireBucket"
}
