# =============================================================================
# Azure Front Door Module - Outputs
# =============================================================================

output "frontdoor_profile_id" {
  description = "ID of the Front Door profile"
  value       = azurerm_cdn_frontdoor_profile.main.id
}

output "frontdoor_profile_name" {
  description = "Name of the Front Door profile"
  value       = azurerm_cdn_frontdoor_profile.main.name
}

output "frontdoor_resource_guid" {
  description = "Resource GUID for origin header validation (X-Azure-FDID)"
  value       = azurerm_cdn_frontdoor_profile.main.resource_guid
}

output "frontdoor_endpoint_hostname" {
  description = "Default hostname of the Front Door endpoint"
  value       = azurerm_cdn_frontdoor_endpoint.main.host_name
}

output "frontdoor_endpoint_id" {
  description = "ID of the Front Door endpoint"
  value       = azurerm_cdn_frontdoor_endpoint.main.id
}

# =============================================================================
# Custom Domain Outputs
# =============================================================================

output "custom_domain_apex_id" {
  description = "ID of the apex custom domain"
  value       = var.domain_name != "" ? azurerm_cdn_frontdoor_custom_domain.apex[0].id : null
}

output "custom_domain_api_id" {
  description = "ID of the API custom domain"
  value       = var.domain_name != "" ? azurerm_cdn_frontdoor_custom_domain.api[0].id : null
}

output "custom_domain_www_id" {
  description = "ID of the www custom domain"
  value       = var.domain_name != "" ? azurerm_cdn_frontdoor_custom_domain.www[0].id : null
}

output "custom_domain_app_id" {
  description = "ID of the app custom domain"
  value       = var.domain_name != "" ? azurerm_cdn_frontdoor_custom_domain.app[0].id : null
}

# =============================================================================
# WAF Outputs
# =============================================================================

output "waf_policy_id" {
  description = "ID of the WAF policy"
  value       = var.enable_waf ? azurerm_cdn_frontdoor_firewall_policy.main[0].id : null
}

output "waf_policy_name" {
  description = "Name of the WAF policy"
  value       = var.enable_waf ? azurerm_cdn_frontdoor_firewall_policy.main[0].name : null
}

# =============================================================================
# Origin Protection
# =============================================================================

output "origin_protection_header" {
  description = "Header name and value for origin protection"
  value = {
    header_name  = "X-Azure-FDID"
    header_value = azurerm_cdn_frontdoor_profile.main.resource_guid
  }
  sensitive = true
}

output "origin_protection_instructions" {
  description = "Instructions for configuring origin protection"
  value       = <<-EOT
    ================================================================================
    ORIGIN PROTECTION CONFIGURATION
    ================================================================================

    Configure your AKS ingress or application to validate this header:

    Header Name:  X-Azure-FDID
    Header Value: ${azurerm_cdn_frontdoor_profile.main.resource_guid}

    NGINX Ingress Example:
    ----------------------
    Add this annotation to your Ingress resource:

    nginx.ingress.kubernetes.io/configuration-snippet: |
      if ($http_x_azure_fdid != "${azurerm_cdn_frontdoor_profile.main.resource_guid}") {
        return 403;
      }

    Application-Level Example (Express.js):
    --------------------------------------
    app.use((req, res, next) => {
      const fdid = req.headers['x-azure-fdid'];
      if (fdid !== '${azurerm_cdn_frontdoor_profile.main.resource_guid}') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    });

    ================================================================================
  EOT
}

# =============================================================================
# URLs
# =============================================================================

output "urls" {
  description = "All configured URLs"
  value = {
    default_endpoint = "https://${azurerm_cdn_frontdoor_endpoint.main.host_name}"
    apex             = var.domain_name != "" ? "https://${var.domain_name}" : null
    www              = var.domain_name != "" ? "https://www.${var.domain_name}" : null
    api              = var.domain_name != "" ? "https://api.${var.domain_name}" : null
    app              = var.domain_name != "" ? "https://app.${var.domain_name}" : null
  }
}
