# Relatórios: histórico consolidado

`GET /api/reports/records?startDate=&endDate=` (requer Bearer token)

Lista única com as glicemias e as aplicações de insulina do usuário, para a
tela Relatórios mostrar os dois tipos na mesma linha do tempo. É uma consulta
agregada: reaproveita `GlycemiaService` e `InsulinService`, que já filtram por
dono e por período. Nenhum dado é copiado para tabela nova.

## Query

`startDate` e `endDate` seguem a convenção de [`date-range.md`](date-range.md)
(`AAAA-MM-DD`, inclusivos, opcionais). Sem datas, devolve todo o histórico.

## Resposta 200

Array ordenado por `dateTime`, **do mais recente para o mais antigo**. Em
empate no mesmo instante, desempata pelo `id`, para a ordem ser sempre a mesma.
Sem registros: `[]`.

```json
[
  {
    "type": "GLYCEMIA",
    "id": "3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f",
    "dateTime": "2026-10-12T11:30:00.000Z",
    "glycemia": { "valor": 110, "momento": "JEJUM", "status": "NORMAL" },
    "insulin": null
  },
  {
    "type": "INSULIN",
    "id": "9c1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f",
    "dateTime": "2026-10-12T11:00:00.000Z",
    "glycemia": null,
    "insulin": { "tipo": "Rápida", "doseUi": 10, "localAplicacao": "ABDOMEN" }
  }
]
```

| Campo | Descrição |
| --- | --- |
| `type` | `GLYCEMIA` ou `INSULIN` |
| `id` | id do registro original (use nas rotas de glicemia ou insulina para abrir, editar ou excluir) |
| `dateTime` | data e hora em ISO 8601 (UTC) |
| `glycemia` | preenchido só quando `type` = `GLYCEMIA`; senão `null` |
| `insulin` | preenchido só quando `type` = `INSULIN`; senão `null` |

Os nomes `type`, `id` e `dateTime` vêm do contrato da task
"[BACK][REPORTS] Criar endpoint de histórico consolidado".

**Agrupar por dia no app:** converta `dateTime` para o fuso do aparelho antes
de separar os dias. A lista já vem ordenada; basta quebrar quando o dia muda.

## Erros

No formato padrão ([`errors.md`](errors.md)): 400 para período inválido ou
parâmetro desconhecido (ex.: `userId`), 401 sem token válido.
