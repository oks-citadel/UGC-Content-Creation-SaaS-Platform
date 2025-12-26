# =============================================================================
# Monitoring Module
# Log Analytics, Application Insights, Alerts, and Dashboards
# =============================================================================

# =============================================================================
# Log Analytics Workspace
# =============================================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${var.project}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.log_analytics_sku
  retention_in_days   = var.retention_days

  daily_quota_gb = var.daily_quota_gb

  tags = var.tags
}

# =============================================================================
# Application Insights
# =============================================================================

resource "azurerm_application_insights" "main" {
  name                = "appi-${var.project}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  daily_data_cap_in_gb                  = var.appinsights_daily_cap_gb
  daily_data_cap_notifications_disabled = false
  retention_in_days                     = var.retention_days
  sampling_percentage                   = var.sampling_percentage
  disable_ip_masking                    = false

  tags = var.tags
}

# =============================================================================
# Action Group for Alerts
# =============================================================================

resource "azurerm_monitor_action_group" "critical" {
  name                = "ag-${var.project}-critical-${var.environment}"
  resource_group_name = var.resource_group_name
  short_name          = "Critical"

  dynamic "email_receiver" {
    for_each = var.alert_email_receivers
    content {
      name                    = email_receiver.value.name
      email_address           = email_receiver.value.email
      use_common_alert_schema = true
    }
  }

  dynamic "webhook_receiver" {
    for_each = var.alert_webhook_receivers
    content {
      name                    = webhook_receiver.value.name
      service_uri             = webhook_receiver.value.uri
      use_common_alert_schema = true
    }
  }

  tags = var.tags
}

resource "azurerm_monitor_action_group" "warning" {
  name                = "ag-${var.project}-warning-${var.environment}"
  resource_group_name = var.resource_group_name
  short_name          = "Warning"

  dynamic "email_receiver" {
    for_each = var.alert_email_receivers
    content {
      name                    = email_receiver.value.name
      email_address           = email_receiver.value.email
      use_common_alert_schema = true
    }
  }

  tags = var.tags
}

# =============================================================================
# Metric Alerts - API Health
# =============================================================================

resource "azurerm_monitor_metric_alert" "api_response_time" {
  count               = var.create_alerts ? 1 : 0
  name                = "alert-api-response-time-${var.environment}"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when API response time exceeds threshold"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/duration"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.api_response_time_threshold_ms
  }

  action {
    action_group_id = azurerm_monitor_action_group.warning.id
  }

  tags = var.tags
}

resource "azurerm_monitor_metric_alert" "api_failure_rate" {
  count               = var.create_alerts ? 1 : 0
  name                = "alert-api-failure-rate-${var.environment}"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when API failure rate exceeds threshold"
  severity            = 1
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/failed"
    aggregation      = "Count"
    operator         = "GreaterThan"
    threshold        = var.api_failure_count_threshold
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }

  tags = var.tags
}

# =============================================================================
# Scheduled Query Alerts
# =============================================================================

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "auth_failures" {
  count               = var.create_alerts ? 1 : 0
  name                = "alert-auth-failures-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location
  description         = "Alert on excessive authentication failures"
  severity            = 1

  evaluation_frequency = "PT5M"
  window_duration      = "PT15M"
  scopes               = [azurerm_log_analytics_workspace.main.id]

  criteria {
    query = <<-QUERY
      AppRequests
      | where ResultCode == 401 or ResultCode == 403
      | summarize FailedCount = count() by bin(TimeGenerated, 5m)
      | where FailedCount > ${var.auth_failure_threshold}
    QUERY

    time_aggregation_method = "Count"
    threshold               = 1
    operator                = "GreaterThan"

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.critical.id]
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "suspended_user_attempts" {
  count               = var.create_alerts ? 1 : 0
  name                = "alert-suspended-user-attempts-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location
  description         = "Alert when suspended users attempt to access the system"
  severity            = 2

  evaluation_frequency = "PT5M"
  window_duration      = "PT15M"
  scopes               = [azurerm_log_analytics_workspace.main.id]

  criteria {
    query = <<-QUERY
      AppTraces
      | where Message contains "suspended" and Message contains "access denied"
      | summarize AttemptCount = count() by bin(TimeGenerated, 5m)
      | where AttemptCount > 5
    QUERY

    time_aggregation_method = "Count"
    threshold               = 1
    operator                = "GreaterThan"

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.warning.id]
  }

  tags = var.tags
}

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "privilege_escalation" {
  count               = var.create_alerts ? 1 : 0
  name                = "alert-privilege-escalation-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location
  description         = "CRITICAL: Potential privilege escalation attempt detected"
  severity            = 0

  evaluation_frequency = "PT1M"
  window_duration      = "PT5M"
  scopes               = [azurerm_log_analytics_workspace.main.id]

  criteria {
    query = <<-QUERY
      AppTraces
      | where Message contains "privilege" or Message contains "escalation" or Message contains "unauthorized admin"
      | summarize AttemptCount = count() by bin(TimeGenerated, 1m)
      | where AttemptCount > 0
    QUERY

    time_aggregation_method = "Count"
    threshold               = 0
    operator                = "GreaterThan"

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.critical.id]
  }

  tags = var.tags
}

# =============================================================================
# Workbooks (Dashboards)
# =============================================================================

resource "azurerm_application_insights_workbook" "platform_overview" {
  count               = var.create_workbooks ? 1 : 0
  name                = "wb-${var.project}-overview-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location
  display_name        = "${var.project} Platform Overview"

  data_json = jsonencode({
    version = "Notebook/1.0"
    items = [
      {
        type = 1
        content = {
          json = "# ${var.project} Platform Overview\n\nReal-time platform health and security monitoring."
        }
      },
      {
        type = 3
        content = {
          version    = "KqlItem/1.0"
          query      = "AppRequests | summarize TotalRequests=count(), FailedRequests=countif(Success==false) by bin(TimeGenerated, 1h) | order by TimeGenerated desc"
          size       = 0
          title      = "Request Volume & Failures"
          timeContext = { durationMs = 86400000 }
          queryType  = 0
        }
      },
      {
        type = 3
        content = {
          version    = "KqlItem/1.0"
          query      = "AppRequests | where ResultCode == 401 or ResultCode == 403 | summarize Count=count() by bin(TimeGenerated, 1h) | order by TimeGenerated desc"
          size       = 0
          title      = "Authentication Failures"
          timeContext = { durationMs = 86400000 }
          queryType  = 0
        }
      }
    ]
  })

  tags = var.tags
}

# =============================================================================
# Saved Searches
# =============================================================================

resource "azurerm_log_analytics_saved_search" "failed_authentications" {
  name                       = "FailedAuthentications"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  category                   = "Security"
  display_name               = "Failed Authentication Attempts"
  query                      = <<-QUERY
    AppRequests
    | where ResultCode == 401 or ResultCode == 403
    | project TimeGenerated, Name, ResultCode, ClientIP, UserAgent = tostring(customDimensions.UserAgent)
    | order by TimeGenerated desc
  QUERY
}

resource "azurerm_log_analytics_saved_search" "tier_access_patterns" {
  name                       = "TierAccessPatterns"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  category                   = "Business"
  display_name               = "Access Patterns by Subscription Tier"
  query                      = <<-QUERY
    AppTraces
    | where Message contains "tier"
    | extend Tier = extract("tier[=:]\\s*([a-zA-Z]+)", 1, Message)
    | summarize RequestCount = count() by Tier, bin(TimeGenerated, 1h)
    | order by TimeGenerated desc
  QUERY
}

resource "azurerm_log_analytics_saved_search" "admin_actions" {
  name                       = "AdminActions"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  category                   = "Audit"
  display_name               = "Administrative Actions"
  query                      = <<-QUERY
    AppTraces
    | where Message contains "admin" or Message contains "Administrator"
    | project TimeGenerated, Message, Operation = tostring(customDimensions.Operation), UserId = tostring(customDimensions.UserId)
    | order by TimeGenerated desc
  QUERY
}
