#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { runLatencyTest, LatencyOptions } from '../tests/latency';

const program = new Command();

program
  .name('latency')
  .description('Mede latência de uma API — min, p50, p90, p95, p99, max')
  .requiredOption('-u, --url <url>', 'URL a ser testada')
  .option('-n, --count <number>', 'Total de requisições', '50')
  .option('-c, --concurrency <number>', 'Requisições simultâneas por lote', '1')
  .option('-m, --method <method>', 'Método HTTP', 'GET')
  .option('-H, --header <header>', 'Adicionar header (chave:valor) — repetível', collectHeaders, [])
  .action(async (opts) => {
    const options: LatencyOptions = {
      url: opts.url,
      count: parseInt(opts.count),
      concurrency: parseInt(opts.concurrency),
      method: (opts.method as string).toUpperCase(),
      headers: parseHeaders(opts.header as string[]),
    };

    try {
      await runLatencyTest(options);
    } catch (err) {
      console.error(chalk.red(`Erro: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program.parse();

function collectHeaders(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

function parseHeaders(headers: string[]): Record<string, string> {
  return headers.reduce(
    (acc, h) => {
      const idx = h.indexOf(':');
      if (idx === -1) return acc;
      acc[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
      return acc;
    },
    {} as Record<string, string>,
  );
}
