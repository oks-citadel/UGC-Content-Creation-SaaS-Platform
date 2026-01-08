# =============================================================================
# ECS Service Module Variables
# =============================================================================

# -----------------------------------------------------------------------------
# Required Variables
# -----------------------------------------------------------------------------

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "service_name" {
  description = "Service name"
  type        = string
}

variable "cluster_arn" {
  description = "ECS cluster ARN"
  type        = string
}

variable "cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "ecr_repository_url" {
  description = "ECR repository URL"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
}

variable "task_execution_role_arn" {
  description = "Task execution role ARN"
  type        = string
}

variable "task_role_arn" {
  description = "Task role ARN"
  type        = string
}

variable "log_group_name" {
  description = "CloudWatch log group name"
  type        = string
}

# -----------------------------------------------------------------------------
# Container Configuration
# -----------------------------------------------------------------------------

variable "container_port" {
  description = "Container port"
  type        = number
}

variable "cpu" {
  description = "CPU units (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory in MB"
  type        = number
  default     = 512
}

variable "cpu_architecture" {
  description = "CPU architecture (X86_64 or ARM64)"
  type        = string
  default     = "X86_64"
}

variable "environment_variables" {
  description = "Map of environment variables"
  type        = map(string)
  default     = {}
}

variable "secrets" {
  description = "Map of secret name to Secrets Manager ARN or SSM parameter ARN"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Health Check
# -----------------------------------------------------------------------------

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/health"
}

variable "health_check_start_period" {
  description = "Health check start period in seconds"
  type        = number
  default     = 60
}

variable "health_check_grace_period" {
  description = "ALB health check grace period in seconds"
  type        = number
  default     = 60
}

variable "enable_container_health_check" {
  description = "Enable container-level health check"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Service Configuration
# -----------------------------------------------------------------------------

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
}

variable "platform_version" {
  description = "Fargate platform version"
  type        = string
  default     = "LATEST"
}

variable "enable_execute_command" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = true
}

variable "deployment_maximum_percent" {
  description = "Maximum percent during deployment"
  type        = number
  default     = 200
}

variable "deployment_minimum_healthy_percent" {
  description = "Minimum healthy percent during deployment"
  type        = number
  default     = 100
}

# -----------------------------------------------------------------------------
# Spot Configuration
# -----------------------------------------------------------------------------

variable "use_spot" {
  description = "Use Fargate Spot capacity"
  type        = bool
  default     = false
}

variable "spot_weight_fargate" {
  description = "Weight for FARGATE capacity provider when using Spot"
  type        = number
  default     = 1
}

variable "spot_base_fargate" {
  description = "Base count for FARGATE capacity provider when using Spot"
  type        = number
  default     = 1
}

variable "spot_weight_spot" {
  description = "Weight for FARGATE_SPOT capacity provider"
  type        = number
  default     = 3
}

# -----------------------------------------------------------------------------
# Load Balancer
# -----------------------------------------------------------------------------

variable "target_group_arn" {
  description = "ALB target group ARN"
  type        = string
  default     = ""
}

variable "alb_resource_label" {
  description = "ALB resource label for request-based scaling"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Service Connect
# -----------------------------------------------------------------------------

variable "enable_service_connect" {
  description = "Enable ECS Service Connect"
  type        = bool
  default     = true
}

variable "service_connect_namespace_arn" {
  description = "Service Connect namespace ARN"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Auto Scaling
# -----------------------------------------------------------------------------

variable "enable_autoscaling" {
  description = "Enable auto scaling"
  type        = bool
  default     = true
}

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
  default     = 10
}

variable "cpu_target_value" {
  description = "Target CPU utilization percentage"
  type        = number
  default     = 70
}

variable "memory_target_value" {
  description = "Target memory utilization percentage"
  type        = number
  default     = 80
}

variable "requests_target_value" {
  description = "Target requests per task"
  type        = number
  default     = 1000
}

variable "scale_in_cooldown" {
  description = "Scale in cooldown in seconds"
  type        = number
  default     = 300
}

variable "scale_out_cooldown" {
  description = "Scale out cooldown in seconds"
  type        = number
  default     = 60
}

# -----------------------------------------------------------------------------
# Tags
# -----------------------------------------------------------------------------

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
