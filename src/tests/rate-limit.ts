import chalk from 'chalk';

export interface RateLimitOptions {
  url: string;
  count: number;
  concurrency?: number;
  delay?: number;
  method: string;
  headers?: Record<string, string>;
  expectedStatus: number;
}

export interface RateLimitResult {
  statusCounts: Record<number, number>;
  totalRequests: number;
  durationMs: number;
  successCount: number;
  throttledCount: number;
}

async function sendRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
): Promise<number> {
  try {
    const res = await fetch(url, { method, headers });
    return res.status;
  } catch {
    return 0;
  }
}

async function runBatch(
  url: string,
  method: string,
  headers: Record<string, string>,
  size: number,
): Promise<number[]> {
  return Promise.all(Array.from({ length: size }, () => sendRequest(url, method, headers)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runRateLimitTest(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { url, count, method, headers = {}, expectedStatus, delay = 0 } = opts;
  const concurrency = opts.concurrency ?? count;

  console.log(chalk.bold('\nRate Limit Test'));
  console.log(`  URL:         ${chalk.cyan(url)}`);
  console.log(`  Método:      ${method}`);
  console.log(`  Requisições: ${count}`);
  console.log(`  Concorrência: ${concurrency}`);
  if (delay > 0) console.log(`  Delay:        ${delay}ms entre lotes`);
  console.log('');

  const start = Date.now();
  const statuses: number[] = [];
  let sent = 0;

  while (sent < count) {
    const batchSize = Math.min(concurrency, count - sent);
    const batch = await runBatch(url, method, headers, batchSize);
    statuses.push(...batch);
    sent += batchSize;

    const filled = Math.round((sent / count) * 25);
    const bar = '█'.repeat(filled) + '░'.repeat(25 - filled);
    process.stdout.write(`\r  Progresso: [${bar}] ${sent}/${count}`);

    if (sent < count && delay > 0) await sleep(delay);
  }

  process.stdout.write('\n\n');

  const durationMs = Date.now() - start;

  const statusCounts = statuses.reduce(
    (acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const successCount = statusCounts[expectedStatus] ?? 0;
  const throttledCount = statusCounts[429] ?? 0;

  printResults(
    { statusCounts, totalRequests: count, durationMs, successCount, throttledCount },
    expectedStatus,
  );

  return { statusCounts, totalRequests: count, durationMs, successCount, throttledCount };
}

function statusColor(status: number): chalk.Chalk {
  if (status === 0) return chalk.red;
  if (status < 300) return chalk.green;
  if (status < 400) return chalk.yellow;
  if (status === 429) return chalk.magenta;
  return chalk.red;
}

function printResults(result: RateLimitResult, expectedStatus: number): void {
  const { statusCounts, totalRequests, durationMs, successCount, throttledCount } = result;

  console.log(chalk.bold('Resultados por Status:'));
  console.log('─'.repeat(48));

  const sorted = Object.entries(statusCounts).sort(([a], [b]) => Number(a) - Number(b));
  for (const [status, count] of sorted) {
    const pct = ((count / totalRequests) * 100).toFixed(1);
    const color = statusColor(Number(status));
    const bar = '▪'.repeat(Math.round((count / totalRequests) * 30));
    const label = Number(status) === 0 ? 'ERR   ' : String(status).padEnd(6);
    console.log(`  ${color(label)} ${String(count).padEnd(6)} (${pct.padStart(5)}%)  ${chalk.gray(bar)}`);
  }

  console.log('─'.repeat(48));
  console.log(chalk.bold('\nResumo:'));
  console.log(`  Total:          ${totalRequests}`);
  console.log(
    `  Sucesso (${expectedStatus}):   ${chalk.green(String(successCount))} (${((successCount / totalRequests) * 100).toFixed(1)}%)`,
  );
  if (throttledCount > 0) {
    console.log(
      `  Bloqueado (429): ${chalk.magenta(String(throttledCount))} (${((throttledCount / totalRequests) * 100).toFixed(1)}%)`,
    );
  }
  console.log(`  Duração:        ${(durationMs / 1000).toFixed(2)}s`);
  console.log(`  Req/s:          ${((totalRequests / durationMs) * 1000).toFixed(1)}`);
  console.log('');
}
