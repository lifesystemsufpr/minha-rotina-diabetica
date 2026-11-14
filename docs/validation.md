# Validação de Requests

## Como funciona

A validação é feita de forma global, através do `ValidationPipe` criado em
`src/common/pipes/app-validation.pipe.ts` e registrado em `src/app.setup.ts`
(`configureApp`, usado pelo `main.ts` e pelos testes e2e). Isso significa que
**todo controller que receber um DTO tipado no `@Body()`, `@Query()` ou
`@Param()` já tem a validação aplicada automaticamente** — não é necessário
(e não deve ser feito) validar campos manualmente dentro do controller ou
service.

## Configuração aplicada

| Opção | Valor | Efeito |
| --- | --- | --- |
| `whitelist` | `true` | Remove do payload propriedades que não existem no DTO |
| `forbidNonWhitelisted` | `true` | Se vier propriedade extra, retorna 400 em vez de ignorar |
| `transform` | `true` | Converte o payload para uma instância real da classe do DTO |
| `transformOptions.enableImplicitConversion` | `true` | Converte tipos primitivos automaticamente (ex.: string → number) |
| `exceptionFactory` | `details` por campo | Monta o erro 400 no formato padrão, com a lista de campos inválidos |

O formato do erro de validação está descrito em [`docs/errors.md`](./errors.md).

## Regra para novos endpoints

1. Sempre criar um DTO em `<module>/dto/*.dto.ts` para o corpo da requisição.
2. Usar decorators do `class-validator` (`IsString`, `IsEmail`,
   `IsNotEmpty`, `IsDateString`, `MinLength`, etc.) para expressar as regras.
3. Documentar cada campo com `@ApiProperty()` para ele aparecer no Swagger.
4. Tipar o parâmetro do controller com o DTO (`@Body() dto: MeuDto`).
5. **Não** fazer `if` de validação manual no controller — se precisar de uma
   regra que o `class-validator` não cobre nativamente, criar um decorator
   customizado em `src/common/decorators`.

## Exemplo

Veja `src/modules/auth/dto/register.dto.ts` e
`src/modules/auth/auth.controller.ts` como referência de uso. Para query
string, veja `src/common/dto/date-range-query.dto.ts`.

## Testando

```bash
npm run test:e2e
```

O arquivo `test/auth-register.e2e-spec.ts` cobre:
- payload válido → 201
- cada campo inválido → 400 com o campo em `details`
- campo obrigatório ausente e corpo vazio → 400
- campo extra não previsto no DTO (ex.: `id`, `isAdmin`) → 400

A antiga rota de demonstração `POST /api/users`, que só ecoava o payload, foi
removida na revisão de segurança (era pública e não fazia nada).
