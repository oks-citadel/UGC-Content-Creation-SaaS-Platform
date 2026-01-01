# =============================================================================
# Route 53 Module Outputs
# =============================================================================

output "zone_id" {
  description = "Hosted zone ID"
  value       = local.zone_id
}

output "zone_name" {
  description = "Hosted zone name"
  value       = var.domain_name
}

output "name_servers" {
  description = "Name servers for the hosted zone"
  value       = var.create_zone ? aws_route53_zone.main[0].name_servers : null
}

output "zone_arn" {
  description = "Hosted zone ARN"
  value       = var.create_zone ? aws_route53_zone.main[0].arn : null
}

output "record_fqdns" {
  description = "Map of record names to FQDNs"
  value       = { for k, v in aws_route53_record.main : k => v.fqdn }
}

output "health_check_ids" {
  description = "Map of health check names to IDs"
  value       = { for k, v in aws_route53_health_check.main : k => v.id }
}

output "health_check_arns" {
  description = "Map of health check names to ARNs"
  value       = { for k, v in aws_route53_health_check.main : k => v.arn }
}
