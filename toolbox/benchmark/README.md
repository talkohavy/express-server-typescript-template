# Benchmarking & Load Testing

This directory contains tools and scripts for measuring the performance of your Fastify server. We use two complementary tools:

- **Autocannon** - Quick HTTP benchmarking (requests per second, latency)
- **k6** - Full-featured load testing with scenarios, thresholds, and metrics

---

## Why Benchmark & Load Test?

| Purpose                  | Question It Answers                            |
| ------------------------ | ---------------------------------------------- |
| **Performance baseline** | "How fast is my endpoint?"                     |
| **Capacity planning**    | "How many users can my server handle?"         |
| **Regression detection** | "Did my changes make things slower?"           |
| **Breaking point**       | "At what load does my server fail?"            |
| **SLA validation**       | "Does my API meet response time requirements?" |

---

## Quick Start

```bash
# Make sure the server is running first
pnpm dev

# Then in another terminal:
pnpm benchmark        # Autocannon benchmark
pnpm k6:smoke         # Quick k6 sanity check
pnpm k6:health        # k6 health check test
pnpm k6:load          # Full k6 load test
pnpm k6:stress        # k6 stress test (find breaking points)
```

---

## Tools Comparison

| Aspect              | Autocannon                | k6                                        |
| ------------------- | ------------------------- | ----------------------------------------- |
| **Best for**        | Quick endpoint benchmarks | Realistic load scenarios                  |
| **Setup**           | npm package               | System binary (brew install k6)           |
| **Scripting**       | Programmatic TypeScript   | JavaScript with k6 API                    |
| **User simulation** | Concurrent connections    | Virtual Users (VUs) with behaviors        |
| **Metrics**         | Basic (req/s, latency)    | Rich (custom metrics, thresholds, checks) |
| **CI/CD ready**     | ✅                        | ✅ (with pass/fail thresholds)            |

---

## File Structure

```
benchmark/
├── README.md              # This file
├── benchmark.ts           # Autocannon benchmark script
└── k6/
    ├── smoke-test.js      # Quick sanity check (1 VU, 10s)
    ├── health-check.js    # Health endpoint test with ramping
    ├── load-test.js       # Full load test with scenarios
    └── stress-test.js     # Stress test to find breaking points
```

---

## Autocannon (Quick Benchmarks)

### What is it?

[Autocannon](https://github.com/mcollina/autocannon) is a fast HTTP benchmarking tool written in Node.js. It's perfect for quick "how fast is this endpoint?" checks.

### Usage

```bash
# Run the benchmark suite (starts server internally)
pnpm benchmark

# Quick ad-hoc benchmark against running server
pnpm benchmark:quick

# Manual autocannon command
npx autocannon -c 100 -d 10 -p 10 http://localhost:8000/api/health-check
```

### Options Explained

| Flag     | Meaning                              |
| -------- | ------------------------------------ |
| `-c 100` | 100 concurrent connections           |
| `-d 10`  | Run for 10 seconds                   |
| `-p 10`  | 10 pipelined requests per connection |

### Output Metrics

- **Requests/sec** - Throughput (higher is better)
- **Latency avg** - Average response time (lower is better)
- **Latency p99** - 99th percentile response time
- **Throughput** - Data transferred per second
- **Errors** - Failed requests (should be 0)

### Customizing

Edit `benchmark/benchmark.ts` to add more routes:

```typescript
const benchmarks: BenchmarkConfig[] = [
  {
    title: 'Health Check',
    url: '/api/health-check',
    method: 'GET',
  },
  {
    title: 'Create User',
    url: '/api/users',
    method: 'POST',
    body: JSON.stringify({ name: 'test', email: 'test@example.com' }),
    headers: { 'Content-Type': 'application/json' },
  },
];
```

---

## k6 (Load Testing)

### What is it?

[k6](https://k6.io) by Grafana Labs is a modern load testing tool. It simulates virtual users (VUs) performing realistic behaviors, with support for thresholds, checks, and custom metrics.

### Installation

```bash
# macOS
brew install k6

# Other platforms: https://k6.io/docs/get-started/installation/
```

### k6 Lifecycle

When you run a k6 script, it executes these exported functions in order:

```
┌─────────────────────────────────────────────────────────┐
│  k6 run script.js                                       │
├─────────────────────────────────────────────────────────┤
│  1. setup()           ← Runs ONCE before VUs start      │
├─────────────────────────────────────────────────────────┤
│  2. default()         ← Main test, runs by each VU      │
│     └─ VU 1: iteration 1, 2, 3...                       │
│     └─ VU 2: iteration 1, 2, 3...                       │
│     └─ VU N: iteration 1, 2, 3...                       │
├─────────────────────────────────────────────────────────┤
│  3. teardown()        ← Runs ONCE after all VUs stop    │
├─────────────────────────────────────────────────────────┤
│  4. handleSummary()   ← Processes and outputs results   │
└─────────────────────────────────────────────────────────┘
```

---

## k6 Test Types

### 1. Smoke Test (`k6:smoke`)

**Purpose:** Quick sanity check before deployments.

```bash
pnpm k6:smoke
```

| Setting       | Value                     |
| ------------- | ------------------------- |
| Virtual Users | 1                         |
| Duration      | 10 seconds                |
| Use Case      | Pre-deployment validation |

**When to use:**

- Before every deployment
- After infrastructure changes
- Quick "is it working?" check

---

### 2. Health Check Test (`k6:health`)

**Purpose:** Test the health endpoint with ramping users.

```bash
pnpm k6:health
```

| Stage     | Duration | Target VUs |
| --------- | -------- | ---------- |
| Ramp up   | 10s      | 0 → 10     |
| Ramp up   | 30s      | 10 → 50    |
| Sustain   | 1m       | 50         |
| Ramp down | 10s      | 50 → 0     |

**When to use:**

- Verify health check endpoint performance
- Quick load verification

---

### 3. Load Test (`k6:load`)

**Purpose:** Verify system handles expected production load.

```bash
pnpm k6:load
```

**Scenarios:**

1. **Constant load** - 20 VUs for 1 minute
2. **Ramping load** - 0 → 50 → 100 → 0 VUs over several minutes

**Features:**

- Custom metrics (health_check_duration, health_check_success)
- Setup/teardown lifecycle hooks
- Multiple scenarios running in sequence

**When to use:**

- Before major releases
- After performance-related changes
- Regular performance regression checks

---

### 4. Stress Test (`k6:stress`)

**Purpose:** Push beyond normal load to find breaking points.

```bash
pnpm k6:stress
```

| Stage     | Duration | Target VUs | Purpose         |
| --------- | -------- | ---------- | --------------- |
| Warm up   | 30s      | 50         | Baseline        |
| Normal    | 1m       | 100        | Expected load   |
| Stress    | 1m       | 200        | Above normal    |
| Breaking  | 1m       | 300        | Find limits     |
| Spike     | 30s      | 500        | Extreme spike   |
| Recovery  | 1m       | 100        | Can it recover? |
| Cool down | 30s      | 0          | Graceful end    |

**When to use:**

- Capacity planning
- Before scaling infrastructure
- Finding bottlenecks
- Validating auto-scaling

---

## Thresholds (Pass/Fail Criteria)

k6 thresholds define success criteria. If thresholds fail, k6 exits with code 1 (useful for CI/CD).

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95) < 200'],  // 95% of requests under 200ms
    http_req_failed: ['rate < 0.01'],     // Less than 1% errors
  },
};
```

Common threshold patterns:

| Threshold     | Meaning                     |
| ------------- | --------------------------- |
| `p(95) < 200` | 95th percentile under 200ms |
| `p(99) < 500` | 99th percentile under 500ms |
| `avg < 100`   | Average under 100ms         |
| `rate < 0.01` | Less than 1% failure rate   |
| `rate > 0.99` | More than 99% success rate  |

---

## Testing Against Different Environments

Pass the `BASE_URL` environment variable to test other environments:

```bash
# Local (default)
pnpm k6:load

# Staging
k6 run -e BASE_URL=https://staging.example.com benchmark/k6/load-test.js

# Production (be careful!)
k6 run -e BASE_URL=https://api.example.com benchmark/k6/smoke-test.js
```

---

## Interpreting Results

### Good Results ✅

```
http_req_duration: avg=2.5ms  p(95)=5ms  p(99)=10ms
http_req_failed:   0.00%
checks:            100.00% ✓ 5000 ✗ 0
```

### Warning Signs ⚠️

- **High p99 vs avg** - Some requests are very slow (investigate outliers)
- **Increasing latency under load** - Server struggling to keep up
- **Errors appearing** - Timeouts, connection refused, 5xx responses

### Bad Results ❌

```
http_req_duration: avg=500ms  p(95)=2s   p(99)=5s
http_req_failed:   15.00%
checks:            85.00% ✓ 4250 ✗ 750
```

---

## Best Practices

1. **Run benchmarks on consistent hardware** - Results vary by machine
2. **Warm up the server first** - Cold starts skew results
3. **Disable logging during benchmarks** - I/O impacts performance
4. **Test realistic payloads** - Don't just test empty responses
5. **Run multiple times** - Look for consistency
6. **Monitor server resources** - CPU, memory, connections during tests
7. **Test in isolation** - No other processes competing for resources

---

## Resources

- [Fastify Benchmarking Guide](https://fastify.dev/docs/latest/Guides/Benchmarking/)
- [k6 Documentation](https://k6.io/docs/)
- [Autocannon GitHub](https://github.com/mcollina/autocannon)
- [k6 GitHub](https://github.com/grafana/k6)
- [Load Testing Best Practices](https://grafana.com/load-testing/load-testing-best-practices/)
