import chalk from 'chalk';

export interface LatencyOptions {
  url: string;
  count: number;
  concurrency: number;
  method: string;
  headers?: Record<string, string>;
}

export interface LatencyResult {
  timings: number[];
  totalRequests: number;
  successCount: number;
  errorCount: number;
  durationMs: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

async function sendRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
): Promise<{ status: number; ms: number }> {
  const start = performance.now();
  try {
    const res = await fetch(url, { method, headers });
    return { status: res.status, ms: performance.now() - start };
  } catch {
    return { status: 0, ms: performance.now() - start };
  }
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runLatencyTest(opts: LatencyOptions): Promise<LatencyResult> {
  const { url, count, concurrency, method, headers = {} } = opts;

  console.log(chalk.bold('\nLatency Test'));
  console.log(`  URL:         ${chalk.cyan(url)}`);
  console.log(`  Método:      ${method}`);
  console.log(`  Requisições: ${count}`);
  console.log(`  Concorrência: ${concurrency}`);
  console.log('');

  const start = Date.now();
  const timings: number[] = [];
  let successCount = 0;
  let errorCount = 0;
  let sent = 0;

  while (sent < count) {
    const batchSize = Math.min(concurrency, count - sent);
    const batch = await Promise.all(
      Array.from({ length: batchSize }, () => sendRequest(url, method, headers)),
    );

    for (const r of batch) {
      timings.push(r.ms);
      if (r.status >= 200 && r.status < 300) successCount++;
      else errorCount++;
    }

    sent += batchSize;
    const filled = Math.round((sent / count) * 25);
    const bar = '█'.repeat(filled) + '░'.repeat(25 - filled);
    process.stdout.write(`\r  Progresso: [${bar}] ${sent}/${count}`);
  }

  process.stdout.write('\n\n');

  const durationMs = Date.now() - start;
  const sorted = [...timings].sort((a, b) => a - b);
  const mean = timings.reduce((a, b) => a + b, 0) / timings.length;

  const result: LatencyResult = {
    timings,
    totalRequests: count,
    successCount,
    errorCount,
    durationMs,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    p50: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };

  printResults(result);
  return result;
}

function bar(value: number, max: number, width = 30): string {
  const filled = Math.round((value / max) * width);
  return chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(width - filled));
}

function printResults(r: LatencyResult): void {
  const fmt = (ms: number) => `${ms.toFixed(2)}ms`;

  console.log(chalk.bold('Latência:'));
  console.log('─'.repeat(52));
  console.log(`  ${'Min'.padEnd(8)} ${fmt(r.min).padStart(10)}  ${bar(r.min, r.max)}`);
  console.log(`  ${'P50'.padEnd(8)} ${fmt(r.p50).padStart(10)}  ${bar(r.p50, r.max)}`);
  console.log(`  ${'P90'.padEnd(8)} ${fmt(r.p90).padStart(10)}  ${bar(r.p90, r.max)}`);
  console.log(`  ${'P95'.padEnd(8)} ${fmt(r.p95).padStart(10)}  ${bar(r.p95, r.max)}`);
  console.log(`  ${'P99'.padEnd(8)} ${fmt(r.p99).padStart(10)}  ${bar(r.p99, r.max)}`);
  console.log(`  ${'Max'.padEnd(8)} ${fmt(r.max).padStart(10)}  ${bar(r.max, r.max)}`);
  console.log(`  ${'Média'.padEnd(8)} ${fmt(r.mean).padStart(10)}`);
  console.log('─'.repeat(52));
  console.log(chalk.bold('\nResumo:'));
  console.log(`  Total:    ${r.totalRequests}`);
  console.log(`  Sucesso:  ${chalk.green(String(r.successCount))} (${((r.successCount / r.totalRequests) * 100).toFixed(1)}%)`);
  if (r.errorCount > 0) {
    console.log(`  Erros:    ${chalk.red(String(r.errorCount))} (${((r.errorCount / r.totalRequests) * 100).toFixed(1)}%)`);
  }
  console.log(`  Duração:  ${(r.durationMs / 1000).toFixed(2)}s`);
  console.log(`  Req/s:    ${((r.totalRequests / r.durationMs) * 1000).toFixed(1)}`);
  console.log('');
}
