# =============================================================================
# Azure DNS Module - Variables
# =============================================================================

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name for the DNS zone"
  type        = string
}

variable "default_ttl" {
  description = "Default TTL for DNS records in seconds"
  type        = number
  default     = 3600
}

variable "email_ttl" {
  description = "TTL for email-related DNS records in seconds"
  type        = number
  default     = 3600
}

# =============================================================================
# Record Creation Flags
# =============================================================================

variable "create_apex_record" {
  description = "Create apex A record pointing to Front Door"
  type        = bool
  default     = false
}

variable "create_www_record" {
  description = "Create www CNAME record"
  type        = bool
  default     = true
}

variable "create_api_record" {
  description = "Create api CNAME record"
  type        = bool
  default     = true
}

variable "create_app_record" {
  description = "Create app CNAME record"
  type        = bool
  default     = true
}

# =============================================================================
# Record Targets
# =============================================================================

variable "front_door_id" {
  description = "Resource ID of Front Door for apex alias record"
  type        = string
  default     = ""
}

variable "www_target" {
  description = "Target for www CNAME record"
  type        = string
  default     = ""
}

variable "api_target" {
  description = "Target for api CNAME record (usually Front Door endpoint)"
  type        = string
  default     = ""
}

variable "app_target" {
  description = "Target for app CNAME record (usually Front Door endpoint)"
  type        = string
  default     = ""
}

# =============================================================================
# Email Records
# =============================================================================

variable "mx_records" {
  description = "MX records for email"
  type = list(object({
    preference = number
    exchange   = string
  }))
  default = []
}

variable "spf_record" {
  description = "SPF record value (without quotes)"
  type        = string
  default     = ""
}

variable "dkim_records" {
  description = "DKIM CNAME records (selector -> target)"
  type        = map(string)
  default     = {}
}

variable "dmarc_record" {
  description = "DMARC record value (without quotes)"
  type        = string
  default     = ""
}

# =============================================================================
# Verification Records
# =============================================================================

variable "verification_records" {
  description = "TXT records for domain verification (name -> value)"
  type        = map(string)
  default     = {}
}

# =============================================================================
# CAA Records
# =============================================================================

variable "caa_records" {
  description = "CAA records for certificate authority authorization"
  type = list(object({
    flags = number
    tag   = string
    value = string
  }))
  default = [
    {
      flags = 0
      tag   = "issue"
      value = "digicert.com"
    },
    {
      flags = 0
      tag   = "issue"
      value = "letsencrypt.org"
    },
    {
      flags = 0
      tag   = "issuewild"
      value = "digicert.com"
    }
  ]
}

# =============================================================================
# Custom Records
# =============================================================================

variable "custom_cname_records" {
  description = "Custom CNAME records (subdomain -> target)"
  type        = map(string)
  default     = {}
}

variable "custom_a_records" {
  description = "Custom A records (subdomain -> list of IPs)"
  type        = map(list(string))
  default     = {}
}

# =============================================================================
# Tags
# =============================================================================

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
