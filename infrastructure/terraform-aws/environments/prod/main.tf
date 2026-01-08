# =============================================================================
# NEXUS Platform - AWS Production Environment
# Replaces: Azure Production (infrastructure/terraform/environments/prod)
# =============================================================================
#
# AWS Organization: o-14wy6xb785
# Target Account: workload-prod (Workloads/Prod OU)
#
# IMPORTANT: This configuration adheres to SCPs attached to the Prod OU.
# No destructive operations are permitted without explicit approval.
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # AWS S3 Backend for state management
  backend "s3" {
    bucket         = "nexus-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "nexus-terraform-locks"

    # Assume role in workload-prod account
    # role_arn = "arn:aws:iam::WORKLOAD_PROD_ACCOUNT_ID:role/TerraformStateRole"
  }
}

# -----------------------------------------------------------------------------
# Provider Configuration
# -----------------------------------------------------------------------------

provider "aws" {
  region = var.region

  # Assume role for deployment
  # assume_role {
  #   role_arn = "arn:aws:iam::${var.account_id}:role/ClaudeMigrationRole"
  # }

  default_tags {
    tags = {
      Environment  = "prod"
      Project      = "nexus"
      ManagedBy    = "terraform"
      CostCenter   = "production"
      Organization = "o-14wy6xb785"
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}

# -----------------------------------------------------------------------------
# Local Variables
# -----------------------------------------------------------------------------

locals {
  environment = "prod"
  project     = "nexus"
  region      = var.region

  common_tags = {
    Environment = local.environment
    Project     = local.project
    ManagedBy   = "terraform"
  }
}

# -----------------------------------------------------------------------------
# VPC Module
# -----------------------------------------------------------------------------

module "vpc" {
  source = "../../modules/vpc"

  project     = local.project
  environment = local.environment
  region      = local.region

  vpc_cidr           = "10.1.0.0/16"
  az_count           = 3
  enable_nat_gateway = true
  single_nat_gateway = false # HA for production

  enable_vpc_endpoints     = true
  enable_flow_logs         = true
  flow_logs_retention_days = 90

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ECR Repositories
# -----------------------------------------------------------------------------

module "ecr" {
  source = "../../modules/ecr"

  project     = local.project
  environment = local.environment

  repositories = [
    # Backend Services
    "api-gateway",
    "auth-service",
    "user-service",
    "creator-service",
    "campaign-service",
    "content-service",
    "commerce-service",
    "analytics-service",
    "billing-service",
    "marketplace-service",
    "notification-service",
    "workflow-service",
    "compliance-service",
    "integration-service",
    "payout-service",
    "rights-service",
    "asset-service",
    # AI Services
    "ai-service",
    "moderation-engine",
    "recommendation-engine",
    "performance-predictor",
    "video-generator",
    "customer-agent",
    "marketing-agent",
    "ai-center",
    # Workers
    "video-processor",
    "social-publisher",
    "analytics-aggregator",
    "notification-dispatcher",
    # Frontend Apps
    "web",
    "creator-portal",
    "admin",
    "brand-portal",
  ]

  image_tag_mutability = "IMMUTABLE"
  scan_on_push         = true

  lifecycle_policy_rules = [
    {
      rulePriority = 1
      description  = "Keep last 30 production images"
      selection = {
        tagStatus     = "tagged"
        tagPrefixList = ["prod-"]
        countType     = "imageCountMoreThan"
        countNumber   = 30
      }
      action = {
        type = "expire"
      }
    },
    {
      rulePriority = 2
      description  = "Expire untagged images older than 14 days"
      selection = {
        tagStatus   = "untagged"
        countType   = "sinceImagePushed"
        countUnit   = "days"
        countNumber = 14
      }
      action = {
        type = "expire"
      }
    }
  ]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# EKS Cluster
# -----------------------------------------------------------------------------

module "eks" {
  source = "../../modules/eks"

  project     = local.project
  environment = local.environment

  kubernetes_version = "1.29"

  subnet_ids                = module.vpc.private_subnet_ids
  cluster_security_group_id = module.vpc.eks_cluster_security_group_id

  enable_public_access = true
  public_access_cidrs  = var.allowed_cidr_blocks

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  log_retention_days        = 90

  # System Node Group (control plane workloads)
  system_instance_types = ["t3.medium"]
  system_desired_size   = 2
  system_min_size       = 2
  system_max_size       = 3

  # Application Node Group
  app_instance_types = ["t3.xlarge", "t3.2xlarge"]
  app_capacity_type  = "ON_DEMAND"
  app_desired_size   = 3
  app_min_size       = 2
  app_max_size       = 10

  # Worker Node Group (background jobs)
  worker_instance_types = ["t3.large", "t3.xlarge"]
  worker_desired_size   = 1
  worker_min_size       = 0
  worker_max_size       = 5

  enable_ebs_csi_driver     = true
  enable_cluster_autoscaler = true

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# RDS PostgreSQL
# -----------------------------------------------------------------------------

module "rds" {
  source = "../../modules/rds"

  project     = local.project
  environment = local.environment

  engine_version = "15.4"
  instance_class = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"

  database_name   = "nexus"
  master_username = "nexusadmin"
  # Password stored in Secrets Manager

  db_subnet_group_name = module.vpc.db_subnet_group_name
  security_group_ids   = [module.vpc.database_security_group_id]

  multi_az                = true
  backup_retention_period = 35
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:00-Sun:05:00"

  monitoring_interval          = 60
  performance_insights_enabled = true

  deletion_protection         = true
  iam_database_authentication = true

  # Read Replica for scaling
  create_read_replica = true

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ElastiCache Redis
# -----------------------------------------------------------------------------

module "elasticache" {
  source = "../../modules/elasticache"

  project     = local.project
  environment = local.environment

  node_type                  = "cache.r6g.large"
  num_cache_clusters         = 2
  automatic_failover_enabled = true

  subnet_group_name  = module.vpc.elasticache_subnet_group_name
  security_group_ids = [module.vpc.database_security_group_id]

  snapshot_retention_limit = 7
  snapshot_window          = "02:00-03:00"
  maintenance_window       = "sun:03:00-sun:04:00"

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# S3 Buckets
# -----------------------------------------------------------------------------

module "s3" {
  source = "../../modules/s3"

  project     = local.project
  environment = local.environment

  buckets = {
    uploads = {
      versioning = true
      lifecycle_rules = [
        {
          id = "move-to-intelligent-tiering"
          transition = [
            {
              days          = 30
              storage_class = "INTELLIGENT_TIERING"
            }
          ]
          expiration = {
            days = 365
          }
        }
      ]
    }
    assets = {
      versioning = true
      lifecycle_rules = [
        {
          id = "move-to-intelligent-tiering"
          transition = [
            {
              days          = 30
              storage_class = "INTELLIGENT_TIERING"
            }
          ]
        }
      ]
    }
    thumbnails = {
      versioning = false
      lifecycle_rules = [
        {
          id = "expire-old-thumbnails"
          expiration = {
            days = 90
          }
        }
      ]
    }
    documents = {
      versioning = true
    }
  }

  block_public_access = true

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Secrets Manager
# -----------------------------------------------------------------------------

module "secrets" {
  source = "../../modules/secrets-manager"

  project     = local.project
  environment = local.environment

  secrets = {
    "jwt-secret" = {
      description = "JWT signing secret"
      generate    = true
      length      = 64
    }
    "jwt-refresh-secret" = {
      description = "JWT refresh token secret"
      generate    = true
      length      = 64
    }
    "internal-service-secret" = {
      description = "Service-to-service authentication secret"
      generate    = true
      length      = 32
    }
  }

  # Database credentials are managed by RDS module

  recovery_window_in_days = 30

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CloudFront Distribution
# -----------------------------------------------------------------------------

module "cloudfront" {
  source = "../../modules/cloudfront"

  project     = local.project
  environment = local.environment

  # Origins
  api_origin_domain = module.eks.cluster_endpoint
  web_origin_domain = module.s3.bucket_regional_domain_names["assets"]

  # Custom domain (configure in Route 53)
  aliases         = var.custom_domains
  certificate_arn = var.acm_certificate_arn

  # WAF
  waf_web_acl_arn = module.waf.web_acl_arn

  # Cache behaviors
  enable_compression = true
  price_class        = "PriceClass_All"

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# WAF
# -----------------------------------------------------------------------------

module "waf" {
  source = "../../modules/waf"

  project     = local.project
  environment = local.environment

  scope = "CLOUDFRONT"

  enable_aws_managed_rules = true
  enable_rate_limiting     = true
  rate_limit               = 2000

  # Block bad bots
  enable_bot_control = true

  # Log to CloudWatch
  log_destination_arn = aws_cloudwatch_log_group.waf.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${local.project}-${local.environment}"
  retention_in_days = 90

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Route 53 (DNS)
# -----------------------------------------------------------------------------

module "route53" {
  source = "../../modules/route53"
  count  = var.create_dns_zone ? 1 : 0

  domain_name = var.domain_name

  records = {
    api = {
      type = "A"
      alias = {
        name    = module.cloudfront.distribution_domain_name
        zone_id = module.cloudfront.distribution_hosted_zone_id
      }
    }
    www = {
      type = "A"
      alias = {
        name    = module.cloudfront.distribution_domain_name
        zone_id = module.cloudfront.distribution_hosted_zone_id
      }
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CloudWatch & Monitoring
# -----------------------------------------------------------------------------

module "cloudwatch" {
  source = "../../modules/cloudwatch"

  project     = local.project
  environment = local.environment

  eks_cluster_name = module.eks.cluster_name
  rds_identifier   = module.rds.db_instance_identifier

  alarm_email_endpoints = var.alert_email_endpoints

  # Dashboard
  create_dashboard = true

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# SNS Topic for Alerts
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "alerts" {
  name = "${local.project}-${local.environment}-alerts"

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alert_emails" {
  for_each = toset(var.alert_email_endpoints)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# -----------------------------------------------------------------------------
# AWS Budgets
# -----------------------------------------------------------------------------

resource "aws_budgets_budget" "monthly" {
  name         = "${local.project}-${local.environment}-monthly"
  budget_type  = "COST"
  limit_amount = var.monthly_budget
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.alert_email_endpoints
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.alert_email_endpoints
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.alert_email_endpoints
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 120
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.alert_email_endpoints
  }
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "rds_credentials_secret_arn" {
  description = "RDS credentials secret ARN"
  value       = module.rds.db_credentials_secret_arn
}

output "elasticache_endpoint" {
  description = "ElastiCache endpoint"
  value       = module.elasticache.primary_endpoint_address
}

output "s3_bucket_names" {
  description = "S3 bucket names"
  value       = module.s3.bucket_names
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = module.waf.web_acl_arn
}
