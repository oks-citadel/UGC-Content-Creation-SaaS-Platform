# =============================================================================
# Identity Module - Variables
# =============================================================================

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# =============================================================================
# B2C Configuration
# =============================================================================

variable "b2c_tenant_id" {
  description = "Azure AD B2C tenant ID"
  type        = string
  default     = ""
}

variable "b2c_tenant_name" {
  description = "Azure AD B2C tenant name (without .onmicrosoft.com)"
  type        = string
  default     = ""
}

variable "sign_in_audience" {
  description = "Sign-in audience for app registrations"
  type        = string
  default     = "AzureADandPersonalMicrosoftAccount"

  validation {
    condition = contains([
      "AzureADMyOrg",
      "AzureADMultipleOrgs",
      "AzureADandPersonalMicrosoftAccount",
      "PersonalMicrosoftAccount"
    ], var.sign_in_audience)
    error_message = "Invalid sign_in_audience value."
  }
}

# =============================================================================
# App Registration Configuration
# =============================================================================

variable "web_redirect_uris" {
  description = "Redirect URIs for web application"
  type        = list(string)
  default     = []
}

variable "spa_redirect_uris" {
  description = "Redirect URIs for single-page application"
  type        = list(string)
  default     = []
}

# =============================================================================
# Security Groups
# =============================================================================

variable "create_security_groups" {
  description = "Create security groups for subscription tiers"
  type        = bool
  default     = true
}

# =============================================================================
# Key Vault Integration
# =============================================================================

variable "key_vault_id" {
  description = "Key Vault ID to store app credentials"
  type        = string
  default     = ""
}

# =============================================================================
# Tags
# =============================================================================

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
