# =============================================================================
# IAM ECS Module Outputs
# =============================================================================

output "task_execution_role_arn" {
  description = "Task execution role ARN (shared)"
  value       = aws_iam_role.task_execution.arn
}

output "task_execution_role_name" {
  description = "Task execution role name"
  value       = aws_iam_role.task_execution.name
}

output "task_role_arns" {
  description = "Map of service names to task role ARNs"
  value       = { for k, v in aws_iam_role.task : k => v.arn }
}

output "task_role_names" {
  description = "Map of service names to task role names"
  value       = { for k, v in aws_iam_role.task : k => v.name }
}
