# =============================================================================
# AWS Secrets Manager Module - NEXUS Platform
# Replaces: Azure Key Vault (modules/keyvault)
# =============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# -----------------------------------------------------------------------------
# Local Variables
# -----------------------------------------------------------------------------

locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = merge(var.tags, {
    Module      = "secrets-manager"
    Environment = var.environment
  })
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# KMS Key for Secrets Encryption
# -----------------------------------------------------------------------------

resource "aws_kms_key" "secrets" {
  count = var.create_kms_key ? 1 : 0

  description             = "KMS key for Secrets Manager encryption"
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
        Sid    = "Allow Secrets Manager to use the key"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
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
    Name = "${local.name_prefix}-secrets-kms"
  })
}

resource "aws_kms_alias" "secrets" {
  count = var.create_kms_key ? 1 : 0

  name          = "alias/${local.name_prefix}-secrets"
  target_key_id = aws_kms_key.secrets[0].key_id
}

# -----------------------------------------------------------------------------
# Generate Random Secrets
# -----------------------------------------------------------------------------

resource "random_password" "generated" {
  for_each = { for k, v in var.secrets : k => v if lookup(v, "generate", false) }

  length           = lookup(each.value, "length", 32)
  special          = lookup(each.value, "special", true)
  override_special = lookup(each.value, "override_special", "!#$%&*()-_=+[]{}<>:?")
  min_lower        = lookup(each.value, "min_lower", 2)
  min_upper        = lookup(each.value, "min_upper", 2)
  min_numeric      = lookup(each.value, "min_numeric", 2)
  min_special      = lookup(each.value, "special", true) ? lookup(each.value, "min_special", 2) : 0
}

# -----------------------------------------------------------------------------
# Secrets
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "main" {
  for_each = var.secrets

  name        = "${var.project}/${var.environment}/${each.key}"
  description = lookup(each.value, "description", "Secret for ${each.key}")

  kms_key_id = var.create_kms_key ? aws_kms_key.secrets[0].arn : var.kms_key_arn

  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(local.common_tags, {
    SecretName = each.key
  })
}

resource "aws_secretsmanager_secret_version" "main" {
  for_each = var.secrets

  secret_id = aws_secretsmanager_secret.main[each.key].id

  secret_string = lookup(each.value, "generate", false) ? random_password.generated[each.key].result : (
    lookup(each.value, "secret_string", null) != null ? each.value.secret_string : (
      lookup(each.value, "secret_map", null) != null ? jsonencode(each.value.secret_map) : ""
    )
  )
}

# -----------------------------------------------------------------------------
# Secret Rotation (optional)
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret_rotation" "main" {
  for_each = { for k, v in var.secrets : k => v if lookup(v, "rotation_enabled", false) }

  secret_id           = aws_secretsmanager_secret.main[each.key].id
  rotation_lambda_arn = each.value.rotation_lambda_arn

  rotation_rules {
    automatically_after_days = lookup(each.value, "rotation_days", 30)
  }
}

# -----------------------------------------------------------------------------
# IAM Policy for Secret Access
# -----------------------------------------------------------------------------

resource "aws_iam_policy" "secret_read" {
  count = var.create_read_policy ? 1 : 0

  name        = "${local.name_prefix}-secrets-read-policy"
  description = "Policy to read secrets from Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "GetSecretValue"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [for k, v in aws_secretsmanager_secret.main : v.arn]
      },
      {
        Sid    = "DecryptSecret"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = var.create_kms_key ? [aws_kms_key.secrets[0].arn] : (var.kms_key_arn != null ? [var.kms_key_arn] : [])
      }
    ]
  })

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Resource Policy for Cross-Account Access (optional)
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret_policy" "cross_account" {
  for_each = { for k, v in var.secrets : k => v if lookup(v, "cross_account_principals", null) != null }

  secret_arn = aws_secretsmanager_secret.main[each.key].arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCrossAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = each.value.cross_account_principals
        }
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "*"
      }
    ]
  })
}
