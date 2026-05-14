# test-api

[![npm](https://img.shields.io/npm/v/test-api)](https://www.npmjs.com/package/test-api)
[![Node.js](https://img.shields.io/node/v/test-api)](https://nodejs.org)
[![License](https://img.shields.io/npm/l/test-api)](LICENSE)

CLI para testes de API — rate limit, latência, stress e mais.

## Instalação

```bash
# Executar sem instalar
npx test-api <comando> [opções]

# Instalar globalmente
npm install -g test-api
```

**Requisito:** Node.js >= 18

## Comandos

### `rate-limit` (alias: `rl`)

Dispara N requisições contra um endpoint e exibe a distribuição de status HTTP — ideal para verificar se o rate limiting está funcionando corretamente.

```bash
test-api rate-limit --url <url> [opções]
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

#### Exemplos

```bash
# 50 requisições simultâneas
test-api rate-limit -u https://api.exemplo.com/endpoint

# 100 req em lotes de 10, com 200ms entre lotes
test-api rl -u https://api.exemplo.com/endpoint -n 100 -c 10 -d 200

# Com autenticação
test-api rl -u https://api.exemplo.com/endpoint \
  -H "Authorization:Bearer seu-token" \
  -H "X-Api-Key:abc123"

# Testar endpoint POST esperando 201
test-api rl -u https://api.exemplo.com/users -m POST -e 201
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
```

## Uso como biblioteca

```typescript
import { runRateLimitTest } from 'test-api';

const result = await runRateLimitTest({
  url: 'https://api.exemplo.com/endpoint',
  count: 100,
  concurrency: 10,
  delay: 200,
  method: 'GET',
  headers: { Authorization: 'Bearer token' },
  expectedStatus: 200,
});

console.log(result.statusCounts);
console.log(result.successCount);
console.log(result.throttledCount);
```

### Tipos

```typescript
interface RateLimitOptions {
  url: string;
  count: number;
  concurrency?: number;  // padrão: count (todas simultâneas)
  delay?: number;        // ms entre lotes, padrão: 0
  method: string;
  headers?: Record<string, string>;
  expectedStatus: number;
}

interface RateLimitResult {
  statusCounts: Record<number, number>;
  totalRequests: number;
  durationMs: number;
  successCount: number;
  throttledCount: number;
}
```

## Desenvolvimento

```bash
# Clonar e instalar
git clone <repo>
pnpm install

# Rodar sem build
pnpm dev rate-limit -u https://api.exemplo.com/endpoint

# Build
pnpm build

# Rodar após build
node dist/cli.js rate-limit -u https://api.exemplo.com/endpoint
```

## Adicionar novos testes

1. Criar `src/tests/meu-teste.ts` com a lógica
2. Criar `src/commands/meu-teste.ts` com `registerMeuTesteCommand(program)`
3. Importar e registrar em `src/cli.ts`

```typescript
// src/cli.ts
import { registerMeuTesteCommand } from './commands/meu-teste';

registerMeuTesteCommand(program);
```

## Publicação

Publicação no npm é automática via GitHub Actions ao criar uma tag:

```bash
npm version patch   # 0.0.2 → 0.0.3  (ou minor / major)
git push && git push --tags
```

O workflow `.github/workflows/publish.yml` dispara na tag, executa o build e publica no npm usando o secret `NPM_TOKEN`.

## Licença

ISC
