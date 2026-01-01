# =============================================================================
# ElastiCache Module Outputs
# =============================================================================

output "replication_group_id" {
  description = "ID of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.main.id
}

output "primary_endpoint_address" {
  description = "Primary endpoint address"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "Reader endpoint address"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.main.port
}

output "connection_string" {
  description = "Redis connection string"
  value       = "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}"
  sensitive   = true
}

output "configuration_endpoint" {
  description = "Configuration endpoint for cluster mode"
  value       = aws_elasticache_replication_group.main.configuration_endpoint_address
}

output "member_clusters" {
  description = "IDs of the individual cache clusters"
  value       = aws_elasticache_replication_group.main.member_clusters
}

output "arn" {
  description = "ARN of the replication group"
  value       = aws_elasticache_replication_group.main.arn
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = var.at_rest_encryption_enabled && var.kms_key_arn == null ? aws_kms_key.redis[0].arn : var.kms_key_arn
}
