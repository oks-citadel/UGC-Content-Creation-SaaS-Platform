# =============================================================================
# Variables for Production Environment
# =============================================================================

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "db_admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  default     = "mktadmin"
}

variable "db_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Cost Management Variables
# -----------------------------------------------------------------------------

variable "monthly_budget" {
  description = "Monthly budget in USD for the resource group"
  type        = number
  default     = 1000
}

variable "budget_alert_emails" {
  description = "Email addresses for budget alerts"
  type        = list(string)
  default     = ["admin@example.com"]
}
