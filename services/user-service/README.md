# User Service

## Overview

The User Service manages user profiles, organizations, team membership, and user preferences for the NEXUS UGC platform. It provides the core user management functionality that other services depend on.

**Port:** 3002 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL

## Responsibilities

- User profile management
- Organization creation and management
- Team member invitations and role management
- User preferences and settings
- Notification settings
- Internal user lookup APIs for other services

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |

### User Routes (`/users`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/me` | Get current user | Required |
| PATCH | `/me` | Update current user | Required |
| DELETE | `/me` | Delete account | Required |
| GET | `/me/profile` | Get user profile | Required |
| PATCH | `/me/profile` | Update profile | Required |
| GET | `/me/preferences` | Get preferences | Required |
| PATCH | `/me/preferences` | Update preferences | Required |
| GET | `/me/notifications` | Get notification settings | Required |
| PATCH | `/me/notifications` | Update notification settings | Required |
| GET | `/me/organizations` | Get user's organizations | Required |

### Organization Routes (`/organizations`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create organization | Required |
| GET | `/:id` | Get organization | Required |
| PATCH | `/:id` | Update organization | Required |
| POST | `/:id/invitations` | Invite member | Required |
| POST | `/accept-invitation` | Accept invitation | Required |
| DELETE | `/:id/members/:memberId` | Remove member | Required |
| PATCH | `/:id/members/:memberId` | Update member role | Required |
| POST | `/:id/leave` | Leave organization | Required |

### Internal Routes (Service-to-Service)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/internal/by-email/:email` | Get user by email | Internal |

### Request/Response Examples

#### Get Current User
```json
GET /users/me

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "avatarUrl": "https://...",
    "bio": "Content creator and marketer",
    "phoneNumber": "+1234567890",
    "timezone": "America/New_York",
    "locale": "en",
    "status": "ACTIVE",
    "role": "USER",
    "profile": {
      "company": "Acme Inc",
      "jobTitle": "Marketing Manager",
      "industry": "Technology",
      "website": "https://example.com",
      "linkedinUrl": "https://linkedin.com/in/johndoe"
    }
  }
}
```

#### Create Organization
```json
POST /organizations
{
  "name": "Acme Marketing",
  "description": "Marketing team for Acme Inc",
  "website": "https://acme.com",
  "industry": "Technology",
  "size": "MEDIUM"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Marketing",
    "slug": "acme-marketing",
    "description": "Marketing team for Acme Inc",
    "status": "ACTIVE",
    "plan": "FREE",
    "members": [
      {
        "userId": "uuid",
        "role": "OWNER",
        "user": { "email": "user@example.com" }
      }
    ]
  }
}
```

#### Invite Team Member
```json
POST /organizations/uuid/invitations
{
  "email": "teammate@example.com",
  "role": "MEMBER"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "teammate@example.com",
    "role": "MEMBER",
    "expiresAt": "2024-01-22T00:00:00Z"
  }
}
```

## Data Models

### User
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email |
| firstName | String | First name |
| lastName | String | Last name |
| displayName | String | Display name |
| avatarUrl | String | Profile picture |
| bio | String | User biography |
| phoneNumber | String | Phone number |
| timezone | String | Timezone (default: UTC) |
| locale | String | Language (default: en) |
| status | Enum | User status |
| role | Enum | User role |
| createdAt | DateTime | Registration date |
| updatedAt | DateTime | Last update |

### UserStatus Enum
- `PENDING` - Awaiting verification
- `ACTIVE` - Active user
- `SUSPENDED` - Suspended account
- `DELETED` - Soft deleted

### UserRole Enum
- `USER` - Standard user
- `CREATOR` - Content creator
- `MARKETER` - Marketing user
- `ADMIN` - Administrator
- `SUPER_ADMIN` - Super administrator

### UserProfile
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | User reference |
| company | String | Company name |
| jobTitle | String | Job title |
| industry | String | Industry |
| website | String | Personal website |
| linkedinUrl | String | LinkedIn profile |
| twitterHandle | String | Twitter handle |
| location | String | Location |
| country | String | Country |
| metadata | JSON | Custom metadata |

### Organization
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Organization name |
| slug | String | URL-friendly slug |
| description | String | Description |
| logoUrl | String | Logo image |
| website | String | Website |
| industry | String | Industry |
| size | Enum | Organization size |
| billingEmail | String | Billing email |
| status | Enum | Organization status |
| plan | Enum | Subscription plan |
| createdAt | DateTime | Creation date |
| updatedAt | DateTime | Last update |

### OrganizationSize Enum
- `SOLO` - 1 person
- `SMALL` - 2-10 people
- `MEDIUM` - 11-50 people
- `LARGE` - 51-200 people
- `ENTERPRISE` - 200+ people

### OrganizationStatus Enum
- `ACTIVE` - Active organization
- `SUSPENDED` - Suspended
- `DELETED` - Soft deleted

### SubscriptionPlan Enum
- `FREE` - Free tier
- `STARTER` - Starter plan
- `PROFESSIONAL` - Professional plan
- `BUSINESS` - Business plan
- `ENTERPRISE` - Enterprise plan

### OrganizationMember
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Organization |
| userId | UUID | User |
| role | Enum | Member role |
| joinedAt | DateTime | Join date |

### MemberRole Enum
- `OWNER` - Organization owner
- `ADMIN` - Administrator
- `MEMBER` - Standard member
- `VIEWER` - Read-only access

### OrganizationInvitation
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Organization |
| email | String | Invitee email |
| role | Enum | Assigned role |
| token | String | Invite token |
| expiresAt | DateTime | Expiration |
| acceptedAt | DateTime | Acceptance time |
| createdAt | DateTime | Created time |

### UserPreferences
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | User reference |
| theme | String | light, dark, system |
| language | String | Language code |
| dateFormat | String | Date format |
| timeFormat | String | 12h or 24h |
| weekStartsOn | Int | 0=Sunday, 1=Monday |
| compactMode | Boolean | Compact UI |
| sidebarCollapsed | Boolean | Sidebar state |

### NotificationSettings
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | User reference |
| emailMarketing | Boolean | Marketing emails |
| emailProductUpdates | Boolean | Product updates |
| emailCampaignUpdates | Boolean | Campaign updates |
| emailCreatorMessages | Boolean | Creator messages |
| pushNotifications | Boolean | Push notifications |
| smsNotifications | Boolean | SMS notifications |

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| auth-service | Authentication |
| notification-service | Invitation emails |
| billing-service | Subscription info |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | Data storage |
| Redis | Caching (optional) |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3002 | Server port |
| `SERVICE_NAME` | No | user-service | Service name |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | No | - | Redis connection |
| `CORS_ORIGINS` | No | http://localhost:3000 | CORS origins |
| `NOTIFICATION_SERVICE_URL` | No | - | Notification service |

## Database Schema

### Tables

- `users` - User accounts
- `user_profiles` - Extended profile info
- `organizations` - Organizations
- `organization_members` - Membership
- `organization_invitations` - Pending invitations
- `user_preferences` - UI preferences
- `notification_settings` - Notification preferences

### Indexes
- `users`: (email), (status)
- `organizations`: (slug), (status)
- `organization_members`: (organization_id), (user_id)
- `organization_invitations`: (organization_id), (email), (token)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `user.created` | New user registered |
| `user.updated` | User profile updated |
| `user.deleted` | User account deleted |
| `user.suspended` | User account suspended |
| `organization.created` | Organization created |
| `organization.updated` | Organization updated |
| `organization.deleted` | Organization deleted |
| `member.invited` | Team invitation sent |
| `member.joined` | Member joined organization |
| `member.removed` | Member removed |
| `member.role.changed` | Member role updated |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `auth.user.registered` | auth-service | Create user record |
| `billing.subscription.updated` | billing-service | Update org plan |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `USER_NOT_FOUND` | 404 | User not found |
| `ORGANIZATION_NOT_FOUND` | 404 | Organization not found |
| `MEMBER_NOT_FOUND` | 404 | Member not found |
| `INVITATION_NOT_FOUND` | 404 | Invitation not found |
| `INVITATION_EXPIRED` | 410 | Invitation expired |
| `ALREADY_MEMBER` | 409 | Already a member |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CANNOT_REMOVE_OWNER` | 400 | Cannot remove owner |
| `LAST_OWNER` | 400 | Cannot leave as last owner |
| `SLUG_EXISTS` | 409 | Organization slug exists |
| `EMAIL_EXISTS` | 409 | Email already registered |

## Permissions

### Organization Roles

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| View organization | Yes | Yes | Yes | Yes |
| Update organization | Yes | Yes | No | No |
| Delete organization | Yes | No | No | No |
| Invite members | Yes | Yes | No | No |
| Remove members | Yes | Yes | No | No |
| Change member roles | Yes | Yes | No | No |
| View members | Yes | Yes | Yes | Yes |
