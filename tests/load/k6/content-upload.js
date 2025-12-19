// =============================================================================
// K6 Load Test - Content Upload Stress Test
// =============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const uploadErrors = new Rate('upload_errors');
const uploadDuration = new Trend('upload_duration');
const uploadedFiles = new Counter('uploaded_files');

// Test configuration for stress testing
export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
    },
    spike_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      startTime: '5m', // Start after constant load
    },
  },
  thresholds: {
    upload_duration: ['p(95)<5000'], // 95% of uploads under 5s
    upload_errors: ['rate<0.05'],     // Less than 5% error rate
    http_req_duration: ['p(99)<10000'], // 99% under 10s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Simulated file data (base64 encoded small image)
const SMALL_FILE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const testUsers = new SharedArray('users', function () {
  return [
    { email: 'creator1@example.com', password: 'LoadTest123' },
    { email: 'creator2@example.com', password: 'LoadTest123' },
    { email: 'creator3@example.com', password: 'LoadTest123' },
  ];
});

let authToken = '';

export function setup() {
  // Login to get auth token
  const user = testUsers[0];
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginRes.status === 200) {
    const { tokens } = JSON.parse(loginRes.body);
    return { token: tokens.accessToken };
  }

  throw new Error('Setup failed: Could not authenticate');
}

export default function (data) {
  const authHeaders = {
    'Authorization': `Bearer ${data.token}`,
  };

  // Simulate content upload
  const uploadStart = Date.now();

  const formData = {
    file: http.file(SMALL_FILE, 'test-content.png', 'image/png'),
    title: `Load Test Content ${__VU}-${__ITER}`,
    description: 'Content uploaded during load testing',
    campaignId: 'test-campaign-id',
  };

  const uploadRes = http.post(
    `${BASE_URL}/api/content/upload`,
    formData,
    { headers: authHeaders }
  );

  const uploadSuccess = check(uploadRes, {
    'upload status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'upload response has content id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id || body.contentId;
      } catch {
        return false;
      }
    },
  });

  if (uploadSuccess) {
    uploadedFiles.add(1);
    uploadErrors.add(0);
  } else {
    uploadErrors.add(1);
    console.error(`Upload failed: ${uploadRes.status} - ${uploadRes.body}`);
  }

  uploadDuration.add(Date.now() - uploadStart);

  sleep(2);

  // Get upload status
  if (uploadSuccess) {
    try {
      const { id } = JSON.parse(uploadRes.body);

      const statusRes = http.get(
        `${BASE_URL}/api/content/${id}`,
        { headers: authHeaders }
      );

      check(statusRes, {
        'status check is 200': (r) => r.status === 200,
      });
    } catch (e) {
      console.error('Error checking upload status:', e);
    }
  }

  sleep(1);
}

export function teardown(data) {
  console.log('Content upload stress test completed');
}
