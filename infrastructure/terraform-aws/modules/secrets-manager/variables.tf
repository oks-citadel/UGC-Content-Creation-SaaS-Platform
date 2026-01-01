# =============================================================================
# Secrets Manager Module Variables
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
# Secret Configuration
# -----------------------------------------------------------------------------

variable "secrets" {
  description = "Map of secrets to create"
  type = map(object({
    description              = optional(string, "")
    generate                 = optional(bool, false)
    length                   = optional(number, 32)
    special                  = optional(bool, true)
    override_special         = optional(string, "!#$%&*()-_=+[]{}<>:?")
    min_lower                = optional(number, 2)
    min_upper                = optional(number, 2)
    min_numeric              = optional(number, 2)
    min_special              = optional(number, 2)
    secret_string            = optional(string, null)
    secret_map               = optional(map(string), null)
    rotation_enabled         = optional(bool, false)
    rotation_lambda_arn      = optional(string, "")
    rotation_days            = optional(number, 30)
    cross_account_principals = optional(list(string), null)
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# Encryption
# -----------------------------------------------------------------------------

variable "create_kms_key" {
  description = "Create a KMS key for secrets encryption"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "ARN of existing KMS key"
  type        = string
  default     = null
}

# -----------------------------------------------------------------------------
# Recovery
# -----------------------------------------------------------------------------

variable "recovery_window_in_days" {
  description = "Number of days to recover a deleted secret"
  type        = number
  default     = 30
}

# -----------------------------------------------------------------------------
# IAM
# -----------------------------------------------------------------------------

variable "create_read_policy" {
  description = "Create an IAM policy for reading secrets"
  type        = bool
  default     = true
}
