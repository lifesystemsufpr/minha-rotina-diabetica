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

- Todas as rotas têm o prefixo `/api` (ex.: `POST /api/auth login`). No mobile, a `baseURL` deve terminar em `/api`.
- Todo erro sai no mesmo formato, com `details` por campo em erros de validação. Veja [`docs/errors.md`](docs/errors.md).
- Regras de validação de DTOs: [`docs/validation.md`](docs/validation.md).
- Exclusão de conta (LGPD) e seus efeitos: [`docs/account-deletion.md`](docs/account-deletion.md).
- Glicemias e aplicações de insulina (rotas, enums, datas e status): [`docs/glycemia-insulin.md`](docs/glycemia-insulin.md).
- Lembretes (rotas e status): [`docs/reminders.md`](docs/reminders.md).
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

### Contrato de cadastro e login

Fluxo de autenticação do app: **cadastro** cria a conta e o perfil inicial; **login** valida e-mail e senha e devolve o JWT usado nas rotas privadas.

> **Atenção (mobile):** o campo de senha se chama `senha`, não `password`. Qualquer campo que não esteja no contrato (incluindo `password`) é rejeitado com `400`, tanto no cadastro quanto no login. A senha nunca é alterada pela API (sem trim, sem conversão).

#### `POST /api/auth/register`

Cria o usuário e o perfil inicial na mesma transação: ou grava os dois, ou nenhum.

| Status | Quando |
| --- | --- |
| `201` | Conta e perfil criados |
| `400` | Payload inválido, campo obrigatório ausente ou campo extra enviado |
| `409` | E-mail já cadastrado (a comparação ignora maiúsculas/minúsculas) |

**Request**

```json
{
  "nome": "Maria Silva",
  "email": "maria@example.com",
  "senha": "senha-forte-123",
  "confirmarSenha": "senha-forte-123",
  "dataNascimento": "1995-04-12",
  "tipoDiabetes": "TIPO_1",
  "alturaCm": 170.5,
  "pesoKg": 68.3,
  "contatoEmergencia": {
    "nome": "João Silva",
    "relacao": "Pai",
    "telefone": "(41) 99999-9999"
  }
}
```

**Regras dos campos**

| Campo | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| `nome` | string | sim | Não vazio, até 100 caracteres. Espaços nas pontas são removidos |
| `email` | string | sim | E-mail válido, até 100 caracteres. Salvo em minúsculas e sem espaços nas pontas |
| `senha` | string | sim | De 8 a 72 caracteres, com letras e números (regra do protótipo). Armazenada somente como hash (bcrypt) |
| `confirmarSenha` | string | não | Se enviada, deve ser igual a `senha`. Nunca é persistida nem devolvida |
| `dataNascimento` | string | sim | Formato `AAAA-MM-DD`, data real (rejeita `2020-02-30`), não futura e a partir de `1900-01-01` |
| `tipoDiabetes` | string | sim | `TIPO_1`, `TIPO_2` ou `OUTRO` |
| `alturaCm` | number | sim | De 30 a 272, até 2 casas decimais. Aceita número ou texto numérico (`"170.5"`) |
| `pesoKg` | number | sim | De 1 a 500, até 2 casas decimais. Aceita número ou texto numérico (`"68.3"`) |
| `contatoEmergencia.nome` | string | sim | Não vazio, até 100 caracteres |
| `contatoEmergencia.relacao` | string | sim | Não vazio, até 50 caracteres |
| `contatoEmergencia.telefone` | string | sim | De 8 a 20 caracteres; somente números, espaços e `+ ( ) -` |

**Response `201`**

```json
{
  "id": "3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f",
  "nome": "Maria Silva",
  "email": "maria@example.com",
  "createdAt": "2026-10-09T15:00:00.000Z",
  "perfil": {
    "dataNascimento": "1995-04-12",
    "tipoDiabetes": "TIPO_1",
    "alturaCm": 170.5,
    "pesoKg": 68.3,
    "contatoEmergencia": {
      "nome": "João Silva",
      "relacao": "Pai",
      "telefone": "(41) 99999-9999"
    }
  }
}
```

A resposta nunca contém senha, `confirmarSenha` nem hash. O cadastro **não** faz login automático: para obter o token, chame `POST /api/auth/login`.

#### `POST /api/auth/login`

| Status | Quando |
| --- | --- |
| `200` | Credenciais válidas |
| `400` | Payload inválido ou campo extra |
| `401` | E-mail ou senha incorretos |

**Request**

```json
{ "email": "maria@example.com", "senha": "senha-forte-123" }
```

| Campo | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| `email` | string | sim | E-mail válido. Espaços e maiúsculas são normalizados (`" Maria@Example.com "` funciona) |
| `senha` | string | sim | Não vazia, até 72 caracteres. Enviada exatamente como digitada |

**Response `200`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f",
    "nome": "Maria Silva",
    "email": "maria@example.com"
  }
}
```

- Envie o token nas rotas privadas: `Authorization: Bearer <accessToken>`.
- Validade definida por `JWT_EXPIRATION` (padrão do `.env.example`: `1d`). Quando expira, a rota privada responde `401` e o app deve pedir novo login.
- O payload do token tem somente `sub` (id do usuário), `iat` e `exp`.

**Credenciais inválidas (`401`)**

Senha errada e e-mail não cadastrado recebem exatamente a mesma resposta, para não revelar quais e-mails existem na base:

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "E-mail ou senha inválidos",
  "timestamp": "2026-10-09T15:00:00.000Z",
  "path": "/api/auth/login",
  "method": "POST"
}
```

#### Erros

Todos os erros seguem o formato padrão descrito em [`docs/errors.md`](docs/errors.md). Em `400`, o campo `details` traz um item por campo inválido, e campos aninhados usam ponto (`contatoEmergencia.telefone`):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Erro de validação",
  "timestamp": "2026-10-09T15:00:00.000Z",
  "path": "/api/auth/register",
  "method": "POST",
  "details": [
    { "field": "senha", "messages": ["senha must be longer than or equal to 8 characters"] },
    { "field": "contatoEmergencia.telefone", "messages": ["telefone deve conter apenas números, espaços e + ( ) - (8 a 20 caracteres)"] }
  ]
}
```

Campo não previsto no contrato também gera `400`, com a mensagem `property <campo> should not exist` no item correspondente de `details`.

`409` no cadastro:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "O e-mail \"maria@example.com\" já está cadastrado.",
  "timestamp": "2026-10-09T15:00:00.000Z",
  "path": "/api/auth/register",
  "method": "POST"
}
```

#### Garantias de segurança

- A senha só existe em texto puro dentro do `AuthService`, durante o hash. A coluna `senha_hash` tem `select: false`, então nenhuma consulta comum a traz.
- O e-mail é único: verificado antes de criar a conta e protegido por índice UNIQUE no banco contra cadastros simultâneos.
- O backend não confia no cliente: `id`, `isAdmin`, `senhaHash` e qualquer outra propriedade fora do contrato são rejeitados.
- O login gasta o mesmo tempo para e-mail inexistente e senha errada, o que dificulta descobrir e-mails cadastrados pelo tempo de resposta.

#### Teste rápido (curl)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria Silva","email":"maria@example.com","senha":"senha-forte-123","dataNascimento":"1995-04-12","tipoDiabetes":"TIPO_1","alturaCm":170.5,"pesoKg":68.3,"contatoEmergencia":{"nome":"João Silva","relacao":"Pai","telefone":"(41) 99999-9999"}}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@example.com","senha":"senha-forte-123"}'
```

#### `GET /api/users/me` (Bearer)
200 → `{ id, nome, email, createdAt, perfil: { dataNascimento, tipoDiabetes, alturaCm, pesoKg, contatoEmergencia: { nome, relacao, telefone } } }`
401 → token ausente, inválido, expirado ou usuário removido. Nunca retorna senha/hash.

#### `POST /api/auth/forgot-password`
Body: `{ "email": "maria@example.com" }`
200 → `{ "message": "Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha." }`
(sempre igual, exista a conta ou não). 400 → e-mail inválido.
Token: uso único, expira em `PASSWORD_RESET_TOKEN_TTL_MINUTES` (padrão 30), guardado só como hash.

#### `POST /api/auth/reset-password`
Body: `{ "token": "<recebido por e-mail>", "novaSenha": "8 a 72 caracteres, com letras e números" }`
200 → `{ "message": "Senha redefinida com sucesso." }`
400 → payload inválido ou token inválido/expirado/já usado (mesma mensagem: "Token inválido ou expirado").

### Autorização de rotas privadas

- Toda rota fora de `/auth/*` precisa de `JwtAuthGuard`. O teste `test/authorization.e2e-spec.ts` lista as rotas registradas e **falha** se aparecer rota nova sem guard que não esteja na lista `ROTAS_PUBLICAS` do próprio teste.
- O dono do registro vem sempre de `@CurrentUser('id')`, nunca de body, query ou param. Campos como `usuarioId` ou `userId` no payload são rejeitados com `400`.
- Busque registros por `{ id, user: { id: userId } }`. Registro de outro usuário responde `404`, igual a um id inexistente, para não revelar que ele existe. O projeto não usa `403` nesse caso.
- Respostas usam DTOs de saída explícitos (nunca a entidade), para não vazar senha/hash nem campos internos.
- Detalhes dos códigos de erro: [`docs/errors.md`](docs/errors.md).