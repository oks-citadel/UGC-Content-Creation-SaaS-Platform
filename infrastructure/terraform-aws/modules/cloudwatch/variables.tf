# =============================================================================
# CloudWatch Module Variables
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
# Resource References
# -----------------------------------------------------------------------------

variable "eks_cluster_name" {
  description = "EKS cluster name for monitoring"
  type        = string
  default     = null
}

variable "rds_identifier" {
  description = "RDS instance identifier for monitoring"
  type        = string
  default     = null
}

variable "rds_max_connections" {
  description = "Maximum RDS connections for threshold calculation"
  type        = number
  default     = 100
}

# -----------------------------------------------------------------------------
# Alerting
# -----------------------------------------------------------------------------

variable "alarm_email_endpoints" {
  description = "Email addresses for alarm notifications"
  type        = list(string)
  default     = []
}

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------

variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 30
}

# -----------------------------------------------------------------------------
# Dashboard
# -----------------------------------------------------------------------------

variable "create_dashboard" {
  description = "Create a CloudWatch dashboard"
  type        = bool
  default     = true
}
