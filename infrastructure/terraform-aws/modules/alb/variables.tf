# =============================================================================
# ALB Module Variables
# =============================================================================

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
}

variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
}

variable "logs_bucket" {
  description = "S3 bucket for ALB access logs"
  type        = string
  default     = ""
}

variable "enable_access_logs" {
  description = "Enable ALB access logs"
  type        = bool
  default     = true
}

variable "idle_timeout" {
  description = "ALB idle timeout in seconds"
  type        = number
  default     = 60
}

variable "ssl_policy" {
  description = "SSL policy for HTTPS listener"
  type        = string
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "services" {
  description = "Map of services with routing configuration"
  type = map(object({
    port                  = number
    priority              = number
    path_patterns         = list(string)
    health_check_path     = string
    health_check_interval = optional(number, 30)
    health_check_timeout  = optional(number, 5)
    health_check_matcher  = optional(string, "200")
    deregistration_delay  = optional(number, 30)
    stickiness_enabled    = optional(bool, false)
  }))
  default = {}
}

variable "host_rules" {
  description = "Map of host-based routing rules"
  type = map(object({
    priority       = number
    host_headers   = list(string)
    target_service = string
  }))
  default = {}
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
