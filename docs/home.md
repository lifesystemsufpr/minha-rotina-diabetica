# Home: resumo em uma chamada

`GET /api/home/summary` (requer Bearer token)

Junta numa resposta só o que a tela Home mostra, para o app não precisar fazer
várias chamadas. Todas as consultas usam o usuário do token; parâmetros na URL
(ex.: `?userId=`) são ignorados.

## Resposta 200

```json
{
  "nome": "Maria",
  "ultimaGlicemia": {
    "id": "…", "valor": 110, "momento": "JEJUM", "status": "NORMAL",
    "dataHora": "2026-10-12T11:30:00.000Z", "observacao": null
  },
  "ultimaInsulina": {
    "id": "…", "tipo": "Rápida", "doseUi": 8, "localAplicacao": "ABDOMEN",
    "dataHora": "2026-10-11T23:00:00.000Z", "observacao": null
  },
  "proximoLembrete": {
    "id": "…", "titulo": "Insulina da noite",
    "dataHora": "2026-10-13T00:00:00.000Z", "status": "ATIVO"
  },
  "resumoDiario": { "glicemiaRegistrada": true, "insulinaRegistrada": false },
  "glicemiaUltimos7Dias": [
    { "dataHora": "2026-10-10T11:00:00.000Z", "valor": 200 }
  ]
}
```

| Campo | Regra |
| --- | --- |
| `nome` | nome da conta, para a saudação |
| `ultimaGlicemia` | glicemia com o `dataHora` mais recente, no mesmo formato de `GET /api/glycemias/:id` |
| `ultimaInsulina` | aplicação com o `dataHora` mais recente, no mesmo formato de `GET /api/insulin-applications/:id` |
| `proximoLembrete` | lembrete `ATIVO` com `dataHora` a partir de agora, o mais próximo. `INATIVO` e lembretes que já passaram não contam |
| `resumoDiario` | se houve ao menos uma glicemia e uma insulina **hoje**. Só esses dois itens (a task exclui alimentação e exercício) |
| `glicemiaUltimos7Dias` | glicemias de hoje e dos 6 dias anteriores, em ordem cronológica, com `dataHora` e `valor` |

Registros com `dataHora` no futuro (a API aceita) só entram em `ultimaGlicemia`,
`ultimaInsulina`, `resumoDiario` e `glicemiaUltimos7Dias` quando a hora chega.

"Hoje" e "últimos 7 dias" seguem o fuso do processo da API, como o filtro por
período ([`date-range.md`](date-range.md#fuso-horário)).

**Sem registros:** 200 com `null` nos campos de registro, `false` no resumo e
`[]` no gráfico. Nunca 500.

## Erros

401 sem token válido, no formato padrão ([`errors.md`](errors.md)).
