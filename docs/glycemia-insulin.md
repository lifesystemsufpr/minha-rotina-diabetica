# Glicemias e aplicações de insulina

Rotas protegidas por JWT (`Authorization: Bearer <token>`). O dono de cada
registro vem **sempre do token**; o corpo não aceita `usuarioId` (400).
Registro de outro usuário é tratado como inexistente (404).

## Rotas

| Método e rota | Resposta |
| --- | --- |
| `POST /api/glycemias` | 201 com o registro |
| `GET /api/glycemias?startDate&endDate&momento` | 200 com a lista (vazia é `[]`) |
| `GET /api/glycemias/:id` | 200, ou 404 |
| `PATCH /api/glycemias/:id` | 200 com o registro atualizado |
| `DELETE /api/glycemias/:id` | 204 |
| `POST /api/insulin-applications` | 201 com o registro |
| `GET /api/insulin-applications?startDate&endDate&tipo` | 200 com a lista |
| `GET/PATCH/DELETE /api/insulin-applications/:id` | 200 / 200 / 204, ou 404 |

`:id` precisa ser um UUID; outro formato retorna 400.

## Campos

**Glicemia:** `valor` (mg/dL, maior que zero, até 999,99), `momento`,
`dataHora` (ISO 8601) e `observacao` opcional (até 255 caracteres).

**Insulina:** `tipo` (texto, até 50), `doseUi` (UI, maior que zero, até
9999,99), `localAplicacao`, `dataHora` (ISO 8601) e `observacao` opcional.

| Enum | Valores | Fonte |
| --- | --- | --- |
| `momento` | `JEJUM`, `ANTES_CAFE`, `APOS_CAFE`, `ANTES_ALMOCO`, `APOS_ALMOCO`, `ANTES_JANTAR`, `APOS_JANTAR` | Task "[BACK][GLICEMIA] Criar entidade e DTOs" |
| `localAplicacao` | `ABDOMEN`, `BRACO`, `COXA`, `GLUTEO` | Task "[BACK][INSULINA] Criar entidade e DTOs" e tela de Registro de Insulina |
| `status` (só resposta) | `BAIXA`, `NORMAL`, `ALTA` | Calculado pela API |

O `tipo` de insulina é texto livre: a task pede para não inventar valores
clínicos enquanto a lista não for fechada pela equipe.

## Datas e horários

- `dataHora` é ISO 8601 com fuso (ex.: `2026-10-12T08:30:00-03:00`). O app
  junta os campos de data e hora da tela antes de enviar. A resposta volta
  em UTC (`2026-10-12T11:30:00.000Z`).
- Filtros `startDate` e `endDate` usam `AAAA-MM-DD` e são **inclusivos**:
  `endDate=2026-10-13` inclui todo o dia 13. Os limites do dia seguem o
  horário do servidor.
- O mesmo `DateRangeQueryDto` (`src/common/dto`) serve aos dois módulos.

## Status da glicemia

Calculado pela API e **gravado** junto com o registro (relatórios e dashboard
não precisam recalcular). É recalculado quando o `valor` muda no PATCH.

| Faixa | Status |
| --- | --- |
| abaixo de 70 mg/dL | `BAIXA` |
| de 70 a 180 mg/dL | `NORMAL` |
| acima de 180 mg/dL | `ALTA` |

A faixa de 70 a 180 mg/dL é o "tempo no alvo" do Consenso Internacional
de 2019 (Battelino et al., *Diabetes Care*), usado pela ADA e pela SBD.

## Exclusão

Exclusão física: o registro apagado deixa de aparecer em qualquer consulta.
O projeto não adota soft delete para registros de saúde.
