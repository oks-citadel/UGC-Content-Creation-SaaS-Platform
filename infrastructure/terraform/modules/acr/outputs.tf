# =============================================================================
# ACR Module - Outputs
# =============================================================================

output "acr_id" {
  description = "Container Registry ID"
  value       = azurerm_container_registry.main.id
}

output "acr_name" {
  description = "Container Registry name"
  value       = azurerm_container_registry.main.name
}

output "acr_login_server" {
  description = "Container Registry login server"
  value       = azurerm_container_registry.main.login_server
}

output "admin_username" {
  description = "Admin username"
  value       = azurerm_container_registry.main.admin_username
  sensitive   = true
}

output "admin_password" {
  description = "Admin password"
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
}

output "cicd_token_id" {
  description = "CI/CD token ID"
  value       = azurerm_container_registry_token.cicd.id
}
