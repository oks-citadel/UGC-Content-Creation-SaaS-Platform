# EKS Decommission Guide
## NEXUS Platform - Post ECS Migration Cleanup

**Version:** 1.0
**Date:** 2026-01-08
**Status:** READY FOR EXECUTION (after ECS validation)

---

## Prerequisites

Before proceeding with EKS decommissioning, ensure:

- [ ] All services are running successfully on ECS Fargate
- [ ] Health checks pass for all ECS services
- [ ] Traffic has been fully migrated from EKS to ECS
- [ ] CloudFront origin has been updated to point to ALB (not EKS)
- [ ] Monitoring confirms no traffic to EKS endpoints
- [ ] DNS has been updated to point to ECS ALB
- [ ] At least 48 hours of stable ECS operation

---

## Phase 1: Traffic Validation

### 1.1 Verify ECS Health

```bash
# Check all ECS services are stable
aws ecs describe-services \
  --cluster nexus-prod \
  --services api-gateway auth-service user-service web \
  --query 'services[*].{Name:serviceName,Running:runningCount,Desired:desiredCount,Status:status}' \
  --output table

# Verify ALB health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --output table
```

### 1.2 Verify No EKS Traffic

```bash
# Check EKS load balancer metrics (should be zero)
aws cloudwatch get-metric-statistics \
  --namespace AWS/ELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancerName,Value=<eks-lb-name> \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Sum

# Expected: All values should be 0 or very low
```

---

## Phase 2: Remove Kubernetes Providers from Terraform

### 2.1 Update Production main.tf

Remove the following from `infrastructure/terraform-aws/environments/prod/main.tf`:

```hcl
# DELETE THESE PROVIDERS
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}
```

### 2.2 Update required_providers

```hcl
# REMOVE THESE from required_providers block
kubernetes = {
  source  = "hashicorp/kubernetes"
  version = "~> 2.24"
}
helm = {
  source  = "hashicorp/helm"
  version = "~> 2.12"
}
```

---

## Phase 3: Remove EKS Module

### 3.1 Comment Out EKS Module

First, comment out the EKS module to plan the destruction:

```hcl
# COMMENTED OUT FOR DECOMMISSION
# module "eks" {
#   source = "../../modules/eks"
#   ...
# }
```

### 3.2 Remove EKS References

Remove all references to EKS outputs:

```hcl
# DELETE THESE OUTPUTS
output "eks_cluster_name" { ... }
output "eks_cluster_endpoint" { ... }

# UPDATE CLOUDFRONT MODULE
# Change:
#   api_origin_domain  = module.eks.cluster_endpoint
# To:
#   api_origin_domain  = module.alb.alb_dns_name

# UPDATE CLOUDWATCH MODULE
# Remove:
#   eks_cluster_name = module.eks.cluster_name
```

---

## Phase 4: Delete EKS Resources

### 4.1 Terraform Destroy (EKS Only)

```bash
cd infrastructure/terraform-aws/environments/prod

# Plan the destruction
terraform plan -destroy -target=module.eks

# Review the plan carefully!
# Expected resources to be destroyed:
# - aws_eks_cluster.main
# - aws_eks_node_group.system
# - aws_eks_node_group.app
# - aws_eks_node_group.worker
# - aws_eks_addon.vpc_cni
# - aws_eks_addon.coredns
# - aws_eks_addon.kube_proxy
# - aws_eks_addon.ebs_csi_driver
# - aws_iam_role.cluster
# - aws_iam_role.node_group
# - aws_iam_role.ebs_csi_driver
# - aws_iam_role.cluster_autoscaler
# - aws_iam_role.aws_load_balancer_controller
# - aws_iam_openid_connect_provider.eks

# Execute destruction (REQUIRES APPROVAL)
terraform destroy -target=module.eks
```

### 4.2 Manual Cleanup (if needed)

If Terraform has issues, manually clean up:

```bash
# Delete EKS cluster
aws eks delete-cluster --name nexus-prod-eks --region us-east-1

# Delete node groups first
aws eks delete-nodegroup \
  --cluster-name nexus-prod-eks \
  --nodegroup-name system \
  --region us-east-1

aws eks delete-nodegroup \
  --cluster-name nexus-prod-eks \
  --nodegroup-name app \
  --region us-east-1

aws eks delete-nodegroup \
  --cluster-name nexus-prod-eks \
  --nodegroup-name worker \
  --region us-east-1

# Wait for node groups to delete
aws eks wait nodegroup-deleted \
  --cluster-name nexus-prod-eks \
  --nodegroup-name system

# Then delete cluster
aws eks delete-cluster --name nexus-prod-eks
aws eks wait cluster-deleted --name nexus-prod-eks
```

---

## Phase 5: Delete Kubernetes Manifests

### 5.1 Remove K8s Directories

```bash
# Remove Kubernetes-specific directories
rm -rf infrastructure/kubernetes/
rm -rf infrastructure/k8s/
rm -rf infrastructure/helm/
```

### 5.2 Files to Delete

```
infrastructure/kubernetes/base/
infrastructure/kubernetes/overlays/
infrastructure/kubernetes/deploy.sh
infrastructure/kubernetes/setup-secrets.sh
infrastructure/kubernetes/verify.sh
infrastructure/k8s/
infrastructure/helm/
```

---

## Phase 6: Update VPC Security Groups

### 6.1 Remove EKS Security Group Rules

Update `infrastructure/terraform-aws/modules/vpc/main.tf`:

```hcl
# DELETE: EKS Cluster Security Group
resource "aws_security_group" "eks_cluster" { ... }

# DELETE: EKS Nodes Security Group
resource "aws_security_group" "eks_nodes" { ... }

# UPDATE: Database Security Group - Remove EKS rules
resource "aws_security_group" "database" {
  # DELETE these ingress rules:
  # ingress {
  #   from_port       = 5432
  #   to_port         = 5432
  #   protocol        = "tcp"
  #   security_groups = [aws_security_group.eks_nodes.id]
  #   description     = "PostgreSQL from EKS nodes"
  # }
  #
  # ingress {
  #   from_port       = 6379
  #   to_port         = 6379
  #   protocol        = "tcp"
  #   security_groups = [aws_security_group.eks_nodes.id]
  #   description     = "Redis from EKS nodes"
  # }
}
```

### 6.2 Update VPC Outputs

Remove EKS-related outputs:

```hcl
# DELETE THESE OUTPUTS from modules/vpc/outputs.tf
output "eks_cluster_security_group_id" { ... }
output "eks_nodes_security_group_id" { ... }
```

---

## Phase 7: Clean Up CI/CD

### 7.1 Remove Old Workflows

```bash
# Archive (don't delete yet)
mv .github/workflows/ci-cd-aws.yml .github/workflows/ci-cd-aws.yml.archived
mv .github/workflows/aws-deploy.yml .github/workflows/aws-deploy.yml.archived

# Rename ECS workflow as primary
mv .github/workflows/ci-cd-ecs.yml .github/workflows/ci-cd.yml
```

### 7.2 Remove buildspec.yml (EKS)

```bash
# Archive old buildspec
mv buildspec.yml buildspec-eks.yml.archived

# Rename ECS buildspec as primary
mv buildspec-ecs.yml buildspec.yml
```

---

## Phase 8: Update Documentation

### 8.1 Update README

Remove all EKS references from:
- README.md
- docs/deployment.md
- docs/architecture.md

### 8.2 Update Environment Variables

Remove from .env.example and deployment docs:
- EKS_CLUSTER_NAME
- KUBECONFIG references
- kubectl commands

---

## Phase 9: Final Verification

### 9.1 Terraform State Cleanup

```bash
# Verify no EKS resources in state
terraform state list | grep -i eks
# Should return nothing

# Verify ECS resources exist
terraform state list | grep -i ecs
# Should list all ECS resources
```

### 9.2 AWS Console Verification

Verify in AWS Console:
- [ ] No EKS clusters exist
- [ ] No EC2 instances (EKS nodes) exist
- [ ] ECS cluster is healthy
- [ ] All ECS services running
- [ ] ALB targets healthy
- [ ] CloudWatch logs flowing

### 9.3 Cost Verification

```bash
# Check AWS Cost Explorer for EKS costs
# Should show $0 for:
# - Amazon EKS
# - EC2 (node instances)
# - EKS-related NAT Gateway traffic
```

---

## Rollback Plan

If issues occur, the EKS infrastructure can be recreated:

1. Uncomment the EKS module in Terraform
2. Run `terraform apply`
3. Restore Kubernetes manifests from git history
4. Update DNS to point back to EKS

**Note:** Keep archived files for 30 days before permanent deletion.

---

## Estimated Cost Savings

| Resource | Before (EKS) | After (ECS) | Savings |
|----------|--------------|-------------|---------|
| EKS Control Plane | $73/mo | $0 | $73/mo |
| EC2 Nodes (avg) | ~$440/mo | $0 | $440/mo |
| Total Compute | ~$513/mo | ~$200-300/mo | ~$250/mo |

**Estimated Annual Savings: $3,000+**

---

## Checklist

- [ ] Phase 1: Traffic validation complete
- [ ] Phase 2: Kubernetes providers removed
- [ ] Phase 3: EKS module removed
- [ ] Phase 4: EKS resources destroyed
- [ ] Phase 5: K8s manifests deleted
- [ ] Phase 6: Security groups updated
- [ ] Phase 7: CI/CD cleaned up
- [ ] Phase 8: Documentation updated
- [ ] Phase 9: Final verification complete

---

**Document Status:** READY
**Next Action:** Execute after 48 hours of stable ECS operation
