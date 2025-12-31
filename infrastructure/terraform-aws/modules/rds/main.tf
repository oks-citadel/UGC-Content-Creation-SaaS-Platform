# =============================================================================
# AWS RDS PostgreSQL Module - NEXUS Platform
# Replaces: Azure PostgreSQL Flexible Server (modules/postgresql)
# =============================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# -----------------------------------------------------------------------------
# Local Variables
# -----------------------------------------------------------------------------

locals {
  name_prefix = "${var.project}-${var.environment}"
  db_identifier = "${local.name_prefix}-postgres"

  common_tags = merge(var.tags, {
    Module      = "rds"
    Environment = var.environment
  })
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}

# -----------------------------------------------------------------------------
# KMS Key for RDS Encryption
# -----------------------------------------------------------------------------

resource "aws_kms_key" "rds" {
  count = var.kms_key_arn == null ? 1 : 0

  description             = "KMS key for RDS ${local.db_identifier} encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.db_identifier}-kms"
  })
}

resource "aws_kms_alias" "rds" {
  count = var.kms_key_arn == null ? 1 : 0

  name          = "alias/${local.db_identifier}"
  target_key_id = aws_kms_key.rds[0].key_id
}

# -----------------------------------------------------------------------------
# Random Password (if not provided)
# -----------------------------------------------------------------------------

resource "random_password" "master" {
  count = var.master_password == null ? 1 : 0

  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# -----------------------------------------------------------------------------
# DB Parameter Group
# -----------------------------------------------------------------------------

resource "aws_db_parameter_group" "main" {
  name        = "${local.db_identifier}-params"
  family      = "postgres${split(".", var.engine_version)[0]}"
  description = "Parameter group for ${local.db_identifier}"

  # Match Azure PostgreSQL configurations
  parameter {
    name  = "max_connections"
    value = var.max_connections
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/32768}"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "work_mem"
    value = "16384"  # 16MB
  }

  parameter {
    name  = "log_min_duration_statement"
    value = var.slow_query_log_threshold
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  # Enable extensions
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# DB Subnet Group
# -----------------------------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  count = var.db_subnet_group_name == null ? 1 : 0

  name        = "${local.db_identifier}-subnet-group"
  description = "Subnet group for ${local.db_identifier}"
  subnet_ids  = var.subnet_ids

  tags = merge(local.common_tags, {
    Name = "${local.db_identifier}-subnet-group"
  })
}

# -----------------------------------------------------------------------------
# RDS PostgreSQL Instance
# -----------------------------------------------------------------------------

resource "aws_db_instance" "main" {
  identifier = local.db_identifier

  # Engine
  engine               = "postgres"
  engine_version       = var.engine_version
  instance_class       = var.instance_class
  parameter_group_name = aws_db_parameter_group.main.name

  # Storage
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = var.storage_type
  storage_encrypted     = true
  kms_key_id           = var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.rds[0].arn

  # Database
  db_name  = var.database_name
  username = var.master_username
  password = var.master_password != null ? var.master_password : random_password.master[0].result

  # Network
  db_subnet_group_name   = var.db_subnet_group_name != null ? var.db_subnet_group_name : aws_db_subnet_group.main[0].name
  vpc_security_group_ids = var.security_group_ids
  publicly_accessible    = false
  port                   = 5432

  # Availability
  multi_az               = var.multi_az
  availability_zone      = var.multi_az ? null : var.availability_zone

  # Backup
  backup_retention_period   = var.backup_retention_period
  backup_window             = var.backup_window
  maintenance_window        = var.maintenance_window
  copy_tags_to_snapshot     = true
  delete_automated_backups  = false
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${local.db_identifier}-final-${formatdate("YYYYMMDD-hhmmss", timestamp())}" : null

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval             = var.monitoring_interval
  monitoring_role_arn             = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null
  performance_insights_enabled    = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? var.performance_insights_retention_days : null
  performance_insights_kms_key_id = var.performance_insights_enabled ? (var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.rds[0].arn) : null

  # Protection
  deletion_protection = var.deletion_protection

  # IAM
  iam_database_authentication_enabled = var.iam_database_authentication

  # Updates
  auto_minor_version_upgrade  = true
  allow_major_version_upgrade = false
  apply_immediately           = var.environment != "prod"

  tags = merge(local.common_tags, {
    Name = local.db_identifier
  })

  lifecycle {
    ignore_changes = [password]
  }
}

# -----------------------------------------------------------------------------
# Enhanced Monitoring IAM Role
# -----------------------------------------------------------------------------

resource "aws_iam_role" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  name = "${local.db_identifier}-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${local.db_identifier}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is above 80%"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "free_storage_space" {
  alarm_name          = "${local.db_identifier}-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.allocated_storage * 1024 * 1024 * 1024 * 0.2  # 20% of allocated
  alarm_description   = "RDS free storage space is below 20%"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${local.db_identifier}-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.max_connections * 0.9  # 90% of max
  alarm_description   = "RDS database connections are above 90% of max"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Secrets Manager (Store credentials)
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.project}/${var.environment}/database/credentials"
  description = "Database credentials for ${local.db_identifier}"

  recovery_window_in_days = var.environment == "prod" ? 30 : 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.master_username
    password = var.master_password != null ? var.master_password : random_password.master[0].result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    database = var.database_name
    engine   = "postgres"
    connection_string = "postgresql://${var.master_username}:${var.master_password != null ? var.master_password : random_password.master[0].result}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${var.database_name}?sslmode=require"
  })
}

# -----------------------------------------------------------------------------
# Read Replica (optional)
# -----------------------------------------------------------------------------

resource "aws_db_instance" "replica" {
  count = var.create_read_replica ? 1 : 0

  identifier = "${local.db_identifier}-replica"

  replicate_source_db = aws_db_instance.main.identifier
  instance_class      = var.replica_instance_class != null ? var.replica_instance_class : var.instance_class

  # Storage (inherits from source)
  storage_encrypted = true
  kms_key_id       = var.kms_key_arn != null ? var.kms_key_arn : aws_kms_key.rds[0].arn

  # Network
  vpc_security_group_ids = var.security_group_ids
  publicly_accessible    = false

  # Availability
  availability_zone = var.replica_availability_zone

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval             = var.monitoring_interval
  monitoring_role_arn             = var.monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null
  performance_insights_enabled    = var.performance_insights_enabled

  # Updates
  auto_minor_version_upgrade = true
  skip_final_snapshot        = true

  tags = merge(local.common_tags, {
    Name = "${local.db_identifier}-replica"
  })
}
