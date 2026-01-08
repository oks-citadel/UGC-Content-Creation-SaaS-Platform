# =============================================================================
# CloudWatch Module Outputs
# =============================================================================

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "application_log_group_name" {
  description = "Application log group name"
  value       = aws_cloudwatch_log_group.application.name
}

output "application_log_group_arn" {
  description = "Application log group ARN"
  value       = aws_cloudwatch_log_group.application.arn
}

output "eks_log_group_name" {
  description = "EKS log group name"
  value       = var.eks_cluster_name != null ? aws_cloudwatch_log_group.eks[0].name : null
}

output "eks_log_group_arn" {
  description = "EKS log group ARN"
  value       = var.eks_cluster_name != null ? aws_cloudwatch_log_group.eks[0].arn : null
}

output "dashboard_arn" {
  description = "CloudWatch dashboard ARN"
  value       = var.create_dashboard ? aws_cloudwatch_dashboard.main[0].dashboard_arn : null
}

output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = var.create_dashboard ? aws_cloudwatch_dashboard.main[0].dashboard_name : null
}

output "alarm_arns" {
  description = "Map of alarm names to ARNs"
  value = merge(
    var.eks_cluster_name != null ? {
      eks_cpu         = aws_cloudwatch_metric_alarm.eks_cpu[0].arn
      eks_memory      = aws_cloudwatch_metric_alarm.eks_memory[0].arn
      eks_pod_restart = aws_cloudwatch_metric_alarm.eks_pod_restart[0].arn
    } : {},
    var.rds_identifier != null ? {
      rds_cpu         = aws_cloudwatch_metric_alarm.rds_cpu[0].arn
      rds_connections = aws_cloudwatch_metric_alarm.rds_connections[0].arn
      rds_storage     = aws_cloudwatch_metric_alarm.rds_storage[0].arn
    } : {},
    {
      api_error_rate = aws_cloudwatch_metric_alarm.api_error_rate.arn
      api_latency    = aws_cloudwatch_metric_alarm.api_latency.arn
      error_logs     = aws_cloudwatch_metric_alarm.error_logs.arn
    }
  )
}

output "composite_alarm_arn" {
  description = "Critical composite alarm ARN"
  value       = aws_cloudwatch_composite_alarm.critical.arn
}
