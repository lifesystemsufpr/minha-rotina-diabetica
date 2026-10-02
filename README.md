# Minha Rotina Diabética - API

Backend do projeto Minha Rotina Diabética, construído com NestJS.

## Stack
- NestJS 11 + TypeScript
- REST API
- Banco: MySQL com TypeORM 0.3 (schema versionado por migrations)
- Autenticação: JWT Bearer Token
- Documentação: Swagger/OpenAPI

## Como rodar o projeto

1. Clone o repositório e entre na pasta
2. Instale as dependências (use `npm ci` para instalar exatamente o que está no `package-lock.json`):
   ```bash
   npm ci
   ```
3. Copie o arquivo de exemplo de variáveis de ambiente e preencha com seus dados locais:
   ```bash
   cp .env.example .env
   ```
4. Crie o banco no MySQL (o nome deve ser o mesmo de `DATABASE_NAME`):
   ```sql
   CREATE DATABASE rotina_diabetica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
5. Crie as tabelas aplicando as migrations:
   ```bash
   npm run migration:run
   ```
6. Rode o projeto em modo de desenvolvimento:
   ```bash
   npm run start:dev
   ```
7. Acesse http://localhost:3000/api

## Convenções da API

- Todas as rotas têm o prefixo `/api` (ex.: `POST /api/users`). No mobile, a `baseURL` deve terminar em `/api`.
- Todo erro sai no mesmo formato, com `details` por campo em erros de validação. Veja [`docs/errors.md`](docs/errors.md).
- Regras de validação de DTOs: [`docs/validation.md`](docs/validation.md).
- CORS: sem `CORS_ORIGIN`, qualquer origem é aceita (desenvolvimento). Em produção, defina `CORS_ORIGIN` com as origens separadas por vírgula.

## Documentação da API (Swagger)

Com a API rodando, a documentação interativa fica em:

http://localhost:3000/api/docs

Para testar rotas protegidas, clique em **Authorize** e cole o token JWT.
Em rotas protegidas, use `@ApiBearerAuth()` (sem argumentos) no controller.

## Banco de dados e migrations

O schema do banco só muda por migration (`synchronize` está desligado).

| Comando | O que faz |
| --- | --- |
| `npm run migration:run` | Aplica as migrations pendentes |
| `npm run migration:revert` | Desfaz a última migration aplicada |
| `npm run migration:show` | Lista as migrations e quais já foram aplicadas |
| `npm run migration:generate -- src/database/migrations/NomeDaMudanca` | Gera uma migration comparando as entidades com o banco |

Ao alterar uma entidade, gere a migration, confira o arquivo gerado e commite-o junto.

## Testes

```bash
npm run test       # testes unitários
npm run test:e2e   # testes e2e (usam SQLite em memória, não precisam de MySQL)
```

## Estrutura de pastas

- `src/modules`: módulos de domínio (auth, users, profile, glycemia, insulin, reminders)
- `src/common`: guards, decorators, exceptions e filters compartilhados
- `src/config`: configurações da aplicação (ex.: Swagger)
- `src/database`: configuração de conexão com o banco e migrations

## Importante
- Nunca commite o arquivo `.env`
- Cada integrante deve criar seu próprio `.env` local a partir do `.env.example`
- Variável de ambiente nova deve ser adicionada ao `.env.example` no mesmo PR, sem valor secreto
