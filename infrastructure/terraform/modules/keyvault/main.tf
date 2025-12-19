# =============================================================================
# Azure Key Vault Module
# =============================================================================

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  # Name max 24 chars, alphanumeric + dashes only
  name                        = "kv-cb-${var.environment}${var.name_suffix != "" ? "-${var.name_suffix}" : ""}"
  location                    = var.location
  resource_group_name         = var.resource_group_name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = var.sku_name
  enabled_for_disk_encryption = true
  soft_delete_retention_days  = var.soft_delete_retention_days
  purge_protection_enabled    = var.purge_protection_enabled

  enable_rbac_authorization = true

  network_acls {
    default_action             = var.default_network_action
    bypass                     = "AzureServices"
    virtual_network_subnet_ids = var.allowed_subnet_ids
    ip_rules                   = var.allowed_ip_ranges
  }

  tags = var.tags
}

# Grant current deploying user access to manage secrets
resource "azurerm_role_assignment" "deployer_secrets" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

# Admin Access Policy
resource "azurerm_role_assignment" "admin_secrets" {
  for_each             = toset(var.admin_object_ids)
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = each.value
}

# Reader Access for AKS
resource "azurerm_role_assignment" "aks_secrets" {
  count                = var.aks_identity_principal_id != null ? 1 : 0
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = var.aks_identity_principal_id
}

# Store Database Connection String
resource "azurerm_key_vault_secret" "database_url" {
  count        = var.database_connection_string != null ? 1 : 0
  name         = "database-url"
  value        = var.database_connection_string
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_role_assignment.admin_secrets]
}

# Store Redis Connection String
resource "azurerm_key_vault_secret" "redis_url" {
  count        = var.redis_connection_string != null ? 1 : 0
  name         = "redis-url"
  value        = var.redis_connection_string
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_role_assignment.admin_secrets]
}

# Store JWT Secret
resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = var.jwt_secret != null ? var.jwt_secret : random_password.jwt_secret.result
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_role_assignment.deployer_secrets]
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "keyvault" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "keyvault-diagnostics"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "AuditEvent"
  }

  enabled_log {
    category = "AzurePolicyEvaluationDetails"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
