# NEXUS Admin Dashboard

Internal administration dashboard for the NEXUS Platform.

## Features

### Authentication & Security
- MFA-required login for all admin users
- Role-based access control (RBAC)
- Comprehensive audit logging
- Session management with automatic timeout
- IP whitelisting support

### User Management
- View and manage all platform users
- User activity monitoring
- Account suspension/activation
- Detailed user profiles
- Filtering and search capabilities

### Organization Management
- Manage brand organizations
- View organization metrics
- Team member management
- Subscription monitoring

### Creator Management
- Creator verification workflow
- Portfolio and document review
- Verification status tracking
- Creator performance metrics

### Content Moderation
- Queue-based content review system
- Video/image preview
- Approval/rejection workflow
- Content flagging system
- Moderation guidelines

### Campaign Oversight
- View all platform campaigns
- Budget and spend tracking
- Campaign performance metrics
- Content delivery monitoring

### Billing & Revenue
- MRR/ARR tracking
- Revenue charts and analytics
- Invoice management
- Subscription monitoring
- Payment processing

### Creator Payouts
- Payout queue management
- Payment processing
- Earnings tracking
- Payout history

### Compliance & Legal
- Dispute management
- Rights management
- Compliance metrics
- GDPR/CCPA tools

### System Monitoring
- Real-time health status
- Service uptime monitoring
- Performance metrics
- Audit log viewer
- Background job queue

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **UI**: React 18, Tailwind CSS
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Authentication**: NextAuth.js with MFA
- **API**: Type-safe API client

## Getting Started

### Prerequisites

- Node.js 18.17.0 or higher
- pnpm 8.0.0 or higher
- PostgreSQL database
- Redis (for sessions)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

The admin dashboard will be available at http://localhost:3001

### Default Admin Account

For initial setup, create an admin user via the database or CLI tool:

```bash
pnpm admin:create --email admin@nexus.com --role SUPER_ADMIN
```

## Environment Variables

See `.env.example` for all required environment variables.

Critical variables:
- `ADMIN_JWT_SECRET` - JWT signing key (must be secure)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection for sessions
- `INTERNAL_API_URL` - Backend API endpoint

## Security Features

### Role-Based Access Control

- **SUPER_ADMIN**: Full system access
- **ADMIN**: Most operations except system config
- **MODERATOR**: Content moderation only
- **SUPPORT**: User support, read-only access
- **FINANCE**: Billing and payouts only

### Audit Logging

All administrative actions are logged:
- User account modifications
- Content moderation decisions
- System configuration changes
- Failed login attempts
- Suspicious activities

Logs are stored in the database and can be exported for compliance.

### MFA Requirement

Multi-factor authentication is required for:
- Initial login
- Critical operations (user suspension, system changes)
- Billing operations
- Accessing sensitive data

### Session Security

- Automatic timeout after 30 minutes of inactivity
- Secure session storage in Redis
- Session invalidation on role change
- IP address verification

## Development

### Project Structure

```
apps/admin/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── users/            # User management
│   ├── moderation/       # Content moderation
│   ├── billing/          # Billing components
│   └── system/           # System monitoring
├── lib/                   # Utilities
│   ├── api.ts            # API client
│   └── utils.ts          # Helper functions
├── middleware.ts          # Auth middleware
└── package.json
```

### Adding New Admin Pages

1. Create page in `app/(dashboard)/`
2. Add route to middleware permissions
3. Add navigation item in layout
4. Implement API endpoints
5. Add audit logging

### API Integration

Use the type-safe API client:

```typescript
import { api } from '@/lib/api';

// Fetch users
const { data, error } = await api.users.list({ status: 'active' });

// Suspend user (with audit log)
await api.users.suspend(userId);
```

## Deployment

### Production Checklist

- [ ] Update all environment variables
- [ ] Enable MFA for all admin accounts
- [ ] Configure IP whitelist
- [ ] Set up monitoring (Sentry/Datadog)
- [ ] Configure backup strategy
- [ ] Set up SSL/TLS
- [ ] Enable rate limiting
- [ ] Configure CORS
- [ ] Test disaster recovery
- [ ] Document runbook

### Build

```bash
pnpm build
```

### Docker

```bash
docker build -t nexus-admin .
docker run -p 3001:3001 nexus-admin
```

## Monitoring

The dashboard includes built-in monitoring:

- System health checks
- API response times
- Error rates
- Job queue status
- Database performance

Integrate with external monitoring:
- Sentry for error tracking
- Datadog for metrics
- LogRocket for session replay

## Support

For admin dashboard issues:
- Internal documentation: `/docs/admin`
- DevOps team: devops@nexus.com
- Emergency contact: See runbook

## License

Internal use only - NEXUS Platform
