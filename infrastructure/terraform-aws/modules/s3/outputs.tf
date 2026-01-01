# =============================================================================
# S3 Module Outputs
# =============================================================================

output "bucket_ids" {
  description = "Map of bucket names to IDs"
  value       = { for k, v in aws_s3_bucket.main : k => v.id }
}

output "bucket_arns" {
  description = "Map of bucket names to ARNs"
  value       = { for k, v in aws_s3_bucket.main : k => v.arn }
}

output "bucket_names" {
  description = "Map of logical names to actual bucket names"
  value       = { for k, v in aws_s3_bucket.main : k => v.bucket }
}

output "bucket_regional_domain_names" {
  description = "Map of bucket names to regional domain names"
  value       = { for k, v in aws_s3_bucket.main : k => v.bucket_regional_domain_name }
}

output "bucket_domain_names" {
  description = "Map of bucket names to domain names"
  value       = { for k, v in aws_s3_bucket.main : k => v.bucket_domain_name }
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = var.create_kms_key ? aws_kms_key.s3[0].arn : var.kms_key_arn
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = var.create_kms_key ? aws_kms_key.s3[0].key_id : null
}
