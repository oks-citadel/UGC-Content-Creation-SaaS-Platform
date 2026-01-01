# =============================================================================
# Secrets Manager Module Outputs
# =============================================================================

output "secret_arns" {
  description = "Map of secret names to ARNs"
  value       = { for k, v in aws_secretsmanager_secret.main : k => v.arn }
}

output "secret_ids" {
  description = "Map of secret names to IDs"
  value       = { for k, v in aws_secretsmanager_secret.main : k => v.id }
}

output "secret_names" {
  description = "Map of logical names to full secret names"
  value       = { for k, v in aws_secretsmanager_secret.main : k => v.name }
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = var.create_kms_key ? aws_kms_key.secrets[0].arn : var.kms_key_arn
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = var.create_kms_key ? aws_kms_key.secrets[0].key_id : null
}

output "read_policy_arn" {
  description = "ARN of the IAM policy for reading secrets"
  value       = var.create_read_policy ? aws_iam_policy.secret_read[0].arn : null
}

output "secret_version_ids" {
  description = "Map of secret names to version IDs"
  value       = { for k, v in aws_secretsmanager_secret_version.main : k => v.version_id }
}
