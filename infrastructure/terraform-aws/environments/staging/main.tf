# =============================================================================
# NEXUS Platform - AWS Staging Environment (ECS Fargate)
# =============================================================================
# This is the NEW ECS Fargate-based infrastructure, replacing EKS.
# All services run on serverless Fargate with automatic scaling.
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

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

  # AWS S3 Backend for state management
  backend "s3" {
    bucket         = "nexus-terraform-state-staging"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "nexus-terraform-locks"
  }
}

# -----------------------------------------------------------------------------
# Provider Configuration
# -----------------------------------------------------------------------------

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = "staging"
      Project     = "nexus"
      ManagedBy   = "terraform"
      CostCenter  = "staging"
      Platform    = "ecs-fargate"
    }
  }
}

# -----------------------------------------------------------------------------
# Local Variables
# -----------------------------------------------------------------------------

locals {
  environment = "staging"
  project     = "nexus"
  region      = var.region

  common_tags = {
    Environment = local.environment
    Project     = local.project
    ManagedBy   = "terraform"
  }

  # All services that need to be deployed
  all_services = concat(
    local.backend_services,
    local.frontend_apps,
    local.workers,
    local.ai_services
  )

  # Backend services configuration
  backend_services = [
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
    "ai-service",
  ]

  # Frontend applications
  frontend_apps = [
    "web",
    "creator-portal",
    "admin",
    "brand-portal",
  ]

  # Background workers
  workers = [
    "video-processor",
    "social-publisher",
    "notification-dispatcher",
    "analytics-aggregator",
  ]

  # AI services
  ai_services = [
    "ai-center",
    "customer-agent",
    "marketing-agent",
    "moderation-engine",
    "performance-predictor",
    "recommendation-engine",
    "video-generator",
  ]

  # Service port mapping
  service_ports = {
    # Backend services
    "api-gateway"          = 3000
    "auth-service"         = 3001
    "user-service"         = 3002
    "creator-service"      = 3003
    "campaign-service"     = 3004
    "content-service"      = 3005
    "commerce-service"     = 3006
    "analytics-service"    = 3007
    "billing-service"      = 3008
    "marketplace-service"  = 3009
    "notification-service" = 3010
    "workflow-service"     = 3011
    "compliance-service"   = 3012
    "integration-service"  = 3013
    "payout-service"       = 3014
    "rights-service"       = 3015
    "asset-service"        = 3016
    "ai-service"           = 3017
    # Frontend apps
    "web"            = 3000
    "creator-portal" = 3000
    "admin"          = 3000
    "brand-portal"   = 3000
    # Workers
    "video-processor"         = 4001
    "social-publisher"        = 4002
    "notification-dispatcher" = 4003
    "analytics-aggregator"    = 4004
    # AI services
    "ai-center"             = 5001
    "customer-agent"        = 5002
    "marketing-agent"       = 5003
    "moderation-engine"     = 5004
    "performance-predictor" = 5005
    "recommendation-engine" = 5006
    "video-generator"       = 5007
  }

  # ALB routing configuration
  alb_services = {
    "auth-service" = {
      port                  = 3001
      priority              = 100
      path_patterns         = ["/api/v1/auth/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "user-service" = {
      port                  = 3002
      priority              = 110
      path_patterns         = ["/api/v1/users/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "creator-service" = {
      port                  = 3003
      priority              = 120
      path_patterns         = ["/api/v1/creators/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "campaign-service" = {
      port                  = 3004
      priority              = 130
      path_patterns         = ["/api/v1/campaigns/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "content-service" = {
      port                  = 3005
      priority              = 140
      path_patterns         = ["/api/v1/content/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "commerce-service" = {
      port                  = 3006
      priority              = 150
      path_patterns         = ["/api/v1/commerce/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "analytics-service" = {
      port                  = 3007
      priority              = 160
      path_patterns         = ["/api/v1/analytics/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "billing-service" = {
      port                  = 3008
      priority              = 170
      path_patterns         = ["/api/v1/billing/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "marketplace-service" = {
      port                  = 3009
      priority              = 180
      path_patterns         = ["/api/v1/marketplace/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "notification-service" = {
      port                  = 3010
      priority              = 190
      path_patterns         = ["/api/v1/notifications/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "workflow-service" = {
      port                  = 3011
      priority              = 200
      path_patterns         = ["/api/v1/workflows/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "compliance-service" = {
      port                  = 3012
      priority              = 210
      path_patterns         = ["/api/v1/compliance/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "integration-service" = {
      port                  = 3013
      priority              = 220
      path_patterns         = ["/api/v1/integrations/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "payout-service" = {
      port                  = 3014
      priority              = 230
      path_patterns         = ["/api/v1/payouts/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "rights-service" = {
      port                  = 3015
      priority              = 240
      path_patterns         = ["/api/v1/rights/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "asset-service" = {
      port                  = 3016
      priority              = 250
      path_patterns         = ["/api/v1/assets/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "ai-service" = {
      port                  = 3017
      priority              = 260
      path_patterns         = ["/api/v1/ai/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "api-gateway" = {
      port                  = 3000
      priority              = 900
      path_patterns         = ["/api/*"]
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
    "web" = {
      port                  = 3000
      priority              = 999
      path_patterns         = ["/*"]
      health_check_path     = "/"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200-399"
      deregistration_delay  = 30
      stickiness_enabled    = false
    }
  }

  # Host-based routing for subdomains
  host_rules = {
    "creator-portal" = {
      priority       = 10
      host_headers   = ["creator.${var.domain_name}", "creator-staging.${var.domain_name}"]
      target_service = "creator-portal"
    }
    "admin" = {
      priority       = 11
      host_headers   = ["admin.${var.domain_name}", "admin-staging.${var.domain_name}"]
      target_service = "admin"
    }
    "brand-portal" = {
      priority       = 12
      host_headers   = ["brand.${var.domain_name}", "brand-staging.${var.domain_name}"]
      target_service = "brand-portal"
    }
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

  vpc_cidr           = "10.2.0.0/16" # Different CIDR from prod
  az_count           = 3
  enable_nat_gateway = true
  single_nat_gateway = true # Cost optimization for staging

  enable_vpc_endpoints     = true
  enable_flow_logs         = true
  flow_logs_retention_days = 14

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ECR Repositories
# -----------------------------------------------------------------------------

module "ecr" {
  source = "../../modules/ecr"

  project     = local.project
  environment = local.environment

  repositories = local.all_services

  image_tag_mutability = "MUTABLE" # Allow retagging in staging
  scan_on_push         = true

  lifecycle_policy_rules = [
    {
      rulePriority = 1
      description  = "Keep last 10 staging images"
      selection = {
        tagStatus     = "tagged"
        tagPrefixList = ["staging-"]
        countType     = "imageCountMoreThan"
        countNumber   = 10
      }
      action = {
        type = "expire"
      }
    },
    {
      rulePriority = 2
      description  = "Expire untagged images older than 7 days"
      selection = {
        tagStatus   = "untagged"
        countType   = "sinceImagePushed"
        countUnit   = "days"
        countNumber = 7
      }
      action = {
        type = "expire"
      }
    }
  ]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Application Load Balancer
# -----------------------------------------------------------------------------

module "alb" {
  source = "../../modules/alb"

  project     = local.project
  environment = local.environment

  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids

  certificate_arn    = var.acm_certificate_arn
  logs_bucket        = module.s3.bucket_names["logs"]
  enable_access_logs = true

  services   = local.alb_services
  host_rules = local.host_rules

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ECS Cluster
# -----------------------------------------------------------------------------

module "ecs_cluster" {
  source = "../../modules/ecs-cluster"

  project     = local.project
  environment = local.environment

  vpc_id                = module.vpc.vpc_id
  alb_security_group_id = module.alb.alb_security_group_id

  enable_container_insights = true
  log_retention_days        = 14

  # Enable Spot for default strategy in staging
  enable_spot_default    = true
  default_fargate_weight = 1
  default_fargate_base   = 1
  default_spot_weight    = 2

  service_names = local.all_services

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# IAM Roles for ECS
# -----------------------------------------------------------------------------

module "iam_ecs" {
  source = "../../modules/iam-ecs"

  project     = local.project
  environment = local.environment

  service_names = local.all_services

  kms_key_arns = [] # Add KMS key ARNs if using encrypted secrets

  s3_buckets = [
    module.s3.bucket_names["uploads"],
    module.s3.bucket_names["assets"],
    module.s3.bucket_names["thumbnails"],
  ]

  # Services that need S3 access
  s3_access_services = [
    "content-service",
    "asset-service",
    "video-processor",
    "video-generator",
  ]

  # Services that need SES access
  ses_access_services = [
    "notification-service",
    "notification-dispatcher",
  ]

  # Services that need SQS access
  sqs_access_services = [
    "video-processor",
    "social-publisher",
    "notification-dispatcher",
    "analytics-aggregator",
  ]

  # Services that need Bedrock access
  bedrock_access_services = [
    "ai-center",
    "customer-agent",
    "marketing-agent",
    "moderation-engine",
    "performance-predictor",
    "recommendation-engine",
  ]

  # Services that need runtime Secrets Manager access
  secrets_access_services = [
    "auth-service",
    "billing-service",
    "integration-service",
    "payout-service",
  ]

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
  instance_class = "db.t3.medium" # Smaller for staging

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"

  database_name   = "nexus"
  master_username = "nexusadmin"

  db_subnet_group_name = module.vpc.db_subnet_group_name
  security_group_ids   = [module.vpc.database_security_group_id]

  multi_az                = false # Single AZ for staging
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:00-Sun:05:00"

  monitoring_interval          = 0 # Disabled for staging
  performance_insights_enabled = false

  deletion_protection         = false # Allow deletion in staging
  iam_database_authentication = true

  create_read_replica = false

  alarm_actions = []

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ElastiCache Redis
# -----------------------------------------------------------------------------

module "elasticache" {
  source = "../../modules/elasticache"

  project     = local.project
  environment = local.environment

  node_type                  = "cache.t3.micro" # Small for staging
  num_cache_clusters         = 1
  automatic_failover_enabled = false

  subnet_group_name  = module.vpc.elasticache_subnet_group_name
  security_group_ids = [module.vpc.database_security_group_id]

  snapshot_retention_limit = 1
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
      versioning = false
      lifecycle_rules = [
        {
          id = "expire-old-uploads"
          expiration = {
            days = 30
          }
        }
      ]
    }
    assets = {
      versioning = false
    }
    thumbnails = {
      versioning = false
      lifecycle_rules = [
        {
          id = "expire-old-thumbnails"
          expiration = {
            days = 14
          }
        }
      ]
    }
    logs = {
      versioning = false
      lifecycle_rules = [
        {
          id = "expire-logs"
          expiration = {
            days = 30
          }
        }
      ]
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

  recovery_window_in_days = 7

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ECS Services (Backend)
# -----------------------------------------------------------------------------

module "backend_services" {
  source   = "../../modules/ecs-service"
  for_each = toset(local.backend_services)

  project      = local.project
  environment  = local.environment
  service_name = each.key

  cluster_arn  = module.ecs_cluster.cluster_arn
  cluster_name = module.ecs_cluster.cluster_name

  ecr_repository_url = module.ecr.repository_urls[each.key]
  image_tag          = var.image_tag

  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_ids = [module.ecs_cluster.ecs_tasks_security_group_id]

  task_execution_role_arn = module.iam_ecs.task_execution_role_arn
  task_role_arn           = module.iam_ecs.task_role_arns[each.key]
  log_group_name          = module.ecs_cluster.service_log_group_names[each.key]

  container_port = local.service_ports[each.key]
  cpu            = each.key == "api-gateway" ? 512 : 256
  memory         = each.key == "api-gateway" ? 1024 : 512

  target_group_arn = module.alb.service_target_group_arns[each.key]

  enable_service_connect        = true
  service_connect_namespace_arn = module.ecs_cluster.service_connect_namespace_arn

  environment_variables = {
    NODE_ENV     = local.environment
    SERVICE_NAME = each.key
    PORT         = tostring(local.service_ports[each.key])
    # Service Connect DNS names
    AUTH_SERVICE_URL         = "http://auth-service:3001"
    USER_SERVICE_URL         = "http://user-service:3002"
    CREATOR_SERVICE_URL      = "http://creator-service:3003"
    CAMPAIGN_SERVICE_URL     = "http://campaign-service:3004"
    CONTENT_SERVICE_URL      = "http://content-service:3005"
    COMMERCE_SERVICE_URL     = "http://commerce-service:3006"
    ANALYTICS_SERVICE_URL    = "http://analytics-service:3007"
    BILLING_SERVICE_URL      = "http://billing-service:3008"
    MARKETPLACE_SERVICE_URL  = "http://marketplace-service:3009"
    NOTIFICATION_SERVICE_URL = "http://notification-service:3010"
    WORKFLOW_SERVICE_URL     = "http://workflow-service:3011"
    # Database URLs will come from secrets
    REDIS_URL = "redis://${module.elasticache.primary_endpoint_address}:6379"
  }

  secrets = {
    DATABASE_URL = module.rds.db_credentials_secret_arn
    JWT_SECRET   = module.secrets.secret_arns["jwt-secret"]
  }

  # Staging: use Spot for cost savings
  use_spot            = true
  spot_weight_fargate = 1
  spot_base_fargate   = 1
  spot_weight_spot    = 2

  desired_count = 1
  min_capacity  = 1
  max_capacity  = 4

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ECS Services (Frontend Apps)
# -----------------------------------------------------------------------------

module "frontend_apps" {
  source   = "../../modules/ecs-service"
  for_each = toset(local.frontend_apps)

  project      = local.project
  environment  = local.environment
  service_name = each.key

  cluster_arn  = module.ecs_cluster.cluster_arn
  cluster_name = module.ecs_cluster.cluster_name

  ecr_repository_url = module.ecr.repository_urls[each.key]
  image_tag          = var.image_tag

  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_ids = [module.ecs_cluster.ecs_tasks_security_group_id]

  task_execution_role_arn = module.iam_ecs.task_execution_role_arn
  task_role_arn           = module.iam_ecs.task_role_arns[each.key]
  log_group_name          = module.ecs_cluster.service_log_group_names[each.key]

  container_port = 3000
  cpu            = 256
  memory         = 512

  target_group_arn = each.key == "web" ? module.alb.service_target_group_arns["web"] : module.alb.service_target_group_arns[each.key]

  enable_service_connect        = true
  service_connect_namespace_arn = module.ecs_cluster.service_connect_namespace_arn

  environment_variables = {
    NODE_ENV        = local.environment
    NEXT_PUBLIC_API = "https://api-staging.${var.domain_name}"
  }

  secrets = {}

  use_spot            = true
  spot_weight_fargate = 1
  spot_base_fargate   = 1
  spot_weight_spot    = 2

  desired_count = 1
  min_capacity  = 1
  max_capacity  = 3

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ECS Services (Workers)
# -----------------------------------------------------------------------------

module "workers" {
  source   = "../../modules/ecs-service"
  for_each = toset(local.workers)

  project      = local.project
  environment  = local.environment
  service_name = each.key

  cluster_arn  = module.ecs_cluster.cluster_arn
  cluster_name = module.ecs_cluster.cluster_name

  ecr_repository_url = module.ecr.repository_urls[each.key]
  image_tag          = var.image_tag

  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_ids = [module.ecs_cluster.ecs_tasks_security_group_id]

  task_execution_role_arn = module.iam_ecs.task_execution_role_arn
  task_role_arn           = module.iam_ecs.task_role_arns[each.key]
  log_group_name          = module.ecs_cluster.service_log_group_names[each.key]

  container_port = local.service_ports[each.key]
  cpu            = 256
  memory         = 512

  # Workers don't need ALB
  target_group_arn = ""

  enable_service_connect        = true
  service_connect_namespace_arn = module.ecs_cluster.service_connect_namespace_arn

  environment_variables = {
    NODE_ENV     = local.environment
    SERVICE_NAME = each.key
    REDIS_URL    = "redis://${module.elasticache.primary_endpoint_address}:6379"
  }

  secrets = {
    DATABASE_URL = module.rds.db_credentials_secret_arn
  }

  # Workers: 100% Spot
  use_spot            = true
  spot_weight_fargate = 0
  spot_base_fargate   = 0
  spot_weight_spot    = 1

  desired_count = 1
  min_capacity  = 0
  max_capacity  = 5

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# ECS Services (AI Services)
# -----------------------------------------------------------------------------

module "ai_services" {
  source   = "../../modules/ecs-service"
  for_each = toset(local.ai_services)

  project      = local.project
  environment  = local.environment
  service_name = each.key

  cluster_arn  = module.ecs_cluster.cluster_arn
  cluster_name = module.ecs_cluster.cluster_name

  ecr_repository_url = module.ecr.repository_urls[each.key]
  image_tag          = var.image_tag

  private_subnet_ids = module.vpc.private_subnet_ids
  security_group_ids = [module.ecs_cluster.ecs_tasks_security_group_id]

  task_execution_role_arn = module.iam_ecs.task_execution_role_arn
  task_role_arn           = module.iam_ecs.task_role_arns[each.key]
  log_group_name          = module.ecs_cluster.service_log_group_names[each.key]

  container_port = local.service_ports[each.key]
  cpu            = 512
  memory         = 1024

  # AI services don't need ALB (internal only)
  target_group_arn = ""

  enable_service_connect        = true
  service_connect_namespace_arn = module.ecs_cluster.service_connect_namespace_arn

  environment_variables = {
    ENVIRONMENT  = local.environment
    SERVICE_NAME = each.key
  }

  secrets = {}

  # AI services: mix of Spot
  use_spot            = true
  spot_weight_fargate = 1
  spot_base_fargate   = 1
  spot_weight_spot    = 1

  desired_count = 1
  min_capacity  = 0
  max_capacity  = 3

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# CloudWatch Dashboard
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_dashboard" "ecs" {
  dashboard_name = "${local.project}-${local.environment}-ecs"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ECS Cluster CPU Utilization"
          region = local.region
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", module.ecs_cluster.cluster_name, { stat = "Average" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ECS Cluster Memory Utilization"
          region = local.region
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ClusterName", module.ecs_cluster.cluster_name, { stat = "Average" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          title  = "ALB Request Count"
          region = local.region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", module.alb.alb_arn, { stat = "Sum" }]
          ]
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs_cluster.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = module.ecs_cluster.cluster_arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
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

output "elasticache_endpoint" {
  description = "ElastiCache endpoint"
  value       = module.elasticache.primary_endpoint_address
}

output "service_connect_namespace" {
  description = "Service Connect namespace"
  value       = module.ecs_cluster.service_connect_namespace_name
}
