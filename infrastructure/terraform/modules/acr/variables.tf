# =============================================================================
# ACR Module - Variables
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

variable "sku" {
  description = "ACR SKU (Basic, Standard, Premium)"
  type        = string
  default     = "Premium"
}

variable "admin_enabled" {
  description = "Enable admin user"
  type        = bool
  default     = false
}

variable "georeplications" {
  description = "Geo-replication locations (Premium only)"
  type = list(object({
    location                  = string
    regional_endpoint_enabled = optional(bool, true)
    zone_redundancy_enabled   = optional(bool, true)
  }))
  default = []
}

variable "default_network_action" {
  description = "Default network action"
  type        = string
  default     = "Deny"
}

variable "ip_rules" {
  description = "IP rules for network access"
  type = list(object({
    action   = string
    ip_range = string
  }))
  default = []
}

variable "virtual_network_rules" {
  description = "Virtual network rules"
  type = list(object({
    action    = string
    subnet_id = string
  }))
  default = []
}

variable "retention_days" {
  description = "Retention days for untagged manifests"
  type        = number
  default     = 7
}

variable "retention_enabled" {
  description = "Enable retention policy"
  type        = bool
  default     = true
}

variable "trust_policy_enabled" {
  description = "Enable trust policy"
  type        = bool
  default     = false
}

variable "zone_redundancy_enabled" {
  description = "Enable zone redundancy"
  type        = bool
  default     = true
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
