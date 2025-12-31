# AZURE → AWS SERVICE MAPPING

**Platform:** NEXUS UGC Content Creation SaaS Platform
**Version:** 1.0
**Date:** 2025-12-30
**Phase:** 3 - Service Mapping

---

## COMPLETE SERVICE MAPPING TABLE

### 1. COMPUTE & CONTAINERS

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure Kubernetes Service (AKS)** | **Amazon EKS** | MEDIUM - Cluster recreation required | IAM roles replace Azure AD RBAC | SOC 2 compliant both | Maintain AKS until EKS stable |
| **Azure Container Registry (ACR)** | **Amazon ECR** | LOW - Image push/pull only | IAM policies for access | No impact | Keep ACR images as backup |
| **AKS Node Pools** | **EKS Managed Node Groups** | LOW - Similar concepts | Security groups replace NSGs | No impact | Scale AKS nodes to 0 |
| **Azure Container Instances** | **AWS Fargate** | LOW - If used for jobs | Task IAM roles | No impact | N/A |

### 2. DATABASE & CACHE

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure PostgreSQL Flexible** | **Amazon RDS PostgreSQL** or **Aurora PostgreSQL** | MEDIUM - Data migration required | IAM auth option, Security Groups | GDPR: Same encryption standards | Point-in-time restore to Azure |
| **Azure Cache for Redis** | **Amazon ElastiCache Redis** | LOW - Connection string change | Auth tokens, Security Groups | No impact | Maintain Azure Redis hot standby |
| **Azure Cosmos DB** (if used) | **Amazon DynamoDB** or **DocumentDB** | HIGH - API differences | IAM policies | No impact | Keep Cosmos DB sync |

### 3. STORAGE

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure Blob Storage** | **Amazon S3** | MEDIUM - SDK changes required | Bucket policies, IAM roles | Same encryption standards | S3 Cross-Region Replication back |
| **Azure Storage Containers** | **S3 Buckets/Prefixes** | LOW - Naming convention | Per-bucket policies | No impact | Bidirectional sync |
| **Azure CDN** | **Amazon CloudFront** | LOW - Configuration only | OAI/OAC for S3 access | No impact | Keep Azure CDN active |
| **Azure Storage Lifecycle** | **S3 Lifecycle Policies** | LOW - Direct equivalent | No change | No impact | Mirror policies |

### 4. NETWORKING

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure Virtual Network** | **Amazon VPC** | LOW - New network creation | Security Groups, NACLs | Private subnets required | Independent networks |
| **Azure Subnets** | **AWS Subnets** | LOW - Direct mapping | Subnet-level NACLs | No impact | N/A |
| **Azure NSG** | **AWS Security Groups** | LOW - Rule translation | Stateful rules (same) | No impact | Maintain both |
| **Azure Private Endpoints** | **AWS PrivateLink / VPC Endpoints** | MEDIUM - Different implementation | Private connectivity | Enhanced privacy | N/A |
| **Azure Private DNS Zones** | **Route 53 Private Hosted Zones** | LOW - Zone recreation | VPC association | No impact | N/A |
| **Azure Load Balancer** | **AWS NLB/ALB** | LOW - Auto-created by EKS | Security groups | No impact | N/A |
| **Azure Front Door** | **Amazon CloudFront + WAF** | MEDIUM - Configuration rebuild | WAF rules migration | Same OWASP coverage | Keep Front Door active |

### 5. SECURITY & IDENTITY

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure Key Vault** | **AWS Secrets Manager** | MEDIUM - Secret migration | IAM policies, KMS encryption | Same encryption standards | Keep Key Vault as backup |
| **Azure AD B2C** | **Amazon Cognito User Pools** | HIGH - User migration required | OAuth 2.0/OIDC (same standards) | GDPR: User consent needed | Maintain B2C until stable |
| **Azure AD App Registrations** | **Cognito App Clients** | MEDIUM - Reconfiguration | Client credentials | No impact | Keep both active |
| **Azure AD Security Groups** | **Cognito Groups + IAM** | MEDIUM - Group migration | RBAC via Cognito groups | No impact | Sync group memberships |
| **Azure Managed Identity** | **IAM Roles for Service Accounts (IRSA)** | MEDIUM - Pod identity change | Pod-level IAM | No impact | N/A |
| **Azure RBAC** | **AWS IAM + K8s RBAC** | MEDIUM - Policy translation | Least privilege maintained | Audit trail required | N/A |

### 6. MONITORING & OBSERVABILITY

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure Log Analytics** | **Amazon CloudWatch Logs** | MEDIUM - Agent change | Log encryption | Retention policies | Dual logging initially |
| **Azure Application Insights** | **AWS X-Ray + CloudWatch** | MEDIUM - SDK change | Trace data encryption | No impact | Run both temporarily |
| **Azure Monitor Alerts** | **CloudWatch Alarms + SNS** | LOW - Rule recreation | SNS encryption | No impact | Maintain both |
| **Azure Monitor Action Groups** | **SNS Topics + Lambda** | LOW - Webhook migration | IAM for Lambda | No impact | N/A |
| **Azure Workbooks** | **CloudWatch Dashboards** | LOW - Dashboard rebuild | Read-only access | No impact | N/A |

### 7. MESSAGING & EVENTS

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure Service Bus** | **Amazon SQS + SNS** | MEDIUM - API differences | IAM policies, encryption | Message encryption | Run parallel queues |
| **Azure Event Grid** | **Amazon EventBridge** | MEDIUM - Event schema | IAM policies | No impact | N/A |
| **Azure Notification Hub** | **Amazon SNS Mobile Push** | LOW - SDK change | Platform credentials | No impact | N/A |

### 8. AI & COGNITIVE SERVICES

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure OpenAI** | **Amazon Bedrock** or **OpenAI Direct** | MEDIUM - API endpoint change | API key management | Data processing location | Keep Azure OpenAI as fallback |
| **Azure Form Recognizer** | **Amazon Textract** | MEDIUM - API differences | IAM policies | Document handling | N/A |
| **Azure Cognitive Services** | **Amazon Comprehend/Rekognition** | MEDIUM - API differences | IAM policies | No impact | N/A |

### 9. EMAIL & COMMUNICATION

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure Communication Services** | **Amazon SES + SNS** | LOW - API change | DKIM/SPF configuration | CAN-SPAM compliance | Keep both active |
| **SendGrid** (current) | **Amazon SES** (optional) | LOW - Can keep SendGrid | No change if kept | No impact | N/A |

### 10. DNS & DOMAIN

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure DNS** | **Amazon Route 53** | LOW - Zone transfer | DNSSEC support | No impact | Low TTL for quick rollback |
| **Azure Traffic Manager** | **Route 53 Traffic Policies** | LOW - Routing rules | Health checks | No impact | Weighted routing for cutover |

### 11. COST MANAGEMENT

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure Cost Management** | **AWS Cost Explorer** | LOW - Dashboard setup | IAM read-only | No impact | N/A |
| **Azure Budgets** | **AWS Budgets** | LOW - Budget recreation | SNS for alerts | No impact | N/A |

### 12. CI/CD & DEVOPS

| Azure Service | AWS Equivalent | Migration Impact | Security Impact | Compliance Impact | Rollback Strategy |
|---------------|----------------|------------------|-----------------|-------------------|-------------------|
| **Azure CLI in Pipelines** | **AWS CLI in Pipelines** | LOW - Command translation | OIDC for GitHub Actions | No impact | Keep both configured |
| **ACR Build** | **CodeBuild + ECR** | MEDIUM - Build process change | IAM roles | No impact | Can use both |

---

## MIGRATION PRIORITY MATRIX

### Phase 1: Foundation (Week 1-2)
| Priority | Service | Azure → AWS | Risk Level |
|----------|---------|-------------|------------|
| 1 | VPC/Networking | VNet → VPC | LOW |
| 2 | ECR | ACR → ECR | LOW |
| 3 | Secrets Manager | Key Vault → Secrets Manager | MEDIUM |
| 4 | RDS PostgreSQL | Azure PostgreSQL → RDS | MEDIUM |
| 5 | ElastiCache | Azure Redis → ElastiCache | LOW |

### Phase 2: Core Services (Week 3-4)
| Priority | Service | Azure → AWS | Risk Level |
|----------|---------|-------------|------------|
| 6 | EKS Cluster | AKS → EKS | MEDIUM |
| 7 | S3 Storage | Blob Storage → S3 | MEDIUM |
| 8 | CloudWatch | Log Analytics → CloudWatch | LOW |
| 9 | CloudFront + WAF | Front Door → CloudFront | MEDIUM |

### Phase 3: Identity & Security (Week 5-6)
| Priority | Service | Azure → AWS | Risk Level |
|----------|---------|-------------|------------|
| 10 | Cognito | Azure AD B2C → Cognito | HIGH |
| 11 | IAM Roles | Azure RBAC → IAM | MEDIUM |
| 12 | IRSA | Managed Identity → IRSA | MEDIUM |

### Phase 4: Optimization (Week 7+)
| Priority | Service | Azure → AWS | Risk Level |
|----------|---------|-------------|------------|
| 13 | Route 53 | Azure DNS → Route 53 | LOW |
| 14 | Budgets | Azure Budgets → AWS Budgets | LOW |
| 15 | X-Ray | App Insights → X-Ray | LOW |

---

## TERRAFORM MODULE MAPPING

| Azure Module | AWS Module | Notes |
|--------------|------------|-------|
| `modules/networking` | `modules/vpc` | New module structure |
| `modules/aks` | `modules/eks` | Complete rewrite |
| `modules/acr` | `modules/ecr` | Simpler in AWS |
| `modules/postgresql` | `modules/rds` | Similar structure |
| `modules/keyvault` | `modules/secrets-manager` | Different API |
| `modules/monitoring` | `modules/cloudwatch` | Different structure |
| `modules/frontdoor` | `modules/cloudfront` | WAF separate module |
| `modules/identity` | `modules/cognito` | Major differences |
| `modules/dns` | `modules/route53` | Similar structure |

---

## SDK/LIBRARY REPLACEMENT GUIDE

### Node.js/TypeScript
| Azure Package | AWS Package | Changes Required |
|---------------|-------------|------------------|
| `@azure/storage-blob` | `@aws-sdk/client-s3` | API rewrite |
| `@azure/identity` | `@aws-sdk/credential-providers` | Credential chain |
| `@azure/keyvault-secrets` | `@aws-sdk/client-secrets-manager` | API rewrite |
| `@azure/service-bus` | `@aws-sdk/client-sqs` | API rewrite |

### Python
| Azure Package | AWS Package | Changes Required |
|---------------|-------------|------------------|
| `azure-storage-blob` | `boto3` (s3) | API rewrite |
| `azure-identity` | `boto3` (sts) | Credential chain |
| `azure-ai-formrecognizer` | `boto3` (textract) | API differences |

---

## ENVIRONMENT VARIABLE MAPPING

| Azure Variable | AWS Variable | Notes |
|----------------|--------------|-------|
| `AZURE_SUBSCRIPTION_ID` | `AWS_ACCOUNT_ID` | Different concept |
| `AZURE_TENANT_ID` | N/A | Not applicable |
| `AZURE_CLIENT_ID` | `AWS_ACCESS_KEY_ID` or IAM Role | Prefer IRSA |
| `AZURE_CLIENT_SECRET` | `AWS_SECRET_ACCESS_KEY` or IAM Role | Prefer IRSA |
| `AZURE_STORAGE_CONNECTION_STRING` | `AWS_S3_BUCKET` + `AWS_REGION` | Simpler in AWS |
| `AZURE_KEY_VAULT_URL` | `AWS_SECRETS_MANAGER_PREFIX` | Different pattern |
| `AZURE_AD_B2C_TENANT_NAME` | `COGNITO_USER_POOL_ID` | Different structure |
| `AZURE_AD_B2C_CLIENT_ID` | `COGNITO_CLIENT_ID` | Direct mapping |

---

## RISK ASSESSMENT SUMMARY

### HIGH RISK (Requires Careful Planning)
1. **Azure AD B2C → Cognito**: User migration, authentication flow changes
2. **Blob Storage → S3**: Large data volume, SDK changes in code

### MEDIUM RISK (Manageable with Testing)
3. **AKS → EKS**: Cluster differences, IRSA setup
4. **PostgreSQL Migration**: Data sync, connection string changes
5. **Key Vault → Secrets Manager**: Secret rotation, access patterns
6. **Front Door → CloudFront**: WAF rule translation

### LOW RISK (Straightforward)
7. **ACR → ECR**: Simple image push
8. **Redis Cache → ElastiCache**: Connection string only
9. **Log Analytics → CloudWatch**: Agent swap
10. **Azure DNS → Route 53**: Standard DNS transfer

---

## COMPLIANCE MAPPING

| Compliance Requirement | Azure Implementation | AWS Implementation | Gap Analysis |
|------------------------|---------------------|-------------------|--------------|
| **Data Encryption at Rest** | Azure Storage Service Encryption | S3 SSE-S3/SSE-KMS | No gap |
| **Data Encryption in Transit** | TLS 1.2+ enforced | TLS 1.2+ enforced | No gap |
| **Network Isolation** | VNet + Private Endpoints | VPC + PrivateLink | No gap |
| **Identity Management** | Azure AD B2C | Cognito User Pools | Migration required |
| **Access Control** | Azure RBAC | IAM Policies | Policy translation |
| **Audit Logging** | Log Analytics | CloudTrail + CloudWatch | No gap |
| **Secrets Management** | Key Vault | Secrets Manager | No gap |
| **DDoS Protection** | Front Door DDoS | Shield + CloudFront | No gap |
| **WAF** | Front Door WAF (OWASP) | AWS WAF (OWASP) | Rule migration |
| **Backup & Recovery** | Geo-redundant backup | Cross-region replication | Configuration |
| **SOC 2** | Azure SOC 2 | AWS SOC 2 | Both compliant |
| **GDPR** | Azure EU regions | AWS EU regions | Region selection |

---

## ESTIMATED MIGRATION TIMELINE

| Phase | Duration | Activities |
|-------|----------|------------|
| **Phase 1: Foundation** | 2 weeks | VPC, ECR, Secrets Manager, RDS, ElastiCache |
| **Phase 2: Core Services** | 2 weeks | EKS, S3, CloudWatch, CloudFront |
| **Phase 3: Identity** | 2 weeks | Cognito setup, user migration planning |
| **Phase 4: Testing** | 2 weeks | Full regression, security testing |
| **Phase 5: Cutover** | 1 week | DNS migration, traffic shift |
| **Phase 6: Decommission** | 2 weeks | Azure resource cleanup |
| **Total** | **11 weeks** | End-to-end migration |

---

## NEXT STEPS

1. **Phase 4**: Generate AWS Terraform modules based on this mapping
2. **Phase 5**: Deploy to workload-dev for validation
3. **Phase 6**: Promote to staging with full testing
4. **Phase 7**: Execute zero-downtime DNS cutover

---

*Document generated by Autonomous Cloud Transformation System*
*Mapping version: 1.0*
