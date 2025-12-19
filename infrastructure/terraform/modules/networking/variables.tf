# =============================================================================
# Networking Module - Variables
# =============================================================================

variable "project" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "vnet_address_space" {
  description = "VNet address space"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "aks_subnet_prefix" {
  description = "AKS subnet address prefix"
  type        = string
  default     = "10.0.0.0/20"
}

variable "data_subnet_prefix" {
  description = "Data subnet address prefix"
  type        = string
  default     = "10.0.16.0/24"
}

variable "appgw_subnet_prefix" {
  description = "Application Gateway subnet address prefix"
  type        = string
  default     = "10.0.17.0/24"
}

variable "apim_subnet_prefix" {
  description = "API Management subnet address prefix"
  type        = string
  default     = "10.0.18.0/24"
}

variable "private_endpoints_subnet_prefix" {
  description = "Private endpoints subnet address prefix"
  type        = string
  default     = "10.0.19.0/24"
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
