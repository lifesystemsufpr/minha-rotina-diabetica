# Exclusão de conta

`DELETE /api/users/me` (autenticado) exclui a conta do usuário do token.

## Decisão

A exclusão segue a LGPD (Lei 13.709/2018): o titular tem direito à eliminação
dos seus dados (art. 18, VI), e dados de saúde são dados pessoais sensíveis
(art. 5º, II). Como o app não tem obrigação legal de guardar esses registros
(são anotações do próprio paciente, não prontuário), eles são apagados.

Na mesma transação:

1. São **apagados** fisicamente: perfil, glicemias, aplicações de insulina,
   lembretes e tokens de recuperação de senha do usuário.
2. A linha de `usuarios` é **anonimizada e desativada**: `ativo = false`,
   nome e e-mail substituídos por valores sem dado pessoal, e o hash da senha
   trocado por um valor com o qual nenhuma senha confere.

A linha anonimizada fica só como registro técnico de que a conta existiu.
Ela não guarda nenhum dado pessoal.

## O que acontece

| Item | Comportamento |
| --- | --- |
| Resposta | `204 No Content` |
| Login com a conta excluída | `401`, com a mesma mensagem genérica de credencial inválida |
| Token emitido antes da exclusão | Deixa de ser aceito: `401` em qualquer rota protegida (a `JwtStrategy` confere `ativo` a cada requisição) |
| Perfil, glicemias, insulinas, lembretes | Apagados |
| E-mail | Liberado: a pessoa pode criar uma conta nova com o mesmo e-mail |
| Recuperação de senha | Não encontra mais a conta (o e-mail foi anonimizado) |
| Outros usuários | Não são afetados |

## Implementação

- `UsersService.deleteAccount` faz a exclusão e a anonimização numa transação (`404` se o usuário não existir, `409` se a conta já estiver inativa).
- `AuthService.login` recusa usuário inativo.
- `JwtStrategy.validate` busca o usuário a cada requisição e recusa o token se ele não existir ou estiver inativo.
- Coluna `usuarios.ativo` criada pela migration `AddAtivoToUsuario`.

Testes: `test/account.e2e-spec.ts`.

## Fora do escopo atual

- **Período de carência** (desfazer a exclusão em X dias): exige um job agendado para apagar depois. Pode ser adotado no futuro sem mudar o contrato.
- **Exportação dos dados antes da exclusão** (portabilidade, LGPD art. 18, V): fica para a task de relatórios em PDF.
