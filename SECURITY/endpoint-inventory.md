# NEXUS Platform - Security Audit: Endpoint Inventory

**Generated**: 2025-12-23
**Audit Phase**: 0 - Repository Reconnaissance

---

## Platform Overview

### Technology Stack

| Component | Technology |
|-----------|------------|
| **API Framework** | Express.js (Node.js) |
| **Routing Pattern** | Express Router with http-proxy-middleware for API Gateway |
| **Authentication** | JWT (RS256 via JWKS for production, HS256 secret for dev), Azure AD B2C integration |
| **Authorization** | Role-based (RBAC) + Permission-based middleware |
| **ORM/Data Layer** | Prisma ORM |
| **Validation** | Zod schema validation |
| **Test Framework** | Jest + Vitest + Playwright (E2E) |
| **CI Provider** | GitHub Actions |
| **Package Manager** | pnpm (monorepo with Turborepo) |
| **Infrastructure** | Azure Kubernetes Service (AKS), Azure Container Registry (ACR) |

### Services Architecture

The platform uses a microservices architecture with the following services:

1. **api-gateway** - Entry point, request routing, auth middleware
2. **auth-service** - Authentication, MFA, sessions
3. **user-service** - User profiles, organizations
4. **campaign-service** - Campaign management
5. **content-service** - Media uploads, content management
6. **creator-service** - Creator profiles, matching
7. **billing-service** - Subscriptions, invoices, payments
8. **commerce-service** - Products, galleries, checkout
9. **analytics-service** - Metrics, dashboards, reports
10. **marketplace-service** - Opportunities, bids, contracts
11. **notification-service** - Multi-channel notifications
12. **integration-service** - OAuth, webhooks
13. **workflow-service** - Automation workflows
14. **compliance-service** - GDPR, consent, rights
15. **asset-service** - Asset management, uploads
16. **rights-service** - Content licensing
17. **payout-service** - Creator payouts, tax documents

---

## Authentication & Authorization Mechanisms

### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string;           // User ID
  email: string;
  name?: string;
  role: string;          // User role
  organizationId?: string;
  permissions?: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}
```

### Public Routes (No Auth Required)
- `/api/v1/auth/login`
- `/api/v1/auth/register`
- `/api/v1/auth/refresh`
- `/api/v1/auth/forgot-password`
- `/api/v1/auth/reset-password`
- `/api/v1/auth/verify-email`
- `/api/v1/auth/oauth`
- `/api/v1/public/*`
- `/api/v1/webhooks/*`

### Headers Used for Auth Context
- `Authorization: Bearer <token>` - JWT access token
- `X-User-ID` - Forwarded by gateway after auth
- `X-User-Email` - Forwarded by gateway
- `X-User-Role` - Forwarded by gateway
- `X-Organization-ID` - Tenant scoping
- `X-Request-ID` - Request tracing
- `X-Creator-ID` - Creator context (payout/rights services)

---

## Endpoint Inventory by Service

### 1. Auth Service (`/api/v1/auth`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| POST | `/register` | None | Any | `{ email, password, firstName?, lastName? }` | `{ user, tokens }` | None |
| POST | `/login` | None | Any | `{ email, password, mfaToken? }` | `{ user, tokens, requiresMfa? }` | None |
| POST | `/logout` | Bearer | Any | None | `{ success, message }` | None |
| POST | `/refresh` | None | Any | `{ refreshToken }` | `{ accessToken, refreshToken }` | None |
| POST | `/mfa/setup` | X-User-ID | Any | None | `{ secret, qrCode }` | None |
| POST | `/mfa/enable` | X-User-ID | Any | `{ token }` | `{ success, message }` | None |
| POST | `/mfa/disable` | X-User-ID | Any | `{ token }` | `{ success, message }` | None |
| POST | `/password/forgot` | None | Any | `{ email }` | `{ success, message }` | None |
| POST | `/password/reset` | None | Any | `{ token, password }` | `{ success, message }` | None |
| POST | `/email/verify` | X-User-ID | Any | `{ code }` | `{ success, message }` | None |
| POST | `/email/resend` | X-User-ID | Any | None | `{ success, message }` | None |
| GET | `/sessions` | X-User-ID | Any | None | `{ sessions[] }` | User-scoped |
| DELETE | `/sessions/:sessionId` | X-User-ID | Any | None | `{ success, message }` | User-scoped |
| DELETE | `/sessions` | X-User-ID | Any | None | `{ success, message }` | User-scoped |

### 2. User Service (`/api/v1/users`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| GET | `/me` | X-User-ID | Any | None | `{ user }` | User-scoped |
| PATCH | `/me` | X-User-ID | Any | `{ firstName?, lastName?, displayName?, bio?, phoneNumber?, timezone?, locale? }` | `{ user }` | User-scoped |
| DELETE | `/me` | X-User-ID | Any | None | `{ success, message }` | User-scoped |
| GET | `/me/profile` | X-User-ID | Any | None | `{ profile }` | User-scoped |
| PATCH | `/me/profile` | X-User-ID | Any | `{ company?, jobTitle?, industry?, website?, linkedinUrl?, twitterHandle?, location?, country? }` | `{ profile }` | User-scoped |
| GET | `/me/preferences` | X-User-ID | Any | None | `{ preferences }` | User-scoped |
| PATCH | `/me/preferences` | X-User-ID | Any | `{ theme?, language?, dateFormat?, timeFormat?, weekStartsOn?, compactMode?, sidebarCollapsed? }` | `{ preferences }` | User-scoped |
| GET | `/me/notifications` | X-User-ID | Any | None | `{ settings }` | User-scoped |
| PATCH | `/me/notifications` | X-User-ID | Any | `{ emailMarketing?, emailProductUpdates?, ... }` | `{ settings }` | User-scoped |
| GET | `/me/organizations` | X-User-ID | Any | None | `{ organizations[] }` | User-scoped |
| POST | `/organizations` | X-User-ID | Any | `{ name, description?, website?, industry?, size? }` | `{ organization }` | Creates new org |
| GET | `/organizations/:id` | X-User-ID | Any | None | `{ organization }` | Org member |
| PATCH | `/organizations/:id` | X-User-ID | Admin | Partial org data | `{ organization }` | Org-scoped |
| POST | `/organizations/:id/invitations` | X-User-ID | Admin | `{ email, role }` | `{ invitation }` | Org-scoped |
| POST | `/organizations/accept-invitation` | X-User-ID | Any | `{ token }` | `{ organization }` | None |
| DELETE | `/organizations/:id/members/:memberId` | X-User-ID | Admin | None | `{ success, message }` | Org-scoped |
| PATCH | `/organizations/:id/members/:memberId` | X-User-ID | Admin | `{ role }` | `{ member }` | Org-scoped |
| POST | `/organizations/:id/leave` | X-User-ID | Any | None | `{ success, message }` | Org-scoped |
| GET | `/internal/by-email/:email` | None | **INTERNAL** | None | `{ user }` | **SECURITY CONCERN** |

### 3. Campaign Service (`/api/v1/campaigns`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| POST | `/` | X-User-ID + X-Org-ID | Any | `{ name, description?, type?, startDate?, endDate?, budget?, currency?, targetAudience?, goals?, tags? }` | `{ campaign }` | Org-scoped |
| GET | `/` | X-User-ID + X-Org-ID | Any | Query params | `{ campaigns[], pagination }` | Org-scoped |
| GET | `/stats` | X-User-ID + X-Org-ID | Any | None | `{ stats }` | Org-scoped |
| GET | `/:id` | X-User-ID + X-Org-ID | Any | None | `{ campaign }` | Org-scoped |
| PATCH | `/:id` | X-User-ID + X-Org-ID | Any | Partial campaign data | `{ campaign }` | Org-scoped |
| DELETE | `/:id` | X-User-ID + X-Org-ID | Any | None | `{ success, message }` | Org-scoped |
| PUT | `/:id/brief` | X-User-ID + X-Org-ID | Any | Brief data | `{ brief }` | Org-scoped |
| POST | `/:id/deliverables` | X-User-ID + X-Org-ID | Any | `{ name, description?, type, platform?, quantity?, requirements?, dueDate?, compensation? }` | `{ deliverable }` | Org-scoped |
| PATCH | `/:id/deliverables/:deliverableId` | X-User-ID + X-Org-ID | Any | Partial deliverable | `{ deliverable }` | Org-scoped |
| DELETE | `/:id/deliverables/:deliverableId` | X-User-ID + X-Org-ID | Any | None | `{ success, message }` | Org-scoped |
| POST | `/:id/apply` | X-User-ID | Creator | `{ pitch?, proposedRate? }` | `{ application }` | Public campaign |
| GET | `/:id/applications` | X-User-ID + X-Org-ID | Brand | Query params | `{ applications[] }` | Org-scoped |
| PATCH | `/:id/applications/:applicationId` | X-User-ID + X-Org-ID | Brand | `{ status }` | `{ application }` | Org-scoped |
| POST | `/:id/milestones` | X-User-ID + X-Org-ID | Any | `{ name, description?, dueDate? }` | `{ milestone }` | Org-scoped |
| POST | `/:id/milestones/:milestoneId/complete` | X-User-ID + X-Org-ID | Any | None | `{ milestone }` | Org-scoped |

### 4. Creator Service (`/api/v1/creators`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| POST | `/` | authenticate | Any | Creator profile data | `{ creator }` | None |
| GET | `/:id` | optionalAuth | Any | Query: include | `{ creator }` | Public |
| PUT | `/:id` | authenticate + requireSelfOrAdmin | Creator/Admin | Update data | `{ creator }` | Self or Admin |
| DELETE | `/:id` | authenticate + requireSelfOrAdmin | Creator/Admin | None | 204 No Content | Self or Admin |
| GET | `/` | optionalAuth | Any | Query filters | `{ creators[], pagination }` | Public |
| GET | `/user/:userId` | authenticate | Any | None | `{ creator }` | Self |
| GET | `/:id/portfolio` | optionalAuth | Any | None | `{ portfolio[] }` | Public |
| POST | `/:id/portfolio` | authenticate + requireSelfOrAdmin | Creator/Admin | Portfolio item | `{ portfolioItem }` | Self or Admin |
| PUT | `/:id/portfolio/:itemId` | authenticate + requireSelfOrAdmin | Creator/Admin | Update data | `{ portfolioItem }` | Self or Admin |
| DELETE | `/:id/portfolio/:itemId` | authenticate + requireSelfOrAdmin | Creator/Admin | None | 204 No Content | Self or Admin |
| GET | `/:id/metrics` | optionalAuth | Any | None | `{ metrics }` | Public |
| PUT | `/:id/metrics` | authenticate + requireRole('admin', 'system') | Admin/System | Metrics data | `{ metrics }` | Admin only |
| GET | `/:id/earnings` | authenticate + requireSelfOrAdmin | Creator/Admin | None | `{ earnings }` | Self or Admin |
| POST | `/:id/payout` | authenticate + requireSelfOrAdmin | Creator/Admin | `{ amount }` | `{ payout }` | Self or Admin |
| GET | `/:id/payouts` | authenticate + requireSelfOrAdmin | Creator/Admin | None | `{ payouts[] }` | Self or Admin |
| GET | `/:id/verification` | authenticate + requireSelfOrAdmin | Creator/Admin | None | `{ verification }` | Self or Admin |
| POST | `/:id/verify` | authenticate + requireRole('admin') | Admin | None | `{ creator }` | Admin only |
| PUT | `/:id/verification` | authenticate + requireSelfOrAdmin | Creator/Admin | Verification data | `{ verification }` | Self or Admin |
| GET | `/:id/reviews` | optionalAuth | Any | None | `{ reviews[] }` | Public |
| POST | `/:id/reviews/:reviewId/respond` | authenticate + requireSelfOrAdmin | Creator/Admin | `{ response }` | `{ review }` | Self or Admin |
| POST | `/:id/calculate-reputation` | authenticate + requireRole('admin', 'system') | Admin/System | None | `{ reputationScore }` | Admin only |
| GET | `/match` | authenticate | Any | Query criteria | `{ creators[] }` | Any |
| GET | `/recommend` | authenticate | Any | Query criteria | `{ recommendations[] }` | Any |
| GET | `/:id/similar` | optionalAuth | Any | Query: limit | `{ creators[] }` | Public |
| GET | `/:id/compatibility/:brandId` | authenticate | Any | None | `{ compatibility }` | Any |
| GET | `/trending/:niche` | optionalAuth | Any | Query: limit | `{ creators[] }` | Public |

### 5. Billing Service (`/api/v1/billing`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| GET | `/subscription` | X-User-ID | Any | None | `{ subscription }` | User-scoped |
| POST | `/subscribe` | X-User-ID | Any | `{ planName, email, name?, paymentMethodId? }` | `{ subscription }` | User-scoped |
| POST | `/upgrade` | X-User-ID + requireActiveSubscription | Any | `{ planName }` | `{ subscription }` | User-scoped |
| POST | `/cancel` | X-User-ID + requireActiveSubscription | Any | `{ cancelAtPeriodEnd? }` | `{ subscription }` | User-scoped |
| GET | `/invoices` | X-User-ID | Any | Query: status, limit, offset | `{ invoices[], total }` | User-scoped |
| GET | `/invoices/:id` | X-User-ID | Any | None | `{ invoice }` | User-scoped + ownership check |
| GET | `/invoices/:id/download` | X-User-ID | Any | None | `{ pdfUrl }` | User-scoped + ownership check |
| GET | `/usage` | X-User-ID | Any | Query: type, startDate, endDate | `{ usage, summary }` | User-scoped |
| POST | `/payment-methods` | X-User-ID | Any | `{ paymentMethodId }` | `{ paymentMethod }` | User-scoped |
| DELETE | `/payment-methods/:id` | X-User-ID | Any | None | `{ message }` | User-scoped + ownership check |
| POST | `/webhooks/stripe` | stripe-signature | **Webhook** | Stripe event | `{ received: true }` | N/A |

### 6. Billing Service - Plans (`/api/v1/billing/plans`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| GET | `/` | None | Any | Query: includeInactive | `{ plans[] }` | Public |
| GET | `/:name` | None | Any | None | `{ plan }` | Public |
| POST | `/compare` | None | Any | `{ currentPlan, targetPlan }` | `{ comparison }` | None |
| POST | `/recommend` | None | Any | `{ currentUsage }` | `{ recommendation }` | None |

### 7. Commerce Service (`/api/v1`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| GET | `/products` | authenticate | Any | Query params | `{ products[], meta }` | Tenant-scoped |
| GET | `/products/:id` | authenticate | Any | None | `{ product }` | Tenant-scoped |
| POST | `/products` | authenticate | Any | Product data | `{ product }` | Tenant-scoped |
| POST | `/products/sync` | authenticate | Any | `{ source, credentials }` | `{ synced, products[] }` | Tenant-scoped |
| GET | `/galleries` | authenticate | Any | Query params | `{ galleries[] }` | Tenant-scoped |
| GET | `/galleries/:id` | authenticate | Any | None | `{ gallery }` | Tenant-scoped |
| POST | `/galleries` | authenticate | Any | Gallery data | `{ gallery }` | Tenant-scoped |
| PUT | `/galleries/:id` | authenticate | Any | Update data | `{ gallery }` | Tenant-scoped |
| DELETE | `/galleries/:id` | authenticate | Any | None | `{ success, message }` | Tenant-scoped |
| POST | `/galleries/:id/content` | authenticate | Any | `{ content_id, position?, settings? }` | `{ galleryContent }` | Tenant-scoped |
| DELETE | `/galleries/:id/content/:contentId` | authenticate | Any | None | `{ success, message }` | Tenant-scoped |
| GET | `/galleries/:id/analytics` | authenticate | Any | Query: dates | `{ analytics }` | Tenant-scoped |
| POST | `/galleries/:id/publish` | authenticate | Any | None | `{ gallery }` | Tenant-scoped |
| POST | `/content/:id/tags` | authenticate | Any | Tag data | `{ tag }` | Tenant-scoped |
| GET | `/content/:id/tags` | authenticate | Any | None | `{ tags[] }` | Tenant-scoped |
| PUT | `/tags/:id` | authenticate | Any | Update data | `{ tag }` | Tenant-scoped |
| DELETE | `/tags/:id` | authenticate | Any | None | `{ success, message }` | Tenant-scoped |
| POST | `/content/:id/detect` | authenticate | Any | Detection params | `{ tags[] }` | Tenant-scoped |
| POST | `/events` | optionalAuth | Any | Event data | `{ event }` | Tenant from body/header |
| GET | `/attribution/report` | authenticate | Any | Query: dates, model | `{ report }` | Tenant-scoped |
| GET | `/attribution/content/:id/roi` | authenticate | Any | Query: dates | `{ roi }` | Tenant-scoped |
| POST | `/attribution/creator/roi` | authenticate | Any | `{ creator_id, content_ids }` | `{ roi }` | Tenant-scoped |
| POST | `/checkout` | optionalAuth | Any | Checkout data | `{ session }` | Tenant from body/header |
| GET | `/checkout/:token` | None | Any | None | `{ session }` | Token-based |
| PUT | `/checkout/:token` | None | Any | Update data | `{ session }` | Token-based |
| POST | `/checkout/process` | None | Any | Order data | `{ order }` | From checkout |
| GET | `/orders` | authenticate | Any | Query params | `{ orders[] }` | Tenant-scoped |
| GET | `/orders/:id` | authenticate | Any | None | `{ order }` | Tenant-scoped |
| GET | `/orders/number/:orderNumber` | authenticate | Any | None | `{ order }` | Tenant-scoped |
| PUT | `/orders/:id/status` | authenticate | Any | `{ status, metadata? }` | `{ order }` | Tenant-scoped |
| POST | `/orders/:id/cancel` | authenticate | Any | `{ reason? }` | `{ order }` | Tenant-scoped |

### 8. Analytics Service (`/api/v1/analytics`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| GET | `/metrics/:entityType/:entityId` | None | **MISSING AUTH** | Query params | `{ data }` | **SECURITY CONCERN** |
| POST | `/metrics` | None | **MISSING AUTH** | Metrics data | `{ snapshot }` | **SECURITY CONCERN** |
| GET | `/metrics/:entityType/:entityId/trend` | None | **MISSING AUTH** | Query params | `{ trend }` | **SECURITY CONCERN** |
| GET | `/metrics/:entityType/:entityId/compare` | None | **MISSING AUTH** | Query params | `{ comparison }` | **SECURITY CONCERN** |
| GET | `/metrics/:entityType/top` | None | **MISSING AUTH** | Query params | `{ topPerformers }` | **SECURITY CONCERN** |
| GET | `/dashboards` | None | **MISSING AUTH** | Query params | `{ dashboards[] }` | Query-based |
| POST | `/dashboards` | None | **MISSING AUTH** | Dashboard data | `{ dashboard }` | **SECURITY CONCERN** |
| GET | `/dashboards/:id` | None | **MISSING AUTH** | None | `{ dashboard }` | **SECURITY CONCERN** |
| PUT | `/dashboards/:id` | None | **MISSING AUTH** | Update data | `{ dashboard }` | **SECURITY CONCERN** |
| DELETE | `/dashboards/:id` | None | **MISSING AUTH** | None | `{ success }` | **SECURITY CONCERN** |
| GET | `/dashboards/:id/data` | None | **MISSING AUTH** | None | `{ data }` | **SECURITY CONCERN** |
| GET | `/dashboards/unified/overview` | None | **MISSING AUTH** | Query params | `{ data }` | Query-based |
| GET | `/reports` | None | **MISSING AUTH** | Query params | `{ reports[] }` | Query-based |
| POST | `/reports` | None | **MISSING AUTH** | Report data | `{ report }` | **SECURITY CONCERN** |
| GET | `/reports/:id` | None | **MISSING AUTH** | None | `{ report }` | **SECURITY CONCERN** |
| PUT | `/reports/:id` | None | **MISSING AUTH** | Update data | `{ report }` | **SECURITY CONCERN** |
| DELETE | `/reports/:id` | None | **MISSING AUTH** | None | `{ success }` | **SECURITY CONCERN** |
| POST | `/reports/:id/generate` | None | **MISSING AUTH** | None | `{ result }` | **SECURITY CONCERN** |
| GET | `/reports/:id/download` | None | **MISSING AUTH** | None | PDF stream | **SECURITY CONCERN** |
| GET | `/reports/:id/history` | None | **MISSING AUTH** | Query: limit | `{ history[] }` | **SECURITY CONCERN** |
| GET | `/realtime/:entityType` | None | **MISSING AUTH** | Query: entityId | `{ stats }` | **SECURITY CONCERN** |
| GET | `/realtime/status` | None | **MISSING AUTH** | None | `{ subscriptions, clients }` | **SECURITY CONCERN** |
| GET | `/anomalies` | None | **MISSING AUTH** | Query params | `{ anomalies[] }` | **SECURITY CONCERN** |
| POST | `/anomalies/detect` | None | **MISSING AUTH** | Detection params | `{ anomaly }` | **SECURITY CONCERN** |
| PUT | `/anomalies/:id/resolve` | None | **MISSING AUTH** | None | `{ anomaly }` | **SECURITY CONCERN** |
| GET | `/alerts` | None | **MISSING AUTH** | Query params | `{ alerts[] }` | Query-based |
| POST | `/alerts` | None | **MISSING AUTH** | Alert data | `{ alert }` | **SECURITY CONCERN** |
| GET | `/alerts/:id` | None | **MISSING AUTH** | None | `{ alert }` | **SECURITY CONCERN** |
| PUT | `/alerts/:id` | None | **MISSING AUTH** | Update data | `{ alert }` | **SECURITY CONCERN** |
| DELETE | `/alerts/:id` | None | **MISSING AUTH** | None | `{ success }` | **SECURITY CONCERN** |
| GET | `/alerts/:id/triggers` | None | **MISSING AUTH** | Query: limit | `{ triggers[] }` | **SECURITY CONCERN** |
| GET | `/fatigue/:contentId/:platformId` | None | **MISSING AUTH** | Query params | `{ analysis }` | **SECURITY CONCERN** |
| GET | `/fatigue` | None | **MISSING AUTH** | Query params | `{ records[] }` | **SECURITY CONCERN** |
| POST | `/fatigue/:id/action` | None | **MISSING AUTH** | `{ action }` | `{ record }` | **SECURITY CONCERN** |
| POST | `/aggregate/content/:contentId` | None | **MISSING AUTH** | None | `{ metrics }` | **SECURITY CONCERN** |
| POST | `/aggregate/campaign/:campaignId` | None | **MISSING AUTH** | None | `{ metrics }` | **SECURITY CONCERN** |
| POST | `/aggregate/creator/:creatorId` | None | **MISSING AUTH** | None | `{ metrics }` | **SECURITY CONCERN** |
| POST | `/aggregate/commerce/product/:productId` | None | **MISSING AUTH** | None | `{ metrics }` | **SECURITY CONCERN** |

### 9. Marketplace Service (`/api/v1/marketplace`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| POST | `/opportunities` | None | **Brand** | Opportunity data | `{ opportunity }` | **MISSING AUTH** |
| GET | `/opportunities` | None | Any | Query filters | `{ opportunities[] }` | Public |
| GET | `/opportunities/:id` | None | Any | None | `{ opportunity }` | Public |
| PUT | `/opportunities/:id` | None | **Brand** | Update data | `{ opportunity }` | **MISSING AUTH** |
| POST | `/opportunities/:id/close` | None | **Brand** | `{ reason? }` | `{ opportunity }` | **MISSING AUTH** |
| GET | `/opportunities/matches/:creatorId` | None | **Creator** | None | `{ matches[] }` | **MISSING AUTH** |
| POST | `/bids` | None | **Creator** | Bid data | `{ bid }` | **MISSING AUTH** |
| GET | `/bids/creator/:creatorId` | None | **Creator** | Query params | `{ bids[] }` | **MISSING AUTH** |
| GET | `/opportunities/:id/bids` | None | **Brand** | Query: brandId required | `{ bids[] }` | Query-based |
| PUT | `/bids/:id` | None | **Creator** | Update + creatorId | `{ bid }` | Body-based |
| POST | `/bids/:id/withdraw` | None | **Creator** | `{ creatorId }` | `{ bid }` | Body-based |
| POST | `/bids/:id/accept` | None | **Brand** | `{ brandId }` | `{ bid }` | Body-based |
| POST | `/bids/:id/reject` | None | **Brand** | `{ brandId, reason? }` | `{ bid }` | Body-based |
| POST | `/bids/:id/negotiate` | None | **Brand/Creator** | Counter offer | `{ bid }` | Body-based |
| POST | `/contracts` | None | **Brand** | Contract data | `{ contract }` | **MISSING AUTH** |
| GET | `/contracts/:id` | None | **Brand/Creator** | Query: userId required | `{ contract }` | Query-based |
| GET | `/contracts` | None | **Brand/Creator** | Query: userId, userRole required | `{ contracts[] }` | Query-based |
| POST | `/contracts/:id/send-for-signature` | None | **Brand** | `{ senderId }` | `{ contract }` | Body-based |
| POST | `/contracts/:id/sign` | None | **Brand/Creator** | `{ signerId, role }` | `{ contract }` | Body-based |
| GET | `/contracts/:id/status` | None | Any | None | `{ status }` | **MISSING AUTH** |
| POST | `/contracts/:id/terminate` | None | **Brand/Creator** | `{ terminatedBy, reason }` | `{ contract }` | Body-based |
| POST | `/contracts/:id/complete` | None | **Brand** | None | `{ contract }` | **MISSING AUTH** |
| POST | `/payouts` | None | **Creator** | Payout data | `{ payout }` | **MISSING AUTH** |
| GET | `/payouts/:creatorId` | None | **Creator** | Query params | `{ payouts[] }` | Path-based |
| POST | `/payouts/:id/cancel` | None | **Creator** | `{ creatorId }` | `{ payout }` | Body-based |
| POST | `/payout-methods` | None | **Creator** | Method data | `{ payoutMethod }` | **MISSING AUTH** |
| GET | `/payout-methods/:creatorId` | None | **Creator** | None | `{ methods[] }` | Path-based |
| POST | `/payout-methods/:id/verify` | None | **Creator** | None | `{ method }` | **MISSING AUTH** |
| POST | `/disputes` | None | **Brand/Creator** | Dispute data | `{ dispute }` | **MISSING AUTH** |
| GET | `/disputes/:id` | None | **Any** | Query: userId required | `{ dispute }` | Query-based |
| GET | `/disputes` | None | **Any** | Query params | `{ disputes[] }` | Query-based |
| POST | `/disputes/:id/respond` | None | **Any** | Response data | `{ message }` | **MISSING AUTH** |
| POST | `/disputes/:id/escalate` | None | **Brand/Creator** | `{ escalatedBy }` | `{ dispute }` | Body-based |
| POST | `/disputes/:id/resolve` | None | **Admin** | Resolution data | `{ dispute }` | **MISSING AUTH** |
| POST | `/disputes/:id/close` | None | **Admin** | `{ closedBy }` | `{ dispute }` | Body-based |
| POST | `/ambassador-programs` | None | **Brand** | Program data | `{ program }` | **MISSING AUTH** |
| GET | `/ambassador-programs` | None | Any | Query params | `{ programs[] }` | Public |
| GET | `/ambassador-programs/:id` | None | Any | None | `{ program }` | Public |
| PUT | `/ambassador-programs/:id` | None | **Brand** | Update + brandId | `{ program }` | Body-based |
| POST | `/ambassador-programs/:id/invite` | None | **Brand** | `{ creatorId, tier }` | `{ ambassador }` | **MISSING AUTH** |
| GET | `/ambassador-programs/:id/ambassadors` | None | **Brand** | Query params | `{ ambassadors[] }` | **MISSING AUTH** |
| POST | `/ambassadors/:id/accept` | None | **Creator** | `{ creatorId }` | `{ ambassador }` | Body-based |
| POST | `/ambassadors/:id/decline` | None | **Creator** | `{ creatorId }` | `{ ambassador }` | Body-based |
| POST | `/ambassadors/:id/track-performance` | None | **System/Brand** | `{ metrics }` | `{ ambassador }` | **MISSING AUTH** |
| POST | `/ambassadors/:id/upgrade-tier` | None | **Brand** | `{ newTier, upgradedBy }` | `{ ambassador }` | Body-based |
| POST | `/ambassadors/:id/terminate` | None | **Brand** | `{ terminatedBy }` | `{ ambassador }` | Body-based |

### 10. Notification Service (`/api/v1/notifications`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| POST | `/send` | None | **MISSING AUTH** | Notification data | `{ result }` | **SECURITY CONCERN** |
| POST | `/send/batch` | None | **MISSING AUTH** | `{ notifications[] }` | `{ results[] }` | **SECURITY CONCERN** |
| GET | `/:id` | None | **MISSING AUTH** | None | `{ notification }` | **SECURITY CONCERN** |
| GET | `/user/:userId` | None | **MISSING AUTH** | Query params | `{ notifications[], pagination }` | Path-based |
| POST | `/:id/cancel` | None | **MISSING AUTH** | None | `{ notification }` | **SECURITY CONCERN** |
| GET | `/preferences/:userId` | None | **MISSING AUTH** | None | `{ preferences[] }` | Path-based |
| PUT | `/preferences/:userId` | None | **MISSING AUTH** | Preference data | `{ preference }` | Path-based |
| GET | `/templates/list` | None | **MISSING AUTH** | Query params | `{ templates[] }` | **SECURITY CONCERN** |
| GET | `/stats/:userId` | None | **MISSING AUTH** | Query: dates | `{ stats }` | Path-based |

### 11. Content Service (`/api/v1/media`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| POST | `/upload` | X-User-ID | Any | File (multipart) | `{ media }` | User + Org scoped |
| POST | `/upload-multiple` | X-User-ID | Any | Files (multipart) | `{ media[] }` | User + Org scoped |
| GET | `/` | X-User-ID | Any | Query params | `{ media[], pagination }` | User + Org scoped |
| GET | `/:id` | X-User-ID | Any | None | `{ media }` | User-scoped |
| DELETE | `/:id` | X-User-ID | Any | None | `{ success, message }` | User-scoped |

### 12. Integration Service (`/api/v1/integrations`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| POST | `/oauth/initiate` | None | **MISSING AUTH** | `{ userId, provider, redirectUri, metadata? }` | `{ authUrl, state }` | Body-based |
| GET | `/oauth/callback/:provider` | None | Any | Query: code, state | Redirect | Callback |
| GET | `/user/:userId` | None | **MISSING AUTH** | Query params | `{ integrations[] }` | Path-based |
| GET | `/:id` | None | **MISSING AUTH** | None | `{ integration }` | **SECURITY CONCERN** |
| PATCH | `/:id` | None | **MISSING AUTH** | Update data | `{ integration }` | **SECURITY CONCERN** |
| DELETE | `/:id` | None | **MISSING AUTH** | None | `{ message }` | **SECURITY CONCERN** |
| POST | `/:id/refresh` | None | **MISSING AUTH** | None | `{ message }` | **SECURITY CONCERN** |
| POST | `/webhooks` | None | **MISSING AUTH** | Webhook data | `{ webhook }` | **SECURITY CONCERN** |
| GET | `/webhooks/:webhookId/deliveries` | None | **MISSING AUTH** | Query params | `{ deliveries[], pagination }` | **SECURITY CONCERN** |
| PATCH | `/webhooks/:webhookId` | None | **MISSING AUTH** | Update data | `{ webhook }` | **SECURITY CONCERN** |
| DELETE | `/webhooks/:webhookId` | None | **MISSING AUTH** | None | `{ message }` | **SECURITY CONCERN** |
| GET | `/:id/sync-logs` | None | **MISSING AUTH** | Query params | `{ logs[], pagination }` | **SECURITY CONCERN** |

### 13. Workflow Service (`/api/v1/workflows`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| POST | `/` | None | **MISSING AUTH** | Workflow data | `{ workflow }` | Body-based (userId) |
| GET | `/user/:userId` | None | **MISSING AUTH** | None | `{ workflows[] }` | Path-based |
| GET | `/:id` | None | **MISSING AUTH** | None | `{ workflow }` | **SECURITY CONCERN** |
| PATCH | `/:id` | None | **MISSING AUTH** | Update data | `{ workflow }` | **SECURITY CONCERN** |
| DELETE | `/:id` | None | **MISSING AUTH** | None | `{ message }` | **SECURITY CONCERN** |
| POST | `/:id/execute` | None | **MISSING AUTH** | `{ input }` | `{ executionId }` | **SECURITY CONCERN** |
| POST | `/:id/activate` | None | **MISSING AUTH** | None | `{ workflow }` | **SECURITY CONCERN** |
| POST | `/:id/deactivate` | None | **MISSING AUTH** | None | `{ workflow }` | **SECURITY CONCERN** |
| GET | `/:id/executions` | None | **MISSING AUTH** | Query params | `{ executions[], pagination }` | **SECURITY CONCERN** |
| GET | `/executions/:executionId` | None | **MISSING AUTH** | None | `{ execution }` | **SECURITY CONCERN** |
| POST | `/executions/:executionId/cancel` | None | **MISSING AUTH** | None | `{ message }` | **SECURITY CONCERN** |

### 14. Compliance Service (`/api/v1/compliance`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| POST | `/consent/grant` | None | **MISSING AUTH** | Consent data | `{ consent }` | Body-based (userId) |
| POST | `/consent/revoke` | None | **MISSING AUTH** | `{ userId, type }` | `{ message }` | Body-based |
| GET | `/consent/check/:userId/:type` | None | **MISSING AUTH** | None | `{ hasConsent }` | Path-based |
| GET | `/consent/user/:userId` | None | **MISSING AUTH** | None | `{ consents[] }` | Path-based |
| POST | `/gdpr/export` | None | **MISSING AUTH** | `{ userId }` | `{ requestId, message }` | Body-based |
| POST | `/gdpr/delete` | None | **MISSING AUTH** | `{ userId, notes? }` | `{ requestId, message }` | Body-based |
| POST | `/gdpr/delete/:requestId/process` | None | **MISSING AUTH** | None | `{ message }` | **SECURITY CONCERN** |
| GET | `/gdpr/requests/:userId` | None | **MISSING AUTH** | None | `{ requests[] }` | Path-based |
| POST | `/rights` | None | **MISSING AUTH** | Rights data | `{ rights }` | **SECURITY CONCERN** |
| GET | `/rights/content/:contentId` | None | **MISSING AUTH** | None | `{ rights }` | **SECURITY CONCERN** |
| POST | `/rights/:rightsId/transfer` | None | **MISSING AUTH** | `{ newBrandId }` | `{ rights }` | **SECURITY CONCERN** |
| POST | `/rights/:rightsId/revoke` | None | **MISSING AUTH** | None | `{ rights }` | **SECURITY CONCERN** |
| GET | `/rights/verify/:contentId/:brandId/:usageType` | None | **MISSING AUTH** | None | `{ hasRights }` | Path-based |
| POST | `/disclosure` | None | **MISSING AUTH** | Disclosure data | `{ disclosure }` | **SECURITY CONCERN** |
| POST | `/disclosure/:disclosureId/review` | None | **MISSING AUTH** | Review data | `{ disclosure }` | **SECURITY CONCERN** |
| GET | `/disclosure/content/:contentId` | None | **MISSING AUTH** | None | `{ disclosures[] }` | Path-based |
| GET | `/disclosure/non-compliant` | None | **MISSING AUTH** | Query: userId | `{ disclosures[] }` | Query-based |
| POST | `/disclosure/check-compliance` | None | **MISSING AUTH** | Check data | `{ isCompliant }` | None |
| POST | `/disclosure/generate` | None | **MISSING AUTH** | `{ type, platform }` | `{ text }` | None |
| POST | `/audit` | None | **MISSING AUTH** | Audit data | `{ log }` | **SECURITY CONCERN** |
| GET | `/audit/:userId` | None | **MISSING AUTH** | Query params | `{ logs[], pagination }` | Path-based |

### 15. Asset Service (`/api/v1/assets`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| POST | `/upload-url` | None | **MISSING AUTH** | `{ filename, contentType, size, metadata? }` | `{ assetId, uploadUrl, expiresAt, fields }` | **SECURITY CONCERN** |
| GET | `/:id` | None | **MISSING AUTH** | None | `{ asset }` | **SECURITY CONCERN** |
| GET | `/:id/download` | None | **MISSING AUTH** | None | `{ downloadUrl, expiresAt }` | **SECURITY CONCERN** |
| GET | `/:id/variants` | None | **MISSING AUTH** | None | `{ variants[] }` | **SECURITY CONCERN** |
| DELETE | `/:id` | None | **MISSING AUTH** | None | 204 No Content | **SECURITY CONCERN** |
| POST | `/:id/process` | None | **MISSING AUTH** | None | `{ jobId, status }` | **SECURITY CONCERN** |

### 16. Rights Service (`/api/v1/rights`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| GET | `/:contentId/rights` | None | **MISSING AUTH** | None | `{ rights }` | **SECURITY CONCERN** |
| POST | `/:contentId/rights` | None | **MISSING AUTH** | Rights data | `{ rights }` | **SECURITY CONCERN** |
| GET | `/:contentId/license` | None | **MISSING AUTH** | Query: format | JSON/PDF/HTML | **SECURITY CONCERN** |
| POST | `/:contentId/license/sign` | X-Creator-ID | Any | Signature data | `{ signedLicense }` | Creator-scoped |
| GET | `/:contentId/rights/history` | None | **MISSING AUTH** | None | `{ history[] }` | **SECURITY CONCERN** |
| POST | `/:contentId/rights/transfer` | None | **MISSING AUTH** | `{ newBrandId, reason }` | `{ transfer }` | **SECURITY CONCERN** |
| POST | `/:contentId/rights/revoke` | None | **MISSING AUTH** | `{ reason }` | `{ message }` | **SECURITY CONCERN** |

### 17. Payout Service (`/api/v1/payouts`)

| Method | Route | Auth | Roles | Input | Output | Tenant Scope |
|--------|-------|------|-------|-------|--------|--------------|
| GET | `/balance` | X-Creator-ID | Any | None | `{ balance }` | Creator-scoped |
| GET | `/earnings` | X-Creator-ID | Any | Query: dates | `{ earnings }` | Creator-scoped |
| GET | `/pending` | X-Creator-ID | Any | None | `{ pending }` | Creator-scoped |
| GET | `/history` | X-Creator-ID | Any | Query params | `{ history[], pagination }` | Creator-scoped |
| POST | `/request` | X-Creator-ID | Any | `{ amount, currency? }` | `{ payout }` | Creator-scoped |
| GET | `/:payoutId` | None | **MISSING AUTH** | None | `{ payout }` | **SECURITY CONCERN** |
| POST | `/:payoutId/cancel` | X-Creator-ID | Any | None | `{ message }` | Creator-scoped |
| GET | `/account` | X-Creator-ID | Any | None | `{ account }` | Creator-scoped |
| POST | `/account` | X-Creator-ID | Any | Account setup data | `{ account }` | Creator-scoped |
| PATCH | `/account` | X-Creator-ID | Any | Update data | `{ account }` | Creator-scoped |
| POST | `/account/stripe/connect` | X-Creator-ID | Any | `{ returnUrl, refreshUrl }` | `{ url }` | Creator-scoped |
| GET | `/account/stripe/status` | X-Creator-ID | Any | None | `{ status }` | Creator-scoped |
| DELETE | `/account` | X-Creator-ID | Any | None | 204 No Content | Creator-scoped |
| GET | `/tax-documents` | X-Creator-ID | Any | Query: year | `{ documents[] }` | Creator-scoped |
| GET | `/tax-documents/:documentId` | None | **MISSING AUTH** | None | PDF download | **SECURITY CONCERN** |
| GET | `/tax-documents/info` | X-Creator-ID | Any | None | `{ info }` | Creator-scoped |
| POST | `/tax-documents/info` | X-Creator-ID | Any | Tax info data | `{ info }` | Creator-scoped |
| GET | `/tax-documents/summary/:year` | X-Creator-ID | Any | None | `{ summary }` | Creator-scoped |

---

## Critical Security Findings Summary

### 1. Missing Authentication (HIGH SEVERITY)

The following services have **NO authentication middleware** on their routes:

- **Analytics Service** - All 30+ endpoints are unprotected
- **Marketplace Service** - All endpoints rely on body/query params for authorization
- **Notification Service** - All endpoints are unprotected
- **Integration Service** - All endpoints are unprotected
- **Workflow Service** - All endpoints are unprotected
- **Compliance Service** - All endpoints are unprotected
- **Asset Service** - All endpoints are unprotected
- **Rights Service** - Most endpoints are unprotected

### 2. Internal Endpoints Exposed (CRITICAL)

- `GET /users/internal/by-email/:email` - No authentication, exposes user lookup by email

### 3. Authorization via Request Body (MEDIUM)

Many marketplace endpoints accept `userId`, `brandId`, or `creatorId` in the request body without verifying the caller's identity. This allows any authenticated user to impersonate others.

### 4. Missing Tenant Isolation (HIGH)

Several services don't properly scope data access to the authenticated user's organization:
- Analytics dashboards/reports queryable by any userId/brandId
- Notifications accessible by providing any userId
- Workflows accessible by providing any userId

### 5. Webhook Security

- Stripe webhooks properly verify signature (`stripe-signature` header)
- Other webhook endpoints in integration service lack verification

---

## Recommendations (Phase 0)

1. **Add authentication middleware** to all services (analytics, marketplace, notification, integration, workflow, compliance, asset, rights)

2. **Implement proper authorization** - Replace body-based userId/creatorId/brandId with JWT claims

3. **Secure internal endpoints** - Add service-to-service authentication for `/internal/*` routes

4. **Add tenant scoping** - Ensure all data queries include `organizationId` from authenticated context

5. **Implement RBAC consistently** - Use the `requireRole()` and `requirePermission()` middleware across all services

6. **Add rate limiting** - Protect all endpoints, especially authentication and public routes

7. **Audit webhook endpoints** - Ensure all webhook receivers verify signatures

---

*This inventory was generated as part of Phase 0: Repository Reconnaissance. Further phases will address specific vulnerabilities identified above.*
