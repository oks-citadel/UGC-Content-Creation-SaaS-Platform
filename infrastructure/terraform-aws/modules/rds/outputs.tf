# =============================================================================
# RDS Module Outputs
# =============================================================================

output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint (hostname:port)"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_address" {
  description = "RDS instance hostname"
  value       = aws_db_instance.main.address
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "Database master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_credentials_secret_arn" {
  description = "Secrets Manager secret ARN for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "db_credentials_secret_name" {
  description = "Secrets Manager secret name for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "db_kms_key_arn" {
  description = "KMS key ARN for RDS encryption"
  value       = var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.rds[0].arn
}

output "db_replica_endpoint" {
  description = "Read replica endpoint"
  value       = var.create_read_replica ? aws_db_instance.replica[0].endpoint : null
}

output "db_replica_address" {
  description = "Read replica hostname"
  value       = var.create_read_replica ? aws_db_instance.replica[0].address : null
}
