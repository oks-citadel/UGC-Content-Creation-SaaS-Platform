// =============================================================================
// Load Test - Content Upload Flow
// =============================================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { config } from '../k6-config.js';

// Custom metrics
const uploadSuccessRate = new Rate('upload_success_rate');
const uploadDuration = new Trend('upload_duration');
const presignedUrlDuration = new Trend('presigned_url_duration');
const processingJobsCreated = new Counter('processing_jobs_created');

export const options = {
  scenarios: {
    upload_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '1m', target: 25 },
        { duration: '3m', target: 25 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{endpoint:presigned_url}': ['p(95)<500'],
    'http_req_duration{endpoint:upload_complete}': ['p(95)<300'],
    'upload_success_rate': ['rate>0.95'],
  },
};

// Test file data (simulated)
const testFiles = [
  { name: 'test-video-small.mp4', size: 5242880, type: 'video/mp4' },
  { name: 'test-video-medium.mp4', size: 26214400, type: 'video/mp4' },
  { name: 'test-image.jpg', size: 1048576, type: 'image/jpeg' },
  { name: 'test-image-large.png', size: 4194304, type: 'image/png' },
];

let authToken = null;

export function setup() {
  // Login to get auth token
  const loginRes = http.post(
    `${config.baseUrl}/v1/auth/login`,
    JSON.stringify({
      email: config.testUsers.creator.email,
      password: config.testUsers.creator.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return { token: body.data.accessToken };
  }

  return { token: null };
}

export default function (data) {
  if (!data.token) {
    console.error('No auth token available');
    return;
  }

  const baseUrl = config.baseUrl;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  // Select random test file
  const testFile = testFiles[Math.floor(Math.random() * testFiles.length)];

  group('Content Upload Flow', () => {
    // Step 1: Request presigned upload URL
    group('Get Presigned URL', () => {
      const presignedStart = Date.now();
      const presignedRes = http.post(
        `${baseUrl}/v1/assets/upload-url`,
        JSON.stringify({
          filename: testFile.name,
          contentType: testFile.type,
          fileSize: testFile.size,
          category: 'content',
        }),
        {
          headers,
          tags: { endpoint: 'presigned_url' },
        }
      );

      presignedUrlDuration.add(Date.now() - presignedStart);

      const presignedSuccess = check(presignedRes, {
        'presigned URL status is 200': (r) => r.status === 200,
        'presigned URL returns upload URL': (r) => {
          const body = JSON.parse(r.body);
          return body.data && body.data.uploadUrl;
        },
        'presigned URL returns asset ID': (r) => {
          const body = JSON.parse(r.body);
          return body.data && body.data.assetId;
        },
      });

      if (presignedSuccess) {
        const uploadData = JSON.parse(presignedRes.body).data;

        // Step 2: Simulate upload to blob storage (in real test, upload actual file)
        sleep(testFile.size / 10485760); // Simulate upload time based on file size

        // Step 3: Notify upload complete
        const uploadStart = Date.now();
        const completeRes = http.post(
          `${baseUrl}/v1/assets/${uploadData.assetId}/upload-complete`,
          JSON.stringify({
            checksum: 'abc123hash',
          }),
          {
            headers,
            tags: { endpoint: 'upload_complete' },
          }
        );

        uploadDuration.add(Date.now() - uploadStart);

        const uploadSuccess = check(completeRes, {
          'upload complete status is 200': (r) => r.status === 200 || r.status === 202,
          'processing job created': (r) => {
            if (r.status === 200 || r.status === 202) {
              processingJobsCreated.add(1);
              return true;
            }
            return false;
          },
        });

        uploadSuccessRate.add(uploadSuccess);

        if (uploadSuccess) {
          // Step 4: Check processing status
          sleep(2);

          const statusRes = http.get(
            `${baseUrl}/v1/assets/${uploadData.assetId}`,
            {
              headers,
              tags: { endpoint: 'asset_status' },
            }
          );

          check(statusRes, {
            'asset status is 200': (r) => r.status === 200,
            'asset is processing or ready': (r) => {
              const body = JSON.parse(r.body);
              return body.data && ['processing', 'ready'].includes(body.data.status);
            },
          });
        }
      }
    });
  });

  sleep(Math.random() * 5 + 2);
}

export function teardown(data) {
  // Cleanup: logout
  if (data.token) {
    http.post(`${config.baseUrl}/v1/auth/logout`, null, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
  }
}

export function handleSummary(data) {
  return {
    'results/content-upload-summary.json': JSON.stringify(data, null, 2),
  };
}
