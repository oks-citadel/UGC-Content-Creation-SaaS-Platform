# =============================================================================
# Azure Resource Groups Module
# =============================================================================

resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project}-${var.environment}-${var.location}-main"
  location = var.location
  tags     = var.tags
}

resource "azurerm_resource_group" "aks" {
  name     = "rg-${var.project}-${var.environment}-${var.location}-aks"
  location = var.location
  tags     = var.tags
}

resource "azurerm_resource_group" "data" {
  name     = "rg-${var.project}-${var.environment}-${var.location}-data"
  location = var.location
  tags     = var.tags
}

resource "azurerm_resource_group" "network" {
  name     = "rg-${var.project}-${var.environment}-${var.location}-network"
  location = var.location
  tags     = var.tags
}

resource "azurerm_resource_group" "monitoring" {
  name     = "rg-${var.project}-${var.environment}-${var.location}-monitoring"
  location = var.location
  tags     = var.tags
}

resource "azurerm_resource_group" "ai" {
  name     = "rg-${var.project}-${var.environment}-${var.location}-ai"
  location = var.location
  tags     = var.tags
}
