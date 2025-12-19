# =============================================================================
# Azure Database for PostgreSQL Flexible Server Module
# =============================================================================

resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "psql-${var.project}-${var.environment}${var.name_suffix != "" ? "-${var.name_suffix}" : ""}"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  version                       = var.postgresql_version
  delegated_subnet_id           = var.subnet_id
  private_dns_zone_id           = var.private_dns_zone_id
  administrator_login           = var.administrator_login
  administrator_password        = var.administrator_password
  public_network_access_enabled = false

  zone = var.availability_zone

  storage_mb   = var.storage_mb
  storage_tier = var.storage_tier

  sku_name = var.sku_name

  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = var.geo_redundant_backup_enabled

  dynamic "high_availability" {
    for_each = var.high_availability_mode != "Disabled" ? [1] : []
    content {
      mode                      = var.high_availability_mode
      standby_availability_zone = var.standby_availability_zone
    }
  }

  maintenance_window {
    day_of_week  = 0
    start_hour   = 2
    start_minute = 0
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      zone,
      high_availability[0].standby_availability_zone
    ]
  }
}

# PostgreSQL Configuration
resource "azurerm_postgresql_flexible_server_configuration" "max_connections" {
  name      = "max_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.max_connections
}

resource "azurerm_postgresql_flexible_server_configuration" "shared_buffers" {
  name      = "shared_buffers"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.shared_buffers
}

resource "azurerm_postgresql_flexible_server_configuration" "work_mem" {
  name      = "work_mem"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.work_mem
}

resource "azurerm_postgresql_flexible_server_configuration" "log_min_duration_statement" {
  name      = "log_min_duration_statement"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.log_min_duration_statement
}

resource "azurerm_postgresql_flexible_server_configuration" "azure_extensions" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "PG_STAT_STATEMENTS,PGCRYPTO,UUID-OSSP,VECTOR"
}

# Databases
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_postgresql_flexible_server_database" "analytics" {
  count     = var.create_analytics_db ? 1 : 0
  name      = "${var.database_name}_analytics"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Firewall Rules (for Azure Services)
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  count            = var.allow_azure_services ? 1 : 0
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "postgresql" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "postgresql-diagnostics"
  target_resource_id         = azurerm_postgresql_flexible_server.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "PostgreSQLLogs"
  }

  enabled_log {
    category = "PostgreSQLFlexQueryStoreRuntime"
  }

  enabled_log {
    category = "PostgreSQLFlexQueryStoreWaitStats"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
