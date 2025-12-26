# =============================================================================
# Identity Module - Microsoft Entra ID B2C Configuration
# App Registrations, Security Groups, and Authorization Setup
# =============================================================================

terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.45"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# =============================================================================
# Local Variables
# =============================================================================

locals {
  # Standard subscription tiers
  subscription_tiers = ["free", "starter", "growth", "pro", "business", "enterprise"]

  # Special groups
  special_groups = ["verified", "support", "admin", "suspended"]

  # All security groups
  all_groups = concat(
    [for tier in local.subscription_tiers : "${var.project}-${tier}"],
    [for group in local.special_groups : "${var.project}-${group}"]
  )
}

# =============================================================================
# APP REGISTRATION: WEB/SPA CLIENT
# =============================================================================

resource "azuread_application" "web" {
  display_name     = "${var.project}-web-${var.environment}"
  sign_in_audience = var.sign_in_audience

  web {
    redirect_uris = var.web_redirect_uris

    implicit_grant {
      access_token_issuance_enabled = false
      id_token_issuance_enabled     = true
    }
  }

  single_page_application {
    redirect_uris = var.spa_redirect_uris
  }

  api {
    requested_access_token_version = 2
  }

  required_resource_access {
    resource_app_id = azuread_application.api.application_id

    resource_access {
      id   = random_uuid.scope_user_impersonation.result
      type = "Scope"
    }
  }

  # Microsoft Graph permissions (delegated)
  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    resource_access {
      id   = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # User.Read
      type = "Scope"
    }
    resource_access {
      id   = "64a6cdd6-aab1-4aaf-94b8-3cc8405e90d0" # offline_access
      type = "Scope"
    }
    resource_access {
      id   = "37f7f235-527c-4136-accd-4a02d197296e" # openid
      type = "Scope"
    }
    resource_access {
      id   = "14dad69e-099b-42c9-810b-d002981feec1" # profile
      type = "Scope"
    }
  }

  optional_claims {
    access_token {
      name                  = "groups"
      essential             = true
      additional_properties = ["emit_as_roles"]
    }

    id_token {
      name                  = "groups"
      essential             = true
      additional_properties = ["emit_as_roles"]
    }
  }

  tags = ["${var.environment}", var.project, "consumer-app"]

  lifecycle {
    ignore_changes = [
      owners
    ]
  }
}

resource "azuread_service_principal" "web" {
  application_id = azuread_application.web.application_id

  feature_tags {
    enterprise = true
    gallery    = false
  }
}

# =============================================================================
# APP REGISTRATION: BACKEND API
# =============================================================================

resource "azuread_application" "api" {
  display_name     = "${var.project}-api-${var.environment}"
  identifier_uris  = ["api://${var.project}-api-${var.environment}"]
  sign_in_audience = var.sign_in_audience

  api {
    requested_access_token_version = 2

    # User impersonation scope
    oauth2_permission_scope {
      admin_consent_description  = "Allow the application to access ${var.project} API on behalf of the signed-in user"
      admin_consent_display_name = "Access ${var.project} API"
      enabled                    = true
      id                         = random_uuid.scope_user_impersonation.result
      type                       = "User"
      user_consent_description   = "Allow access to ${var.project} on your behalf"
      user_consent_display_name  = "Access ${var.project}"
      value                      = "user_impersonation"
    }

    # Profile read scope
    oauth2_permission_scope {
      admin_consent_description  = "Read user profile information"
      admin_consent_display_name = "Read Profile"
      enabled                    = true
      id                         = random_uuid.scope_profile_read.result
      type                       = "User"
      user_consent_description   = "Read your profile information"
      user_consent_display_name  = "Read Profile"
      value                      = "profile.read"
    }

    # Data write scope
    oauth2_permission_scope {
      admin_consent_description  = "Write user data"
      admin_consent_display_name = "Write Data"
      enabled                    = true
      id                         = random_uuid.scope_data_write.result
      type                       = "User"
      user_consent_description   = "Create and modify your data"
      user_consent_display_name  = "Write Data"
      value                      = "data.write"
    }
  }

  # App roles for subscription tiers
  dynamic "app_role" {
    for_each = local.subscription_tiers
    content {
      allowed_member_types = ["User"]
      description          = "${title(app_role.value)} tier user"
      display_name         = "${title(app_role.value)} User"
      enabled              = true
      id                   = random_uuid.tier_roles[app_role.key].result
      value                = "User.${title(app_role.value)}"
    }
  }

  # Special app roles
  app_role {
    allowed_member_types = ["User"]
    description          = "Verified user with identity confirmation"
    display_name         = "Verified User"
    enabled              = true
    id                   = random_uuid.role_verified.result
    value                = "User.Verified"
  }

  app_role {
    allowed_member_types = ["User"]
    description          = "Customer support staff with limited access"
    display_name         = "Support"
    enabled              = true
    id                   = random_uuid.role_support.result
    value                = "Support"
  }

  app_role {
    allowed_member_types = ["User"]
    description          = "Platform administrator with full access"
    display_name         = "Administrator"
    enabled              = true
    id                   = random_uuid.role_admin.result
    value                = "Administrator"
  }

  # Group claims configuration
  group_membership_claims = ["SecurityGroup"]

  optional_claims {
    access_token {
      name                  = "groups"
      essential             = true
      additional_properties = ["emit_as_roles"]
    }

    id_token {
      name                  = "groups"
      essential             = true
      additional_properties = ["emit_as_roles"]
    }

    access_token {
      name      = "email"
      essential = true
    }
  }

  tags = ["${var.environment}", var.project, "api"]

  lifecycle {
    ignore_changes = [
      owners
    ]
  }
}

resource "azuread_service_principal" "api" {
  application_id = azuread_application.api.application_id

  feature_tags {
    enterprise = true
    gallery    = false
  }
}

# =============================================================================
# APP REGISTRATION: AUTOMATION (Graph API Access)
# =============================================================================

resource "azuread_application" "automation" {
  display_name = "${var.project}-automation-${var.environment}"

  required_resource_access {
    resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

    # User.Read.All - Read all users' profiles
    resource_access {
      id   = "df021288-bdef-4463-88db-98f22de89214"
      type = "Role"
    }
    # Group.ReadWrite.All - Manage all groups
    resource_access {
      id   = "62a82d76-70ea-41e2-9197-370581804d09"
      type = "Role"
    }
    # Directory.ReadWrite.All - Read/write directory data
    resource_access {
      id   = "19dbc75e-c2e2-444c-a770-ec69d8559fc7"
      type = "Role"
    }
    # GroupMember.ReadWrite.All - Manage group memberships
    resource_access {
      id   = "dbaae8cf-10b5-4b86-a4a1-f871c94c6695"
      type = "Role"
    }
  }

  tags = ["${var.environment}", var.project, "automation", "internal-only"]

  lifecycle {
    ignore_changes = [
      owners
    ]
  }
}

resource "azuread_service_principal" "automation" {
  application_id = azuread_application.automation.application_id

  feature_tags {
    enterprise = true
    gallery    = false
  }
}

resource "azuread_application_password" "automation" {
  application_object_id = azuread_application.automation.object_id
  display_name          = "automation-secret-${var.environment}"
  end_date_relative     = "8760h" # 1 year
}

# =============================================================================
# SECURITY GROUPS - SUBSCRIPTION TIERS
# =============================================================================

resource "azuread_group" "tiers" {
  for_each         = var.create_security_groups ? toset(local.subscription_tiers) : []
  display_name     = "${var.project}-${each.key}-${var.environment}"
  description      = "${var.project} ${title(each.key)} tier users"
  security_enabled = true

  prevent_duplicate_names = true

  lifecycle {
    ignore_changes = [
      members
    ]
  }
}

# =============================================================================
# SECURITY GROUPS - SPECIAL GROUPS
# =============================================================================

resource "azuread_group" "verified" {
  count            = var.create_security_groups ? 1 : 0
  display_name     = "${var.project}-verified-${var.environment}"
  description      = "${var.project} Verified users with identity confirmation"
  security_enabled = true

  prevent_duplicate_names = true

  lifecycle {
    ignore_changes = [members]
  }
}

resource "azuread_group" "support" {
  count            = var.create_security_groups ? 1 : 0
  display_name     = "${var.project}-support-${var.environment}"
  description      = "${var.project} Support staff (internal only - NEVER add consumers)"
  security_enabled = true

  prevent_duplicate_names = true

  lifecycle {
    ignore_changes = [members]
  }
}

resource "azuread_group" "admin" {
  count            = var.create_security_groups ? 1 : 0
  display_name     = "${var.project}-admin-${var.environment}"
  description      = "${var.project} Platform administrators (internal only - NEVER add consumers)"
  security_enabled = true

  prevent_duplicate_names = true

  lifecycle {
    ignore_changes = [members]
  }
}

resource "azuread_group" "suspended" {
  count            = var.create_security_groups ? 1 : 0
  display_name     = "${var.project}-suspended-${var.environment}"
  description      = "${var.project} Suspended users (no access to any features)"
  security_enabled = true

  prevent_duplicate_names = true

  lifecycle {
    ignore_changes = [members]
  }
}

# =============================================================================
# RANDOM UUIDs for Scopes and Roles
# =============================================================================

resource "random_uuid" "scope_user_impersonation" {}
resource "random_uuid" "scope_profile_read" {}
resource "random_uuid" "scope_data_write" {}
resource "random_uuid" "role_verified" {}
resource "random_uuid" "role_support" {}
resource "random_uuid" "role_admin" {}

resource "random_uuid" "tier_roles" {
  count = length(local.subscription_tiers)
}

# =============================================================================
# Key Vault Secrets for App Credentials
# =============================================================================

resource "azurerm_key_vault_secret" "web_client_id" {
  count        = var.key_vault_id != "" ? 1 : 0
  name         = "${var.project}-web-client-id"
  value        = azuread_application.web.application_id
  key_vault_id = var.key_vault_id
}

resource "azurerm_key_vault_secret" "api_client_id" {
  count        = var.key_vault_id != "" ? 1 : 0
  name         = "${var.project}-api-client-id"
  value        = azuread_application.api.application_id
  key_vault_id = var.key_vault_id
}

resource "azurerm_key_vault_secret" "automation_client_id" {
  count        = var.key_vault_id != "" ? 1 : 0
  name         = "${var.project}-automation-client-id"
  value        = azuread_application.automation.application_id
  key_vault_id = var.key_vault_id
}

resource "azurerm_key_vault_secret" "automation_client_secret" {
  count        = var.key_vault_id != "" ? 1 : 0
  name         = "${var.project}-automation-client-secret"
  value        = azuread_application_password.automation.value
  key_vault_id = var.key_vault_id
}

resource "azurerm_key_vault_secret" "group_ids" {
  count        = var.key_vault_id != "" && var.create_security_groups ? 1 : 0
  name         = "${var.project}-group-ids"
  value        = jsonencode({
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
  })
  key_vault_id = var.key_vault_id
  content_type = "application/json"
}
