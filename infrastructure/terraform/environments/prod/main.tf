# =============================================================================
# NEXUS Platform - Production Environment
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "azurerm" {
    resource_group_name  = "rg-nexus-tfstate"
    storage_account_name = "stnexustfstateprod"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}

provider "azuread" {}

# =============================================================================
# Local Variables
# =============================================================================

locals {
  environment = "prod"
  location    = "eastus"
  project     = "nexus"

  tags = {
    Environment = local.environment
    Project     = "NEXUS-Platform"
    ManagedBy   = "Terraform"
    Team        = "Platform"
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "azurerm_client_config" "current" {}

# =============================================================================
# Resource Groups
# =============================================================================

module "resource_groups" {
  source = "../../modules/resource-groups"

  project     = local.project
  environment = local.environment
  location    = local.location
  tags        = local.tags
}

# =============================================================================
# Networking
# =============================================================================

module "networking" {
  source = "../../modules/networking"

  project             = local.project
  environment         = local.environment
  location            = local.location
  resource_group_name = module.resource_groups.network_rg_name
  tags                = local.tags

  vnet_address_space              = ["10.0.0.0/16"]
  aks_subnet_prefix               = "10.0.0.0/20"
  data_subnet_prefix              = "10.0.16.0/24"
  appgw_subnet_prefix             = "10.0.17.0/24"
  apim_subnet_prefix              = "10.0.18.0/24"
  private_endpoints_subnet_prefix = "10.0.19.0/24"
}

# =============================================================================
# Monitoring
# =============================================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${local.project}-${local.environment}"
  location            = local.location
  resource_group_name = module.resource_groups.monitoring_rg_name
  sku                 = "PerGB2018"
  retention_in_days   = 90

  tags = local.tags
}

resource "azurerm_application_insights" "main" {
  name                = "appi-${local.project}-${local.environment}"
  location            = local.location
  resource_group_name = module.resource_groups.monitoring_rg_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = local.tags
}

# =============================================================================
# Container Registry
# =============================================================================

module "acr" {
  source = "../../modules/acr"

  project             = local.project
  environment         = local.environment
  location            = local.location
  resource_group_name = module.resource_groups.main_rg_name
  tags                = local.tags

  sku                        = "Premium"
  zone_redundancy_enabled    = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  georeplications = [
    {
      location                  = "westus"
      regional_endpoint_enabled = true
      zone_redundancy_enabled   = true
    }
  ]
}

# =============================================================================
# Key Vault
# =============================================================================

module "keyvault" {
  source = "../../modules/keyvault"

  project             = local.project
  environment         = local.environment
  location            = local.location
  resource_group_name = module.resource_groups.main_rg_name
  tags                = local.tags

  admin_object_ids           = [data.azurerm_client_config.current.object_id]
  allowed_subnet_ids         = [module.networking.aks_subnet_id]
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

# =============================================================================
# PostgreSQL Database
# =============================================================================

resource "random_password" "postgresql" {
  length  = 32
  special = true
}

module "postgresql" {
  source = "../../modules/postgresql"

  project             = local.project
  environment         = local.environment
  location            = local.location
  resource_group_name = module.resource_groups.data_rg_name
  tags                = local.tags

  subnet_id           = module.networking.data_subnet_id
  private_dns_zone_id = module.networking.postgresql_private_dns_zone_id

  administrator_password = random_password.postgresql.result

  sku_name         = "GP_Standard_D4s_v3"
  storage_mb       = 131072
  postgresql_version = "16"

  high_availability_mode        = "ZoneRedundant"
  backup_retention_days         = 35
  geo_redundant_backup_enabled  = true

  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

# =============================================================================
# Redis Cache
# =============================================================================

resource "azurerm_redis_cache" "main" {
  name                = "redis-${local.project}-${local.environment}"
  location            = local.location
  resource_group_name = module.resource_groups.data_rg_name
  capacity            = 2
  family              = "P"
  sku_name            = "Premium"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_reserved              = 642
    maxmemory_delta                 = 642
    maxmemory_policy                = "allkeys-lru"
    maxfragmentationmemory_reserved = 642
    rdb_backup_enabled              = true
    rdb_backup_frequency            = 60
    rdb_backup_max_snapshot_count   = 1
  }

  zones = ["1", "2", "3"]

  tags = local.tags
}

# =============================================================================
# AKS Cluster
# =============================================================================

module "aks" {
  source = "../../modules/aks"

  project             = local.project
  environment         = local.environment
  location            = local.location
  resource_group_name = module.resource_groups.aks_rg_name
  tags                = local.tags

  vnet_subnet_id = module.networking.aks_subnet_id

  kubernetes_version = "1.28"
  sku_tier           = "Standard"

  # System Node Pool
  system_node_count = 3
  system_vm_size    = "Standard_DS2_v2"
  system_min_count  = 3
  system_max_count  = 5

  # Application Node Pool
  app_vm_size   = "Standard_DS3_v2"
  app_min_count = 3
  app_max_count = 15

  # Worker Node Pool
  worker_vm_size   = "Standard_DS2_v2"
  worker_min_count = 2
  worker_max_count = 10

  acr_id                     = module.acr.acr_id
  keyvault_id                = module.keyvault.vault_id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

# =============================================================================
# Storage Account
# =============================================================================

resource "azurerm_storage_account" "main" {
  name                     = "st${local.project}${local.environment}001"
  resource_group_name      = module.resource_groups.main_rg_name
  location                 = local.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  account_kind             = "StorageV2"
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 30
    }

    container_delete_retention_policy {
      days = 30
    }
  }

  tags = local.tags
}

resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "media" {
  name                  = "media"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "blob"
}

resource "azurerm_storage_container" "assets" {
  name                  = "assets"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "blob"
}

# =============================================================================
# Service Bus
# =============================================================================

resource "azurerm_servicebus_namespace" "main" {
  name                = "sb-${local.project}-${local.environment}"
  location            = local.location
  resource_group_name = module.resource_groups.main_rg_name
  sku                 = "Premium"
  capacity            = 1
  zone_redundant      = true

  tags = local.tags
}

resource "azurerm_servicebus_queue" "video_processing" {
  name         = "video-processing"
  namespace_id = azurerm_servicebus_namespace.main.id

  max_delivery_count    = 10
  lock_duration         = "PT5M"
  max_size_in_megabytes = 1024
  enable_partitioning   = false
}

resource "azurerm_servicebus_queue" "notifications" {
  name         = "notifications"
  namespace_id = azurerm_servicebus_namespace.main.id

  max_delivery_count    = 5
  lock_duration         = "PT1M"
  max_size_in_megabytes = 1024
  enable_partitioning   = false
}

resource "azurerm_servicebus_queue" "analytics" {
  name         = "analytics"
  namespace_id = azurerm_servicebus_namespace.main.id

  max_delivery_count    = 3
  lock_duration         = "PT1M"
  max_size_in_megabytes = 5120
  enable_partitioning   = true
}

# =============================================================================
# Outputs
# =============================================================================

output "resource_group_name" {
  value = module.resource_groups.main_rg_name
}

output "aks_cluster_name" {
  value = module.aks.cluster_name
}

output "acr_login_server" {
  value = module.acr.acr_login_server
}

output "keyvault_uri" {
  value = module.keyvault.vault_uri
}

output "postgresql_fqdn" {
  value     = module.postgresql.server_fqdn
  sensitive = true
}

output "redis_hostname" {
  value = azurerm_redis_cache.main.hostname
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}

output "application_insights_connection_string" {
  value     = azurerm_application_insights.main.connection_string
  sensitive = true
}
