import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@nexus/auth';

// Admin roles with hierarchical permissions
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Full system access
  ADMIN = 'ADMIN', // Most operations
  MODERATOR = 'MODERATOR', // Content moderation only
  SUPPORT = 'SUPPORT', // User support, read-only for most
  FINANCE = 'FINANCE', // Billing and payouts only
}

// Route-based permissions
const ROUTE_PERMISSIONS: Record<string, AdminRole[]> = {
  '/dashboard': [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MODERATOR, AdminRole.SUPPORT, AdminRole.FINANCE],
  '/users': [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.SUPPORT],
  '/organizations': [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
  '/creators': [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MODERATOR],
  '/content': [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MODERATOR],
  '/campaigns': [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
  '/billing': [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.FINANCE],
  '/payouts': [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.FINANCE],
  '/reports': [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
  '/compliance': [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
  '/system': [AdminRole.SUPER_ADMIN],
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/api/auth'];

// Audit log interface
interface AuditLog {
  adminId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  successful: boolean;
}

async function logAdminAction(log: AuditLog) {
  // In production, send to audit logging service
  if (process.env.NODE_ENV === 'production') {
    try {
      await fetch(`${process.env.INTERNAL_API_URL}/audit-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  } else {
    console.log('[AUDIT LOG]', log);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get admin token from cookie
  const token = request.cookies.get('admin-token')?.value;

  if (!token) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify JWT token
    const jwtPayload = await verifyJWT(token, process.env.ADMIN_JWT_SECRET!);
    const payload = jwtPayload as { adminId: string; role: string; email?: string };

    if (!payload || !payload.adminId || !payload.role) {
      throw new Error('Invalid token payload');
    }

    // Check if admin role has permission for this route
    const route = Object.keys(ROUTE_PERMISSIONS).find(r => pathname.startsWith(r));
    if (route) {
      const allowedRoles = ROUTE_PERMISSIONS[route];
      if (!allowedRoles.includes(payload.role as AdminRole)) {
        // Log unauthorized access attempt
        await logAdminAction({
          adminId: payload.adminId,
          action: 'ACCESS_DENIED',
          resource: pathname,
          timestamp: new Date(),
          ip: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          successful: false,
        });

        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Log successful access for sensitive routes
    if (pathname.startsWith('/system') || pathname.startsWith('/compliance')) {
      await logAdminAction({
        adminId: payload.adminId,
        action: 'ACCESS',
        resource: pathname,
        timestamp: new Date(),
        ip: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        successful: true,
      });
    }

    // Add admin info to headers for use in the app
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-id', payload.adminId);
    requestHeaders.set('x-admin-role', payload.role);
    requestHeaders.set('x-admin-email', payload.email || '');

    // Check for MFA requirement on critical actions
    if (
      (pathname.startsWith('/users') && request.method !== 'GET') ||
      pathname.startsWith('/system') ||
      (pathname.startsWith('/billing') && request.method !== 'GET')
    ) {
      const mfaVerified = request.cookies.get('mfa-verified')?.value;
      if (!mfaVerified || mfaVerified !== 'true') {
        return NextResponse.json(
          { error: 'MFA verification required for this action' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Auth middleware error:', error);

    // Clear invalid token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('admin-token');
    response.cookies.delete('mfa-verified');

    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
