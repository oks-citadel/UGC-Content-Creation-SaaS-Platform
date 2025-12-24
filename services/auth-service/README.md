# Auth Service

## Overview

The Auth Service handles all authentication and authorization for the NEXUS UGC platform. It provides secure user authentication via email/password and OAuth providers, session management, token handling, MFA support, and access control.

**Port:** 3001 (default)
**Technology Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis

## Responsibilities

- User registration and email verification
- Login/logout with session management
- JWT access and refresh token management
- OAuth integration (Google, Facebook, Apple, Microsoft)
- Multi-factor authentication (MFA/2FA)
- Password reset and account recovery
- Session tracking and invalidation
- Audit logging for security events

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |

### Authentication Routes (`/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | User login | Public |
| POST | `/logout` | User logout | Required |
| POST | `/refresh` | Refresh access token | Required (Refresh Token) |
| GET | `/me` | Get current user | Required |
| POST | `/verify-email` | Verify email address | Public |
| POST | `/resend-verification` | Resend verification email | Public |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password` | Reset password with token | Public |
| POST | `/change-password` | Change current password | Required |

### MFA Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/mfa/enable` | Enable MFA | Required |
| POST | `/mfa/verify` | Verify MFA token | Required |
| POST | `/mfa/disable` | Disable MFA | Required |
| GET | `/mfa/backup-codes` | Get backup codes | Required |
| POST | `/mfa/regenerate-codes` | Regenerate backup codes | Required |

### OAuth Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/oauth/:provider` | Initiate OAuth flow | Public |
| GET | `/oauth/:provider/callback` | OAuth callback | Public |
| POST | `/oauth/:provider/link` | Link OAuth account | Required |
| DELETE | `/oauth/:provider/unlink` | Unlink OAuth account | Required |

### Session Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/sessions` | List active sessions | Required |
| DELETE | `/sessions/:id` | Revoke session | Required |
| DELETE | `/sessions` | Revoke all sessions | Required |

### Request/Response Examples

#### Register
```json
POST /auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "emailVerified": false
    },
    "message": "Verification email sent"
  }
}
```

#### Login
```json
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER"
    }
  }
}
```

## Data Models

### User
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email address |
| passwordHash | String | Hashed password |
| firstName | String | First name |
| lastName | String | Last name |
| avatarUrl | String | Profile picture URL |
| emailVerified | Boolean | Email verification status |
| phoneNumber | String | Phone number |
| phoneVerified | Boolean | Phone verification status |
| mfaEnabled | Boolean | MFA enabled flag |
| mfaSecret | String | Encrypted MFA secret |
| status | Enum | PENDING, ACTIVE, SUSPENDED, DELETED |
| role | Enum | USER, CREATOR, MARKETER, ADMIN, SUPER_ADMIN |
| lastLoginAt | DateTime | Last login timestamp |
| lastLoginIp | String | Last login IP address |
| failedLoginAttempts | Int | Failed login counter |
| lockedUntil | DateTime | Account lockout expiry |

### Session
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | User reference |
| token | String | Session token |
| ipAddress | String | Client IP |
| userAgent | String | Browser user agent |
| expiresAt | DateTime | Session expiry |
| lastActiveAt | DateTime | Last activity |

### RefreshToken
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | User reference |
| token | String | Refresh token |
| family | String | Token family for rotation |
| expiresAt | DateTime | Token expiry |
| revokedAt | DateTime | Revocation timestamp |

### OAuthAccount
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | User reference |
| provider | Enum | GOOGLE, FACEBOOK, APPLE, MICROSOFT |
| providerUserId | String | Provider's user ID |
| accessToken | String | Provider access token |
| refreshToken | String | Provider refresh token |
| expiresAt | DateTime | Token expiry |

### AuditLog
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Related user |
| action | String | Action performed |
| resource | String | Resource type |
| resourceId | String | Resource identifier |
| ipAddress | String | Client IP |
| userAgent | String | Client user agent |
| metadata | JSON | Additional context |
| createdAt | DateTime | Event timestamp |

## Dependencies

### Internal Services
| Service | Purpose |
|---------|---------|
| user-service | User profile management |
| notification-service | Email notifications |

### External Dependencies
| Dependency | Purpose |
|------------|---------|
| PostgreSQL | User and session storage |
| Redis | Session cache, rate limiting |
| Google OAuth | OAuth authentication |
| SendGrid/SES | Email delivery |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3001 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection |
| `REDIS_URL` | Yes | - | Redis connection |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `JWT_ACCESS_TOKEN_EXPIRY` | No | 15m | Access token TTL |
| `JWT_REFRESH_TOKEN_EXPIRY` | No | 7d | Refresh token TTL |
| `JWT_ISSUER` | No | nexus-platform | Token issuer |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth secret |
| `GOOGLE_CALLBACK_URL` | No | - | Google OAuth callback |
| `PASSWORD_MIN_LENGTH` | No | 8 | Minimum password length |
| `MAX_LOGIN_ATTEMPTS` | No | 5 | Max failed attempts |
| `LOCKOUT_DURATION` | No | 900000 | Lockout time (15 min) |
| `USER_SERVICE_URL` | No | http://user-service:3002 | User service URL |
| `NOTIFICATION_SERVICE_URL` | No | http://notification-service:3009 | Notification service URL |

## Database Schema

### Tables

- `users` - User credentials and status
- `sessions` - Active sessions
- `refresh_tokens` - Refresh token storage
- `oauth_accounts` - OAuth provider links
- `verification_codes` - Email/phone verification
- `password_resets` - Password reset tokens
- `audit_logs` - Security audit trail

### Indexes
- `users`: (email), (status)
- `sessions`: (user_id), (token), (expires_at)
- `refresh_tokens`: (user_id), (token), (family)

## Events

### Published Events
| Event | Description |
|-------|-------------|
| `auth.user.registered` | New user registration |
| `auth.user.verified` | Email verification complete |
| `auth.user.login` | Successful login |
| `auth.user.logout` | User logout |
| `auth.password.reset` | Password reset completed |
| `auth.mfa.enabled` | MFA enabled |
| `auth.session.revoked` | Session terminated |

### Consumed Events
| Event | Source | Action |
|-------|--------|--------|
| `user.deleted` | user-service | Clean up auth data |
| `user.suspended` | user-service | Revoke all sessions |

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `ACCOUNT_LOCKED` | 403 | Too many failed attempts |
| `ACCOUNT_SUSPENDED` | 403 | Account suspended |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `MFA_REQUIRED` | 403 | MFA verification needed |
| `INVALID_MFA_TOKEN` | 401 | Invalid MFA code |
| `TOKEN_EXPIRED` | 401 | Access/refresh token expired |
| `TOKEN_INVALID` | 401 | Malformed token |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `WEAK_PASSWORD` | 400 | Password doesn't meet requirements |
| `RESET_TOKEN_INVALID` | 400 | Invalid reset token |
| `OAUTH_ERROR` | 400 | OAuth authentication failed |

## Security Features

- **Password Hashing:** bcrypt with configurable rounds
- **Token Rotation:** Refresh token rotation with family tracking
- **Rate Limiting:** Per-IP and per-user rate limits
- **Account Lockout:** Progressive lockout after failed attempts
- **Session Management:** Device tracking and remote logout
- **Audit Logging:** Complete authentication audit trail
- **TOTP MFA:** Time-based one-time passwords with backup codes
