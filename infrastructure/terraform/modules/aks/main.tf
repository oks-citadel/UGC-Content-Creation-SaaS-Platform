# =============================================================================
# Azure Kubernetes Service (AKS) Module
# =============================================================================

resource "azurerm_kubernetes_cluster" "main" {
  name                = "aks-${var.project}-${var.environment}${var.name_suffix != "" ? "-${var.name_suffix}" : ""}"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "${var.project}-${var.environment}${var.name_suffix != "" ? "-${var.name_suffix}" : ""}"
  kubernetes_version  = var.kubernetes_version
  sku_tier            = var.sku_tier

  default_node_pool {
    name                = "system"
    node_count          = var.system_node_count
    vm_size             = var.system_vm_size
    vnet_subnet_id      = var.vnet_subnet_id
    enable_auto_scaling = var.enable_auto_scaling
    min_count           = var.enable_auto_scaling ? var.system_min_count : null
    max_count           = var.enable_auto_scaling ? var.system_max_count : null
    max_pods            = var.max_pods
    os_disk_size_gb     = var.os_disk_size_gb
    os_disk_type        = "Managed"
    type                = "VirtualMachineScaleSets"

    node_labels = {
      "nodepool-type" = "system"
      "environment"   = var.environment
      "nodepoolos"    = "linux"
    }

    upgrade_settings {
      max_surge = "33%"
    }

    zones = var.availability_zones
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin     = "azure"
    network_policy     = "calico"
    load_balancer_sku  = "standard"
    service_cidr       = var.service_cidr
    dns_service_ip     = var.dns_service_ip
    outbound_type      = "loadBalancer"
  }

  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
    admin_group_object_ids = var.admin_group_object_ids
  }

  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  workload_identity_enabled = true
  oidc_issuer_enabled       = true

  auto_scaler_profile {
    balance_similar_node_groups      = true
    expander                         = "random"
    max_graceful_termination_sec     = 600
    max_node_provisioning_time       = "15m"
    max_unready_nodes                = 3
    max_unready_percentage           = 45
    new_pod_scale_up_delay           = "10s"
    scale_down_delay_after_add       = "10m"
    scale_down_delay_after_delete    = "10s"
    scale_down_delay_after_failure   = "3m"
    scan_interval                    = "10s"
    scale_down_unneeded              = "10m"
    scale_down_unready               = "20m"
    scale_down_utilization_threshold = 0.5
    empty_bulk_delete_max            = 10
    skip_nodes_with_local_storage    = false
    skip_nodes_with_system_pods      = true
  }

  maintenance_window {
    allowed {
      day   = "Sunday"
      hours = [1, 2, 3, 4, 5]
    }
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count,
      kubernetes_version
    ]
  }
}

# Application Node Pool
resource "azurerm_kubernetes_cluster_node_pool" "app" {
  name                  = "app"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.app_vm_size
  enable_auto_scaling   = true
  min_count             = var.app_min_count
  max_count             = var.app_max_count
  max_pods              = var.max_pods
  os_disk_size_gb       = var.os_disk_size_gb
  os_disk_type          = "Managed"
  vnet_subnet_id        = var.vnet_subnet_id
  mode                  = "User"
  os_type               = "Linux"

  node_labels = {
    "nodepool-type" = "application"
    "environment"   = var.environment
    "workload"      = "application"
  }

  node_taints = []

  upgrade_settings {
    max_surge = "33%"
  }

  zones = var.availability_zones

  tags = var.tags

  lifecycle {
    ignore_changes = [node_count]
  }
}

# Worker Node Pool (for background jobs)
resource "azurerm_kubernetes_cluster_node_pool" "worker" {
  name                  = "worker"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.worker_vm_size
  enable_auto_scaling   = true
  min_count             = var.worker_min_count
  max_count             = var.worker_max_count
  max_pods              = var.max_pods
  os_disk_size_gb       = var.os_disk_size_gb
  os_disk_type          = "Managed"
  vnet_subnet_id        = var.vnet_subnet_id
  mode                  = "User"
  os_type               = "Linux"

  node_labels = {
    "nodepool-type" = "worker"
    "environment"   = var.environment
    "workload"      = "background"
  }

  node_taints = ["workload=background:NoSchedule"]

  upgrade_settings {
    max_surge = "33%"
  }

  zones = var.availability_zones

  tags = var.tags

  lifecycle {
    ignore_changes = [node_count]
  }
}

# ACR Pull Permission
resource "azurerm_role_assignment" "acr_pull" {
  count                            = var.enable_acr_integration ? 1 : 0
  principal_id                     = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = var.acr_id
  skip_service_principal_aad_check = true
}

# Key Vault Secrets User for CSI Driver
resource "azurerm_role_assignment" "keyvault_secrets_user" {
  count                            = var.enable_keyvault_integration ? 1 : 0
  principal_id                     = azurerm_kubernetes_cluster.main.key_vault_secrets_provider[0].secret_identity[0].object_id
  role_definition_name             = "Key Vault Secrets User"
  scope                            = var.keyvault_id
  skip_service_principal_aad_check = true
}

# Network Contributor role for AKS on subnet
resource "azurerm_role_assignment" "network_contributor" {
  principal_id                     = azurerm_kubernetes_cluster.main.identity[0].principal_id
  role_definition_name             = "Network Contributor"
  scope                            = var.vnet_subnet_id
  skip_service_principal_aad_check = true
}
