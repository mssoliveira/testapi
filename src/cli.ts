#!/usr/bin/env node
import { Command } from 'commander';
import { registerRateLimitCommand } from './commands/rate-limit';

const program = new Command();

program
  .name('test-api')
  .description('CLI para testes de API — rate limit, latência, stress e mais')
  .version('0.1.0');

registerRateLimitCommand(program);

program.parse();
