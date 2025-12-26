# =============================================================================
# Azure Front Door Module - Variables
# =============================================================================

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for private link resources"
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
# Front Door Configuration
# =============================================================================

variable "sku_name" {
  description = "SKU name for Front Door (Standard_AzureFrontDoor or Premium_AzureFrontDoor)"
  type        = string
  default     = "Premium_AzureFrontDoor"

  validation {
    condition     = contains(["Standard_AzureFrontDoor", "Premium_AzureFrontDoor"], var.sku_name)
    error_message = "SKU must be Standard_AzureFrontDoor or Premium_AzureFrontDoor."
  }
}

variable "response_timeout_seconds" {
  description = "Response timeout in seconds"
  type        = number
  default     = 60
}

# =============================================================================
# Domain Configuration
# =============================================================================

variable "domain_name" {
  description = "Primary domain name for custom domains"
  type        = string
  default     = ""
}

variable "dns_zone_id" {
  description = "ID of the DNS zone for custom domain validation"
  type        = string
  default     = ""
}

# =============================================================================
# Origin Configuration
# =============================================================================

variable "api_origin_hostname" {
  description = "Hostname of the API origin (AKS ingress)"
  type        = string
}

variable "web_origin_hostname" {
  description = "Hostname of the web origin"
  type        = string
}

variable "health_probe_path" {
  description = "Path for health probe"
  type        = string
  default     = "/health"
}

# =============================================================================
# Private Link Configuration
# =============================================================================

variable "api_private_link_target_id" {
  description = "Resource ID for API private link target"
  type        = string
  default     = ""
}

variable "private_link_target_type" {
  description = "Type of private link target"
  type        = string
  default     = "blob"
}

# =============================================================================
# WAF Configuration
# =============================================================================

variable "enable_waf" {
  description = "Enable Web Application Firewall"
  type        = bool
  default     = true
}

variable "waf_mode" {
  description = "WAF mode (Detection or Prevention)"
  type        = string
  default     = "Prevention"

  validation {
    condition     = contains(["Detection", "Prevention"], var.waf_mode)
    error_message = "WAF mode must be Detection or Prevention."
  }
}

variable "rate_limit_threshold" {
  description = "Rate limit threshold per minute"
  type        = number
  default     = 1000
}

variable "rate_limit_whitelist" {
  description = "IP addresses to whitelist from rate limiting"
  type        = list(string)
  default     = []
}

variable "blocked_countries" {
  description = "List of country codes to block"
  type        = list(string)
  default     = []
}

variable "waf_exclusions" {
  description = "WAF rule exclusions"
  type = list(object({
    match_variable = string
    operator       = string
    selector       = string
  }))
  default = []
}

# =============================================================================
# Caching Configuration
# =============================================================================

variable "content_types_to_compress" {
  description = "Content types to compress"
  type        = list(string)
  default = [
    "application/javascript",
    "application/json",
    "application/xml",
    "text/css",
    "text/html",
    "text/javascript",
    "text/plain",
    "text/xml",
    "image/svg+xml"
  ]
}

# =============================================================================
# Monitoring
# =============================================================================

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for diagnostics"
  type        = string
  default     = ""
}

# =============================================================================
# Tags
# =============================================================================

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
