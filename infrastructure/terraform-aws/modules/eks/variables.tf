# =============================================================================
# EKS Module Variables
# =============================================================================

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.29"
}

variable "subnet_ids" {
  description = "List of subnet IDs for EKS"
  type        = list(string)
}

variable "cluster_security_group_id" {
  description = "Security group ID for EKS cluster"
  type        = string
}

variable "enable_public_access" {
  description = "Enable public access to EKS API"
  type        = bool
  default     = true
}

variable "public_access_cidrs" {
  description = "CIDR blocks allowed for public access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enabled_cluster_log_types" {
  description = "List of EKS cluster log types to enable"
  type        = list(string)
  default     = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "kms_key_arn" {
  description = "KMS key ARN for secrets encryption (optional, creates new if null)"
  type        = string
  default     = null
}

# System Node Group
variable "system_instance_types" {
  description = "Instance types for system node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "system_desired_size" {
  description = "Desired size for system node group"
  type        = number
  default     = 2
}

variable "system_min_size" {
  description = "Minimum size for system node group"
  type        = number
  default     = 2
}

variable "system_max_size" {
  description = "Maximum size for system node group"
  type        = number
  default     = 3
}

# Application Node Group
variable "app_instance_types" {
  description = "Instance types for app node group"
  type        = list(string)
  default     = ["t3.large", "t3.xlarge"]
}

variable "app_capacity_type" {
  description = "Capacity type for app node group (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"
}

variable "app_desired_size" {
  description = "Desired size for app node group"
  type        = number
  default     = 2
}

variable "app_min_size" {
  description = "Minimum size for app node group"
  type        = number
  default     = 1
}

variable "app_max_size" {
  description = "Maximum size for app node group"
  type        = number
  default     = 10
}

# Worker Node Group
variable "worker_instance_types" {
  description = "Instance types for worker node group"
  type        = list(string)
  default     = ["t3.medium", "t3.large"]
}

variable "worker_desired_size" {
  description = "Desired size for worker node group"
  type        = number
  default     = 0
}

variable "worker_min_size" {
  description = "Minimum size for worker node group"
  type        = number
  default     = 0
}

variable "worker_max_size" {
  description = "Maximum size for worker node group"
  type        = number
  default     = 5
}

# Addons
variable "enable_ebs_csi_driver" {
  description = "Enable EBS CSI Driver addon"
  type        = bool
  default     = true
}

variable "enable_cluster_autoscaler" {
  description = "Enable Cluster Autoscaler"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
