# =============================================================================
# Networking Module - Outputs
# =============================================================================

output "vnet_id" {
  description = "Virtual network ID"
  value       = azurerm_virtual_network.main.id
}

output "vnet_name" {
  description = "Virtual network name"
  value       = azurerm_virtual_network.main.name
}

output "aks_subnet_id" {
  description = "AKS subnet ID"
  value       = azurerm_subnet.aks.id
}

output "aks_subnet_name" {
  description = "AKS subnet name"
  value       = azurerm_subnet.aks.name
}

output "data_subnet_id" {
  description = "Data subnet ID"
  value       = azurerm_subnet.data.id
}

output "data_subnet_name" {
  description = "Data subnet name"
  value       = azurerm_subnet.data.name
}

output "appgw_subnet_id" {
  description = "Application Gateway subnet ID"
  value       = azurerm_subnet.appgw.id
}

output "apim_subnet_id" {
  description = "API Management subnet ID"
  value       = azurerm_subnet.apim.id
}

output "private_endpoints_subnet_id" {
  description = "Private endpoints subnet ID"
  value       = azurerm_subnet.private_endpoints.id
}

output "postgresql_private_dns_zone_id" {
  description = "PostgreSQL private DNS zone ID"
  value       = azurerm_private_dns_zone.postgresql.id
}

output "redis_private_dns_zone_id" {
  description = "Redis private DNS zone ID"
  value       = azurerm_private_dns_zone.redis.id
}

output "blob_private_dns_zone_id" {
  description = "Blob storage private DNS zone ID"
  value       = azurerm_private_dns_zone.blob.id
}

output "keyvault_private_dns_zone_id" {
  description = "Key Vault private DNS zone ID"
  value       = azurerm_private_dns_zone.keyvault.id
}
