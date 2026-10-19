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

Veja `src/modules/users/dto/create-user.dto.ts` e
`src/modules/users/users.controller.ts` como referência de uso.

## Testando

```bash
npm run test:e2e
```

O arquivo `test/users-validation.e2e-spec.ts` cobre:
- payload válido → 201
- campo obrigatório ausente → 400
- formato inválido (e-mail) → 400
- campo extra não previsto no DTO → 400
- vários campos inválidos → 400 com `details` listando cada campo
