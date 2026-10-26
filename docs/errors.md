# Formato de erro da API

Todos os erros da API saem no mesmo formato, montado pelo filtro global
`src/common/filters/all-exceptions.filter.ts`. O tipo está em
`src/common/dto/error-response.dto.ts` e aparece no Swagger como
`ErrorResponseDto`.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `statusCode` | number | Código HTTP |
| `error` | string | Nome curto do erro HTTP (`Bad Request`, `Conflict`...) |
| `message` | string | Mensagem principal para exibir ao usuário |
| `timestamp` | string | Data e hora em ISO 8601 |
| `path` | string | Caminho da requisição, **sem** query string |
| `method` | string | Método HTTP |
| `details` | `{ field, messages[] }[]` | Só em erros de validação: um item por campo inválido |

## Exemplos

Erro de validação (400):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Erro de validação",
  "timestamp": "2026-10-02T12:00:00.000Z",
  "path": "/api/users",
  "method": "POST",
  "details": [
    { "field": "name", "messages": ["name must be longer than or equal to 3 characters"] },
    { "field": "email", "messages": ["email must be an email"] }
  ]
}
```

E-mail já cadastrado (409), lançado com `EmailAlreadyExistsException`:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "O e-mail \"maria@example.com\" já está cadastrado.",
  "timestamp": "2026-10-02T12:00:00.000Z",
  "path": "/api/auth/register",
  "method": "POST"
}
```

Erro inesperado (500). O detalhe vai só para o log do servidor:

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Erro interno do servidor. Tente novamente mais tarde.",
  "timestamp": "2026-10-02T12:00:00.000Z",
  "path": "/api/users",
  "method": "POST"
}
```

## Como lançar erros no código

Use as exceptions de domínio de `src/common/exceptions` ou as exceptions
nativas do Nest (`BadRequestException`, `NotFoundException`...). O filtro
converte todas para o formato acima; não monte respostas de erro à mão.

| Situação | Exception | Status |
| --- | --- | --- |
| E-mail duplicado no cadastro | `EmailAlreadyExistsException` | 409 |
| Login ou token inválido | `InvalidCredentialsException` | 401 |
| Sem permissão | `InsufficientPermissionsException` | 403 |
| Usuário não encontrado | `UserNotFoundException` | 404 |
