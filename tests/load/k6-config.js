// =============================================================================
// K6 Load Testing Configuration - CreatorBridge Platform
// =============================================================================

export const options = {
  // Test scenarios
  scenarios: {
    // Smoke test - minimal load to verify system works
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      tags: { test_type: 'smoke' },
    },

    // Load test - normal traffic patterns
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp up
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'load' },
    },

    // Stress test - find system limits
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 0 },
      ],
      tags: { test_type: 'stress' },
    },

    // Spike test - sudden traffic bursts
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },  // Spike to 100 users
        { duration: '1m', target: 100 },
        { duration: '10s', target: 500 },  // Spike to 500 users
        { duration: '3m', target: 500 },
        { duration: '10s', target: 100 },  // Drop back
        { duration: '3m', target: 100 },
        { duration: '10s', target: 0 },
      ],
      tags: { test_type: 'spike' },
    },

    // Soak test - extended duration
    soak: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
      tags: { test_type: 'soak' },
    },
  },

  // Performance thresholds
  thresholds: {
    // HTTP request duration
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{endpoint:auth}': ['p(95)<300'],
    'http_req_duration{endpoint:content_upload}': ['p(95)<2000'],
    'http_req_duration{endpoint:content_list}': ['p(95)<400'],

    // Error rate
    'http_req_failed': ['rate<0.01'],  // Less than 1% errors
    'http_req_failed{critical:true}': ['rate<0.001'],  // Critical endpoints

    // Throughput
    'http_reqs': ['rate>100'],  // At least 100 req/s

    // Custom metrics
    'auth_success_rate': ['rate>0.99'],
    'upload_success_rate': ['rate>0.95'],
  },
};

// Environment configuration
export const config = {
  baseUrl: __ENV.BASE_URL || 'https://staging-api.creatorbridge.com',

  // Test data
  testUsers: {
    brand: {
      email: __ENV.BRAND_EMAIL || 'loadtest-brand@creatorbridge.com',
      password: __ENV.BRAND_PASSWORD || 'LoadTest123!',
    },
    creator: {
      email: __ENV.CREATOR_EMAIL || 'loadtest-creator@creatorbridge.com',
      password: __ENV.CREATOR_PASSWORD || 'LoadTest123!',
    },
  },

  // Test assets
  testAssets: {
    smallImage: 'https://storage.creatorbridge.com/test/small-image.jpg',
    largeVideo: 'https://storage.creatorbridge.com/test/large-video.mp4',
  },
};
