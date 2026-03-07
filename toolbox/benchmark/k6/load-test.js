import { check, sleep, group } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// eslint-disable-next-line no-undef -- k6 environment variables
const V6_ENV = __ENV;

/**
 * Load Test
 *
 * Simulates normal and peak load to verify system performance
 * under expected conditions.
 */

// Custom metrics
const healthCheckDuration = new Trend('health_check_duration');
const healthCheckErrors = new Counter('health_check_errors');
const healthCheckSuccess = new Rate('health_check_success');

export const options = {
  thresholds: {
    http_req_duration: ['p(95) < 300', 'p(99) < 500'],
    http_req_failed: ['rate < 0.01'],
    health_check_success: ['rate > 0.99'], // <--- Custom: 99% success rate
  },

  scenarios: {
    // Scenario 1: Constant load
    constant_load: {
      executor: 'constant-vus',
      vus: 20,
      duration: '1m',
      startTime: '0s',
    },

    // Scenario 2: Ramping load (stress test pattern)
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 }, // <--- Ramp up to 50 users over 30 seconds
        { duration: '1m', target: 50 }, // <--- Stay at 50 users for 1 minute
        { duration: '30s', target: 100 }, // <--- Ramp up to 100 users over 30 seconds
        { duration: '1m', target: 100 }, // <--- Stay at 100 users for 1 minute
        { duration: '30s', target: 0 }, // <--- Ramp down to 0 users over 30 seconds
      ],
      startTime: '1m', // <--- Start 1 minute after constant_load scenario
    },
  },
};

const BASE_URL = V6_ENV.BASE_URL || 'http://localhost:8000';

export default function runLoadTest() {
  group('Health Check', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/health-check`);
    const duration = Date.now() - start;

    healthCheckDuration.add(duration);

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'has valid response': (r) => {
        try {
          // @ts-expect-error
          const body = JSON.parse(r.body);
          return body.status === 'OK';
        } catch {
          return false;
        }
      },
    });

    if (success) {
      healthCheckSuccess.add(1);
    } else {
      healthCheckErrors.add(1);
      healthCheckSuccess.add(0);
    }
  });

  sleep(Math.random() * 2 + 0.5); // <--- Random sleep between 0.5s and 2.5s
}

// Lifecycle hooks
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);

  // Verify server is up before running tests
  const res = http.get(`${BASE_URL}/api/health-check`);
  if (res.status !== 200) {
    throw new Error(`Server not ready. Status: ${res.status}`);
  }

  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log(`Load test completed. Started at: ${data.startTime}`);
}
