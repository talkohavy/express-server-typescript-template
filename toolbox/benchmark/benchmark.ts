import autocannon, { type Result } from 'autocannon';
import express, { type Application } from 'express';
import { buildMockApp } from '../../src/mockApp';

const PORT = 8000;

interface BenchmarkConfig {
  title: string;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: string;
  headers?: Record<string, string>;
}

// Define the routes you want to benchmark
const benchmarks: BenchmarkConfig[] = [
  {
    title: 'Health Check',
    url: '/api/health-check',
    method: 'GET',
  },
  // Add more routes to benchmark here:
  // {
  //   title: 'Create Item',
  //   url: '/api/items',
  //   method: 'POST',
  //   body: JSON.stringify({ name: 'test' }),
  //   headers: { 'Content-Type': 'application/json' },
  // },
];

async function runBenchmark(config: BenchmarkConfig) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Benchmarking: ${config.title}`);
  console.log(`URL: ${config.url}`);
  console.log(`Method: ${config.method || 'GET'}`);
  console.log('='.repeat(60));

  const result = await autocannon({
    url: `http://localhost:${PORT}${config.url}`,
    connections: 100, // Number of concurrent connections
    duration: 10, // Duration in seconds
    pipelining: 10, // Number of pipelined requests per connection
    method: config.method || 'GET',
    body: config.body,
    headers: config.headers,
  });

  console.log('\nResults:');
  console.log(`  Requests/sec: ${result.requests.average.toFixed(2)}`);
  console.log(`  Latency (avg): ${result.latency.average.toFixed(2)}ms`);
  console.log(`  Latency (p99): ${result.latency.p99.toFixed(2)}ms`);
  console.log(`  Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`  Total requests: ${result.requests.total}`);
  console.log(`  Errors: ${result.errors}`);
  console.log(`  Timeouts: ${result.timeouts}`);

  return result;
}

async function main() {
  console.log('🚀 Starting Fastify Benchmark Suite\n');

  // Start the server
  const app = express() as unknown as Application;
  await buildMockApp(app);

  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });

  const results: Array<{ title: string; result: Result }> = [];

  try {
    for (const benchmark of benchmarks) {
      const result = await runBenchmark(benchmark);
      results.push({ title: benchmark.title, result });
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 BENCHMARK SUMMARY');
    console.log('='.repeat(60));
    console.log(`${'Route'.padEnd(30)} | ${'Req/s'.padEnd(12)} | ${'Latency (avg)'.padEnd(15)} | ${'p99'.padEnd(10)}`);
    console.log('-'.repeat(75));

    for (const { title, result } of results) {
      console.log(
        `${title.padEnd(30)} | ${result.requests.average.toFixed(0).padEnd(12)} | ${`${result.latency.average.toFixed(2)}ms`.padEnd(15)} | ${result.latency.p99.toFixed(2)}ms`,
      );
    }

    console.log('\n✅ Benchmark complete!');
  } finally {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
