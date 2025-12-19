# =============================================================================
# PostgreSQL Module - Outputs
# =============================================================================

output "server_id" {
  description = "PostgreSQL server ID"
  value       = azurerm_postgresql_flexible_server.main.id
}

output "server_name" {
  description = "PostgreSQL server name"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "server_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "database_name" {
  description = "Main database name"
  value       = azurerm_postgresql_flexible_server_database.main.name
}

output "analytics_database_name" {
  description = "Analytics database name"
  value       = var.create_analytics_db ? azurerm_postgresql_flexible_server_database.analytics[0].name : null
}

output "administrator_login" {
  description = "Administrator login"
  value       = azurerm_postgresql_flexible_server.main.administrator_login
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${azurerm_postgresql_flexible_server.main.administrator_login}@${azurerm_postgresql_flexible_server.main.fqdn}/${azurerm_postgresql_flexible_server_database.main.name}?sslmode=require"
  sensitive   = true
}
