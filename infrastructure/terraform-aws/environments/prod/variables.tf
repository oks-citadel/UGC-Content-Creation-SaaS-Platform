# =============================================================================
# Production Environment Variables
# =============================================================================

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "account_id" {
  description = "AWS account ID for workload-prod"
  type        = string
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access EKS API"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Restrict in production
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = ""
}

variable "custom_domains" {
  description = "Custom domains for CloudFront"
  type        = list(string)
  default     = []
}

variable "create_dns_zone" {
  description = "Create Route 53 hosted zone"
  type        = bool
  default     = false
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for CloudFront"
  type        = string
  default     = null
}

variable "alert_email_endpoints" {
  description = "Email addresses for alerts"
  type        = list(string)
  default     = ["admin@example.com"]
}

variable "monthly_budget" {
  description = "Monthly budget in USD"
  type        = string
  default     = "1500"
}
