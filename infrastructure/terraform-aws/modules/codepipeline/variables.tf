# =============================================================================
# CodePipeline Module Variables
# =============================================================================

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# GitHub Configuration
# -----------------------------------------------------------------------------

variable "github_repository" {
  description = "GitHub repository (owner/repo)"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to track"
  type        = string
  default     = "main"
}

variable "codestar_connection_arn" {
  description = "CodeStar connection ARN for GitHub"
  type        = string
  default     = null
}

# -----------------------------------------------------------------------------
# Build Configuration
# -----------------------------------------------------------------------------

variable "buildspec_path" {
  description = "Path to buildspec.yml"
  type        = string
  default     = "buildspec.yml"
}

variable "testspec_path" {
  description = "Path to test buildspec.yml"
  type        = string
  default     = "buildspec-test.yml"
}

variable "deployspec_path" {
  description = "Path to deploy buildspec.yml"
  type        = string
  default     = "buildspec-deploy.yml"
}

variable "build_image" {
  description = "Docker image for CodeBuild"
  type        = string
  default     = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
}

variable "build_compute_type" {
  description = "Compute type for build"
  type        = string
  default     = "BUILD_GENERAL1_MEDIUM"
}

variable "test_compute_type" {
  description = "Compute type for test"
  type        = string
  default     = "BUILD_GENERAL1_SMALL"
}

variable "deploy_compute_type" {
  description = "Compute type for deploy"
  type        = string
  default     = "BUILD_GENERAL1_SMALL"
}

variable "build_timeout" {
  description = "Build timeout in minutes"
  type        = number
  default     = 60
}

variable "test_timeout" {
  description = "Test timeout in minutes"
  type        = number
  default     = 30
}

variable "deploy_timeout" {
  description = "Deploy timeout in minutes"
  type        = number
  default     = 30
}

# -----------------------------------------------------------------------------
# Pipeline Stages
# -----------------------------------------------------------------------------

variable "enable_test_stage" {
  description = "Enable test stage in pipeline"
  type        = bool
  default     = true
}

variable "enable_deploy_stage" {
  description = "Enable deploy stage in pipeline"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# EKS Configuration
# -----------------------------------------------------------------------------

variable "eks_cluster_name" {
  description = "EKS cluster name for deployment"
  type        = string
  default     = null
}

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
  default     = null
}

# -----------------------------------------------------------------------------
# Notifications
# -----------------------------------------------------------------------------

variable "notification_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = null
}

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}
