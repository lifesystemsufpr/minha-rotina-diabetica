# Glicemias e aplicações de insulina

Rotas protegidas por JWT (`Authorization: Bearer <token>`). O dono de cada
registro vem **sempre do token**; o corpo não aceita `usuarioId` (400).
Registro de outro usuário é tratado como inexistente (404).

## Rotas

| Método e rota                                          | Resposta                       |
| ------------------------------------------------------ | ------------------------------ |
| `POST /api/glycemias`                                  | 201 com o registro             |
| `GET /api/glycemias?startDate&endDate&momento`         | 200 com a lista (vazia é `[]`) |
| `GET /api/glycemias/:id`                               | 200, ou 404                    |
| `PATCH /api/glycemias/:id`                             | 200 com o registro atualizado  |
| `DELETE /api/glycemias/:id`                            | 204                            |
| `POST /api/insulin-applications`                       | 201 com o registro             |
| `GET /api/insulin-applications?startDate&endDate&tipo` | 200 com a lista                |
| `GET/PATCH/DELETE /api/insulin-applications/:id`       | 200 / 200 / 204, ou 404        |

`:id` precisa ser um UUID; outro formato retorna 400.

## Campos

**Glicemia:** `valor` (mg/dL, maior que zero, até 999,99), `momento`,
`dataHora` (ISO 8601) e `observacao` opcional (até 255 caracteres). Na
resposta, a API devolve também `status` (`BAIXA`, `NORMAL`, `ALTA`) e
`hipoglicemiaNivel2` (`boolean`, `true` quando `valor < 54`).

**Insulina:** `tipo` (`TipoInsulina`), `doseUi` (UI, maior que zero, até
9999,99), `localAplicacao`, `dataHora` (ISO 8601) e `observacao` opcional.

| Enum                   | Valores                                                                                          | Fonte                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `momento`              | `JEJUM`, `ANTES_CAFE`, `APOS_CAFE`, `ANTES_ALMOCO`, `APOS_ALMOCO`, `ANTES_JANTAR`, `APOS_JANTAR` | Task "[BACK][GLICEMIA] Criar entidade e DTOs"                                  |
| `tipo`                 | `ULTRARRAPIDA`, `RAPIDA`, `INTERMEDIARIA`, `LONGA`, `ULTRALONGA`, `PRE_MISTURADA`                | Diretriz SBD Ed. 2026, "Insulinoterapia no DM1" (tabela 1, revisão 25/01/2022) |
| `localAplicacao`       | `ABDOMEN`, `BRACO`, `COXA`, `GLUTEO`                                                             | Task "[BACK][INSULINA] Criar entidade e DTOs" e tela de Registro de Insulina   |
| `status` (só resposta) | `BAIXA`, `NORMAL`, `ALTA`                                                                        | Calculado pela API conforme valor e momento                                    |

### Tipos de insulina e compatibilidade com rótulos antigos

| Código (`tipo`) | Rótulo no app / PDF                              | Rótulo antigo aceito na escrita |
| --------------- | ------------------------------------------------ | ------------------------------- |
| `ULTRARRAPIDA`  | Ultrarrápida (lispro, asparte, glulisina, Fiasp) | `Rápida`                        |
| `RAPIDA`        | Rápida (regular)                                 | `Regular`                       |
| `INTERMEDIARIA` | Intermediária (NPH, detemir)                     | `NPH`                           |
| `LONGA`         | Longa (glargina U100)                            | `Longa duração`                 |
| `ULTRALONGA`    | Ultralonga (degludeca, glargina U300)            | —                               |
| `PRE_MISTURADA` | Pré-misturada (70/30, Mix)                       | —                               |

- No `POST` e no `PATCH /api/insulin-applications`, a API aceita os 6 códigos e
  também os 4 rótulos antigos do app já instalado (comparação sem diferenciar
  maiúsculas e com `trim`), convertendo-os para o código antes de gravar.
  Qualquer outro valor retorna 400.
- Na leitura, `tipo` volta como código. Registros antigos no banco cujo texto
  não correspondia a nenhum rótulo conhecido mantêm o texto original.
- O filtro `GET /api/insulin-applications?tipo=` aceita código de `TipoInsulina`.

## Datas e horários

- `dataHora` é ISO 8601 com fuso (ex.: `2026-10-12T08:30:00-03:00`). O app
  junta os campos de data e hora da tela antes de enviar. A resposta volta
  em UTC (`2026-10-12T11:30:00.000Z`).
- `dataHora` não pode estar no futuro: medição e aplicação registram o que já
  aconteceu. Há tolerância de 5 minutos para diferença de relógio entre o
  aparelho e o servidor. Mais que isso responde 400 em `dataHora`, no
  cadastro e na edição. Lembretes não seguem esta regra.
- Filtros `startDate` e `endDate` usam `AAAA-MM-DD` e são **inclusivos**:
  `endDate=2026-10-13` inclui todo o dia 13. `endDate` antes de `startDate`
  responde 400. Regras completas e fuso horário em
  [`date-range.md`](date-range.md).
- O mesmo `DateRangeQueryDto` (`src/common/dto`) serve aos dois módulos.

## Status da glicemia e aviso de hipoglicemia nível 2

O `status` é calculado pela API conforme o `valor` e o `momento` da medição e
**gravado** junto com o registro (relatórios e dashboard não precisam
recalcular). No `PATCH`, é recalculado sempre que mudar `valor` ou `momento`.

| Momento                                                                                 | `BAIXA`            | `NORMAL`          | `ALTA`             |
| --------------------------------------------------------------------------------------- | ------------------ | ----------------- | ------------------ |
| `JEJUM`, `ANTES_CAFE`, `ANTES_ALMOCO`, `ANTES_JANTAR`                                   | abaixo de 70 mg/dL | de 70 a 130 mg/dL | acima de 130 mg/dL |
| `APOS_CAFE`, `APOS_ALMOCO`, `APOS_JANTAR` (e outros momentos futuros sem meta definida) | abaixo de 70 mg/dL | de 70 a 180 mg/dL | acima de 180 mg/dL |

Fonte: Diretriz SBD Ed. 2026, "Metas de controle glicêmico" (DOI
`10.29327/5881296.2026-1`). Um jejum de 70 a 79 mg/dL fica `NORMAL` (abaixo da
faixa ideal 80-130, mas não é hipoglicemia).

Além do `status`, a API calcula na resposta o campo `hipoglicemiaNivel2: boolean`
(`valor < 54` mg/dL), presente em toda resposta de glicemia
(`GlycemiaResponseDto`) e em `ultimaGlicemia` de `GET /api/home/summary`. Não é
gravado no banco.

## Exclusão

Exclusão física: o registro apagado deixa de aparecer em qualquer consulta.
O projeto não adota soft delete para registros de saúde.
