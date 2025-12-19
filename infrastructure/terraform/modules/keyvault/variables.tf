# =============================================================================
# Key Vault Module - Variables
# =============================================================================

variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "name_suffix" {
  description = "Unique suffix for globally unique names"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "sku_name" {
  description = "Key Vault SKU"
  type        = string
  default     = "standard"
}

variable "soft_delete_retention_days" {
  description = "Soft delete retention days"
  type        = number
  default     = 90
}

variable "purge_protection_enabled" {
  description = "Enable purge protection"
  type        = bool
  default     = true
}

variable "default_network_action" {
  description = "Default network action (Allow or Deny)"
  type        = string
  default     = "Deny"
}

variable "allowed_subnet_ids" {
  description = "Allowed subnet IDs"
  type        = list(string)
  default     = []
}

variable "allowed_ip_ranges" {
  description = "Allowed IP ranges"
  type        = list(string)
  default     = []
}

variable "admin_object_ids" {
  description = "Admin principal object IDs"
  type        = list(string)
  default     = []
}

variable "aks_identity_principal_id" {
  description = "AKS identity principal ID for secret access"
  type        = string
  default     = null
}

variable "database_connection_string" {
  description = "Database connection string to store"
  type        = string
  default     = null
  sensitive   = true
}

variable "redis_connection_string" {
  description = "Redis connection string to store"
  type        = string
  default     = null
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret (auto-generated if not provided)"
  type        = string
  default     = null
  sensitive   = true
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  type        = string
  default     = null
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
