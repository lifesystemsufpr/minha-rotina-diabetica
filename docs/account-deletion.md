# Exclusão de conta

`DELETE /api/users/me` (autenticado) exclui a conta do usuário do token.
A exclusão é **lógica** (*soft delete*): o registro continua no banco com
`usuarios.ativo = false`.

## O que acontece

| Item | Comportamento |
| --- | --- |
| Resposta | `204 No Content` |
| Login com a conta excluída | `401`, com a mesma mensagem genérica de credencial inválida |
| Token emitido antes da exclusão | Deixa de ser aceito: `401` em qualquer rota protegida (a `JwtStrategy` confere `ativo` a cada requisição) |
| Perfil, glicemias, insulinas e lembretes | Continuam no banco, associados ao usuário inativo. Nenhuma rota os devolve, porque todas exigem token válido |
| E-mail | Continua ocupado: um novo cadastro com o mesmo e-mail recebe `409` |
| Outros usuários | Não são afetados |

## Implementação

- Coluna `usuarios.ativo` (`boolean`, padrão `true`), criada pela migration `AddAtivoToUsuario`.
- `UsersService.deleteAccount` marca `ativo = false` (`404` se o usuário não existir).
- `AuthService.login` recusa usuário inativo.
- `JwtStrategy.validate` busca o usuário a cada requisição e recusa o token se ele não existir ou estiver inativo.

Testes: `test/account.e2e-spec.ts`.

## Decisões em aberto (liderança)

A task pede que a estratégia de exclusão seja definida com a liderança. Dois
pontos precisam dessa decisão:

1. **Reaproveitar o e-mail:** hoje uma conta excluída mantém o e-mail ocupado.
   Se a pessoa puder criar uma conta nova com o mesmo e-mail, o cadastro
   precisa tratar o caso.
2. **Retenção de dados pessoais e de saúde:** os dados ficam no banco por tempo
   indeterminado. Se for necessário apagá-los (por pedido do titular, por
   exemplo), é preciso definir uma exclusão física ou uma anonimização.
