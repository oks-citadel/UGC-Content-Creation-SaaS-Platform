# =============================================================================
# RDS Module Variables
# =============================================================================

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 64
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling (GB)"
  type        = number
  default     = 256
}

variable "storage_type" {
  description = "Storage type (gp3, io1, etc)"
  type        = string
  default     = "gp3"
}

variable "database_name" {
  description = "Name of the database to create"
  type        = string
  default     = "nexus"
}

variable "master_username" {
  description = "Master username"
  type        = string
  default     = "nexusadmin"
}

variable "master_password" {
  description = "Master password (if null, will be generated)"
  type        = string
  default     = null
  sensitive   = true
}

variable "subnet_ids" {
  description = "List of subnet IDs for RDS"
  type        = list(string)
  default     = []
}

variable "db_subnet_group_name" {
  description = "Existing DB subnet group name (if null, will be created)"
  type        = string
  default     = null
}

variable "security_group_ids" {
  description = "List of security group IDs for RDS"
  type        = list(string)
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "availability_zone" {
  description = "Availability zone (when not multi-az)"
  type        = string
  default     = null
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 35
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "Sun:04:00-Sun:05:00"
}

variable "monitoring_interval" {
  description = "Enhanced monitoring interval (0 to disable)"
  type        = number
  default     = 60
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "performance_insights_retention_days" {
  description = "Performance Insights retention period"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "iam_database_authentication" {
  description = "Enable IAM database authentication"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption (if null, will be created)"
  type        = string
  default     = null
}

variable "max_connections" {
  description = "Maximum database connections"
  type        = string
  default     = "200"
}

variable "slow_query_log_threshold" {
  description = "Slow query log threshold in milliseconds"
  type        = string
  default     = "1000"
}

variable "alarm_actions" {
  description = "List of alarm action ARNs"
  type        = list(string)
  default     = []
}

variable "create_read_replica" {
  description = "Create a read replica"
  type        = bool
  default     = false
}

variable "replica_instance_class" {
  description = "Instance class for read replica"
  type        = string
  default     = null
}

variable "replica_availability_zone" {
  description = "Availability zone for read replica"
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
