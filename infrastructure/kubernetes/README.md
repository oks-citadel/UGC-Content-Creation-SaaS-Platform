# NEXUS Platform - Kubernetes Manifests

Production-ready Kubernetes manifests for the NEXUS UGC Content Creation SaaS Platform using Kustomize.

## Directory Structure

```
kubernetes/
├── base/                           # Base Kubernetes resources
│   ├── namespace.yaml             # Nexus namespace
│   ├── configmap.yaml             # Shared configuration
│   ├── secrets.yaml               # Secret template
│   ├── kustomization.yaml         # Base kustomization
│   ├── deployments/               # Service deployments
│   │   ├── api-gateway.yaml
│   │   ├── auth-service.yaml
│   │   ├── user-service.yaml
│   │   ├── creator-service.yaml
│   │   ├── campaign-service.yaml
│   │   ├── content-service.yaml
│   │   ├── commerce-service.yaml
│   │   ├── analytics-service.yaml
│   │   ├── billing-service.yaml
│   │   ├── marketplace-service.yaml
│   │   ├── notification-service.yaml
│   │   ├── workflow-service.yaml
│   │   └── ai-service.yaml
│   ├── workers/                   # Background workers
│   │   ├── video-processor.yaml
│   │   ├── social-publisher.yaml
│   │   ├── analytics-aggregator.yaml
│   │   └── notification-dispatcher.yaml
│   ├── ingress/                   # Ingress and networking
│   │   ├── ingress.yaml
│   │   └── certificate.yaml
│   └── monitoring/                # Observability
│       ├── prometheus-servicemonitor.yaml
│       └── grafana-dashboards.yaml
├── overlays/                      # Environment-specific configs
│   ├── development/
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   └── patches/
│   │       ├── configmap-patch.yaml
│   │       ├── replica-patch.yaml
│   │       ├── resource-patch.yaml
│   │       └── ingress-patch.yaml
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   └── patches/
│   │       ├── configmap-patch.yaml
│   │       ├── replica-patch.yaml
│   │       └── ingress-patch.yaml
│   └── production/
│       ├── kustomization.yaml
│       └── patches/
│           ├── configmap-patch.yaml
│           ├── replica-patch.yaml
│           ├── resource-patch.yaml
│           ├── hpa-patch.yaml
│           └── ingress-patch.yaml
└── README.md
```

## Prerequisites

1. **Kubernetes Cluster** (v1.25+)
   - AKS, EKS, GKE, or on-premises
   - Minimum 3 nodes for production

2. **Required Tools**
   - kubectl (v1.25+)
   - kustomize (v4.5+)
   - helm (v3.0+) - for dependencies

3. **Required Kubernetes Add-ons**
   - nginx-ingress-controller
   - cert-manager
   - metrics-server
   - prometheus-operator (optional, for monitoring)

## Installation

### 1. Install Dependencies

#### Install NGINX Ingress Controller
```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.metrics.enabled=true \
  --set controller.podAnnotations."prometheus\.io/scrape"=true \
  --set controller.podAnnotations."prometheus\.io/port"=10254
```

#### Install cert-manager
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

#### Install Metrics Server (if not present)
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### 2. Configure Secrets

Before deploying, update the secrets file with actual values:

```bash
# Edit the secrets file
nano base/secrets.yaml

# Or use kubectl to create secrets from environment variables
kubectl create secret generic nexus-secrets \
  --namespace=nexus \
  --from-literal=DATABASE_URL=$DATABASE_URL \
  --from-literal=REDIS_URL=$REDIS_URL \
  --from-literal=JWT_SECRET=$JWT_SECRET \
  --from-literal=STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
  --dry-run=client -o yaml > base/secrets.yaml
```

### 3. Deploy to Environments

#### Development
```bash
# Build and preview
kustomize build overlays/development

# Apply to cluster
kubectl apply -k overlays/development

# Verify deployment
kubectl get all -n nexus-dev
```

#### Staging
```bash
# Build and preview
kustomize build overlays/staging

# Apply to cluster
kubectl apply -k overlays/staging

# Verify deployment
kubectl get all -n nexus-staging
```

#### Production
```bash
# Build and preview
kustomize build overlays/production

# Apply to cluster
kubectl apply -k overlays/production

# Verify deployment
kubectl get all -n nexus
kubectl get ingress -n nexus
kubectl get certificate -n nexus
```

## Service Architecture

### Microservices (Node.js/TypeScript)

| Service | Port | Replicas (Prod) | Resources |
|---------|------|-----------------|-----------|
| api-gateway | 3000 | 5 | 1-2 CPU, 1-2Gi RAM |
| auth-service | 3001 | 3 | 200m-500m CPU, 256-512Mi RAM |
| user-service | 3002 | 3 | 200m-500m CPU, 256-512Mi RAM |
| creator-service | 3003 | 3 | 200m-500m CPU, 256-512Mi RAM |
| campaign-service | 3004 | 3 | 200m-500m CPU, 256-512Mi RAM |
| content-service | 3005 | 5 | 500m-1.5 CPU, 1-2Gi RAM |
| commerce-service | 3006 | 3 | 200m-500m CPU, 256-512Mi RAM |
| analytics-service | 3007 | 3 | 500m-1.5 CPU, 1-2Gi RAM |
| billing-service | 3008 | 3 | 200m-500m CPU, 256-512Mi RAM |
| marketplace-service | 3009 | 3 | 200m-500m CPU, 256-512Mi RAM |
| notification-service | 3010 | 3 | 200m-500m CPU, 256-512Mi RAM |
| workflow-service | 3011 | 3 | 200m-500m CPU, 256-512Mi RAM |

### AI Services (Python)

| Service | Port | Replicas (Prod) | Resources |
|---------|------|-----------------|-----------|
| ai-service | 8000 | 3 | 2-4 CPU, 4-8Gi RAM |

### Workers

| Worker | Concurrency | Replicas (Prod) | Resources |
|--------|-------------|-----------------|-----------|
| video-processor | 2 | 5 | 2-4 CPU, 4-8Gi RAM |
| social-publisher | 5 | 3 | 200m-500m CPU, 256-512Mi RAM |
| analytics-aggregator | 3 | 3 | 300m-1 CPU, 512Mi-1Gi RAM |
| notification-dispatcher | 10 | 3 | 200m-500m CPU, 256-512Mi RAM |

## Configuration

### Environment Variables

Configuration is managed through ConfigMaps and Secrets:

- **ConfigMap** (`nexus-config`): Non-sensitive configuration
- **Secret** (`nexus-secrets`): Sensitive data (API keys, passwords, etc.)

### Resource Limits

Each deployment includes:
- **Resource Requests**: Guaranteed resources
- **Resource Limits**: Maximum resources allowed
- **Liveness Probes**: Health checks for pod restart
- **Readiness Probes**: Traffic routing checks

### Horizontal Pod Autoscaling

All services include HPA configurations:
- Scales based on CPU and memory utilization
- Environment-specific min/max replicas
- Stabilization windows to prevent flapping

## Networking

### Ingress Configuration

The platform uses NGINX Ingress Controller with:
- Automatic TLS via cert-manager and Let's Encrypt
- Rate limiting
- CORS configuration
- Security headers
- Path-based routing

**Production Domains:**
- `api.nexus.io` - API Gateway
- `nexus.io` - Web Application
- `creators.nexus.io` - Creator Portal
- `brands.nexus.io` - Brand Portal
- `admin.nexus.io` - Admin Portal

### Network Policies

Network policies are configured to:
- Allow ingress only from NGINX Ingress Controller
- Allow inter-service communication within namespace
- Restrict egress to required services only

## Monitoring & Observability

### Prometheus Integration

ServiceMonitors are configured for:
- All microservices (metrics on port 9090)
- All workers
- Custom business metrics

### Grafana Dashboards

Pre-configured dashboards:
- **NEXUS Overview**: Platform-wide metrics
- **Service Details**: Per-service metrics
- **Worker Performance**: Queue depth, job processing

### Alerts

Prometheus alerts configured for:
- High CPU/Memory usage
- Pod restart frequency
- Service downtime
- High error rates
- Database connection pool exhaustion
- Queue depth thresholds
- Slow response times

## Security

### Pod Security

All pods include:
- Non-root user execution (`runAsUser: 1000`)
- Read-only root filesystem
- Dropped capabilities
- Security context constraints

### Secrets Management

**Best Practices:**
1. Use external secrets operators in production (e.g., Azure Key Vault, AWS Secrets Manager)
2. Rotate secrets regularly
3. Never commit actual secrets to Git
4. Use RBAC to restrict secret access

### TLS/SSL

- Automatic certificate provisioning via cert-manager
- Let's Encrypt production issuer for production
- Let's Encrypt staging issuer for dev/staging

## Scaling

### Manual Scaling

```bash
# Scale a specific deployment
kubectl scale deployment api-gateway --replicas=10 -n nexus

# Scale using kustomize
kubectl apply -k overlays/production
```

### Auto-scaling

HPA automatically scales based on:
- CPU utilization (65-75% target)
- Memory utilization (75-80% target)

### Cluster Scaling

For production workloads, ensure cluster autoscaler is configured:
- Minimum nodes: 3
- Maximum nodes: 20
- Node instance type: Standard_D4s_v3 (or equivalent)

## Maintenance

### Rolling Updates

All deployments use RollingUpdate strategy:
- Zero-downtime deployments
- Gradual rollout (maxSurge: 1, maxUnavailable: 0)

```bash
# Update image version
kubectl set image deployment/api-gateway api-gateway=nexusregistry.azurecr.io/api-gateway:v1.1.0 -n nexus

# Watch rollout status
kubectl rollout status deployment/api-gateway -n nexus

# Rollback if needed
kubectl rollout undo deployment/api-gateway -n nexus
```

### Backup & Disaster Recovery

1. **Database Backups**: Configure automated backups for PostgreSQL
2. **Persistent Volumes**: Use storage classes with backup capabilities
3. **Configuration Backup**: Version control all manifests in Git

### Health Checks

```bash
# Check all pods
kubectl get pods -n nexus

# Check specific service
kubectl describe deployment api-gateway -n nexus

# View logs
kubectl logs -f deployment/api-gateway -n nexus

# Check events
kubectl get events -n nexus --sort-by='.lastTimestamp'
```

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n nexus
   kubectl logs <pod-name> -n nexus
   ```

2. **ImagePullBackOff**
   - Verify image name and tag
   - Check registry credentials
   ```bash
   kubectl get events -n nexus | grep <pod-name>
   ```

3. **CrashLoopBackOff**
   - Check application logs
   - Verify environment variables
   - Check resource limits

4. **Service not accessible**
   - Verify ingress configuration
   - Check service selectors
   - Verify network policies

### Debug Commands

```bash
# Port forward to local machine
kubectl port-forward service/api-gateway 8080:80 -n nexus

# Execute commands in pod
kubectl exec -it <pod-name> -n nexus -- /bin/sh

# View resource usage
kubectl top pods -n nexus
kubectl top nodes

# Check HPA status
kubectl get hpa -n nexus
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Setup kustomize
        run: |
          curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash

      - name: Deploy to Production
        run: |
          kubectl apply -k infrastructure/kubernetes/overlays/production
```

## Cost Optimization

1. **Right-size resources**: Monitor actual usage and adjust requests/limits
2. **Use node affinity**: Co-locate related services
3. **Implement pod disruption budgets**: Prevent over-provisioning
4. **Use cluster autoscaler**: Scale nodes based on demand
5. **Consider spot/preemptible instances**: For non-critical workers

## Support & Documentation

- **Kubernetes Docs**: https://kubernetes.io/docs/
- **Kustomize Docs**: https://kustomize.io/
- **NGINX Ingress**: https://kubernetes.github.io/ingress-nginx/
- **cert-manager**: https://cert-manager.io/docs/

## License

Copyright © 2024 NEXUS Platform. All rights reserved.
