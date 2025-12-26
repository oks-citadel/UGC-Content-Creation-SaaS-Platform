# =============================================================================
# Azure DNS Module
# Public DNS Zone for custom domain management
# =============================================================================

resource "azurerm_dns_zone" "main" {
  name                = var.domain_name
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# =============================================================================
# Root Domain Records
# =============================================================================

# Apex A record (for Front Door alias - created via Front Door module)
# This is a placeholder that will be updated when Front Door is configured
resource "azurerm_dns_a_record" "apex" {
  count               = var.create_apex_record ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.default_ttl
  target_resource_id  = var.front_door_id

  tags = var.tags
}

# WWW CNAME record
resource "azurerm_dns_cname_record" "www" {
  count               = var.create_www_record ? 1 : 0
  name                = "www"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.default_ttl
  record              = var.www_target != "" ? var.www_target : var.domain_name

  tags = var.tags
}

# API subdomain CNAME (points to Front Door)
resource "azurerm_dns_cname_record" "api" {
  count               = var.create_api_record ? 1 : 0
  name                = "api"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.default_ttl
  record              = var.api_target

  tags = var.tags
}

# App subdomain CNAME (points to Front Door)
resource "azurerm_dns_cname_record" "app" {
  count               = var.create_app_record ? 1 : 0
  name                = "app"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.default_ttl
  record              = var.app_target

  tags = var.tags
}

# =============================================================================
# Email DNS Records
# =============================================================================

# MX Records
resource "azurerm_dns_mx_record" "main" {
  count               = length(var.mx_records) > 0 ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.email_ttl

  dynamic "record" {
    for_each = var.mx_records
    content {
      preference = record.value.preference
      exchange   = record.value.exchange
    }
  }

  tags = var.tags
}

# SPF Record
resource "azurerm_dns_txt_record" "spf" {
  count               = var.spf_record != "" ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.email_ttl

  record {
    value = var.spf_record
  }

  tags = var.tags
}

# DKIM Records
resource "azurerm_dns_cname_record" "dkim" {
  for_each            = var.dkim_records
  name                = each.key
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.email_ttl
  record              = each.value

  tags = var.tags
}

# DMARC Record
resource "azurerm_dns_txt_record" "dmarc" {
  count               = var.dmarc_record != "" ? 1 : 0
  name                = "_dmarc"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.email_ttl

  record {
    value = var.dmarc_record
  }

  tags = var.tags
}

# =============================================================================
# Domain Verification Records (for B2C, Azure, etc.)
# =============================================================================

resource "azurerm_dns_txt_record" "verification" {
  for_each            = var.verification_records
  name                = each.key
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.default_ttl

  record {
    value = each.value
  }

  tags = var.tags
}

# =============================================================================
# CAA Records (Certificate Authority Authorization)
# =============================================================================

resource "azurerm_dns_caa_record" "main" {
  count               = length(var.caa_records) > 0 ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.default_ttl

  dynamic "record" {
    for_each = var.caa_records
    content {
      flags = record.value.flags
      tag   = record.value.tag
      value = record.value.value
    }
  }

  tags = var.tags
}

# =============================================================================
# Custom Subdomain Records
# =============================================================================

resource "azurerm_dns_cname_record" "custom" {
  for_each            = var.custom_cname_records
  name                = each.key
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.default_ttl
  record              = each.value

  tags = var.tags
}

resource "azurerm_dns_a_record" "custom" {
  for_each            = var.custom_a_records
  name                = each.key
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = var.default_ttl
  records             = each.value

  tags = var.tags
}
