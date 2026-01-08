# =============================================================================
# IAM Module for ECS Fargate
# =============================================================================
# This module creates IAM roles and policies for ECS Fargate tasks:
# - Task Execution Role: Used by ECS to pull images and write logs
# - Task Role: Used by the application running in the container
# =============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# Task Execution Role (shared across all services)
# -----------------------------------------------------------------------------
resource "aws_iam_role" "task_execution" {
  name = "${var.project}-${var.environment}-ecs-task-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-ecs-task-execution"
    Environment = var.environment
    Project     = var.project
  })
}

# Attach AWS managed policy for basic ECS task execution
resource "aws_iam_role_policy_attachment" "task_execution_managed" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Custom policy for Secrets Manager and SSM Parameter Store access
resource "aws_iam_role_policy" "task_execution_secrets" {
  name = "${var.project}-${var.environment}-task-execution-secrets"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${var.project}/${var.environment}/*"
        ]
      },
      {
        Sid    = "SSMParameterAccess"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/${var.environment}/*"
        ]
      },
      {
        Sid    = "KMSDecrypt"
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = var.kms_key_arns
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Base Task Role (shared, with service-specific extensions)
# -----------------------------------------------------------------------------
resource "aws_iam_role" "task" {
  for_each = toset(var.service_names)

  name = "${var.project}-${var.environment}-${each.value}-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name        = "${var.project}-${var.environment}-${each.value}-task"
    Environment = var.environment
    Project     = var.project
    Service     = each.value
  })
}

# Base policy for all task roles (ECS Exec, CloudWatch, X-Ray)
resource "aws_iam_role_policy" "task_base" {
  for_each = toset(var.service_names)

  name = "${var.project}-${var.environment}-${each.value}-task-base"
  role = aws_iam_role.task[each.value].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECSExec"
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.project}-${var.environment}/*"
        ]
      },
      {
        Sid    = "XRayTracing"
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Service-Specific Task Role Policies
# -----------------------------------------------------------------------------

# S3 access policy (for services that need it)
resource "aws_iam_role_policy" "task_s3" {
  for_each = toset(var.s3_access_services)

  name = "${var.project}-${var.environment}-${each.value}-s3-access"
  role = aws_iam_role.task[each.value].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3ReadWrite"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = flatten([
          for bucket in var.s3_buckets : [
            "arn:aws:s3:::${bucket}",
            "arn:aws:s3:::${bucket}/*"
          ]
        ])
      }
    ]
  })
}

# SES access policy (for notification service)
resource "aws_iam_role_policy" "task_ses" {
  for_each = toset(var.ses_access_services)

  name = "${var.project}-${var.environment}-${each.value}-ses-access"
  role = aws_iam_role.task[each.value].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SESEmail"
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# SQS access policy (for background workers)
resource "aws_iam_role_policy" "task_sqs" {
  for_each = toset(var.sqs_access_services)

  name = "${var.project}-${var.environment}-${each.value}-sqs-access"
  role = aws_iam_role.task[each.value].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SQSAccess"
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = [
          "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${var.project}-${var.environment}-*"
        ]
      }
    ]
  })
}

# Bedrock access policy (for AI services)
resource "aws_iam_role_policy" "task_bedrock" {
  for_each = toset(var.bedrock_access_services)

  name = "${var.project}-${var.environment}-${each.value}-bedrock-access"
  role = aws_iam_role.task[each.value].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockInvoke"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/*"
        ]
      }
    ]
  })
}

# Secrets Manager access policy (for services needing runtime secret access)
resource "aws_iam_role_policy" "task_secrets" {
  for_each = toset(var.secrets_access_services)

  name = "${var.project}-${var.environment}-${each.value}-secrets-access"
  role = aws_iam_role.task[each.value].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecretsManagerRead"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${var.project}/${var.environment}/*"
        ]
      }
    ]
  })
}
