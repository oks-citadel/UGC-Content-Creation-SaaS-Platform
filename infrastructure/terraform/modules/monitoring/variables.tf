# =============================================================================
# Monitoring Module - Variables
# =============================================================================

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# =============================================================================
# Log Analytics Configuration
# =============================================================================

variable "log_analytics_sku" {
  description = "SKU for Log Analytics workspace"
  type        = string
  default     = "PerGB2018"
}

variable "retention_days" {
  description = "Data retention in days"
  type        = number
  default     = 30

  validation {
    condition     = var.retention_days >= 30 && var.retention_days <= 730
    error_message = "Retention days must be between 30 and 730."
  }
}

variable "daily_quota_gb" {
  description = "Daily quota in GB for Log Analytics (-1 for unlimited)"
  type        = number
  default     = -1
}

# =============================================================================
# Application Insights Configuration
# =============================================================================

variable "appinsights_daily_cap_gb" {
  description = "Daily data cap for Application Insights in GB"
  type        = number
  default     = 10
}

variable "sampling_percentage" {
  description = "Sampling percentage for Application Insights (0-100)"
  type        = number
  default     = 100

  validation {
    condition     = var.sampling_percentage >= 0 && var.sampling_percentage <= 100
    error_message = "Sampling percentage must be between 0 and 100."
  }
}

# =============================================================================
# Alert Configuration
# =============================================================================

variable "create_alerts" {
  description = "Create monitoring alerts"
  type        = bool
  default     = true
}

variable "alert_email_receivers" {
  description = "Email receivers for alerts"
  type = list(object({
    name  = string
    email = string
  }))
  default = []
}

variable "alert_webhook_receivers" {
  description = "Webhook receivers for alerts"
  type = list(object({
    name = string
    uri  = string
  }))
  default = []
}

# Alert Thresholds
variable "api_response_time_threshold_ms" {
  description = "API response time threshold in milliseconds"
  type        = number
  default     = 5000
}

variable "api_failure_count_threshold" {
  description = "API failure count threshold"
  type        = number
  default     = 50
}

variable "auth_failure_threshold" {
  description = "Authentication failure count threshold"
  type        = number
  default     = 100
}

# =============================================================================
# Workbook Configuration
# =============================================================================

variable "create_workbooks" {
  description = "Create Azure workbooks (dashboards)"
  type        = bool
  default     = true
}

# =============================================================================
# Tags
# =============================================================================

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
