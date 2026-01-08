# =============================================================================
# NEXUS Platform - Staging Environment Variables
# =============================================================================

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the platform"
  type        = string
  default     = "nexus-staging.com"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "alert_email_endpoints" {
  description = "Email addresses for alerts"
  type        = list(string)
  default     = []
}
