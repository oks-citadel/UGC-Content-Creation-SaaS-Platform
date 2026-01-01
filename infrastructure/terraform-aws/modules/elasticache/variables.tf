# =============================================================================
# ElastiCache Module Variables
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
# Engine Configuration
# -----------------------------------------------------------------------------

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "num_cache_clusters" {
  description = "Number of cache clusters (nodes) in the replication group"
  type        = number
  default     = 2
}

# -----------------------------------------------------------------------------
# High Availability
# -----------------------------------------------------------------------------

variable "automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Network Configuration
# -----------------------------------------------------------------------------

variable "subnet_group_name" {
  description = "Name of the ElastiCache subnet group"
  type        = string
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
}

# -----------------------------------------------------------------------------
# Encryption
# -----------------------------------------------------------------------------

variable "at_rest_encryption_enabled" {
  description = "Enable encryption at rest"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit"
  type        = bool
  default     = true
}

variable "kms_key_arn" {
  description = "ARN of existing KMS key for encryption"
  type        = string
  default     = null
}

variable "auth_token" {
  description = "Auth token for Redis (required if transit_encryption_enabled)"
  type        = string
  default     = null
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Backup Configuration
# -----------------------------------------------------------------------------

variable "snapshot_retention_limit" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "snapshot_window" {
  description = "Daily time range for snapshot"
  type        = string
  default     = "03:00-04:00"
}

# -----------------------------------------------------------------------------
# Maintenance
# -----------------------------------------------------------------------------

variable "maintenance_window" {
  description = "Weekly maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# -----------------------------------------------------------------------------
# Redis Parameters
# -----------------------------------------------------------------------------

variable "maxmemory_policy" {
  description = "Redis maxmemory policy"
  type        = string
  default     = "volatile-lru"
}

variable "notify_keyspace_events" {
  description = "Keyspace event notification settings"
  type        = string
  default     = ""
}

variable "connection_timeout" {
  description = "Connection timeout in seconds"
  type        = string
  default     = "0"
}

# -----------------------------------------------------------------------------
# Monitoring
# -----------------------------------------------------------------------------

variable "alarm_actions" {
  description = "List of ARNs for alarm actions"
  type        = list(string)
  default     = []
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = null
}

variable "max_connections_threshold" {
  description = "Threshold for connection count alarm"
  type        = number
  default     = 5000
}
