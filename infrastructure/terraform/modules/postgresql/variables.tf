# =============================================================================
# PostgreSQL Module - Variables
# =============================================================================

variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "name_suffix" {
  description = "Unique suffix for globally unique names"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
}

variable "private_dns_zone_id" {
  description = "Private DNS zone ID"
  type        = string
}

variable "postgresql_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "16"
}

variable "sku_name" {
  description = "PostgreSQL SKU name"
  type        = string
  default     = "GP_Standard_D4s_v3"
}

variable "storage_mb" {
  description = "Storage size in MB"
  type        = number
  default     = 131072 # 128 GB
}

variable "storage_tier" {
  description = "Storage tier"
  type        = string
  default     = "P30"
}

variable "administrator_login" {
  description = "Administrator login"
  type        = string
  default     = "nexusadmin"
}

variable "administrator_password" {
  description = "Administrator password"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "Main database name"
  type        = string
  default     = "nexus"
}

variable "create_analytics_db" {
  description = "Create separate analytics database"
  type        = bool
  default     = true
}

variable "availability_zone" {
  description = "Availability zone"
  type        = string
  default     = "1"
}

variable "standby_availability_zone" {
  description = "Standby availability zone for HA"
  type        = string
  default     = "2"
}

variable "high_availability_mode" {
  description = "High availability mode"
  type        = string
  default     = "ZoneRedundant"
}

variable "backup_retention_days" {
  description = "Backup retention days"
  type        = number
  default     = 35
}

variable "geo_redundant_backup_enabled" {
  description = "Enable geo-redundant backups"
  type        = bool
  default     = true
}

variable "allow_azure_services" {
  description = "Allow Azure services to access"
  type        = bool
  default     = false
}

# Performance settings
variable "max_connections" {
  description = "Max connections"
  type        = string
  default     = "500"
}

variable "shared_buffers" {
  description = "Shared buffers"
  type        = string
  default     = "262144" # 256MB in 8KB pages
}

variable "work_mem" {
  description = "Work memory in KB"
  type        = string
  default     = "65536" # 64MB
}

variable "log_min_duration_statement" {
  description = "Log queries longer than this (ms)"
  type        = string
  default     = "1000"
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for diagnostics"
  type        = string
  default     = null
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
