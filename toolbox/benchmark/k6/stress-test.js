import { check, sleep } from 'k6';
import http from 'k6/http';

// eslint-disable-next-line no-undef -- k6 environment variables
const V6_ENV = __ENV;

/**
 * Stress Test
 *
 * Push the system beyond normal load to find breaking points.
 * Useful for capacity planning and identifying bottlenecks.
 */
export const options = {
  thresholds: {
    http_req_duration: ['p(95) < 1000'], // More lenient under stress
    http_req_failed: ['rate < 0.10'], // Allow up to 10% errors under extreme load
  },

  stages: [
    // Warm up
    { duration: '30s', target: 50 },

    // Normal load
    { duration: '1m', target: 100 },

    // Push to stress
    { duration: '1m', target: 200 },

    // Beyond capacity (find breaking point)
    { duration: '1m', target: 300 },

    // Spike test
    { duration: '30s', target: 500 },

    // Recovery
    { duration: '1m', target: 100 },

    // Cool down
    { duration: '30s', target: 0 },
  ],
};

const BASE_URL = V6_ENV.BASE_URL || 'http://localhost:8000';

export default function runStressTest() {
  const res = http.get(`${BASE_URL}/api/health-check`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(0.5);
}

export function handleSummary(data) {
  const failedChecks = data.metrics.checks ? data.metrics.checks.values.fails : 0;
  const passedChecks = data.metrics.checks ? data.metrics.checks.values.passes : 0;
  const totalChecks = failedChecks + passedChecks;

  console.log('\n========== STRESS TEST SUMMARY ==========');
  console.log(`Total Requests: ${data.metrics.http_reqs?.values?.count || 0}`);
  console.log(`Failed Requests: ${data.metrics.http_req_failed?.values?.passes || 0}`);
  console.log(`Checks Passed: ${passedChecks}/${totalChecks}`);
  console.log(`Avg Response Time: ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms`);
  console.log(`p95 Response Time: ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms`);
  console.log(`p99 Response Time: ${(data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms`);
  console.log('==========================================\n');

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
