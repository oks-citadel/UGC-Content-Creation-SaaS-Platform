# =============================================================================
# IAM ECS Module Variables
# =============================================================================

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "service_names" {
  description = "List of all service names that need task roles"
  type        = list(string)
}

variable "kms_key_arns" {
  description = "List of KMS key ARNs for decrypting secrets"
  type        = list(string)
  default     = []
}

variable "s3_buckets" {
  description = "List of S3 bucket names for S3 access policy"
  type        = list(string)
  default     = []
}

variable "s3_access_services" {
  description = "List of services that need S3 access"
  type        = list(string)
  default     = []
}

variable "ses_access_services" {
  description = "List of services that need SES access"
  type        = list(string)
  default     = []
}

variable "sqs_access_services" {
  description = "List of services that need SQS access"
  type        = list(string)
  default     = []
}

variable "bedrock_access_services" {
  description = "List of services that need Bedrock access"
  type        = list(string)
  default     = []
}

variable "secrets_access_services" {
  description = "List of services that need runtime Secrets Manager access"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
