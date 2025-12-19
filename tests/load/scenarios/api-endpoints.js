// =============================================================================
// Load Test - General API Endpoints
// =============================================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config } from '../k6-config.js';

// Custom metrics
const apiSuccessRate = new Rate('api_success_rate');
const listEndpointDuration = new Trend('list_endpoint_duration');
const detailEndpointDuration = new Trend('detail_endpoint_duration');

export const options = {
  scenarios: {
    api_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 30 },
        { duration: '5m', target: 30 },
        { duration: '1m', target: 60 },
        { duration: '5m', target: 60 },
        { duration: '1m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{endpoint:list}': ['p(95)<400'],
    'http_req_duration{endpoint:detail}': ['p(95)<300'],
    'api_success_rate': ['rate>0.99'],
  },
};

export function setup() {
  // Login as brand user
  const loginRes = http.post(
    `${config.baseUrl}/v1/auth/login`,
    JSON.stringify({
      email: config.testUsers.brand.email,
      password: config.testUsers.brand.password,
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

  // Randomly select an endpoint group to test
  const testGroup = Math.floor(Math.random() * 5);

  switch (testGroup) {
    case 0:
      testCampaignEndpoints(baseUrl, headers);
      break;
    case 1:
      testCreatorEndpoints(baseUrl, headers);
      break;
    case 2:
      testContentEndpoints(baseUrl, headers);
      break;
    case 3:
      testAnalyticsEndpoints(baseUrl, headers);
      break;
    case 4:
      testNotificationEndpoints(baseUrl, headers);
      break;
  }

  sleep(Math.random() * 2 + 0.5);
}

function testCampaignEndpoints(baseUrl, headers) {
  group('Campaign Endpoints', () => {
    // List campaigns
    const listStart = Date.now();
    const listRes = http.get(
      `${baseUrl}/v1/campaigns?page=1&limit=20`,
      {
        headers,
        tags: { endpoint: 'list', resource: 'campaigns' },
      }
    );
    listEndpointDuration.add(Date.now() - listStart);

    const listSuccess = check(listRes, {
      'campaigns list is 200': (r) => r.status === 200,
      'campaigns list returns data': (r) => {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.campaigns);
      },
    });
    apiSuccessRate.add(listSuccess);

    // Get campaign detail if we have campaigns
    if (listSuccess) {
      const campaigns = JSON.parse(listRes.body).data.campaigns;
      if (campaigns.length > 0) {
        const campaignId = campaigns[0].id;

        sleep(0.5);

        const detailStart = Date.now();
        const detailRes = http.get(
          `${baseUrl}/v1/campaigns/${campaignId}`,
          {
            headers,
            tags: { endpoint: 'detail', resource: 'campaigns' },
          }
        );
        detailEndpointDuration.add(Date.now() - detailStart);

        check(detailRes, {
          'campaign detail is 200': (r) => r.status === 200,
        });
      }
    }
  });
}

function testCreatorEndpoints(baseUrl, headers) {
  group('Creator Endpoints', () => {
    // Discover creators
    const listStart = Date.now();
    const listRes = http.get(
      `${baseUrl}/v1/creators/discover?page=1&limit=20`,
      {
        headers,
        tags: { endpoint: 'list', resource: 'creators' },
      }
    );
    listEndpointDuration.add(Date.now() - listStart);

    const listSuccess = check(listRes, {
      'creators list is 200': (r) => r.status === 200,
      'creators list returns data': (r) => {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.creators);
      },
    });
    apiSuccessRate.add(listSuccess);

    // Get creator profile
    if (listSuccess) {
      const creators = JSON.parse(listRes.body).data.creators;
      if (creators.length > 0) {
        const creatorId = creators[0].id;

        sleep(0.5);

        const detailStart = Date.now();
        const detailRes = http.get(
          `${baseUrl}/v1/creators/${creatorId}`,
          {
            headers,
            tags: { endpoint: 'detail', resource: 'creators' },
          }
        );
        detailEndpointDuration.add(Date.now() - detailStart);

        check(detailRes, {
          'creator detail is 200': (r) => r.status === 200,
        });
      }
    }
  });
}

function testContentEndpoints(baseUrl, headers) {
  group('Content Endpoints', () => {
    // List content submissions
    const listStart = Date.now();
    const listRes = http.get(
      `${baseUrl}/v1/content?page=1&limit=20`,
      {
        headers,
        tags: { endpoint: 'list', resource: 'content' },
      }
    );
    listEndpointDuration.add(Date.now() - listStart);

    const listSuccess = check(listRes, {
      'content list is 200': (r) => r.status === 200,
    });
    apiSuccessRate.add(listSuccess);

    // Get content detail
    if (listSuccess) {
      try {
        const content = JSON.parse(listRes.body).data.content || [];
        if (content.length > 0) {
          const contentId = content[0].id;

          sleep(0.5);

          const detailStart = Date.now();
          const detailRes = http.get(
            `${baseUrl}/v1/content/${contentId}`,
            {
              headers,
              tags: { endpoint: 'detail', resource: 'content' },
            }
          );
          detailEndpointDuration.add(Date.now() - detailStart);

          check(detailRes, {
            'content detail is 200': (r) => r.status === 200,
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  });
}

function testAnalyticsEndpoints(baseUrl, headers) {
  group('Analytics Endpoints', () => {
    // Get dashboard metrics
    const listStart = Date.now();
    const dashboardRes = http.get(
      `${baseUrl}/v1/analytics/dashboard`,
      {
        headers,
        tags: { endpoint: 'list', resource: 'analytics' },
      }
    );
    listEndpointDuration.add(Date.now() - listStart);

    const success = check(dashboardRes, {
      'analytics dashboard is 200': (r) => r.status === 200,
    });
    apiSuccessRate.add(success);

    sleep(0.5);

    // Get performance metrics
    const perfRes = http.get(
      `${baseUrl}/v1/analytics/performance?period=30d`,
      {
        headers,
        tags: { endpoint: 'detail', resource: 'analytics' },
      }
    );

    check(perfRes, {
      'analytics performance is 200': (r) => r.status === 200,
    });
  });
}

function testNotificationEndpoints(baseUrl, headers) {
  group('Notification Endpoints', () => {
    // List notifications
    const listStart = Date.now();
    const listRes = http.get(
      `${baseUrl}/v1/notifications?page=1&limit=20`,
      {
        headers,
        tags: { endpoint: 'list', resource: 'notifications' },
      }
    );
    listEndpointDuration.add(Date.now() - listStart);

    const success = check(listRes, {
      'notifications list is 200': (r) => r.status === 200,
    });
    apiSuccessRate.add(success);

    sleep(0.5);

    // Get unread count
    const countRes = http.get(
      `${baseUrl}/v1/notifications/unread-count`,
      {
        headers,
        tags: { endpoint: 'detail', resource: 'notifications' },
      }
    );

    check(countRes, {
      'unread count is 200': (r) => r.status === 200,
    });
  });
}

export function teardown(data) {
  if (data.token) {
    http.post(`${config.baseUrl}/v1/auth/logout`, null, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
  }
}

export function handleSummary(data) {
  return {
    'results/api-endpoints-summary.json': JSON.stringify(data, null, 2),
  };
}
