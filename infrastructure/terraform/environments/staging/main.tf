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
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.45"
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

provider "azuread" {
  # Uses same authentication as azurerm
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
  system_node_count = 1
  system_vm_size    = "Standard_B2s"
  system_min_count  = 1
  system_max_count  = 1

  # App node pool (staging - minimal)
  app_vm_size   = "Standard_B2s"
  app_min_count = 0
  app_max_count = 0

  # Disable worker pool for staging
  worker_vm_size   = "Standard_B2s"
  worker_min_count = 0
  worker_max_count = 0

  enable_auto_scaling = false
  availability_zones  = []

  acr_id                     = module.acr.acr_id
  enable_acr_integration     = true
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id

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
# Monitoring (Using Module)
# -----------------------------------------------------------------------------

module "monitoring" {
  source = "../../modules/monitoring"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project             = local.project
  environment         = local.environment

  retention_days        = var.log_retention_days
  alert_email_receivers = var.alert_email_receivers
  create_alerts         = length(var.alert_email_receivers) > 0
  create_workbooks      = true

  tags = local.common_tags
}

# Keep reference for backwards compatibility
locals {
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
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

# =============================================================================
# DNS Zone (Optional - Enable when domain is configured)
# =============================================================================

module "dns" {
  count  = var.enable_dns && var.domain_name != "" ? 1 : 0
  source = "../../modules/dns"

  resource_group_name = azurerm_resource_group.main.name
  domain_name         = var.domain_name

  # Email records
  mx_records   = var.mx_records
  spf_record   = var.spf_record
  dkim_records = var.dkim_records
  dmarc_record = var.dmarc_record

  # Subdomain targets (will be updated when Front Door is enabled)
  create_apex_record = var.enable_frontdoor
  create_www_record  = true
  create_api_record  = true
  create_app_record  = true

  api_target = var.enable_frontdoor ? module.frontdoor[0].frontdoor_endpoint_hostname : ""
  app_target = var.enable_frontdoor ? module.frontdoor[0].frontdoor_endpoint_hostname : ""
  www_target = var.enable_frontdoor ? module.frontdoor[0].frontdoor_endpoint_hostname : ""

  tags = local.common_tags
}

# =============================================================================
# Azure Front Door (Optional - Enable for production-ready setup)
# =============================================================================

module "frontdoor" {
  count  = var.enable_frontdoor ? 1 : 0
  source = "../../modules/frontdoor"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project             = local.project
  environment         = local.environment

  sku_name    = var.frontdoor_sku
  domain_name = var.domain_name
  dns_zone_id = var.enable_dns ? module.dns[0].dns_zone_id : ""

  # Origin configuration
  api_origin_hostname = "${local.project}-${local.environment}-api.${azurerm_resource_group.main.location}.cloudapp.azure.com"
  web_origin_hostname = "${local.project}-${local.environment}-web.${azurerm_resource_group.main.location}.cloudapp.azure.com"

  # WAF configuration
  enable_waf = var.enable_waf
  waf_mode   = var.waf_mode

  # Monitoring
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id

  tags = local.common_tags
}

# =============================================================================
# Identity - Entra ID B2C Configuration (Optional)
# =============================================================================

module "identity" {
  count  = var.enable_identity ? 1 : 0
  source = "../../modules/identity"

  providers = {
    azuread = azuread
  }

  project     = local.project
  environment = local.environment

  b2c_tenant_name = var.b2c_tenant_name

  # Redirect URIs
  web_redirect_uris = var.web_redirect_uris
  spa_redirect_uris = var.spa_redirect_uris

  # Security groups
  create_security_groups = true

  # Store secrets in Key Vault
  key_vault_id = module.keyvault.key_vault_id

  tags = local.common_tags
}

# =============================================================================
# Outputs for new modules
# =============================================================================

output "dns_name_servers" {
  description = "DNS name servers (configure at registrar)"
  value       = var.enable_dns ? module.dns[0].name_servers : []
}

output "frontdoor_endpoint" {
  description = "Front Door endpoint hostname"
  value       = var.enable_frontdoor ? module.frontdoor[0].frontdoor_endpoint_hostname : null
}

output "frontdoor_origin_header" {
  description = "Front Door origin protection header value"
  value       = var.enable_frontdoor ? module.frontdoor[0].frontdoor_resource_guid : null
  sensitive   = true
}

output "identity_web_client_id" {
  description = "Web application client ID"
  value       = var.enable_identity ? module.identity[0].web_app_client_id : null
}

output "identity_api_client_id" {
  description = "API application client ID"
  value       = var.enable_identity ? module.identity[0].api_app_client_id : null
}

output "identity_group_ids" {
  description = "Security group IDs"
  value       = var.enable_identity ? module.identity[0].group_ids : {}
  sensitive   = true
}

output "monitoring_appinsights_connection_string" {
  description = "Application Insights connection string"
  value       = module.monitoring.application_insights_connection_string
  sensitive   = true
}
