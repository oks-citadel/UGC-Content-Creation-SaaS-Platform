// =============================================================================
// K6 Load Test - API Gateway
// =============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const campaignFetchDuration = new Trend('campaign_fetch_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Spike to 200 users
    { duration: '3m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    errors: ['rate<0.1'],              // Custom error rate
    login_duration: ['p(95)<1000'],    // Login should be under 1s for 95%
    campaign_fetch_duration: ['p(95)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const users = [
  { email: 'loadtest1@example.com', password: 'LoadTest123' },
  { email: 'loadtest2@example.com', password: 'LoadTest123' },
  { email: 'loadtest3@example.com', password: 'LoadTest123' },
];

export function setup() {
  console.log('Setting up load test...');
  // Setup can include creating test users, seeding data, etc.
  return { startTime: Date.now() };
}

export default function (data) {
  // Select random user
  const user = users[Math.floor(Math.random() * users.length)];

  // 1. Login
  const loginStart = Date.now();
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.tokens && body.tokens.accessToken;
      } catch {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    errorRate.add(1);
    return;
  }

  loginDuration.add(Date.now() - loginStart);
  errorRate.add(0);

  const { tokens } = JSON.parse(loginRes.body);
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokens.accessToken}`,
  };

  sleep(1);

  // 2. Fetch user profile
  const profileRes = http.get(`${BASE_URL}/api/auth/me`, {
    headers: authHeaders,
  });

  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
    'profile has user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.email;
      } catch {
        return false;
      }
    },
  });

  sleep(1);

  // 3. List campaigns
  const campaignStart = Date.now();
  const campaignsRes = http.get(`${BASE_URL}/api/campaigns?page=1&limit=10`, {
    headers: authHeaders,
  });

  check(campaignsRes, {
    'campaigns status is 200': (r) => r.status === 200,
    'campaigns has data array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  campaignFetchDuration.add(Date.now() - campaignStart);

  sleep(1);

  // 4. Get campaign details (if campaigns exist)
  try {
    const { data: campaigns } = JSON.parse(campaignsRes.body);
    if (campaigns.length > 0) {
      const randomCampaign = campaigns[Math.floor(Math.random() * campaigns.length)];

      const campaignDetailsRes = http.get(
        `${BASE_URL}/api/campaigns/${randomCampaign.id}`,
        { headers: authHeaders }
      );

      check(campaignDetailsRes, {
        'campaign details status is 200': (r) => r.status === 200,
      });
    }
  } catch (e) {
    console.error('Error fetching campaign details:', e);
  }

  sleep(2);

  // 5. Search functionality
  const searchRes = http.get(`${BASE_URL}/api/campaigns?search=summer`, {
    headers: authHeaders,
  });

  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 6. Filter campaigns
  const filterRes = http.get(`${BASE_URL}/api/campaigns?type=UGC&status=ACTIVE`, {
    headers: authHeaders,
  });

  check(filterRes, {
    'filter status is 200': (r) => r.status === 200,
  });

  sleep(2);
}

export function teardown(data) {
  console.log(`Load test completed. Duration: ${(Date.now() - data.startTime) / 1000}s`);
}
