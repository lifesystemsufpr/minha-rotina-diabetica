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
- Exclusão de conta (soft delete) e seus efeitos: [`docs/account-deletion.md`](docs/account-deletion.md).
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

## Autenticação (JWT Bearer)

Variáveis obrigatórias no `.env`: `JWT_SECRET` (string longa e aleatória) e `JWT_EXPIRATION` (ex.: `1d`, o valor do `.env.example`). A aplicação não sobe sem elas. O payload do token tem só `sub` (id do usuário), mais `iat` e `exp`.

Fluxo: `POST /api/auth/register` → `POST /api/auth/login` (retorna `{ "accessToken": "..." }`) → enviar `Authorization: Bearer <accessToken>` nas rotas privadas.

### Como proteger uma rota

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // no controller inteiro ou em um método
@Controller('glicemias')
export class GlicemiasController {
  @Get()
  list(@CurrentUser('id') userId: string) {
    // userId vem do token; nunca leia o dono do recurso do body ou da query
  }
}
```

- Sem token, token inválido ou expirado: `401`.
- `@CurrentUser()` devolve `{ id }`; `@CurrentUser('id')` devolve só o id.
- O módulo do controller não precisa importar o `AuthModule`: o Guard usa a strategy `jwt`, já registrada globalmente pelo Passport.

### Teste manual no Swagger (`/api/docs`)

1. **Token válido:** `POST /auth/login`, copie o `accessToken`, clique em **Authorize**, cole o token e chame `GET /users/me` → `200`.
2. **Sem token:** clique em Authorize → Logout e chame `GET /users/me` → `401`.
3. **Token inválido:** autorize com o token alterado (mude os últimos caracteres) → `401`.
4. **Token expirado:** defina `JWT_EXPIRATION=10s` no `.env`, reinicie, faça login, espere 10 segundos e chame `GET /users/me` → `401`. Depois volte para o valor anterior.