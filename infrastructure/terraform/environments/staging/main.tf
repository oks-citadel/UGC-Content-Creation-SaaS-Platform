# =============================================================================
# CreatorBridge - Staging Environment
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
  environment = "staging"
  project     = "marketing"
  location    = var.location
  suffix      = random_string.resource_suffix.result

  common_tags = {
    Environment = local.environment
    Project     = local.project
    ManagedBy   = "Terraform"
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
# Networking
# -----------------------------------------------------------------------------

module "networking" {
  source = "../../modules/networking"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = local.environment
  project             = local.project

  vnet_address_space              = ["10.0.0.0/16"]
  aks_subnet_prefix               = "10.0.0.0/20"
  data_subnet_prefix              = "10.0.16.0/24"
  appgw_subnet_prefix             = "10.0.17.0/24"
  apim_subnet_prefix              = "10.0.18.0/24"
  private_endpoints_subnet_prefix = "10.0.19.0/24"

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Azure Container Registry
# -----------------------------------------------------------------------------

module "acr" {
  source = "../../modules/acr"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = local.environment
  project             = local.project
  name_suffix         = local.suffix

  sku           = "Basic"
  admin_enabled = true

  # Simplified settings for staging
  default_network_action = "Allow"
  zone_redundancy_enabled = false

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Azure Kubernetes Service
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
  sku_tier           = "Free"

  # System node pool (staging - minimal)
  system_node_count = 2
  system_vm_size    = "Standard_D2s_v3"
  system_min_count  = 2
  system_max_count  = 3

  # App node pool (staging - minimal)
  app_vm_size   = "Standard_D2s_v3"
  app_min_count = 1
  app_max_count = 3

  # Disable worker pool for staging
  worker_vm_size   = "Standard_D2s_v3"
  worker_min_count = 0
  worker_max_count = 0

  enable_auto_scaling = true
  availability_zones  = ["3"]

  acr_id                     = module.acr.acr_id
  enable_acr_integration     = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# PostgreSQL Flexible Server
# -----------------------------------------------------------------------------

module "postgresql" {
  source = "../../modules/postgresql"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  environment         = local.environment
  project             = local.project
  name_suffix         = local.suffix

  sku_name   = "B_Standard_B2s"
  storage_mb = 32768

  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password

  subnet_id           = module.networking.data_subnet_id
  private_dns_zone_id = module.networking.postgresql_private_dns_zone_id

  database_name       = "marketing"
  create_analytics_db = true

  # Staging-specific settings
  high_availability_mode       = "Disabled"
  geo_redundant_backup_enabled = false
  backup_retention_days        = 7

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Redis Cache (Direct resource - no redis module)
# -----------------------------------------------------------------------------

resource "azurerm_redis_cache" "main" {
  name                 = "${local.project}-${local.environment}-redis-${local.suffix}"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  capacity             = 0
  family               = "C"
  sku_name             = "Basic"
  non_ssl_port_enabled = false
  minimum_tls_version  = "1.2"

  redis_configuration {
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Storage Account (Direct resource - no storage module)
# -----------------------------------------------------------------------------

resource "random_string" "storage_suffix" {
  length  = 4
  special = false
  upper   = false
}

resource "azurerm_storage_account" "main" {
  name                     = "mktstg${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

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

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
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
  default_network_action = "Allow"

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Application Insights (Direct resource - no monitoring module)
# -----------------------------------------------------------------------------

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.project}-${local.environment}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

resource "azurerm_application_insights" "main" {
  name                = "${local.project}-${local.environment}-appinsights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = local.common_tags
}

# -----------------------------------------------------------------------------
# JWT Secret for application use
# -----------------------------------------------------------------------------

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# Note: Kubernetes resources are defined in kubernetes.tf
# They will be applied after the Azure infrastructure is created
