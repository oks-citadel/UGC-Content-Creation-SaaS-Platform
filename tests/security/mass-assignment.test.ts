
/**
 * Mass Assignment Escalation Tests
 */

import { describe, it, expect } from 'vitest';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function api(endpoint: string, opts: RequestInit = {}) {
  return fetch(API_BASE_URL + endpoint, { headers: { 'Content-Type': 'application/json', ...opts.headers }, ...opts });
}

