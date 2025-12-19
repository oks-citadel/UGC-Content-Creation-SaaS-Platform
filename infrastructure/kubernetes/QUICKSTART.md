# NEXUS Platform - Kubernetes Quick Start Guide

This guide will help you deploy the NEXUS platform to Kubernetes in under 15 minutes.

## Prerequisites Checklist

- [ ] Kubernetes cluster (v1.25+) with kubectl access
- [ ] kubectl installed and configured
- [ ] kustomize installed (v4.5+)
- [ ] Cluster has NGINX Ingress Controller
- [ ] Cluster has cert-manager installed
- [ ] Domain names configured and pointing to your cluster

## Step 1: Install Required Components

### Install NGINX Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.metrics.enabled=true
```

### Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

Wait for cert-manager to be ready:

```bash
kubectl wait --for=condition=Available --timeout=300s \
  deployment/cert-manager-webhook -n cert-manager
```

## Step 2: Configure Secrets

Choose one of the following methods:

### Option A: Using the setup script (Recommended)

```bash
cd infrastructure/kubernetes

# Create secrets for development
./setup-secrets.sh development

# Edit the generated .env.development file
nano .env.development

# Run the script again to apply
./setup-secrets.sh development
```

### Option B: Manual configuration

```bash
# Copy the template
cp base/secrets.yaml base/secrets-dev.yaml

# Edit with your actual values
nano base/secrets-dev.yaml

# Apply to cluster
kubectl apply -f base/secrets-dev.yaml
```

## Step 3: Update Configuration

### Update domain names

Edit the ingress configuration for your environment:

```bash
nano overlays/development/patches/ingress-patch.yaml
```

Replace `dev.nexus.example.com` with your actual domain.

### Update image registry

Edit `base/kustomization.yaml` and update the image registry:

```yaml
images:
  - name: nexus/api-gateway
    newName: your-registry.azurecr.io/api-gateway
    newTag: latest
```

## Step 4: Deploy

### Development Environment

```bash
# Preview what will be deployed
kustomize build overlays/development

# Deploy
./deploy.sh development

# Or manually
kubectl apply -k overlays/development
```

### Verify Deployment

```bash
# Run verification script
./verify.sh development

# Or manually check
kubectl get all -n nexus-dev
kubectl get ingress -n nexus-dev
kubectl get certificate -n nexus-dev
```

## Step 5: Access Your Platform

### Get URLs

```bash
# Get the ingress URLs
kubectl get ingress -n nexus-dev

# Example output:
# NAME            HOSTS                     ADDRESS         PORTS
# nexus-ingress   api.dev.nexus.example.com   203.0.113.10   80, 443
```

### Test API

```bash
# Port forward to test locally
kubectl port-forward -n nexus-dev service/dev-api-gateway 8080:80

# In another terminal
curl http://localhost:8080/health
```

## Common Commands

### View Logs

```bash
# All pods in namespace
kubectl logs -n nexus-dev -l app.kubernetes.io/part-of=nexus-platform --tail=50

# Specific service
kubectl logs -n nexus-dev -l app.kubernetes.io/name=api-gateway --tail=50 -f

# Specific pod
kubectl logs -n nexus-dev <pod-name> -f
```

### Scale Services

```bash
# Scale manually
kubectl scale deployment dev-api-gateway --replicas=3 -n nexus-dev

# Check HPA status
kubectl get hpa -n nexus-dev
```

### Restart Services

```bash
# Restart a deployment
kubectl rollout restart deployment/dev-api-gateway -n nexus-dev

# Watch rollout
kubectl rollout status deployment/dev-api-gateway -n nexus-dev
```

### Debug Issues

```bash
# Describe pod
kubectl describe pod <pod-name> -n nexus-dev

# Get events
kubectl get events -n nexus-dev --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n nexus-dev
kubectl top nodes

# Shell into pod
kubectl exec -it <pod-name> -n nexus-dev -- /bin/sh
```

## Production Deployment

For production, follow these additional steps:

### 1. Update Image Tags

```bash
# Edit production overlay
nano overlays/production/kustomization.yaml

# Change image tags to specific versions
images:
  - name: nexusregistry.azurecr.io/api-gateway
    newTag: v1.0.0  # Use specific version, not 'latest'
```

### 2. Review Resource Limits

```bash
# Edit resource patch
nano overlays/production/patches/resource-patch.yaml

# Adjust based on your needs
```

### 3. Configure Production Secrets

```bash
# Setup production secrets
./setup-secrets.sh production

# IMPORTANT: Use external secret management
# - Azure Key Vault
# - AWS Secrets Manager
# - HashiCorp Vault
```

### 4. Deploy with Caution

```bash
# Preview changes
kustomize build overlays/production

# Deploy (will prompt for confirmation)
./deploy.sh production

# Verify
./verify.sh production
```

## Monitoring Setup (Optional)

### Install Prometheus Stack

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### Access Grafana

```bash
# Get Grafana password
kubectl get secret -n monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward
kubectl port-forward -n monitoring service/prometheus-grafana 3000:80

# Open http://localhost:3000
# Username: admin
# Password: (from above command)
```

### Import NEXUS Dashboards

The Grafana dashboards are automatically created via ConfigMaps. Check them in:
`base/monitoring/grafana-dashboards.yaml`

## Troubleshooting

### Pods not starting

```bash
# Check events
kubectl describe pod <pod-name> -n nexus-dev

# Common issues:
# - ImagePullBackOff: Check image name and registry credentials
# - CrashLoopBackOff: Check logs for application errors
# - Pending: Check resource availability
```

### Ingress not working

```bash
# Check ingress
kubectl describe ingress nexus-ingress -n nexus-dev

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Verify DNS
nslookup api.dev.nexus.example.com
```

### Certificate issues

```bash
# Check certificate status
kubectl describe certificate nexus-dev-tls -n nexus-dev

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Check certificate request
kubectl get certificaterequest -n nexus-dev
```

### Database connection issues

```bash
# Verify secrets are created
kubectl get secret nexus-secrets -n nexus-dev

# Check DATABASE_URL format
kubectl get secret nexus-secrets -n nexus-dev -o jsonpath='{.data.DATABASE_URL}' | base64 -d
```

## Next Steps

1. **Configure monitoring**: Set up Prometheus and Grafana alerts
2. **Setup CI/CD**: Automate deployments with GitHub Actions or GitLab CI
3. **Configure backups**: Set up automated database and volume backups
4. **Enable autoscaling**: Configure cluster autoscaler
5. **Setup logging**: Deploy ELK or Loki stack for centralized logging
6. **Security hardening**: Implement network policies, RBAC, and pod security policies

## Resources

- [Full Documentation](./README.md)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [NGINX Ingress Documentation](https://kubernetes.github.io/ingress-nginx/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review pod logs: `kubectl logs <pod-name> -n nexus-dev`
3. Check events: `kubectl get events -n nexus-dev`
4. Run verification: `./verify.sh development`

---

**Security Note**: Never commit secrets or .env files to Git. Always use external secret management for production deployments.
