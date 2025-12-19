# =============================================================================
# AKS Module - Outputs
# =============================================================================

output "cluster_id" {
  description = "AKS cluster ID"
  value       = azurerm_kubernetes_cluster.main.id
}

output "cluster_name" {
  description = "AKS cluster name"
  value       = azurerm_kubernetes_cluster.main.name
}

output "cluster_fqdn" {
  description = "AKS cluster FQDN"
  value       = azurerm_kubernetes_cluster.main.fqdn
}

output "kube_config" {
  description = "Kubernetes configuration"
  value       = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive   = true
}

output "kube_config_host" {
  description = "Kubernetes API server host"
  value       = azurerm_kubernetes_cluster.main.kube_config[0].host
}

output "kubelet_identity" {
  description = "Kubelet managed identity"
  value = {
    client_id   = azurerm_kubernetes_cluster.main.kubelet_identity[0].client_id
    object_id   = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
    user_assigned_identity_id = azurerm_kubernetes_cluster.main.kubelet_identity[0].user_assigned_identity_id
  }
}

output "cluster_identity" {
  description = "AKS cluster managed identity"
  value = {
    principal_id = azurerm_kubernetes_cluster.main.identity[0].principal_id
    tenant_id    = azurerm_kubernetes_cluster.main.identity[0].tenant_id
  }
}

output "oidc_issuer_url" {
  description = "OIDC issuer URL for workload identity"
  value       = azurerm_kubernetes_cluster.main.oidc_issuer_url
}

output "key_vault_secrets_provider_identity" {
  description = "Key Vault secrets provider identity"
  value = {
    client_id = azurerm_kubernetes_cluster.main.key_vault_secrets_provider[0].secret_identity[0].client_id
    object_id = azurerm_kubernetes_cluster.main.key_vault_secrets_provider[0].secret_identity[0].object_id
  }
}

output "node_resource_group" {
  description = "AKS node resource group name"
  value       = azurerm_kubernetes_cluster.main.node_resource_group
}

output "kubernetes_version" {
  description = "Current Kubernetes version"
  value       = azurerm_kubernetes_cluster.main.kubernetes_version
}

output "kube_admin_host" {
  description = "Kubernetes admin API server host"
  value       = azurerm_kubernetes_cluster.main.kube_admin_config[0].host
}

output "kube_admin_client_certificate" {
  description = "Kubernetes admin client certificate"
  value       = azurerm_kubernetes_cluster.main.kube_admin_config[0].client_certificate
  sensitive   = true
}

output "kube_admin_client_key" {
  description = "Kubernetes admin client key"
  value       = azurerm_kubernetes_cluster.main.kube_admin_config[0].client_key
  sensitive   = true
}

output "kube_admin_cluster_ca_certificate" {
  description = "Kubernetes admin cluster CA certificate"
  value       = azurerm_kubernetes_cluster.main.kube_admin_config[0].cluster_ca_certificate
  sensitive   = true
}
