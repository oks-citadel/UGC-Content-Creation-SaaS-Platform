// =============================================================================
// Load Test - Authentication Flow
// =============================================================================

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config } from '../k6-config.js';

// Custom metrics
const authSuccessRate = new Rate('auth_success_rate');
const loginDuration = new Trend('login_duration');
const tokenRefreshDuration = new Trend('token_refresh_duration');

export const options = {
  scenarios: {
    auth_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration{endpoint:login}': ['p(95)<500'],
    'http_req_duration{endpoint:refresh}': ['p(95)<200'],
    'auth_success_rate': ['rate>0.99'],
  },
};

export default function () {
  const baseUrl = config.baseUrl;

  group('Authentication Flow', () => {
    // Login
    group('Login', () => {
      const loginStart = Date.now();
      const loginRes = http.post(
        `${baseUrl}/v1/auth/login`,
        JSON.stringify({
          email: config.testUsers.creator.email,
          password: config.testUsers.creator.password,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { endpoint: 'login', critical: 'true' },
        }
      );

      loginDuration.add(Date.now() - loginStart);

      const loginSuccess = check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'login returns access token': (r) => {
          const body = JSON.parse(r.body);
          return body.data && body.data.accessToken;
        },
        'login returns refresh token': (r) => {
          const body = JSON.parse(r.body);
          return body.data && body.data.refreshToken;
        },
      });

      authSuccessRate.add(loginSuccess);

      if (loginSuccess) {
        const tokens = JSON.parse(loginRes.body).data;

        // Access protected resource
        sleep(1);

        const profileRes = http.get(`${baseUrl}/v1/users/me`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          tags: { endpoint: 'profile' },
        });

        check(profileRes, {
          'profile access is 200': (r) => r.status === 200,
          'profile returns user data': (r) => {
            const body = JSON.parse(r.body);
            return body.data && body.data.email;
          },
        });

        // Token refresh
        sleep(2);

        const refreshStart = Date.now();
        const refreshRes = http.post(
          `${baseUrl}/v1/auth/refresh`,
          JSON.stringify({
            refreshToken: tokens.refreshToken,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            tags: { endpoint: 'refresh' },
          }
        );

        tokenRefreshDuration.add(Date.now() - refreshStart);

        check(refreshRes, {
          'refresh status is 200': (r) => r.status === 200,
          'refresh returns new access token': (r) => {
            const body = JSON.parse(r.body);
            return body.data && body.data.accessToken;
          },
        });

        // Logout
        sleep(1);

        const newTokens = JSON.parse(refreshRes.body).data;
        const logoutRes = http.post(
          `${baseUrl}/v1/auth/logout`,
          null,
          {
            headers: {
              Authorization: `Bearer ${newTokens.accessToken}`,
            },
            tags: { endpoint: 'logout' },
          }
        );

        check(logoutRes, {
          'logout status is 200': (r) => r.status === 200,
        });
      }
    });
  });

  sleep(Math.random() * 3 + 1);
}

export function handleSummary(data) {
  return {
    'results/auth-flow-summary.json': JSON.stringify(data, null, 2),
  };
}
