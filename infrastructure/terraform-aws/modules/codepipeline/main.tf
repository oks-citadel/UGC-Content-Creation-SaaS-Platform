# =============================================================================
# AWS CodePipeline Module - NEXUS Platform
# CI/CD Pipeline: GitHub → CodePipeline → CodeBuild → ECR → EKS
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
    Module      = "codepipeline"
    Environment = var.environment
  })
}

# -----------------------------------------------------------------------------
# S3 Bucket for Pipeline Artifacts
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "artifacts" {
  bucket = "${local.name_prefix}-pipeline-artifacts"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.kms_key_arn != null ? "aws:kms" : "AES256"
      kms_master_key_id = var.kms_key_arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "expire-old-artifacts"
    status = "Enabled"

    expiration {
      days = 30
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# -----------------------------------------------------------------------------
# IAM Role for CodePipeline
# -----------------------------------------------------------------------------

resource "aws_iam_role" "codepipeline" {
  name = "${local.name_prefix}-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "codepipeline" {
  name = "${local.name_prefix}-codepipeline-policy"
  role = aws_iam_role.codepipeline.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "codestar-connections:UseConnection"
        ]
        Resource = var.codestar_connection_arn != null ? var.codestar_connection_arn : "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = var.notification_topic_arn != null ? var.notification_topic_arn : "*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# IAM Role for CodeBuild
# -----------------------------------------------------------------------------

resource "aws_iam_role" "codebuild" {
  name = "${local.name_prefix}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "codebuild" {
  name = "${local.name_prefix}-codebuild-policy"
  role = aws_iam_role.codebuild.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:GetAuthorizationToken",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/${var.project}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:*:*:secret:${var.project}/*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# CodeBuild Project - Build
# -----------------------------------------------------------------------------

resource "aws_codebuild_project" "build" {
  name          = "${local.name_prefix}-build"
  description   = "Build Docker images for ${var.project}"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = var.build_timeout

  artifacts {
    type = "CODEPIPELINE"
  }

  cache {
    type  = "LOCAL"
    modes = ["LOCAL_DOCKER_LAYER_CACHE", "LOCAL_SOURCE_CACHE"]
  }

  environment {
    compute_type                = var.build_compute_type
    image                       = var.build_image
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }

    environment_variable {
      name  = "ENVIRONMENT"
      value = var.environment
    }

    environment_variable {
      name  = "PROJECT_NAME"
      value = var.project
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = data.aws_region.current.name
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = var.buildspec_path
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/${local.name_prefix}-build"
      stream_name = "build-log"
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CodeBuild Project - Test
# -----------------------------------------------------------------------------

resource "aws_codebuild_project" "test" {
  count = var.enable_test_stage ? 1 : 0

  name          = "${local.name_prefix}-test"
  description   = "Run tests for ${var.project}"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = var.test_timeout

  artifacts {
    type = "CODEPIPELINE"
  }

  cache {
    type  = "LOCAL"
    modes = ["LOCAL_SOURCE_CACHE"]
  }

  environment {
    compute_type                = var.test_compute_type
    image                       = var.build_image
    type                        = "LINUX_CONTAINER"
    privileged_mode             = false
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "CI"
      value = "true"
    }

    environment_variable {
      name  = "ENVIRONMENT"
      value = var.environment
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = var.testspec_path
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/${local.name_prefix}-test"
      stream_name = "test-log"
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CodeBuild Project - Deploy
# -----------------------------------------------------------------------------

resource "aws_codebuild_project" "deploy" {
  count = var.enable_deploy_stage ? 1 : 0

  name          = "${local.name_prefix}-deploy"
  description   = "Deploy to EKS for ${var.project}"
  service_role  = aws_iam_role.codebuild.arn
  build_timeout = var.deploy_timeout

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = var.deploy_compute_type
    image                       = var.build_image
    type                        = "LINUX_CONTAINER"
    privileged_mode             = false
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }

    environment_variable {
      name  = "ENVIRONMENT"
      value = var.environment
    }

    environment_variable {
      name  = "EKS_CLUSTER_NAME"
      value = var.eks_cluster_name
    }

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = data.aws_region.current.name
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = var.deployspec_path
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/${local.name_prefix}-deploy"
      stream_name = "deploy-log"
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CodePipeline
# -----------------------------------------------------------------------------

resource "aws_codepipeline" "main" {
  name     = "${local.name_prefix}-pipeline"
  role_arn = aws_iam_role.codepipeline.arn

  artifact_store {
    location = aws_s3_bucket.artifacts.bucket
    type     = "S3"

    dynamic "encryption_key" {
      for_each = var.kms_key_arn != null ? [1] : []
      content {
        id   = var.kms_key_arn
        type = "KMS"
      }
    }
  }

  # Source Stage - GitHub
  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn    = var.codestar_connection_arn
        FullRepositoryId = var.github_repository
        BranchName       = var.github_branch
        DetectChanges    = true
      }
    }
  }

  # Test Stage (optional)
  dynamic "stage" {
    for_each = var.enable_test_stage ? [1] : []
    content {
      name = "Test"

      action {
        name             = "Test"
        category         = "Build"
        owner            = "AWS"
        provider         = "CodeBuild"
        version          = "1"
        input_artifacts  = ["source_output"]
        output_artifacts = ["test_output"]

        configuration = {
          ProjectName = aws_codebuild_project.test[0].name
        }
      }
    }
  }

  # Build Stage
  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["source_output"]
      output_artifacts = ["build_output"]

      configuration = {
        ProjectName = aws_codebuild_project.build.name
      }
    }
  }

  # Deploy Stage (optional)
  dynamic "stage" {
    for_each = var.enable_deploy_stage ? [1] : []
    content {
      name = "Deploy"

      action {
        name            = "Deploy"
        category        = "Build"
        owner           = "AWS"
        provider        = "CodeBuild"
        version         = "1"
        input_artifacts = ["build_output"]

        configuration = {
          ProjectName = aws_codebuild_project.deploy[0].name
        }
      }
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CloudWatch Log Groups
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "build" {
  name              = "/aws/codebuild/${local.name_prefix}-build"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "test" {
  count = var.enable_test_stage ? 1 : 0

  name              = "/aws/codebuild/${local.name_prefix}-test"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "deploy" {
  count = var.enable_deploy_stage ? 1 : 0

  name              = "/aws/codebuild/${local.name_prefix}-deploy"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# SNS Notifications
# -----------------------------------------------------------------------------

resource "aws_codestarnotifications_notification_rule" "pipeline" {
  count = var.notification_topic_arn != null ? 1 : 0

  name        = "${local.name_prefix}-pipeline-notifications"
  resource    = aws_codepipeline.main.arn
  detail_type = "FULL"

  event_type_ids = [
    "codepipeline-pipeline-pipeline-execution-started",
    "codepipeline-pipeline-pipeline-execution-failed",
    "codepipeline-pipeline-pipeline-execution-succeeded",
    "codepipeline-pipeline-manual-approval-needed"
  ]

  target {
    address = var.notification_topic_arn
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
