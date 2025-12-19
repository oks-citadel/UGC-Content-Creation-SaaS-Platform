# =============================================================================
# Azure Container Registry Module
# =============================================================================

resource "azurerm_container_registry" "main" {
  name                = "acr${var.project}${var.environment}${var.name_suffix}"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku
  admin_enabled       = var.admin_enabled

  dynamic "georeplications" {
    for_each = var.sku == "Premium" ? var.georeplications : []
    content {
      location                  = georeplications.value.location
      regional_endpoint_enabled = georeplications.value.regional_endpoint_enabled
      zone_redundancy_enabled   = georeplications.value.zone_redundancy_enabled
      tags                      = var.tags
    }
  }

  zone_redundancy_enabled = var.zone_redundancy_enabled

  tags = var.tags
}

# Scope Map for CI/CD
resource "azurerm_container_registry_scope_map" "cicd" {
  name                    = "cicd-scope"
  container_registry_name = azurerm_container_registry.main.name
  resource_group_name     = var.resource_group_name
  actions = [
    "repositories/*/content/read",
    "repositories/*/content/write",
    "repositories/*/metadata/read",
    "repositories/*/metadata/write"
  ]
}

# Token for CI/CD
resource "azurerm_container_registry_token" "cicd" {
  name                    = "cicd-token"
  container_registry_name = azurerm_container_registry.main.name
  resource_group_name     = var.resource_group_name
  scope_map_id            = azurerm_container_registry_scope_map.cicd.id
}

# Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "acr" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "acr-diagnostics"
  target_resource_id         = azurerm_container_registry.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "ContainerRegistryRepositoryEvents"
  }

  enabled_log {
    category = "ContainerRegistryLoginEvents"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
