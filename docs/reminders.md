# Lembretes

Rotas protegidas por JWT. O dono vem sempre do token; registro de outro
usuário é tratado como inexistente (404). `:id` precisa ser um UUID.

| Método e rota | Corpo | Resposta |
| --- | --- | --- |
| `POST /api/reminders` | `{ titulo, dataHora }` | 201; o status nasce `ATIVO` |
| `GET /api/reminders` | | 200, ordenado por `dataHora` (mais cedo primeiro) |
| `GET /api/reminders/:id` | | 200 ou 404 |
| `PATCH /api/reminders/:id` | `titulo` e/ou `dataHora` | 200; corpo vazio é 400 |
| `PATCH /api/reminders/:id/status` | `{ status: "ATIVO" \| "INATIVO" }` | 200 (o switch da tela) |
| `DELETE /api/reminders/:id` | | 204 |

- `titulo`: texto livre de 1 a 150 caracteres (espaços nas pontas são removidos).
- `dataHora`: ISO 8601 com fuso (ex.: `2026-10-25T08:00:00-03:00`); a resposta volta em UTC.
- O status só muda pela rota `/status`; `PATCH /:id` e `POST` recusam `status` (400).
- Exclusão física. A exclusão da conta apaga os lembretes do usuário (ver `docs/account-deletion.md`).
