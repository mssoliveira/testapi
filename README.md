# @mssoliveira/test

[![npm](https://img.shields.io/npm/v/@mssoliveira/test)](https://www.npmjs.com/package/@mssoliveira/test)
[![Node.js](https://img.shields.io/node/v/@mssoliveira/test)](https://nodejs.org)
[![License](https://img.shields.io/npm/l/@mssoliveira/test)](LICENSE)

CLI para testes de API — rate limit, latência, stress e mais.

## Instalação

```bash
# Executar sem instalar
npx -p @mssoliveira/test rate-limit [opções]
npx -p @mssoliveira/test latency [opções]

# Instalar globalmente
npm install -g @mssoliveira/test
```

**Requisito:** Node.js >= 18

## Comandos

### `rate-limit`

Dispara N requisições contra um endpoint e exibe a distribuição de status HTTP — ideal para verificar se o rate limiting está funcionando corretamente.

```bash
npx -p @mssoliveira/test rate-limit --url <url> [opções]
```

| Opção | Alias | Descrição | Padrão |
|-------|-------|-----------|--------|
| `--url` | `-u` | URL a ser testada **(obrigatório)** | — |
| `--count` | `-n` | Total de requisições | `50` |
| `--concurrency` | `-c` | Requisições simultâneas por lote | todas de uma vez |
| `--delay` | `-d` | Delay entre lotes (ms) | `0` |
| `--method` | `-m` | Método HTTP | `GET` |
| `--header` | `-H` | Header `chave:valor` (repetível) | — |
| `--expected` | `-e` | Status esperado como sucesso | `200` |
| `--response-headers` | `-r` | Exibir response headers no relatório | — |

#### Exemplos

```bash
# 50 requisições simultâneas
npx -p @mssoliveira/test rate-limit -u https://api.exemplo.com/endpoint

# 100 req em lotes de 10, com 200ms entre lotes
npx -p @mssoliveira/test rate-limit -u https://api.exemplo.com/endpoint -n 100 -c 10 -d 200

# Com autenticação
npx -p @mssoliveira/test rate-limit -u https://api.exemplo.com/endpoint \
  -H "Authorization:Bearer seu-token" \
  -H "X-Api-Key:abc123"

# Testar endpoint POST esperando 201
npx -p @mssoliveira/test rate-limit -u https://api.exemplo.com/users -m POST -e 201

# Exibir response headers no relatório
npx -p @mssoliveira/test rate-limit -u https://api.exemplo.com/endpoint -r
```

#### Saída

```
Rate Limit Test
  URL:          https://api.exemplo.com/endpoint
  Método:       GET
  Requisições:  100
  Concorrência: 10

  Progresso: [█████████████████████████] 100/100

Resultados por Status:
────────────────────────────────────────────────
  200    85     (85.0%)  ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪
  429    15     (15.0%)  ▪▪▪▪▪

────────────────────────────────────────────────

Resumo:
  Total:           100
  Sucesso (200):   85 (85.0%)
  Bloqueado (429): 15 (15.0%)
  Duração:         1.23s
  Req/s:           81.3

Response Headers (última requisição):
────────────────────────────────────────────────
  connection          keep-alive
  content-type        application/json; charset=utf-8
  x-ratelimit-limit   100
  x-ratelimit-remaining  61
  x-ratelimit-reset   30
────────────────────────────────────────────────
```

## Uso como biblioteca

```typescript
import { runRateLimitTest } from '@mssoliveira/test';

const result = await runRateLimitTest({
  url: 'https://api.exemplo.com/endpoint',
  count: 100,
  concurrency: 10,
  delay: 200,
  method: 'GET',
  headers: { Authorization: 'Bearer token' },
  expectedStatus: 200,
  showResponseHeaders: true,
});

console.log(result.statusCounts);
console.log(result.successCount);
console.log(result.throttledCount);
console.log(result.responseHeaders);
```

### Tipos

```typescript
interface RateLimitOptions {
  url: string;
  count: number;
  concurrency?: number;         // padrão: count (todas simultâneas)
  delay?: number;               // ms entre lotes, padrão: 0
  method: string;
  headers?: Record<string, string>;
  expectedStatus: number;
  showResponseHeaders?: boolean;
}

interface RateLimitResult {
  statusCounts: Record<number, number>;
  totalRequests: number;
  durationMs: number;
  successCount: number;
  throttledCount: number;
  responseHeaders?: Record<string, string>;
}
```

## Licença

ISC
