# =============================================================================
# Azure Front Door Premium Module
# Global entry point with WAF, TLS, and origin protection
# =============================================================================

resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = "afd-${var.project}-${var.environment}"
  resource_group_name = var.resource_group_name
  sku_name            = var.sku_name

  response_timeout_seconds = var.response_timeout_seconds

  tags = var.tags
}

# =============================================================================
# Origins and Origin Groups
# =============================================================================

# API Origin Group
resource "azurerm_cdn_frontdoor_origin_group" "api" {
  name                     = "og-api-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  session_affinity_enabled = false

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
    additional_latency_in_milliseconds = 50
  }

  health_probe {
    path                = var.health_probe_path
    request_type        = "GET"
    protocol            = "Https"
    interval_in_seconds = 30
  }
}

# API Origin
resource "azurerm_cdn_frontdoor_origin" "api" {
  name                          = "origin-api-${var.environment}"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.api.id
  enabled                       = true

  certificate_name_check_enabled = true
  host_name                      = var.api_origin_hostname
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = var.api_origin_hostname
  priority                       = 1
  weight                         = 1000

  private_link {
    request_message        = "Front Door Private Link Request"
    target_type            = var.private_link_target_type
    location               = var.location
    private_link_target_id = var.api_private_link_target_id
  }
}

# Web/App Origin Group
resource "azurerm_cdn_frontdoor_origin_group" "web" {
  name                     = "og-web-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  session_affinity_enabled = true

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
    additional_latency_in_milliseconds = 50
  }

  health_probe {
    path                = "/"
    request_type        = "HEAD"
    protocol            = "Https"
    interval_in_seconds = 30
  }
}

# Web Origin
resource "azurerm_cdn_frontdoor_origin" "web" {
  name                          = "origin-web-${var.environment}"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.web.id
  enabled                       = true

  certificate_name_check_enabled = true
  host_name                      = var.web_origin_hostname
  http_port                      = 80
  https_port                     = 443
  origin_host_header             = var.web_origin_hostname
  priority                       = 1
  weight                         = 1000
}

# =============================================================================
# Endpoints
# =============================================================================

resource "azurerm_cdn_frontdoor_endpoint" "main" {
  name                     = "ep-${var.project}-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  enabled                  = true

  tags = var.tags
}

# =============================================================================
# Custom Domains
# =============================================================================

resource "azurerm_cdn_frontdoor_custom_domain" "apex" {
  count                    = var.domain_name != "" ? 1 : 0
  name                     = "cd-apex-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  dns_zone_id              = var.dns_zone_id
  host_name                = var.domain_name

  tls {
    certificate_type    = "ManagedCertificate"
    minimum_tls_version = "TLS12"
  }
}

resource "azurerm_cdn_frontdoor_custom_domain" "www" {
  count                    = var.domain_name != "" ? 1 : 0
  name                     = "cd-www-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  dns_zone_id              = var.dns_zone_id
  host_name                = "www.${var.domain_name}"

  tls {
    certificate_type    = "ManagedCertificate"
    minimum_tls_version = "TLS12"
  }
}

resource "azurerm_cdn_frontdoor_custom_domain" "api" {
  count                    = var.domain_name != "" ? 1 : 0
  name                     = "cd-api-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  dns_zone_id              = var.dns_zone_id
  host_name                = "api.${var.domain_name}"

  tls {
    certificate_type    = "ManagedCertificate"
    minimum_tls_version = "TLS12"
  }
}

resource "azurerm_cdn_frontdoor_custom_domain" "app" {
  count                    = var.domain_name != "" ? 1 : 0
  name                     = "cd-app-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  dns_zone_id              = var.dns_zone_id
  host_name                = "app.${var.domain_name}"

  tls {
    certificate_type    = "ManagedCertificate"
    minimum_tls_version = "TLS12"
  }
}

# =============================================================================
# Routes
# =============================================================================

# API Route
resource "azurerm_cdn_frontdoor_route" "api" {
  name                          = "route-api-${var.environment}"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.main.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.api.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.api.id]
  cdn_frontdoor_rule_set_ids    = var.enable_waf ? [azurerm_cdn_frontdoor_rule_set.security[0].id] : []
  enabled                       = true

  forwarding_protocol    = "HttpsOnly"
  https_redirect_enabled = true
  patterns_to_match      = ["/api/*", "/graphql", "/health/*"]
  supported_protocols    = ["Http", "Https"]

  cdn_frontdoor_custom_domain_ids = var.domain_name != "" ? [
    azurerm_cdn_frontdoor_custom_domain.api[0].id
  ] : []

  link_to_default_domain = true

  cache {
    query_string_caching_behavior = "IgnoreQueryString"
    compression_enabled           = true
    content_types_to_compress     = var.content_types_to_compress
  }
}

# Web Route
resource "azurerm_cdn_frontdoor_route" "web" {
  name                          = "route-web-${var.environment}"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.main.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.web.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.web.id]
  cdn_frontdoor_rule_set_ids    = var.enable_waf ? [azurerm_cdn_frontdoor_rule_set.security[0].id] : []
  enabled                       = true

  forwarding_protocol    = "HttpsOnly"
  https_redirect_enabled = true
  patterns_to_match      = ["/*"]
  supported_protocols    = ["Http", "Https"]

  cdn_frontdoor_custom_domain_ids = var.domain_name != "" ? [
    azurerm_cdn_frontdoor_custom_domain.apex[0].id,
    azurerm_cdn_frontdoor_custom_domain.www[0].id,
    azurerm_cdn_frontdoor_custom_domain.app[0].id
  ] : []

  link_to_default_domain = true

  cache {
    query_string_caching_behavior = "UseQueryString"
    compression_enabled           = true
    content_types_to_compress     = var.content_types_to_compress
  }
}

# =============================================================================
# Security Rule Set
# =============================================================================

resource "azurerm_cdn_frontdoor_rule_set" "security" {
  count                    = var.enable_waf ? 1 : 0
  name                     = "SecurityRules"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
}

# Add X-Azure-FDID header for origin protection
resource "azurerm_cdn_frontdoor_rule" "add_fd_header" {
  count                     = var.enable_waf ? 1 : 0
  name                      = "AddFrontDoorIdHeader"
  cdn_frontdoor_rule_set_id = azurerm_cdn_frontdoor_rule_set.security[0].id
  order                     = 1
  behavior_on_match         = "Continue"

  actions {
    request_header_action {
      header_action = "Overwrite"
      header_name   = "X-Azure-FDID"
      value         = azurerm_cdn_frontdoor_profile.main.resource_guid
    }
  }
}

# =============================================================================
# WAF Policy
# =============================================================================

resource "azurerm_cdn_frontdoor_firewall_policy" "main" {
  count               = var.enable_waf ? 1 : 0
  name                = "wafpolicy${var.project}${var.environment}"
  resource_group_name = var.resource_group_name
  sku_name            = var.sku_name
  enabled             = true
  mode                = var.waf_mode

  # OWASP Default Rule Set
  managed_rule {
    type    = "DefaultRuleSet"
    version = "2.1"
    action  = "Block"

    dynamic "exclusion" {
      for_each = var.waf_exclusions
      content {
        match_variable = exclusion.value.match_variable
        operator       = exclusion.value.operator
        selector       = exclusion.value.selector
      }
    }
  }

  # Bot Protection
  managed_rule {
    type    = "Microsoft_BotManagerRuleSet"
    version = "1.0"
    action  = "Block"
  }

  # Rate Limiting
  custom_rule {
    name                           = "RateLimitRule"
    enabled                        = true
    priority                       = 1
    rate_limit_duration_in_minutes = 1
    rate_limit_threshold           = var.rate_limit_threshold
    type                           = "RateLimitRule"
    action                         = "Block"

    match_condition {
      match_variable     = "SocketAddr"
      operator           = "IPMatch"
      negation_condition = true
      match_values       = var.rate_limit_whitelist
    }
  }

  # Block known bad actors
  custom_rule {
    name     = "BlockBadActors"
    enabled  = true
    priority = 2
    type     = "MatchRule"
    action   = "Block"

    match_condition {
      match_variable     = "RequestUri"
      operator           = "Contains"
      negation_condition = false
      match_values       = [".php", "wp-admin", "wp-login", ".asp", "phpmyadmin"]
      transforms         = ["Lowercase"]
    }
  }

  # Geo-blocking (optional)
  dynamic "custom_rule" {
    for_each = length(var.blocked_countries) > 0 ? [1] : []
    content {
      name     = "GeoBlock"
      enabled  = true
      priority = 3
      type     = "MatchRule"
      action   = "Block"

      match_condition {
        match_variable     = "SocketAddr"
        operator           = "GeoMatch"
        negation_condition = false
        match_values       = var.blocked_countries
      }
    }
  }

  tags = var.tags
}

# Associate WAF policy with endpoint
resource "azurerm_cdn_frontdoor_security_policy" "main" {
  count                    = var.enable_waf ? 1 : 0
  name                     = "secpolicy-${var.project}-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = azurerm_cdn_frontdoor_firewall_policy.main[0].id

      association {
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.main.id
        }
        patterns_to_match = ["/*"]
      }
    }
  }
}

# =============================================================================
# Diagnostic Settings
# =============================================================================

resource "azurerm_monitor_diagnostic_setting" "frontdoor" {
  count                      = var.log_analytics_workspace_id != "" ? 1 : 0
  name                       = "diag-frontdoor-${var.environment}"
  target_resource_id         = azurerm_cdn_frontdoor_profile.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "FrontDoorAccessLog"
  }

  enabled_log {
    category = "FrontDoorHealthProbeLog"
  }

  enabled_log {
    category = "FrontDoorWebApplicationFirewallLog"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
