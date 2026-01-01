# =============================================================================
# CodePipeline Module Outputs
# =============================================================================

output "pipeline_arn" {
  description = "CodePipeline ARN"
  value       = aws_codepipeline.main.arn
}

output "pipeline_name" {
  description = "CodePipeline name"
  value       = aws_codepipeline.main.name
}

output "artifacts_bucket_name" {
  description = "S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.artifacts.id
}

output "artifacts_bucket_arn" {
  description = "S3 bucket ARN for pipeline artifacts"
  value       = aws_s3_bucket.artifacts.arn
}

output "codebuild_build_project_name" {
  description = "CodeBuild build project name"
  value       = aws_codebuild_project.build.name
}

output "codebuild_build_project_arn" {
  description = "CodeBuild build project ARN"
  value       = aws_codebuild_project.build.arn
}

output "codebuild_test_project_name" {
  description = "CodeBuild test project name"
  value       = var.enable_test_stage ? aws_codebuild_project.test[0].name : null
}

output "codebuild_test_project_arn" {
  description = "CodeBuild test project ARN"
  value       = var.enable_test_stage ? aws_codebuild_project.test[0].arn : null
}

output "codebuild_deploy_project_name" {
  description = "CodeBuild deploy project name"
  value       = var.enable_deploy_stage ? aws_codebuild_project.deploy[0].name : null
}

output "codebuild_deploy_project_arn" {
  description = "CodeBuild deploy project ARN"
  value       = var.enable_deploy_stage ? aws_codebuild_project.deploy[0].arn : null
}

output "codepipeline_role_arn" {
  description = "CodePipeline IAM role ARN"
  value       = aws_iam_role.codepipeline.arn
}

output "codebuild_role_arn" {
  description = "CodeBuild IAM role ARN"
  value       = aws_iam_role.codebuild.arn
}
