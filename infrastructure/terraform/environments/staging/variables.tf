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
  default     = "mktadmin"
}

variable "db_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true
}

# =============================================================================
# DNS & Domain Configuration
# =============================================================================

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = ""
}

variable "enable_dns" {
  description = "Enable Azure DNS zone creation"
  type        = bool
  default     = false
}

variable "mx_records" {
  description = "MX records for email"
  type = list(object({
    preference = number
    exchange   = string
  }))
  default = []
}

variable "spf_record" {
  description = "SPF record value"
  type        = string
  default     = ""
}

variable "dkim_records" {
  description = "DKIM records (selector -> target)"
  type        = map(string)
  default     = {}
}

variable "dmarc_record" {
  description = "DMARC record value"
  type        = string
  default     = ""
}

# =============================================================================
# Front Door Configuration
# =============================================================================

variable "enable_frontdoor" {
  description = "Enable Azure Front Door"
  type        = bool
  default     = false
}

variable "frontdoor_sku" {
  description = "Front Door SKU"
  type        = string
  default     = "Standard_AzureFrontDoor"
}

variable "enable_waf" {
  description = "Enable WAF policy"
  type        = bool
  default     = true
}

variable "waf_mode" {
  description = "WAF mode (Detection or Prevention)"
  type        = string
  default     = "Detection"
}

# =============================================================================
# Identity Configuration
# =============================================================================

variable "enable_identity" {
  description = "Enable Entra ID B2C identity configuration"
  type        = bool
  default     = false
}

variable "b2c_tenant_name" {
  description = "B2C tenant name (without .onmicrosoft.com)"
  type        = string
  default     = ""
}

variable "web_redirect_uris" {
  description = "Redirect URIs for web application"
  type        = list(string)
  default     = []
}

variable "spa_redirect_uris" {
  description = "Redirect URIs for SPA"
  type        = list(string)
  default     = []
}

# =============================================================================
# Monitoring Configuration
# =============================================================================

variable "alert_email_receivers" {
  description = "Email receivers for alerts"
  type = list(object({
    name  = string
    email = string
  }))
  default = []
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}
