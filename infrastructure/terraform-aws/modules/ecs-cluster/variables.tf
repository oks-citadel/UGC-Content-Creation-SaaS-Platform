# =============================================================================
# ECS Cluster Module Variables
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
  description = "VPC ID where ECS cluster will be deployed"
  type        = string
}

variable "alb_security_group_id" {
  description = "Security group ID of the ALB"
  type        = string
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "default_fargate_weight" {
  description = "Default weight for FARGATE capacity provider"
  type        = number
  default     = 1
}

variable "default_fargate_base" {
  description = "Default base for FARGATE capacity provider"
  type        = number
  default     = 1
}

variable "enable_spot_default" {
  description = "Include FARGATE_SPOT in default capacity provider strategy"
  type        = bool
  default     = false
}

variable "default_spot_weight" {
  description = "Default weight for FARGATE_SPOT capacity provider"
  type        = number
  default     = 0
}

variable "service_names" {
  description = "List of service names to create log groups for"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
