# Marketplace Service Deployment Guide

## Prerequisites

Before deploying the Marketplace Service, ensure you have:

1. PostgreSQL database (v13 or higher)
2. Redis instance (v6 or higher)
3. Payment provider accounts:
   - Stripe account with Connect enabled
   - Paystack account (for African markets)
   - Flutterwave account (optional)
4. DocuSign account with API access
5. Node.js 18+ installed
6. Docker (for containerized deployment)

## Environment Setup

### 1. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE nexus_marketplace;
CREATE USER nexus_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE nexus_marketplace TO nexus_user;
```

### 2. Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Configure the following required variables:

```env
# Database
DATABASE_URL=postgresql://nexus_user:password@localhost:5432/nexus_marketplace

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# Paystack
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...

# DocuSign
DOCUSIGN_INTEGRATION_KEY=your-integration-key
DOCUSIGN_USER_ID=your-user-id
DOCUSIGN_ACCOUNT_ID=your-account-id
DOCUSIGN_PRIVATE_KEY_PATH=./keys/docusign-private.key
DOCUSIGN_OAUTH_BASE_PATH=https://account.docusign.com
DOCUSIGN_API_BASE_PATH=https://na3.docusign.net/restapi
```

### 3. DocuSign Setup

Generate RSA key pair for DocuSign JWT authentication:

```bash
mkdir -p keys
openssl genrsa -out keys/docusign-private.key 2048
openssl rsa -in keys/docusign-private.key -pubout -out keys/docusign-public.key
```

Upload the public key to DocuSign:
1. Go to DocuSign Admin Console
2. Navigate to Settings > Integrations > Apps and Keys
3. Add your integration key and upload the public key

## Installation

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma client:
```bash
npm run prisma:generate
```

3. Run database migrations:
```bash
npm run prisma:migrate
```

4. Start development server:
```bash
npm run dev
```

The service will be available at `http://localhost:3006`

### Production Build

1. Build the application:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

## Docker Deployment

### Single Container

Build and run with Docker:

```bash
# Build image
docker build -t nexus-marketplace-service:latest .

# Run container
docker run -d \
  --name marketplace-service \
  -p 3006:3006 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=... \
  -v $(pwd)/keys:/app/keys:ro \
  nexus-marketplace-service:latest
```

### Docker Compose

Use the provided docker-compose.yml:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f marketplace-service

# Stop services
docker-compose down
```

## Cloud Deployment

### AWS ECS/Fargate

1. Push Docker image to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag nexus-marketplace-service:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/nexus-marketplace:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/nexus-marketplace:latest
```

2. Create ECS task definition with environment variables
3. Create ECS service with load balancer
4. Configure RDS PostgreSQL and ElastiCache Redis
5. Set up secrets in AWS Secrets Manager

### Google Cloud Run

1. Build and push to Google Container Registry:
```bash
gcloud builds submit --tag gcr.io/<project-id>/nexus-marketplace
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy nexus-marketplace \
  --image gcr.io/<project-id>/nexus-marketplace \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=postgresql://...,REDIS_URL=redis://... \
  --set-secrets JWT_SECRET=jwt-secret:latest
```

### Kubernetes

Apply Kubernetes manifests:

```bash
# Create namespace
kubectl create namespace nexus

# Create secrets
kubectl create secret generic marketplace-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=jwt-secret=... \
  --from-file=docusign-key=./keys/docusign-private.key \
  -n nexus

# Apply deployments
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

## Database Migrations

### Running Migrations

Development:
```bash
npm run prisma:migrate
```

Production:
```bash
npx prisma migrate deploy
```

### Creating New Migrations

```bash
npx prisma migrate dev --name description_of_changes
```

## Monitoring

### Health Checks

The service exposes health check endpoints:

- `GET /health` - Overall health status
- `GET /ready` - Readiness probe (for K8s)

Configure your load balancer/orchestrator to use these endpoints.

### Logging

Logs are written to:
- Console (stdout)
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Unhandled exceptions

For production, configure log forwarding to:
- AWS CloudWatch
- Google Cloud Logging
- Datadog
- ELK Stack

### Metrics

If Prometheus is enabled (`PROMETHEUS_ENABLED=true`), metrics are available at:
```
GET /metrics
```

Key metrics:
- HTTP request duration
- Request count by endpoint
- Error rates
- Database query performance
- Payout processing times

## Scaling

### Horizontal Scaling

The service is stateless and can be horizontally scaled:

```bash
# Docker Compose
docker-compose up -d --scale marketplace-service=3

# Kubernetes
kubectl scale deployment marketplace-service --replicas=5 -n nexus
```

### Performance Optimization

1. **Database Connection Pooling**
   - Adjust Prisma connection pool size based on load
   - Default: 10 connections per instance

2. **Redis Caching**
   - Exchange rates cached for 24 hours
   - Opportunity matches cached for 1 hour

3. **Background Jobs**
   - Payout processing runs asynchronously
   - Email notifications queued in Redis

## Backup and Recovery

### Database Backups

Automated daily backups:
```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20240115.sql
```

### Disaster Recovery

1. Restore database from latest backup
2. Restart service instances
3. Verify health checks pass
4. Check recent transactions for data integrity

## Security Checklist

- [ ] JWT secret is strong (minimum 32 characters)
- [ ] Database credentials are secure
- [ ] DocuSign private key is properly protected
- [ ] Payment provider API keys are in production mode
- [ ] HTTPS/TLS enabled for all endpoints
- [ ] CORS configured for allowed origins
- [ ] Rate limiting enabled
- [ ] Secrets stored in environment variables or secret manager
- [ ] Database backups automated and tested
- [ ] Monitoring and alerting configured

## Troubleshooting

### Common Issues

**Database connection fails:**
```bash
# Check connection
psql $DATABASE_URL

# Verify migrations
npm run prisma:migrate status
```

**DocuSign authentication fails:**
- Verify private key is correct
- Check integration key and user ID
- Ensure consent is granted in DocuSign admin

**Payout processing fails:**
- Check Stripe/Paystack API keys
- Verify creator has verified payout method
- Check minimum payout amount configuration

**Redis connection timeout:**
- Verify Redis is running
- Check network connectivity
- Increase timeout in configuration

## Support and Maintenance

### Regular Maintenance

1. **Weekly:**
   - Review error logs
   - Check failed payouts
   - Monitor dispute resolution times

2. **Monthly:**
   - Update dependencies (security patches)
   - Review database performance
   - Optimize slow queries

3. **Quarterly:**
   - Review and update exchange rates
   - Audit contract templates
   - Performance testing under load

### Updating the Service

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations
npm run prisma:migrate deploy

# Build
npm run build

# Restart service
pm2 restart marketplace-service
# or
docker-compose restart marketplace-service
```

## Rollback Procedure

If deployment fails:

1. Revert to previous Docker image:
```bash
docker pull nexus-marketplace-service:previous-tag
docker-compose up -d
```

2. Rollback database migrations:
```bash
npm run prisma:migrate resolve --rolled-back <migration-name>
```

3. Verify service health:
```bash
curl http://localhost:3006/health
```

## Contact

For deployment issues or questions:
- Platform Team: platform@nexus.com
- On-call: +1-XXX-XXX-XXXX
- Slack: #nexus-platform-ops
