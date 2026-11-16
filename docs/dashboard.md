# Dashboard

`GET /api/dashboard?startDate=&endDate=` (requer Bearer token)

Indicadores da tela Dashboard, calculados na API para o app só desenhar.
Usa os mesmos `GlycemiaService` e `InsulinService` das listagens, que já filtram
por dono e por período.

## Query

`startDate` e `endDate` seguem [`date-range.md`](date-range.md) (`AAAA-MM-DD`,
inclusivos, opcionais). **Sem datas, considera todo o histórico do usuário.**
Para a tela mostrar "últimos 7 dias" ou "este mês", o app envia o período.

## Resposta 200

```json
{
  "mediaGlicemia": 128.5,
  "maiorValor": { "valor": 200, "dataHora": "2026-10-06T12:00:00.000Z", "momento": "APOS_ALMOCO" },
  "menorValor": { "valor": 60, "dataHora": "2026-10-07T12:00:00.000Z", "momento": "ANTES_JANTAR" },
  "glicemiaAoLongoDoDia": [
    { "valor": 100, "dataHora": "2026-10-05T12:00:00.000Z", "momento": "JEJUM" }
  ],
  "insulinaTotalDiaria": [
    { "data": "2026-10-05", "totalUi": 14.5, "quantidade": 2 }
  ],
  "distribuicaoLeituras": {
    "total": 3,
    "muitoBaixa": { "quantidade": 0, "percentual": 0 },
    "baixa": { "quantidade": 1, "percentual": 33.3 },
    "noAlvo": { "quantidade": 1, "percentual": 33.3 },
    "alta": { "quantidade": 1, "percentual": 33.3 },
    "muitoAlta": { "quantidade": 0, "percentual": 0 }
  },
  "mediaPorMomento": [
    { "momento": "JEJUM", "media": 100, "quantidade": 1 }
  ]
}
```

| Campo | Regra |
| --- | --- |
| `mediaGlicemia` | média simples das glicemias do período, em mg/dL, 2 casas decimais |
| `maiorValor` / `menorValor` | registro com o maior/menor valor, com data e momento. Empate: vale o mais recente |
| `glicemiaAoLongoDoDia` | todas as glicemias do período, em ordem cronológica (pronto para gráfico de linha) |
| `insulinaTotalDiaria` | soma das doses (`totalUi`) e quantidade de aplicações (`quantidade`) por dia, em ordem cronológica. Dias sem aplicação não aparecem |
| `distribuicaoLeituras` | `{ total, muitoBaixa, baixa, noAlvo, alta, muitoAlta }`, cada faixa com `{ quantidade, percentual }`. Faixas do consenso de 2019: <54, 54–69, 70–180, 181–250 e >250 mg/dL. É percentual das **leituras**, não do tempo. Sem leituras, `percentual` é `null` |
| `mediaPorMomento` | `[{ momento, media, quantidade }]`: média de cada momento do dia (perfil glicêmico), na ordem jejum → após jantar. Só aparecem momentos com leitura |

O "dia" de `insulinaTotalDiaria.data` segue o fuso do processo da API, como no
filtro por período ([`date-range.md`](date-range.md#fuso-horário)).

**Sem registros no período:** 200 com `mediaGlicemia`, `maiorValor` e
`menorValor` iguais a `null` e as duas listas vazias. Não há divisão por zero.

## Erros

No formato padrão ([`errors.md`](errors.md)): 400 para período inválido,
401 sem token válido.

## Validade clínica

A revisão dos indicadores, com as referências e o que ainda depende de
profissional de saúde, está em [`revisao-graficos.md`](revisao-graficos.md).
