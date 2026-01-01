# =============================================================================
# CloudFront Module Variables
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
# Origins
# -----------------------------------------------------------------------------

variable "api_origin_domain" {
  description = "Domain name of the API origin (EKS/ALB)"
  type        = string
  default     = null
}

variable "web_origin_domain" {
  description = "Domain name of the S3 bucket for static assets"
  type        = string
  default     = null
}

variable "origin_verify_header" {
  description = "Secret header value to verify requests are from CloudFront"
  type        = string
  default     = ""
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Distribution Configuration
# -----------------------------------------------------------------------------

variable "aliases" {
  description = "CNAMEs for the distribution"
  type        = list(string)
  default     = []
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate"
  type        = string
  default     = null
}

variable "price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"  # US, Canada, Europe
}

variable "default_root_object" {
  description = "Default root object"
  type        = string
  default     = "index.html"
}

variable "enable_compression" {
  description = "Enable compression"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------

variable "waf_web_acl_arn" {
  description = "ARN of WAF Web ACL"
  type        = string
  default     = null
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}

# -----------------------------------------------------------------------------
# Geo Restrictions
# -----------------------------------------------------------------------------

variable "geo_restriction_type" {
  description = "Geo restriction type (whitelist, blacklist, none)"
  type        = string
  default     = "none"
}

variable "geo_restriction_locations" {
  description = "ISO country codes for geo restriction"
  type        = list(string)
  default     = []
}

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------

variable "logging_bucket" {
  description = "S3 bucket for access logs"
  type        = string
  default     = null
}

# -----------------------------------------------------------------------------
# Monitoring
# -----------------------------------------------------------------------------

variable "alarm_actions" {
  description = "List of ARNs for alarm actions"
  type        = list(string)
  default     = []
}
