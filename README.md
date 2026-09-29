# Minha Rotina Diabética - API

Backend do projeto Minha Rotina Diabética, construído com NestJS.

## Stack
- NestJS + TypeScript
- REST API
- Autenticação: JWT Bearer Token
- Documentação: Swagger/OpenAPI

## Como rodar o projeto

1. Clone o repositório e entre na pasta
2. Instale as dependências:
   ```bash
   npm install
   npm install @nestjs/swagger@11
   ```
3. Copie o arquivo de exemplo de variáveis de ambiente e preencha com seus dados locais:
   ```bash
   cp .env.example .env
   ```
4. Rode o projeto em modo de desenvolvimento:
   ```bash
   npm run start:dev
   ```
5. Acesse http://localhost:3000

## Estrutura de pastas

- `src/modules`: módulos de domínio (auth, users, profile, glycemia, insulin)
- `src/common`: guards, decorators, exceptions e filters compartilhados
- `src/config`: configuração de variáveis de ambiente
- `src/database`: configuração de conexão com o banco e migrations

## Importante
- Nunca commite o arquivo `.env`
- Cada integrante deve criar seu próprio `.env` local a partir do `.env.example`