# =============================================================================
# Resource Groups Module - Outputs
# =============================================================================

output "main_rg_name" {
  description = "Main resource group name"
  value       = azurerm_resource_group.main.name
}

output "main_rg_id" {
  description = "Main resource group ID"
  value       = azurerm_resource_group.main.id
}

output "aks_rg_name" {
  description = "AKS resource group name"
  value       = azurerm_resource_group.aks.name
}

output "aks_rg_id" {
  description = "AKS resource group ID"
  value       = azurerm_resource_group.aks.id
}

output "data_rg_name" {
  description = "Data resource group name"
  value       = azurerm_resource_group.data.name
}

output "data_rg_id" {
  description = "Data resource group ID"
  value       = azurerm_resource_group.data.id
}

output "network_rg_name" {
  description = "Network resource group name"
  value       = azurerm_resource_group.network.name
}

output "network_rg_id" {
  description = "Network resource group ID"
  value       = azurerm_resource_group.network.id
}

output "monitoring_rg_name" {
  description = "Monitoring resource group name"
  value       = azurerm_resource_group.monitoring.name
}

output "monitoring_rg_id" {
  description = "Monitoring resource group ID"
  value       = azurerm_resource_group.monitoring.id
}

output "ai_rg_name" {
  description = "AI resource group name"
  value       = azurerm_resource_group.ai.name
}

output "ai_rg_id" {
  description = "AI resource group ID"
  value       = azurerm_resource_group.ai.id
}
