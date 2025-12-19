# =============================================================================
# AKS Module - Variables
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

variable "vnet_subnet_id" {
  description = "VNet subnet ID for AKS"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "sku_tier" {
  description = "AKS SKU tier (Free or Standard)"
  type        = string
  default     = "Standard"
}

# System Node Pool
variable "system_node_count" {
  description = "Initial node count for system pool"
  type        = number
  default     = 2
}

variable "system_vm_size" {
  description = "VM size for system nodes"
  type        = string
  default     = "Standard_DS2_v2"
}

variable "system_min_count" {
  description = "Minimum node count for system pool"
  type        = number
  default     = 2
}

variable "system_max_count" {
  description = "Maximum node count for system pool"
  type        = number
  default     = 5
}

# Application Node Pool
variable "app_vm_size" {
  description = "VM size for application nodes"
  type        = string
  default     = "Standard_DS3_v2"
}

variable "app_min_count" {
  description = "Minimum node count for app pool"
  type        = number
  default     = 2
}

variable "app_max_count" {
  description = "Maximum node count for app pool"
  type        = number
  default     = 10
}

# Worker Node Pool
variable "worker_vm_size" {
  description = "VM size for worker nodes"
  type        = string
  default     = "Standard_DS2_v2"
}

variable "worker_min_count" {
  description = "Minimum node count for worker pool"
  type        = number
  default     = 1
}

variable "worker_max_count" {
  description = "Maximum node count for worker pool"
  type        = number
  default     = 5
}

# Common Node Pool Settings
variable "enable_auto_scaling" {
  description = "Enable cluster autoscaler"
  type        = bool
  default     = true
}

variable "max_pods" {
  description = "Maximum pods per node"
  type        = number
  default     = 110
}

variable "os_disk_size_gb" {
  description = "OS disk size in GB"
  type        = number
  default     = 128
}

variable "availability_zones" {
  description = "Availability zones for node pools"
  type        = list(string)
  default     = ["1", "2", "3"]
}

# Network Settings
variable "service_cidr" {
  description = "Kubernetes service CIDR"
  type        = string
  default     = "10.1.0.0/16"
}

variable "dns_service_ip" {
  description = "DNS service IP"
  type        = string
  default     = "10.1.0.10"
}

# Integration Settings
variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  type        = string
  default     = null
}

variable "acr_id" {
  description = "Azure Container Registry ID"
  type        = string
  default     = null
}

variable "enable_acr_integration" {
  description = "Enable ACR pull integration"
  type        = bool
  default     = false
}

variable "keyvault_id" {
  description = "Key Vault ID for secrets provider"
  type        = string
  default     = null
}

variable "enable_keyvault_integration" {
  description = "Enable Key Vault secrets provider"
  type        = bool
  default     = false
}

variable "admin_group_object_ids" {
  description = "Azure AD group object IDs for cluster admin"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
