# Identity Groups Governance Framework

## Overview

This document defines the identity group governance structure for the UGC SaaS platform.
It establishes clear boundaries between consumer (subscriber) groups and administrative groups,
ensuring complete separation of concerns and preventing privilege escalation.

## Core Principles

1. **Separation of Domains**: Consumer users and administrative users exist in separate identity domains
2. **No Cross-Domain Escalation**: A consumer account can NEVER be granted administrative privileges
3. **Least Privilege**: Users receive only the minimum permissions required for their role
4. **Explicit Group Assignment**: Group membership must be explicitly assigned, never inherited
5. **Audit Trail**: All group membership changes are logged and auditable
---

## Consumer Identity Groups
### saas-free
Domain Consumer Admin NO

### saas-standard
Domain Consumer Admin NO

### saas-premium
Domain Consumer Admin NO

### saas-verified
Domain Consumer Supplementary Admin NO

## Administrative Identity Groups
Consumer accounts are PERMANENTLY INELIGIBLE

### saas-admin
Domain Operator Consumer NEVER MFA YES

### saas-operator
Domain Operator Consumer NEVER MFA YES

## Enforcement Rules
1. Domain Separation - Consumers NEVER in operator groups
2. Admin Creation - Must be created separately
3. Tier Changes - Consumer domain only
