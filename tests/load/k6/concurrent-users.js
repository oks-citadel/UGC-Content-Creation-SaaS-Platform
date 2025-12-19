// =============================================================================
// K6 Load Test - Concurrent Users Simulation
// =============================================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const transactionDuration = new Trend('transaction_duration');

// Test scenarios simulating real user behavior
export const options = {
  scenarios: {
    // Brand users browsing and managing campaigns
    brand_users: {
      executor: 'ramping-vus',
      exec: 'brandUserScenario',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '1m', target: 0 },
      ],
    },
    // Creator users browsing and applying to campaigns
    creator_users: {
      executor: 'ramping-vus',
      exec: 'creatorUserScenario',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      startTime: '30s',
    },
    // Spike of new user registrations
    new_registrations: {
      executor: 'ramping-arrival-rate',
      exec: 'registrationScenario',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      stages: [
        { duration: '2m', target: 5 },  // 5 registrations per second
        { duration: '1m', target: 10 }, // Spike to 10/sec
        { duration: '2m', target: 5 },  // Back to 5/sec
        { duration: '1m', target: 0 },
      ],
      startTime: '2m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.05'],
    'http_req_duration{scenario:brand_users}': ['p(95)<1500'],
    'http_req_duration{scenario:creator_users}': ['p(95)<1500'],
    'http_req_duration{scenario:new_registrations}': ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Brand user workflow
export function brandUserScenario() {
  const transactionStart = Date.now();

  group('Brand User - Login', function () {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: `brand${randomIntBetween(1, 10)}@example.com`,
      password: 'BrandTest123',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const success = check(loginRes, {
      'brand login successful': (r) => r.status === 200,
    });

    if (!success) {
      errorRate.add(1);
      return;
    }

    errorRate.add(0);
    const { tokens } = JSON.parse(loginRes.body);
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.accessToken}`,
    };

    sleep(1);

    group('View Campaigns Dashboard', function () {
      const dashboardRes = http.get(`${BASE_URL}/api/campaigns`, {
        headers: authHeaders,
      });

      check(dashboardRes, {
        'dashboard loaded': (r) => r.status === 200,
      });

      sleep(2);
    });

    group('View Applications', function () {
      // Get first campaign
      const campaignsRes = http.get(`${BASE_URL}/api/campaigns?limit=1`, {
        headers: authHeaders,
      });

      if (campaignsRes.status === 200) {
        const { data } = JSON.parse(campaignsRes.body);
        if (data.length > 0) {
          const applicationsRes = http.get(
            `${BASE_URL}/api/campaigns/${data[0].id}/applications`,
            { headers: authHeaders }
          );

          check(applicationsRes, {
            'applications loaded': (r) => r.status === 200,
          });
        }
      }

      sleep(2);
    });

    group('View Analytics', function () {
      const analyticsRes = http.get(`${BASE_URL}/api/analytics/overview`, {
        headers: authHeaders,
      });

      check(analyticsRes, {
        'analytics loaded': (r) => r.status === 200,
      });

      sleep(1);
    });
  });

  transactionDuration.add(Date.now() - transactionStart);
  sleep(randomIntBetween(3, 8));
}

// Creator user workflow
export function creatorUserScenario() {
  const transactionStart = Date.now();

  group('Creator User - Login', function () {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: `creator${randomIntBetween(1, 50)}@example.com`,
      password: 'CreatorTest123',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const success = check(loginRes, {
      'creator login successful': (r) => r.status === 200,
    });

    if (!success) {
      errorRate.add(1);
      return;
    }

    errorRate.add(0);
    const { tokens } = JSON.parse(loginRes.body);
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.accessToken}`,
    };

    sleep(1);

    group('Browse Campaigns', function () {
      const campaignsRes = http.get(`${BASE_URL}/api/campaigns?status=ACTIVE&page=1&limit=20`, {
        headers: authHeaders,
      });

      check(campaignsRes, {
        'campaigns loaded': (r) => r.status === 200,
      });

      sleep(2);
    });

    group('Search Campaigns', function () {
      const searchRes = http.get(
        `${BASE_URL}/api/campaigns?search=${randomString(8)}&type=UGC`,
        { headers: authHeaders }
      );

      check(searchRes, {
        'search completed': (r) => r.status === 200,
      });

      sleep(1);
    });

    group('View Campaign Details', function () {
      const campaignsRes = http.get(`${BASE_URL}/api/campaigns?limit=1`, {
        headers: authHeaders,
      });

      if (campaignsRes.status === 200) {
        const { data } = JSON.parse(campaignsRes.body);
        if (data.length > 0) {
          const detailsRes = http.get(
            `${BASE_URL}/api/campaigns/${data[0].id}`,
            { headers: authHeaders }
          );

          check(detailsRes, {
            'campaign details loaded': (r) => r.status === 200,
          });
        }
      }

      sleep(3);
    });

    group('Check My Applications', function () {
      const myAppsRes = http.get(`${BASE_URL}/api/applications/me`, {
        headers: authHeaders,
      });

      check(myAppsRes, {
        'my applications loaded': (r) => r.status === 200,
      });

      sleep(1);
    });
  });

  transactionDuration.add(Date.now() - transactionStart);
  sleep(randomIntBetween(5, 10));
}

// New user registration workflow
export function registrationScenario() {
  const transactionStart = Date.now();

  group('New User Registration', function () {
    const uniqueEmail = `loadtest-${Date.now()}-${randomString(8)}@example.com`;

    const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
      email: uniqueEmail,
      password: 'LoadTest123',
      firstName: 'Load',
      lastName: 'Test',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const success = check(registerRes, {
      'registration successful': (r) => r.status === 201,
      'registration returns tokens': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.tokens && body.tokens.accessToken;
        } catch {
          return false;
        }
      },
    });

    if (success) {
      errorRate.add(0);
    } else {
      errorRate.add(1);
    }

    sleep(1);
  });

  transactionDuration.add(Date.now() - transactionStart);
}

export function teardown() {
  console.log('Concurrent user simulation completed');
}
