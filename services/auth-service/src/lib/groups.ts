/**
 * Identity Groups Governance Module
 */

export const CONSUMER_GROUPS = ['saas-free', 'saas-standard', 'saas-premium', 'saas-verified'] as const;
export const OPERATOR_GROUPS = ['saas-admin', 'saas-operator'] as const;

export type ConsumerGroup = typeof CONSUMER_GROUPS[number];
export type OperatorGroup = typeof OPERATOR_GROUPS[number];

export class GroupSecurityViolationError extends Error {
  constructor(public code: string, message: string, public userId?: string) {
    super(message);
    this.name = 'GroupSecurityViolationError';
  }
}

export function isConsumerGroup(group: string): group is ConsumerGroup {
  return CONSUMER_GROUPS.includes(group as ConsumerGroup);
}

export function isOperatorGroup(group: string): group is OperatorGroup {
  return OPERATOR_GROUPS.includes(group as OperatorGroup);
}

export function validateGroupAssignment(userId: string, newGroup: string, currentGroups: string[]): void {
  const a = currentGroups.some(isConsumerGroup);
  const b = isOperatorGroup(newGroup);
  if (a && b) throw new GroupSecurityViolationError('CONSUMER_CANNOT_BE_OPERATOR', 'Blocked', userId);
}

export interface GroupClaims { role: string; tier: string | null; isAdmin: boolean; isOperator: boolean; }

export function getGroupClaims(groups: string[]): GroupClaims {
  let claims: GroupClaims = { role: 'consumer', tier: null, isAdmin: false, isOperator: false };
  for (const g of groups) {
    if (g === 'saas-free') claims.tier = 'free';
    if (g === 'saas-standard') claims.tier = 'standard';
    if (g === 'saas-premium') claims.tier = 'premium';
    if (g === 'saas-operator') { claims.role = 'operator'; claims.isOperator = true; }
    if (g === 'saas-admin') { claims.role = 'admin'; claims.isAdmin = true; claims.isOperator = true; }
  }
  return claims;
}
