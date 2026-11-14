# Filtro por período (`startDate` e `endDate`)

Convenção única para filtrar registros por data. Vale para todas as rotas que
recebem `DateRangeQueryDto` (`src/common/dto/date-range-query.dto.ts`):

- `GET /api/glycemias`
- `GET /api/insulin-applications`
- `GET /api/reports/records`

Rotas novas que filtram por período devem usar o mesmo DTO, sem criar outra
interpretação de datas.

## Parâmetros

| Query | Formato | Obrigatório | Regra |
| --- | --- | --- | --- |
| `startDate` | `AAAA-MM-DD` | não | Início do período, **inclusivo** (a partir de 00:00 do dia) |
| `endDate` | `AAAA-MM-DD` | não | Fim do período, **inclusivo** (o dia inteiro, até 23:59:59) |

- Sem nenhuma data: não filtra (todo o histórico).
- Só `startDate`: do dia informado em diante.
- Só `endDate`: tudo até o fim do dia informado.
- `startDate` igual a `endDate`: exatamente um dia.

Na consulta, o intervalo vira `[startDate 00:00, dia seguinte a endDate 00:00)`
(`src/common/utils/date-range.ts`). Assim o último dia entra inteiro, sem
depender de milissegundos.

## Quando responde 400

Sempre no formato padrão de erro (`docs/errors.md`), com o campo em `details`:

| Exemplo | Motivo |
| --- | --- |
| `?startDate=10-10-2026` | formato diferente de `AAAA-MM-DD` |
| `?startDate=2026-10-01T08:00:00Z` | data com horário |
| `?startDate=2026-02-30` | data que não existe |
| `?startDate=2026-10-13&endDate=2026-10-01` | `endDate` anterior a `startDate` |

A última regra usa o decorator `IsNotBeforeProperty`
(`src/common/decorators`), que pode ser reutilizado em outros DTOs.

## Fuso horário

Os limites de cada dia (00:00 e 23:59) são calculados no **fuso horário do
processo da API**, isto é, da variável de ambiente `TZ` do servidor. Se `TZ` não
estiver definida, vale o fuso do sistema operacional.

O `dataHora` dos registros é gravado como instante (o app envia ISO 8601 com
fuso e a API responde em UTC). Só o recorte "que dia é este" depende do fuso.

Exemplo com a API em `America/Sao_Paulo` (UTC-3): uma glicemia de
`2026-10-13T23:30:00-03:00` (02:30 UTC do dia 14) aparece em
`endDate=2026-10-13`. Com a API em UTC, ela cairia no dia 14.

**Recomendação para os ambientes compartilhados:** rodar a API com
`TZ=America/Sao_Paulo`, para que "o dia" seja o mesmo que a pessoa vê no
celular. A escolha final do fuso é uma decisão do time; enquanto ela não sai,
cada ambiente usa o fuso da própria máquina.

## Testes

- `src/common/dto/date-range-query.dto.spec.ts`: formatos aceitos e recusados,
  intervalo invertido.
- `src/common/utils/date-range.spec.ts`: limites do dia, fim de mês, fim de
  ano e ano bissexto.
- `test/glycemia.e2e-spec.ts` e `test/insulin-applications.e2e-spec.ts`:
  filtro de um dia e 400 para intervalo invertido.
