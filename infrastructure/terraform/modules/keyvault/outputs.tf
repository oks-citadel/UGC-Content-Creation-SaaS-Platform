# =============================================================================
# Key Vault Module - Outputs
# =============================================================================

output "vault_id" {
  description = "Key Vault ID"
  value       = azurerm_key_vault.main.id
}

output "vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.main.name
}

output "vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

output "tenant_id" {
  description = "Key Vault tenant ID"
  value       = azurerm_key_vault.main.tenant_id
}
