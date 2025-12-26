# =============================================================================
# Monitoring Module - Outputs
# =============================================================================

# =============================================================================
# Log Analytics
# =============================================================================

output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.main.id
}

output "log_analytics_workspace_name" {
  description = "Name of the Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.main.name
}

output "log_analytics_workspace_primary_key" {
  description = "Primary shared key for Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.main.primary_shared_key
  sensitive   = true
}

output "log_analytics_workspace_secondary_key" {
  description = "Secondary shared key for Log Analytics workspace"
  value       = azurerm_log_analytics_workspace.main.secondary_shared_key
  sensitive   = true
}

output "log_analytics_workspace_customer_id" {
  description = "Workspace ID (customer ID) for Log Analytics"
  value       = azurerm_log_analytics_workspace.main.workspace_id
}

# =============================================================================
# Application Insights
# =============================================================================

output "application_insights_id" {
  description = "ID of Application Insights"
  value       = azurerm_application_insights.main.id
}

output "application_insights_name" {
  description = "Name of Application Insights"
  value       = azurerm_application_insights.main.name
}

output "application_insights_app_id" {
  description = "Application ID for Application Insights"
  value       = azurerm_application_insights.main.app_id
}

output "application_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Connection string for Application Insights"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

# =============================================================================
# Action Groups
# =============================================================================

output "action_group_critical_id" {
  description = "ID of the critical alerts action group"
  value       = azurerm_monitor_action_group.critical.id
}

output "action_group_warning_id" {
  description = "ID of the warning alerts action group"
  value       = azurerm_monitor_action_group.warning.id
}

# =============================================================================
# Environment Variables
# =============================================================================

output "env_vars" {
  description = "Environment variables for application configuration"
  value       = <<-EOT
    # =============================================================================
    # Monitoring Configuration - ${var.environment}
    # =============================================================================

    # Application Insights
    APPLICATIONINSIGHTS_CONNECTION_STRING=${azurerm_application_insights.main.connection_string}
    APPINSIGHTS_INSTRUMENTATIONKEY=${azurerm_application_insights.main.instrumentation_key}

    # Log Analytics
    LOG_ANALYTICS_WORKSPACE_ID=${azurerm_log_analytics_workspace.main.workspace_id}
  EOT
  sensitive   = true
}

# =============================================================================
# Kubernetes ConfigMap/Secret Data
# =============================================================================

output "k8s_config" {
  description = "Configuration for Kubernetes deployment"
  value = {
    appinsights_connection_string  = azurerm_application_insights.main.connection_string
    appinsights_instrumentation_key = azurerm_application_insights.main.instrumentation_key
    log_analytics_workspace_id      = azurerm_log_analytics_workspace.main.workspace_id
  }
  sensitive = true
}
