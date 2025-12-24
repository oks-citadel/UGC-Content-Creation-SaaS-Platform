# =============================================================================
# Marketing Platform - Production Environment
# Cost-Optimized Configuration
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }

  backend "azurerm" {
    resource_group_name  = "marketing-tfstate-rg"
    storage_account_name = "mktprodtfstate"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}

provider "azurerm" {
  subscription_id = "ba233460-2dbe-4603-a594-68f93ec9deb3"
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# -----------------------------------------------------------------------------
# Local Variables
# -----------------------------------------------------------------------------

locals {
  environment = "prod"
  project     = "marketing"
  location    = var.location
  suffix      = random_string.resource_suffix.result

  common_tags = {
    Environment = local.environment
    Project     = local.project
    ManagedBy   = "Terraform"
    CostCenter  = "Production"
  }
}

resource "random_string" "resource_suffix" {
  length  = 4
  special = false
  upper   = false
}

# -----------------------------------------------------------------------------
# Resource Group
# -----------------------------------------------------------------------------

resource "azurerm_resource_group" "main" {
  name     = "${local.project}-${local.environment}-rg"
  location = local.location
  tags     = local.common_tags
}

# -----------------------------------------------------------------------------
# Cost Management - Budget Alerts
# -----------------------------------------------------------------------------

resource "azurerm_consumption_budget_resource_group" "main" {
  name              = "${local.project}-${local.environment}-budget"
  resource_group_id = azurerm_resource_group.main.id

  amount     = var.monthly_budget
  time_grain = "Monthly"

  time_period {
    start_date = formatdate("YYYY-MM-01'T'00:00:00Z", timestamp())
  }

  notification {
    enabled        = true
    threshold      = 50
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = var.budget_alert_emails
  }

  notification {
    enabled        = true
    threshold      = 80
    operator       = "GreaterThan"
    threshold_type = "Actual"

    contact_emails = var.budget_alert_emails
  }

  notification {
    enabled        = true
    threshold      = 100
    operator       = "GreaterThan"
    threshold_type = "Forecasted"

    contact_emails = var.budget_alert_emails
  }

  lifecycle {
    ignore_changes = [time_period]
  }
}

# -----------------------------------------------------------------------------
# Networking
# -----------------------------------------------------------------------------

module "networking" {
  source = "../../modules/networking"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = local.environment
  project             = local.project

  vnet_address_space              = ["10.1.0.0/16"]
  aks_subnet_prefix               = "10.1.0.0/20"
  data_subnet_prefix              = "10.1.16.0/24"
  appgw_subnet_prefix             = "10.1.17.0/24"
  apim_subnet_prefix              = "10.1.18.0/24"
  private_endpoints_subnet_prefix = "10.1.19.0/24"

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Azure Container Registry (Standard tier for cost savings)
# -----------------------------------------------------------------------------

module "acr" {
  source = "../../modules/acr"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = local.environment
  project             = local.project
  name_suffix         = local.suffix

  # Cost optimization: Standard tier is sufficient for most production workloads
  sku           = "Standard"
  admin_enabled = false

  default_network_action  = "Allow"
  zone_redundancy_enabled = false

  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Azure Kubernetes Service (Cost-Optimized)
# -----------------------------------------------------------------------------

module "aks" {
  source = "../../modules/aks"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = local.environment
  project             = local.project
  name_suffix         = local.suffix

  vnet_subnet_id     = module.networking.aks_subnet_id
  kubernetes_version = "1.32"

  # Cost optimization: Standard tier for production SLA
  sku_tier = "Standard"

  # System node pool (minimal for control plane workloads)
  system_node_count = 2
  system_vm_size    = "Standard_D2s_v3"
  system_min_count  = 2
  system_max_count  = 3

  # App node pool (cost-optimized with aggressive autoscaling)
  # Note: Reduced min to 1 due to westus2 vCPU quota limits
  app_vm_size   = "Standard_D4s_v3"
  app_min_count = 1
  app_max_count = 10

  # Worker pool (disabled, use app pool for background jobs to save costs)
  worker_vm_size   = "Standard_D2s_v3"
  worker_min_count = 0
  worker_max_count = 0

  enable_auto_scaling = true
  # Note: westus2 only supports zone 3 for AKS
  availability_zones  = ["3"]

  # Use non-overlapping service CIDR (VNet uses 10.1.0.0/16)
  service_cidr   = "10.2.0.0/16"
  dns_service_ip = "10.2.0.10"

  acr_id                     = module.acr.acr_id
  enable_acr_integration     = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# PostgreSQL Flexible Server (Cost-Optimized)
# -----------------------------------------------------------------------------

module "postgresql" {
  source = "../../modules/postgresql"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = local.environment
  project             = local.project
  name_suffix         = local.suffix

  # Cost optimization: General Purpose tier, smallest recommended for production
  sku_name   = "GP_Standard_D2s_v3"
  storage_mb = 65536

  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password

  subnet_id           = module.networking.data_subnet_id
  private_dns_zone_id = module.networking.postgresql_private_dns_zone_id

  database_name       = "marketing"
  create_analytics_db = true

  # Note: HA is disabled in westus2 region
  high_availability_mode       = "Disabled"
  geo_redundant_backup_enabled = false  # LRS is cheaper, enable for DR requirements
  backup_retention_days        = 14     # Reduced from 35 for cost savings

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Redis Cache (Cost-Optimized)
# -----------------------------------------------------------------------------

resource "azurerm_redis_cache" "main" {
  name                 = "${local.project}-${local.environment}-redis-${local.suffix}"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name

  # Cost optimization: Standard tier C1 (1GB) is sufficient for caching
  capacity             = 1
  family               = "C"
  sku_name             = "Standard"

  non_ssl_port_enabled = false
  minimum_tls_version  = "1.2"

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Storage Account (Cost-Optimized)
# -----------------------------------------------------------------------------

resource "random_string" "storage_suffix" {
  length  = 4
  special = false
  upper   = false
}

resource "azurerm_storage_account" "main" {
  name                     = "mktprod${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location

  # Cost optimization: Standard LRS for most use cases
  account_tier             = "Standard"
  account_replication_type = "LRS"  # Change to GRS for DR requirements

  min_tls_version = "TLS1_2"

  # Cost optimization: Enable lifecycle management
  blob_properties {
    delete_retention_policy {
      days = 7
    }
    container_delete_retention_policy {
      days = 7
    }
  }

  tags = local.common_tags
}

resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "assets" {
  name                  = "assets"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "thumbnails" {
  name                  = "thumbnails"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Lifecycle Management Policy for cost savings
resource "azurerm_storage_management_policy" "lifecycle" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "move-to-cool-storage"
    enabled = true
    filters {
      blob_types   = ["blockBlob"]
      prefix_match = ["uploads/", "assets/"]
    }
    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = 365
      }
    }
  }

  rule {
    name    = "cleanup-old-thumbnails"
    enabled = true
    filters {
      blob_types   = ["blockBlob"]
      prefix_match = ["thumbnails/"]
    }
    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than = 7
        delete_after_days_since_modification_greater_than       = 90
      }
    }
  }
}

# -----------------------------------------------------------------------------
# Key Vault
# -----------------------------------------------------------------------------

module "keyvault" {
  source = "../../modules/keyvault"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = local.environment
  project             = local.project
  name_suffix         = local.suffix

  sku_name               = "standard"
  default_network_action = "Deny"
  allowed_subnet_ids     = [module.networking.aks_subnet_id]
  allowed_ip_ranges      = ["73.76.114.217/32"]  # Deployer IP for initial setup

  aks_identity_principal_id = module.aks.kubelet_identity.object_id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Monitoring (Cost-Optimized)
# -----------------------------------------------------------------------------

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.project}-${local.environment}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"

  # Cost optimization: Reduced retention for logs
  retention_in_days   = 30

  # Cost optimization: Set daily cap
  daily_quota_gb      = 5

  tags = local.common_tags
}

resource "azurerm_application_insights" "main" {
  name                = "${local.project}-${local.environment}-appinsights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  # Cost optimization: Enable sampling
  sampling_percentage = 50

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# JWT Secret
# -----------------------------------------------------------------------------

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "resource_group_name" {
  description = "Production resource group name"
  value       = azurerm_resource_group.main.name
}

output "aks_cluster_name" {
  description = "AKS cluster name"
  value       = module.aks.cluster_name
}

output "acr_login_server" {
  description = "ACR login server URL"
  value       = module.acr.acr_login_server
}

output "postgresql_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = module.postgresql.server_fqdn
  sensitive   = true
}

output "redis_hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.main.hostname
}

output "keyvault_uri" {
  description = "Key Vault URI"
  value       = module.keyvault.vault_uri
}

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.main.name
}

output "application_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}
