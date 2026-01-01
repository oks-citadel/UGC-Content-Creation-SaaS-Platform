# =============================================================================
# WAF Module Variables
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
# WAF Configuration
# -----------------------------------------------------------------------------

variable "scope" {
  description = "WAF scope (REGIONAL or CLOUDFRONT)"
  type        = string
  default     = "REGIONAL"

  validation {
    condition     = contains(["REGIONAL", "CLOUDFRONT"], var.scope)
    error_message = "Scope must be REGIONAL or CLOUDFRONT."
  }
}

# -----------------------------------------------------------------------------
# AWS Managed Rules
# -----------------------------------------------------------------------------

variable "enable_aws_managed_rules" {
  description = "Enable AWS managed rule sets"
  type        = bool
  default     = true
}

variable "common_ruleset_excluded_rules" {
  description = "Rules to exclude from the common rule set (count instead of block)"
  type        = list(string)
  default     = []
}

variable "enable_sql_injection_protection" {
  description = "Enable SQL injection protection rule set"
  type        = bool
  default     = true
}

variable "enable_linux_protection" {
  description = "Enable Linux OS protection rule set"
  type        = bool
  default     = true
}

variable "enable_bot_control" {
  description = "Enable bot control rule set"
  type        = bool
  default     = false
}

variable "bot_control_inspection_level" {
  description = "Bot control inspection level (COMMON or TARGETED)"
  type        = string
  default     = "COMMON"
}

# -----------------------------------------------------------------------------
# Rate Limiting
# -----------------------------------------------------------------------------

variable "enable_rate_limiting" {
  description = "Enable rate limiting"
  type        = bool
  default     = true
}

variable "rate_limit" {
  description = "Number of requests allowed per 5-minute period per IP"
  type        = number
  default     = 2000
}

# -----------------------------------------------------------------------------
# IP Filtering
# -----------------------------------------------------------------------------

variable "blocked_ip_addresses" {
  description = "List of IP addresses to block (CIDR format)"
  type        = list(string)
  default     = []
}

variable "allowed_ip_addresses" {
  description = "List of IP addresses to allow (bypass rules)"
  type        = list(string)
  default     = []
}

# -----------------------------------------------------------------------------
# Geo Blocking
# -----------------------------------------------------------------------------

variable "blocked_countries" {
  description = "List of country codes to block"
  type        = list(string)
  default     = []
}

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------

variable "log_destination_arn" {
  description = "ARN of the log destination (CloudWatch Log Group, S3, or Kinesis Firehose)"
  type        = string
  default     = null
}

variable "enable_logging_filter" {
  description = "Enable logging filter (only log blocked and counted requests)"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Monitoring
# -----------------------------------------------------------------------------

variable "alarm_actions" {
  description = "List of ARNs for alarm actions"
  type        = list(string)
  default     = []
}

variable "blocked_requests_threshold" {
  description = "Threshold for blocked requests alarm"
  type        = number
  default     = 1000
}
