# =============================================================================
# Outputs for Staging Environment
# =============================================================================

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "aks_cluster_name" {
  description = "Name of the AKS cluster"
  value       = module.aks.cluster_name
}

output "acr_login_server" {
  description = "ACR login server URL"
  value       = module.acr.acr_login_server
}

output "postgresql_fqdn" {
  description = "PostgreSQL fully qualified domain name"
  value       = module.postgresql.server_fqdn
}

output "redis_hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.main.hostname
}

output "redis_primary_key" {
  description = "Redis cache primary access key"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.main.name
}

output "storage_primary_key" {
  description = "Storage account primary access key"
  value       = azurerm_storage_account.main.primary_access_key
  sensitive   = true
}

output "keyvault_uri" {
  description = "Key Vault URI"
  value       = module.keyvault.vault_uri
}

output "appinsights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  value       = azurerm_log_analytics_workspace.main.id
}
