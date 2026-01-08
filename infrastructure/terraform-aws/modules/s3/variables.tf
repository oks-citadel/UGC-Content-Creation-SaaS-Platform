# =============================================================================
# S3 Module Variables
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
# Bucket Configuration
# -----------------------------------------------------------------------------

variable "buckets" {
  description = "Map of bucket configurations"
  type = map(object({
    versioning                     = optional(bool, false)
    cors_enabled                   = optional(bool, false)
    cors_allowed_headers           = optional(list(string), ["*"])
    cors_allowed_methods           = optional(list(string), ["GET", "HEAD"])
    cors_allowed_origins           = optional(list(string), ["*"])
    cors_expose_headers            = optional(list(string), ["ETag"])
    cors_max_age                   = optional(number, 3600)
    cloudfront_oac_enabled         = optional(bool, false)
    cloudfront_distribution_arn    = optional(string, "")
    replication_enabled            = optional(bool, false)
    replication_destination_bucket = optional(string, "")
    replication_storage_class      = optional(string, "STANDARD")
    lifecycle_rules = optional(list(object({
      id     = string
      prefix = optional(string, "")
      transition = optional(list(object({
        days          = number
        storage_class = string
      })), [])
      expiration = optional(object({
        days = number
      }), null)
      noncurrent_version_expiration = optional(object({
        days = number
      }), null)
    })), null)
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------

variable "block_public_access" {
  description = "Block all public access to buckets"
  type        = bool
  default     = true
}

variable "create_kms_key" {
  description = "Create a KMS key for bucket encryption"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "ARN of existing KMS key"
  type        = string
  default     = null
}

# -----------------------------------------------------------------------------
# Monitoring
# -----------------------------------------------------------------------------

variable "enable_metrics" {
  description = "Enable CloudWatch request metrics"
  type        = bool
  default     = true
}
