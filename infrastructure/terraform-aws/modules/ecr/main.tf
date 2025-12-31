# =============================================================================
# AWS ECR Module - NEXUS Platform
# Replaces: Azure Container Registry (modules/acr)
# =============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = merge(var.tags, {
    Module      = "ecr"
    Environment = var.environment
  })
}

# -----------------------------------------------------------------------------
# ECR Repositories
# -----------------------------------------------------------------------------

resource "aws_ecr_repository" "main" {
  for_each = toset(var.repositories)

  name                 = "${local.name_prefix}/${each.value}"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = var.encryption_type
    kms_key         = var.encryption_type == "KMS" ? var.kms_key_arn : null
  }

  tags = merge(local.common_tags, {
    Name    = each.value
    Service = each.value
  })
}

# -----------------------------------------------------------------------------
# Lifecycle Policies
# -----------------------------------------------------------------------------

resource "aws_ecr_lifecycle_policy" "main" {
  for_each = toset(var.repositories)

  repository = aws_ecr_repository.main[each.key].name

  policy = jsonencode({
    rules = var.lifecycle_policy_rules
  })
}

# -----------------------------------------------------------------------------
# Repository Policies (for cross-account access)
# -----------------------------------------------------------------------------

resource "aws_ecr_repository_policy" "main" {
  for_each = var.enable_cross_account_access ? toset(var.repositories) : toset([])

  repository = aws_ecr_repository.main[each.key].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCrossAccountPull"
        Effect = "Allow"
        Principal = {
          AWS = var.cross_account_arns
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "repository_urls" {
  description = "Map of repository names to URLs"
  value       = { for k, v in aws_ecr_repository.main : k => v.repository_url }
}

output "repository_arns" {
  description = "Map of repository names to ARNs"
  value       = { for k, v in aws_ecr_repository.main : k => v.arn }
}

output "registry_id" {
  description = "ECR registry ID"
  value       = length(aws_ecr_repository.main) > 0 ? values(aws_ecr_repository.main)[0].registry_id : null
}
