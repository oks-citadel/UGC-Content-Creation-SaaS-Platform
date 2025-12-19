# =============================================================================
# Variables for Staging Environment
# =============================================================================

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "db_admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  default     = "cbadmin"
}

variable "db_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}
