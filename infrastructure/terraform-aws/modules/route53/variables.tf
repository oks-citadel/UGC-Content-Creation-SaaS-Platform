# =============================================================================
# Route 53 Module Variables
# =============================================================================

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Hosted Zone Configuration
# -----------------------------------------------------------------------------

variable "domain_name" {
  description = "Domain name for the hosted zone"
  type        = string
}

variable "create_zone" {
  description = "Create a new hosted zone"
  type        = bool
  default     = true
}

variable "private_zone" {
  description = "Create a private hosted zone"
  type        = bool
  default     = false
}

variable "vpc_id" {
  description = "VPC ID for private hosted zone"
  type        = string
  default     = null
}

# -----------------------------------------------------------------------------
# DNS Records
# -----------------------------------------------------------------------------

variable "records" {
  description = "Map of DNS records to create"
  type = map(object({
    type    = string
    ttl     = optional(number, 300)
    records = optional(list(string), null)
    alias = optional(object({
      name                   = string
      zone_id                = string
      evaluate_target_health = optional(bool, true)
    }), null)
    geolocation = optional(object({
      continent   = optional(string)
      country     = optional(string)
      subdivision = optional(string)
    }), null)
    latency = optional(object({
      region = string
    }), null)
    weighted = optional(object({
      weight = number
    }), null)
    failover = optional(object({
      type = string # PRIMARY or SECONDARY
    }), null)
    set_identifier  = optional(string)
    health_check_id = optional(string)
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# Health Checks
# -----------------------------------------------------------------------------

variable "health_checks" {
  description = "Map of health checks to create"
  type = map(object({
    fqdn              = optional(string)
    ip_address        = optional(string)
    port              = optional(number, 443)
    type              = optional(string, "HTTPS")
    resource_path     = optional(string, "/health")
    failure_threshold = optional(number, 3)
    request_interval  = optional(number, 30)
    measure_latency   = optional(bool, true)
    regions           = optional(list(string))
    create_alarm      = optional(bool, true)
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# DNSSEC
# -----------------------------------------------------------------------------

variable "enable_dnssec" {
  description = "Enable DNSSEC for the hosted zone"
  type        = bool
  default     = false
}

variable "dnssec_kms_key_arn" {
  description = "KMS key ARN for DNSSEC signing"
  type        = string
  default     = null
}

# -----------------------------------------------------------------------------
# Query Logging
# -----------------------------------------------------------------------------

variable "enable_query_logging" {
  description = "Enable DNS query logging"
  type        = bool
  default     = false
}

variable "query_log_group_arn" {
  description = "CloudWatch Log Group ARN for query logging"
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
