# Cadastro em duas etapas e perfil completo

Mudança de produto de nov/2026 (pedida pelo PM a partir dos testes de
integração com o app):

- o cadastro era um formulário único e grande;
- agora a pessoa cria a conta só com o básico e completa os dados de saúde
  depois;
- até completar, o app mostra só a Home;
- o **contato de emergência saiu** do produto. Só tinha entrado por estar no
  DCU e não tinha uso no app.

## Fluxo

```text
1. POST /api/auth/register   { nome, email, senha, confirmarSenha? }
                             → 201, perfilCompleto: false
2. POST /api/auth/login      → 200, user.perfilCompleto: false
3. App: perfilCompleto false → tela "Complete seu perfil" + só a Home
4. PATCH /api/profile        { dataNascimento, tipoDiabetes, alturaCm, pesoKg }
                             → 200, perfilCompleto: true
5. Todas as funcionalidades liberadas
```

O PATCH pode ser feito aos poucos (um campo por vez). O perfil só fica completo
quando os **quatro** campos estiverem preenchidos.

## O que é "perfil completo"

`dataNascimento`, `tipoDiabetes`, `alturaCm` e `pesoKg` preenchidos. A regra
está num lugar só: `src/modules/users/utils/perfil-completo.ts`.

O campo `perfilCompleto` aparece em:

| Rota | Onde |
| --- | --- |
| `POST /api/auth/register` | raiz da resposta |
| `POST /api/auth/login` | `user.perfilCompleto` |
| `GET /api/users/me` | raiz da resposta |
| `GET /api/profile` e `PATCH /api/profile` | raiz da resposta |

## O que fica bloqueado

Com o perfil incompleto, estas rotas respondem **403**:

- `/api/glycemias/**`
- `/api/insulin-applications/**`
- `/api/reminders/**`
- `/api/reports/**`
- `/api/dashboard`

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "code": "PERFIL_INCOMPLETO",
  "message": "Complete seu perfil (data de nascimento, tipo de diabetes, altura e peso) para usar esta funcionalidade.",
  "timestamp": "2026-11-14T12:00:00.000Z",
  "path": "/api/glycemias",
  "method": "GET"
}
```

O app deve decidir pelo `code`, não pelo texto da `message`. Sem token, a
resposta continua sendo 401 (o token é conferido antes do perfil).

Continuam liberadas: `/api/auth/**`, `/api/profile`, `/api/home/summary` e
`/api/users/me` (inclusive `DELETE`, para a exclusão de conta da LGPD
funcionar a qualquer momento).

**Como funciona:** os controllers das funcionalidades usam
`@ExigePerfilCompleto()` (`src/modules/profile/guards/perfil-completo.guard.ts`),
que aplica o `JwtAuthGuard` e depois o `PerfilCompletoGuard`. Rota nova de
funcionalidade deve usar o mesmo decorator.

## Contato de emergência

O contato de emergência saiu do produto (decisão do PM, nov/2026).

- **API:** `contatoEmergencia` não existe mais nos DTOs. Enviar o campo no
  cadastro ou no `PATCH /api/profile` responde 400. As respostas também não
  trazem o campo. O app atual (GliCare `dev`) não envia mais.
- **Banco:** a migration `1795339200000-RemoveContatoEmergenciaComCopia` tira
  as colunas `contato_emergencia_*` de `perfis` **sem perder os dados**.
  - Antes de apagar as colunas, ela copia os contatos preenchidos para a
    tabela `perfis_contato_emergencia_backup` (`usuario_id`, `nome`,
    `relacao`, `telefone`, `copiado_em`).
  - O `migration:revert` recria as colunas e devolve os contatos.
  - Bancos onde a migration antiga `RemoveContatoEmergencia` já tinha apagado
    as colunas só ganham a tabela vazia.
  - Ensaiada no MariaDB 10.4 nos dois casos: com dados (run, cópia conferida,
    revert com os contatos de volta, run de novo) e com as colunas já
    apagadas.
- **LGPD:** a tabela de cópia não é lida pela API. A exclusão de conta apaga a
  linha da pessoa junto com o resto. Quando a remoção estiver confirmada em
  produção, apague a tabela inteira (ver [`deploy-backup.md`](deploy-backup.md)).

## O que muda no app (GliCare)

0. **Antes de tudo, trocar a Home para `GET /api/home/summary`.** Hoje a Home
   do app monta o resumo chamando `/api/glycemias`,
   `/api/insulin-applications` e `/api/reminders`, que respondem 403 enquanto
   o perfil estiver incompleto. Sem essa troca, a Home quebra para quem acabou
   de se cadastrar. O mesmo vale para o dashboard e os relatórios do app, que
   também usam essas listas: com o perfil incompleto, mostrar o aviso no lugar
   deles.
1. Cadastro: só nome, e-mail, senha e confirmação. Os dados de saúde vão para
   uma tela de "Complete seu perfil".
2. Depois do login, ler `user.perfilCompleto`. Se for `false`, mostrar só a
   Home e um aviso/atalho para completar o perfil.
3. Tratar `403` com `code: "PERFIL_INCOMPLETO"` em qualquer rota levando para
   essa tela (por exemplo, se o perfil foi editado em outro aparelho).
4. Remover os campos de contato de emergência do cadastro e do perfil.

## Testes

- `test/cadastro-em-etapas.e2e-spec.ts`: o fluxo completo (cadastro básico,
  403 em todas as rotas bloqueadas, Home e perfil liberados, perfil parcial
  ainda bloqueado, liberação depois do PATCH, login com `perfilCompleto`).
- `src/modules/users/utils/perfil-completo.spec.ts`: a regra de completude.
- `test/auth-register.e2e-spec.ts` e `test/profile.e2e-spec.ts`:
  `contatoEmergencia` recusado com 400.
- `test/account.e2e-spec.ts`: a exclusão de conta apaga a cópia do contato.
