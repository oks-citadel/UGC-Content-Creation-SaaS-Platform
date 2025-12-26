# =============================================================================
# Azure DNS Module - Outputs
# =============================================================================

output "dns_zone_id" {
  description = "ID of the DNS zone"
  value       = azurerm_dns_zone.main.id
}

output "dns_zone_name" {
  description = "Name of the DNS zone"
  value       = azurerm_dns_zone.main.name
}

output "name_servers" {
  description = "Name servers for the DNS zone (configure at registrar)"
  value       = azurerm_dns_zone.main.name_servers
}

output "name_servers_string" {
  description = "Name servers as a comma-separated string"
  value       = join(", ", azurerm_dns_zone.main.name_servers)
}

# =============================================================================
# Record FQDNs
# =============================================================================

output "apex_fqdn" {
  description = "FQDN for the apex domain"
  value       = var.domain_name
}

output "www_fqdn" {
  description = "FQDN for www subdomain"
  value       = var.create_www_record ? "www.${var.domain_name}" : null
}

output "api_fqdn" {
  description = "FQDN for api subdomain"
  value       = var.create_api_record ? "api.${var.domain_name}" : null
}

output "app_fqdn" {
  description = "FQDN for app subdomain"
  value       = var.create_app_record ? "app.${var.domain_name}" : null
}

# =============================================================================
# Registrar Configuration Instructions
# =============================================================================

output "registrar_instructions" {
  description = "Instructions for configuring the domain registrar"
  value       = <<-EOT
    ================================================================================
    DNS ZONE CONFIGURATION COMPLETE
    ================================================================================

    Domain: ${var.domain_name}

    STEP 1: Configure your domain registrar with these name servers:
    ${join("\n    ", azurerm_dns_zone.main.name_servers)}

    STEP 2: Wait for DNS propagation (up to 48 hours, typically 1-4 hours)

    STEP 3: Verify with: dig NS ${var.domain_name} +short

    Expected output should show Azure DNS name servers (*.azure-dns.*)

    ================================================================================
  EOT
}
