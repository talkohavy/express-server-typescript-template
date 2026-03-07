import { check, sleep } from 'k6';
import http from 'k6/http';

// eslint-disable-next-line no-undef -- k6 environment variables
const V6_ENV = __ENV;

/**
 * Smoke Test
 *
 * A smoke test is a minimal load test to verify the system works
 * under minimal load. Run this before other tests to catch obvious issues.
 */
export const options = {
  vus: 1, // <--- 1 virtual user
  duration: '10s', // <--- Run for 10 seconds
  thresholds: {
    http_req_duration: ['p(99) < 1000'], // <--- 99% of requests must be under 1s
    http_req_failed: ['rate < 0.01'], // <--- Less than 1% failure rate
  },
};

const BASE_URL = V6_ENV.BASE_URL || 'http://localhost:8000';

export default function runSmokeTest() {
  const res = http.get(`${BASE_URL}/api/health-check`);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1); // <--- Simulate user think time
}
