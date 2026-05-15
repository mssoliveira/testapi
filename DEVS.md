# @mssoliveira/test - Desenvolvimento

[![npm](https://img.shields.io/npm/v/@mssoliveira/test)](https://www.npmjs.com/package/@mssoliveira/test)
[![Node.js](https://img.shields.io/node/v/@mssoliveira/test)](https://nodejs.org)
[![License](https://img.shields.io/npm/l/@mssoliveira/test)](LICENSE)

CLI para testes de API — rate limit, latência, stress e mais.

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

## Adicionar novos comandos

Cada comando vira um bin independente. Para adicionar `npx -p @mssoliveira/test newcommand`:

1. Criar `src/tests/newcommand.ts` com a lógica do teste
2. Criar `src/entries/newcommand.ts` com o Commander parseando os args
3. Adicionar o bin em `package.json`:

```json
"bin": {
  "rate-limit": "./dist/entries/rate-limit.js",
  "newcommand": "./dist/entries/newcommand.js"
}
```

## Publicação

Publicação no npm é automática via GitHub Actions ao criar uma tag:

```bash
npm version patch   # 0.0.2 → 0.0.3  (ou minor / major)
npm version patch && git push && git push --tags
```

O workflow `.github/workflows/publish.yml` dispara na tag, executa o build e publica no npm usando o secret `NPM_TOKEN`.