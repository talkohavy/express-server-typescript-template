import { check, sleep } from 'k6';
import http from 'k6/http';

// eslint-disable-next-line no-undef -- k6 environment variables
const V6_ENV = __ENV;

// Test configuration
export const options = {
  // Define thresholds (pass/fail criteria)
  thresholds: {
    http_req_duration: ['p(95) < 200', 'p(99) < 500'], // 95% under 200ms, 99% under 500ms
    http_req_failed: ['rate < 0.01'], // Less than 1% failure rate
  },

  // Ramp up/down virtual users
  stages: [
    { duration: '10s', target: 10 }, // Ramp up to 10 users over 10s
    { duration: '30s', target: 50 }, // Ramp up to 50 users over 30s
    { duration: '1m', target: 50 }, // Stay at 50 users for 1 minute
    { duration: '10s', target: 0 }, // Ramp down to 0 users
  ],
};

const BASE_URL = V6_ENV.BASE_URL || 'http://localhost:8000';

export default function runLoadTestOnHealthCheck() {
  // Health check endpoint
  const res = http.get(`${BASE_URL}/api/health-check`);

  // Validate response
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has status OK': (r) => {
      // @ts-expect-error
      const body = JSON.parse(r.body);
      return body.status === 'OK';
    },
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  // Simulate user think time
  sleep(1);
}
