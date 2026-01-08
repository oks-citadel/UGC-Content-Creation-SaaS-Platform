# Phase 1: Discovery & Inventory Report
## EKS to ECS Fargate Migration

**Date:** 2026-01-07
**Status:** COMPLETE
**Platform:** NEXUS UGC Content Creation SaaS

---

## Executive Summary

This report documents the complete infrastructure inventory of the NEXUS platform, identifying all resources that require migration from EKS to ECS Fargate.

### Key Findings

| Category | Count | Migration Impact |
|----------|-------|------------------|
| Terraform Files | 37 | REFACTOR (EKS → ECS) |
| Kubernetes Manifests | 70 | DELETE (Replace with ECS Task Defs) |
| Backend Services | 18 | CONTAINERIZED (ECS Ready) |
| Frontend Apps | 4 | CONTAINERIZED (ECS Ready) |
| Background Workers | 4 | CONTAINERIZED (ECS Ready) |
| AI Services | 7 | CONTAINERIZED (ECS Ready) |
| CI/CD Pipelines | 4 | REFACTOR (Remove kubectl/helm) |

**Total Containers to Migrate:** 33 services

---

## 1. Infrastructure-as-Code Inventory

### 1.1 Terraform Modules (AWS)

**Location:** `infrastructure/terraform-aws/`

| Module | Status | Action Required |
|--------|--------|-----------------|
| `modules/eks/` | EKS-based | **DELETE** - Replace with ECS |
| `modules/vpc/` | Keep | Update for ECS compatibility |
| `modules/ecr/` | Keep | Already compatible |
| `modules/rds/` | Keep | No changes |
| `modules/elasticache/` | Keep | No changes |
| `modules/s3/` | Keep | No changes |
| `modules/secrets-manager/` | Keep | No changes |
| `modules/cloudfront/` | Keep | Update origin to ALB |
| `modules/waf/` | Keep | No changes |
| `modules/route53/` | Keep | No changes |
| `modules/cloudwatch/` | Keep | Update for ECS metrics |
| `modules/codepipeline/` | Keep | Update for ECS deployment |

### 1.2 EKS Resources to Remove

From `infrastructure/terraform-aws/modules/eks/main.tf`:

```hcl
# RESOURCES TO DELETE
aws_eks_cluster.main
aws_eks_node_group.system
aws_eks_node_group.app
aws_eks_node_group.worker
aws_eks_addon.vpc_cni
aws_eks_addon.coredns
aws_eks_addon.kube_proxy
aws_eks_addon.ebs_csi_driver
aws_iam_openid_connect_provider.eks
aws_iam_role.cluster (EKS cluster role)
aws_iam_role.node_group (EC2 node role)
aws_iam_role.ebs_csi_driver
aws_iam_role.cluster_autoscaler
aws_iam_role.aws_load_balancer_controller
```

### 1.3 Terraform Providers to Remove

From `infrastructure/terraform-aws/environments/prod/main.tf`:

```hcl
# PROVIDERS TO DELETE
provider "kubernetes" { ... }
provider "helm" { ... }
```

---

## 2. Kubernetes Manifests Inventory

### 2.1 Manifest Locations

| Directory | Files | Purpose |
|-----------|-------|---------|
| `infrastructure/kubernetes/base/` | ~30 | Base Kustomize configs |
| `infrastructure/kubernetes/overlays/` | ~20 | Environment overlays |
| `infrastructure/k8s/` | ~10 | Additional K8s configs |
| `infrastructure/helm/` | ~10 | Helm charts |

### 2.2 Resources to Delete

All Kubernetes-specific resources will be replaced with ECS equivalents:

| K8s Resource | ECS Equivalent |
|--------------|----------------|
| Deployment | ECS Service + Task Definition |
| Service | ALB Target Group |
| Ingress | ALB Listener Rules |
| ConfigMap | SSM Parameter Store |
| Secret | AWS Secrets Manager |
| HPA | Application Auto Scaling |
| PVC | EFS (if needed) |
| ServiceAccount | ECS Task IAM Role |

### 2.3 Scripts to Delete

```
infrastructure/kubernetes/deploy.sh
infrastructure/kubernetes/setup-secrets.sh
infrastructure/kubernetes/verify.sh
```

---

## 3. Service Catalog

### 3.1 Backend Services (18)

| Service | Port | Health Endpoint | Prisma | Notes |
|---------|------|-----------------|--------|-------|
| api-gateway | 3000 | /health | No | Entry point, NGINX-based |
| auth-service | 3001 | /health | Yes | JWT auth |
| user-service | 3002 | /health | Yes | User management |
| creator-service | 3003 | /health | Yes | Creator profiles |
| campaign-service | 3004 | /health | Yes | Campaign management |
| content-service | 3005 | /health | Yes | Content management |
| commerce-service | 3006 | /health | Yes | E-commerce |
| analytics-service | 3007 | /health | Yes | Analytics |
| billing-service | 3008 | /health | Yes | Billing/payments |
| marketplace-service | 3009 | /health | Yes | Marketplace |
| notification-service | 3010 | /health | Yes | Notifications |
| workflow-service | 3011 | /health | Yes | Workflow engine |
| compliance-service | 3012 | /health | Yes | Compliance |
| integration-service | 3013 | /health | Yes | Third-party integrations |
| payout-service | 3014 | /health | Yes | Payout processing |
| rights-service | 3015 | /health | Yes | Rights management |
| asset-service | 3016 | /health | Yes | Asset management |
| ai-service | 3017 | /health | No | AI orchestration |

### 3.2 Frontend Apps (4)

| App | Port | Framework | Notes |
|-----|------|-----------|-------|
| web | 3000 | Next.js | Main web app |
| creator-portal | 3000 | Next.js | Creator dashboard |
| admin | 3000 | Next.js | Admin dashboard |
| brand-portal | 3000 | Next.js | Brand interface |

### 3.3 Background Workers (4)

| Worker | Port | Type | Spot Eligible |
|--------|------|------|---------------|
| video-processor | 4001 | Node.js | Yes |
| social-publisher | 4002 | Node.js | Yes |
| notification-dispatcher | 4003 | Node.js | Yes |
| analytics-aggregator | 4004 | Node.js | Yes |

### 3.4 AI Services (7)

| Service | Port | Framework | GPU Required |
|---------|------|-----------|--------------|
| ai-center | 5001 | Python/FastAPI | No |
| customer-agent | 5002 | Python/FastAPI | No |
| marketing-agent | 5003 | Python/FastAPI | No |
| moderation-engine | 5004 | Python/FastAPI | No |
| performance-predictor | 5005 | Python/FastAPI | No |
| recommendation-engine | 5006 | Python/FastAPI | No |
| video-generator | 5007 | Python/FastAPI | Yes (optional) |

---

## 4. CI/CD Pipeline Inventory

### 4.1 GitHub Actions Workflows

| Workflow | File | K8s Dependencies |
|----------|------|------------------|
| CI/CD Main | `.github/workflows/ci-cd.yml` | kubectl, helm |
| CI/CD AWS | `.github/workflows/ci-cd-aws.yml` | kubectl, eksctl |
| AWS Deploy | `.github/workflows/aws-deploy.yml` | kubectl, helm |
| Identity Audit | `.github/workflows/identity-audit.yml` | None |

### 4.2 AWS CodePipeline

| File | Purpose |
|------|---------|
| `buildspec.yml` | Main build spec |
| `buildspec-test.yml` | Test build spec |

### 4.3 Commands to Remove from Pipelines

```bash
# DELETE ALL OCCURRENCES
kubectl apply
kubectl rollout
helm upgrade
helm install
eksctl create
aws eks update-kubeconfig
kustomize build
```

---

## 5. AWS Resources (Preserve)

### 5.1 Keep Without Changes

- VPC with private/public subnets
- NAT Gateways
- RDS PostgreSQL (Multi-AZ)
- ElastiCache Redis
- S3 buckets (uploads, assets, thumbnails, documents)
- Secrets Manager secrets
- CloudFront distribution
- WAF Web ACL
- Route 53 DNS
- ECR repositories (33 total)
- CloudWatch log groups
- SNS topics

### 5.2 Modify

- Security groups (add ECS tasks access)
- CloudFront origin (EKS endpoint → ALB)
- CloudWatch dashboards (EKS metrics → ECS metrics)

---

## 6. New Resources Required

### 6.1 ECS Resources

```hcl
# NEW TERRAFORM MODULES NEEDED
modules/ecs-cluster/
  - aws_ecs_cluster (Fargate capacity provider)

modules/ecs-service/
  - aws_ecs_task_definition (per service)
  - aws_ecs_service (per service)
  - aws_appautoscaling_target
  - aws_appautoscaling_policy

modules/alb/
  - aws_lb (Application Load Balancer)
  - aws_lb_target_group (per service)
  - aws_lb_listener
  - aws_lb_listener_rule

modules/iam-ecs/
  - aws_iam_role (task execution role)
  - aws_iam_role (task role per service)
  - aws_iam_policy (least privilege)
```

---

## 7. Migration Risk Assessment

### High Impact
- Kubernetes provider removal from Terraform
- All Deployment manifests → ECS task definitions
- Service discovery mechanism change

### Medium Impact
- CI/CD pipeline refactoring
- Health check endpoint verification
- Secrets injection method change

### Low Impact
- Logging (already uses CloudWatch)
- Monitoring (metrics change, dashboards update)
- Networking (VPC remains same)

---

## 8. Estimated Cost Comparison

### Current EKS Architecture

| Resource | Type | Monthly Cost (Est.) |
|----------|------|---------------------|
| EKS Control Plane | 1 cluster | $73 |
| System Node Group | 2x t3.medium | ~$60 |
| App Node Group | 3x t3.xlarge (avg) | ~$360 |
| Worker Node Group | 1x t3.large (spot) | ~$20 |
| NAT Gateway | 3 AZs | ~$100 |
| **EKS Total** | | **~$613/mo** |

### Target ECS Fargate Architecture

| Resource | Type | Monthly Cost (Est.) |
|----------|------|---------------------|
| ECS Fargate | 33 services | Variable (pay per use) |
| Fargate Spot | Workers + Dev | ~40% savings |
| ALB | 1 shared | ~$20 |
| NAT Gateway | 3 AZs | ~$100 |
| **ECS Total** | | **~$200-400/mo** |

**Estimated Savings:** 35-65% reduction in compute costs

---

## 9. Next Steps

### Phase 2: Architecture Design
- [ ] Design ECS Fargate cluster topology
- [ ] Define ALB routing strategy
- [ ] Plan service-to-service communication
- [ ] Document scaling policies

### Phase 3: Terraform Foundation
- [ ] Create ECS cluster module
- [ ] Create ECS service module
- [ ] Create ALB module
- [ ] Update environment configs

---

## Appendix: File Inventory

### Terraform Files (37)
```
infrastructure/terraform-aws/environments/prod/main.tf
infrastructure/terraform-aws/environments/prod/variables.tf
infrastructure/terraform-aws/modules/cloudfront/main.tf
infrastructure/terraform-aws/modules/cloudfront/outputs.tf
infrastructure/terraform-aws/modules/cloudfront/variables.tf
infrastructure/terraform-aws/modules/cloudwatch/main.tf
infrastructure/terraform-aws/modules/cloudwatch/outputs.tf
infrastructure/terraform-aws/modules/cloudwatch/variables.tf
infrastructure/terraform-aws/modules/codepipeline/main.tf
infrastructure/terraform-aws/modules/codepipeline/outputs.tf
infrastructure/terraform-aws/modules/codepipeline/variables.tf
infrastructure/terraform-aws/modules/ecr/main.tf
infrastructure/terraform-aws/modules/ecr/variables.tf
infrastructure/terraform-aws/modules/eks/main.tf
infrastructure/terraform-aws/modules/eks/outputs.tf
infrastructure/terraform-aws/modules/eks/variables.tf
infrastructure/terraform-aws/modules/elasticache/main.tf
infrastructure/terraform-aws/modules/elasticache/outputs.tf
infrastructure/terraform-aws/modules/elasticache/variables.tf
infrastructure/terraform-aws/modules/rds/main.tf
infrastructure/terraform-aws/modules/rds/outputs.tf
infrastructure/terraform-aws/modules/rds/variables.tf
infrastructure/terraform-aws/modules/route53/main.tf
infrastructure/terraform-aws/modules/route53/outputs.tf
infrastructure/terraform-aws/modules/route53/variables.tf
infrastructure/terraform-aws/modules/s3/main.tf
infrastructure/terraform-aws/modules/s3/outputs.tf
infrastructure/terraform-aws/modules/s3/variables.tf
infrastructure/terraform-aws/modules/secrets-manager/main.tf
infrastructure/terraform-aws/modules/secrets-manager/outputs.tf
infrastructure/terraform-aws/modules/secrets-manager/variables.tf
infrastructure/terraform-aws/modules/vpc/main.tf
infrastructure/terraform-aws/modules/vpc/outputs.tf
infrastructure/terraform-aws/modules/vpc/variables.tf
infrastructure/terraform-aws/modules/waf/main.tf
infrastructure/terraform-aws/modules/waf/outputs.tf
infrastructure/terraform-aws/modules/waf/variables.tf
```

---

**Report Generated By:** Claude Multi-Agent Orchestration System
**Agent:** Platform Architect Agent (AGENT 01)
**Phase:** 1 of 8 - Discovery & Inventory
**Status:** COMPLETE
