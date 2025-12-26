/**
 * Centralized Authorization Policy Layer
 * Prevents IDOR, mass assignment, and privilege escalation
 */

import { z } from 'zod';

// Server-owned fields that clients cannot modify
export const SERVER_OWNED_FIELDS = [
  'id', 'userId', 'createdAt', 'updatedAt', 'role', 'isAdmin',
  'subscriptionTier', 'verified', 'tenantId', 'permissions'
] as const;

// Strict base schema rejecting unknown fields
export const strictSchema = z.object({}).strict();

// IDOR Prevention: Verify resource ownership
export function verifyOwnership(resourceUserId: string, requestUserId: string): boolean {
  return resourceUserId === requestUserId;
}

// Tenant isolation check
export function verifyTenant(resourceTenantId: string, requestTenantId: string): boolean {
  return resourceTenantId === requestTenantId;
}

// Mass assignment protection error
export class MassAssignmentError extends Error {
  constructor(fields: string[]) {
    super('Attempted to modify protected fields: ' + fields.join(', '));
    this.name = 'MassAssignmentError';
  }
}
