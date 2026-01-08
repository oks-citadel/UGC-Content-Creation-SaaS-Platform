# =============================================================================
# ECS Cluster Module Outputs
# =============================================================================

output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "service_connect_namespace_arn" {
  description = "Service Connect namespace ARN"
  value       = aws_service_discovery_http_namespace.main.arn
}

output "service_connect_namespace_id" {
  description = "Service Connect namespace ID"
  value       = aws_service_discovery_http_namespace.main.id
}

output "service_connect_namespace_name" {
  description = "Service Connect namespace name"
  value       = aws_service_discovery_http_namespace.main.name
}

output "ecs_tasks_security_group_id" {
  description = "Security group ID for ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}

output "execute_command_log_group_name" {
  description = "CloudWatch log group name for ECS Exec"
  value       = aws_cloudwatch_log_group.execute_command.name
}

output "service_log_group_names" {
  description = "Map of service names to CloudWatch log group names"
  value       = { for k, v in aws_cloudwatch_log_group.services : k => v.name }
}

output "service_log_group_arns" {
  description = "Map of service names to CloudWatch log group ARNs"
  value       = { for k, v in aws_cloudwatch_log_group.services : k => v.arn }
}
