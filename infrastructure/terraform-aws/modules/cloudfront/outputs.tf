# =============================================================================
# CloudFront Module Outputs
# =============================================================================

output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.main.arn
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "distribution_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID (for Route 53 alias)"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "distribution_status" {
  description = "CloudFront distribution status"
  value       = aws_cloudfront_distribution.main.status
}

output "etag" {
  description = "CloudFront distribution ETag"
  value       = aws_cloudfront_distribution.main.etag
}

output "oac_id" {
  description = "Origin Access Control ID for S3"
  value       = var.web_origin_domain != null ? aws_cloudfront_origin_access_control.s3[0].id : null
}

output "cache_policy_api_id" {
  description = "API cache policy ID"
  value       = aws_cloudfront_cache_policy.api.id
}

output "cache_policy_static_id" {
  description = "Static assets cache policy ID"
  value       = aws_cloudfront_cache_policy.static.id
}
