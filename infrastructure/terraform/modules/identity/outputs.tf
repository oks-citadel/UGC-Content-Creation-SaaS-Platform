# =============================================================================
# Identity Module - Outputs
# =============================================================================

# =============================================================================
# App Registration IDs
# =============================================================================

output "web_app_client_id" {
  description = "Client ID for the web application"
  value       = azuread_application.web.application_id
}

output "web_app_object_id" {
  description = "Object ID for the web application"
  value       = azuread_application.web.object_id
}

output "api_app_client_id" {
  description = "Client ID for the API application"
  value       = azuread_application.api.application_id
}

output "api_app_object_id" {
  description = "Object ID for the API application"
  value       = azuread_application.api.object_id
}

output "api_app_identifier_uri" {
  description = "Identifier URI for the API application"
  value       = azuread_application.api.identifier_uris[0]
}

output "automation_app_client_id" {
  description = "Client ID for the automation application"
  value       = azuread_application.automation.application_id
}

output "automation_app_object_id" {
  description = "Object ID for the automation application"
  value       = azuread_application.automation.object_id
}

output "automation_app_secret" {
  description = "Client secret for the automation application"
  value       = azuread_application_password.automation.value
  sensitive   = true
}

# =============================================================================
# Security Group IDs
# =============================================================================

output "group_ids" {
  description = "Map of security group names to their object IDs"
  value = var.create_security_groups ? {
    free       = azuread_group.tiers["free"].object_id
    starter    = azuread_group.tiers["starter"].object_id
    growth     = azuread_group.tiers["growth"].object_id
    pro        = azuread_group.tiers["pro"].object_id
    business   = azuread_group.tiers["business"].object_id
    enterprise = azuread_group.tiers["enterprise"].object_id
    verified   = azuread_group.verified[0].object_id
    support    = azuread_group.support[0].object_id
    admin      = azuread_group.admin[0].object_id
    suspended  = azuread_group.suspended[0].object_id
  } : {}
}

output "tier_group_ids" {
  description = "Map of subscription tier names to group IDs"
  value = var.create_security_groups ? {
    for tier in ["free", "starter", "growth", "pro", "business", "enterprise"] :
    tier => azuread_group.tiers[tier].object_id
  } : {}
}

output "special_group_ids" {
  description = "Map of special group names to group IDs"
  value = var.create_security_groups ? {
    verified  = azuread_group.verified[0].object_id
    support   = azuread_group.support[0].object_id
    admin     = azuread_group.admin[0].object_id
    suspended = azuread_group.suspended[0].object_id
  } : {}
}

# =============================================================================
# OAuth2 Scope IDs
# =============================================================================

output "scope_ids" {
  description = "OAuth2 permission scope IDs"
  value = {
    user_impersonation = random_uuid.scope_user_impersonation.result
    profile_read       = random_uuid.scope_profile_read.result
    data_write         = random_uuid.scope_data_write.result
  }
}

# =============================================================================
# App Role IDs
# =============================================================================

output "role_ids" {
  description = "App role IDs"
  value = {
    verified = random_uuid.role_verified.result
    support  = random_uuid.role_support.result
    admin    = random_uuid.role_admin.result
    tiers    = { for i, tier in ["free", "starter", "growth", "pro", "business", "enterprise"] : tier => random_uuid.tier_roles[i].result }
  }
}

# =============================================================================
# Configuration Export
# =============================================================================

output "auth_config" {
  description = "Authentication configuration for backend services"
  value = {
    b2c_tenant_name    = var.b2c_tenant_name
    web_client_id      = azuread_application.web.application_id
    api_client_id      = azuread_application.api.application_id
    api_identifier_uri = azuread_application.api.identifier_uris[0]

    group_ids = var.create_security_groups ? {
      free       = azuread_group.tiers["free"].object_id
      starter    = azuread_group.tiers["starter"].object_id
      growth     = azuread_group.tiers["growth"].object_id
      pro        = azuread_group.tiers["pro"].object_id
      business   = azuread_group.tiers["business"].object_id
      enterprise = azuread_group.tiers["enterprise"].object_id
      verified   = azuread_group.verified[0].object_id
      support    = azuread_group.support[0].object_id
      admin      = azuread_group.admin[0].object_id
      suspended  = azuread_group.suspended[0].object_id
    } : {}
  }
  sensitive = true
}

output "env_vars" {
  description = "Environment variables for application configuration"
  value       = <<-EOT
    # =============================================================================
    # Identity Configuration - ${var.environment}
    # Add these to your application environment
    # =============================================================================

    # B2C Tenant
    B2C_TENANT_NAME=${var.b2c_tenant_name}
    B2C_POLICY_NAME=B2C_1_SignUpSignIn

    # App Registrations
    B2C_WEB_CLIENT_ID=${azuread_application.web.application_id}
    B2C_API_CLIENT_ID=${azuread_application.api.application_id}
    B2C_API_IDENTIFIER_URI=${azuread_application.api.identifier_uris[0]}

    # Group IDs (for authorization middleware)
    GROUP_ID_FREE=${var.create_security_groups ? azuread_group.tiers["free"].object_id : ""}
    GROUP_ID_STARTER=${var.create_security_groups ? azuread_group.tiers["starter"].object_id : ""}
    GROUP_ID_GROWTH=${var.create_security_groups ? azuread_group.tiers["growth"].object_id : ""}
    GROUP_ID_PRO=${var.create_security_groups ? azuread_group.tiers["pro"].object_id : ""}
    GROUP_ID_BUSINESS=${var.create_security_groups ? azuread_group.tiers["business"].object_id : ""}
    GROUP_ID_ENTERPRISE=${var.create_security_groups ? azuread_group.tiers["enterprise"].object_id : ""}
    GROUP_ID_VERIFIED=${var.create_security_groups ? azuread_group.verified[0].object_id : ""}
    GROUP_ID_SUPPORT=${var.create_security_groups ? azuread_group.support[0].object_id : ""}
    GROUP_ID_ADMIN=${var.create_security_groups ? azuread_group.admin[0].object_id : ""}
    GROUP_ID_SUSPENDED=${var.create_security_groups ? azuread_group.suspended[0].object_id : ""}
  EOT
}
