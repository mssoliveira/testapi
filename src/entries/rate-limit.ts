#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { runRateLimitTest, RateLimitOptions } from '../tests/rate-limit';

const program = new Command();

program
  .name('rate-limit')
  .description('Testa comportamento de rate limiting de uma API')
  .requiredOption('-u, --url <url>', 'URL a ser testada')
  .option('-n, --count <number>', 'Total de requisições', '50')
  .option('-c, --concurrency <number>', 'Requisições simultâneas por lote (padrão: todas de uma vez)')
  .option('-d, --delay <ms>', 'Delay entre lotes em milissegundos', '0')
  .option('-m, --method <method>', 'Método HTTP', 'GET')
  .option('-H, --header <header>', 'Adicionar header (chave:valor) — repetível', collectHeaders, [])
  .option('-e, --expected <status>', 'Status HTTP esperado como sucesso', '200')
  .option('-r, --response-headers', 'Exibir response headers no relatório')
  .action(async (opts) => {
    const options: RateLimitOptions = {
      url: opts.url,
      count: parseInt(opts.count),
      concurrency: opts.concurrency != null ? parseInt(opts.concurrency) : undefined,
      delay: parseInt(opts.delay),
      method: (opts.method as string).toUpperCase(),
      headers: parseHeaders(opts.header as string[]),
      expectedStatus: parseInt(opts.expected),
      showResponseHeaders: opts.responseHeaders as boolean,
    };

    try {
      await runRateLimitTest(options);
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
