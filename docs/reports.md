# Relatórios

Duas rotas, as duas com Bearer token e o mesmo filtro por período:

- `GET /api/reports/records`: histórico consolidado em JSON.
- `GET /api/reports/pdf`: o mesmo conteúdo em um arquivo PDF.

## Histórico consolidado

`GET /api/reports/records?startDate=&endDate=` (requer Bearer token)

Lista única com as glicemias e as aplicações de insulina do usuário, para a
tela Relatórios mostrar os dois tipos na mesma linha do tempo. É uma consulta
agregada: reaproveita `GlycemiaService` e `InsulinService`, que já filtram por
dono e por período. Nenhum dado é copiado para tabela nova.

### Query

`startDate` e `endDate` seguem a convenção de [`date-range.md`](date-range.md)
(`AAAA-MM-DD`, inclusivos, opcionais). Sem datas, devolve todo o histórico.

### Resposta 200

Array ordenado por `dateTime`, **do mais recente para o mais antigo**. Em
empate no mesmo instante, desempata pelo `id`, para a ordem ser sempre a mesma.
Sem registros: `[]`.

```json
[
  {
    "type": "GLYCEMIA",
    "id": "3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f",
    "dateTime": "2026-10-12T11:30:00.000Z",
    "glycemia": { "valor": 110, "momento": "JEJUM", "status": "NORMAL", "observacao": "Após caminhada" },
    "insulin": null
  },
  {
    "type": "INSULIN",
    "id": "9c1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f",
    "dateTime": "2026-10-12T11:00:00.000Z",
    "glycemia": null,
    "insulin": { "tipo": "Rápida", "doseUi": 10, "localAplicacao": "ABDOMEN", "observacao": null }
  }
]
```

| Campo | Descrição |
| --- | --- |
| `type` | `GLYCEMIA` ou `INSULIN` |
| `id` | id do registro original (use nas rotas de glicemia ou insulina para abrir, editar ou excluir) |
| `dateTime` | data e hora em ISO 8601 (UTC) |
| `glycemia` | preenchido só quando `type` = `GLYCEMIA`; senão `null`. Inclui `observacao` (`null` se não houver) |
| `insulin` | preenchido só quando `type` = `INSULIN`; senão `null`. Inclui `observacao` (`null` se não houver) |

Os nomes `type`, `id` e `dateTime` vêm do contrato da task
"[BACK][REPORTS] Criar endpoint de histórico consolidado".

**Agrupar por dia no app:** converta `dateTime` para o fuso do aparelho antes
de separar os dias. A lista já vem ordenada; basta quebrar quando o dia muda.

### Erros

No formato padrão ([`errors.md`](errors.md)): 400 para período inválido ou
parâmetro desconhecido (ex.: `userId`), 401 sem token válido.

## Relatório em PDF

`GET /api/reports/pdf?startDate=&endDate=` (requer Bearer token)

| Query | Formato | Descrição |
| --- | --- | --- |
| `startDate` | `AAAA-MM-DD`, opcional | Início do período (inclusivo) |
| `endDate` | `AAAA-MM-DD`, opcional | Fim do período (inclusivo, dia todo) |

### Resposta 200

O arquivo vem direto no corpo, sem URL temporária e sem nada guardado no
servidor.

| Header | Valor |
| --- | --- |
| `Content-Type` | `application/pdf` |
| `Content-Disposition` | `attachment; filename="relatorio-rotina-diabetica_<inicio>_a_<fim>.pdf"` |
| `Content-Length` | tamanho do arquivo em bytes |
| `Cache-Control` | `no-store` (dados de saúde não devem ficar em cache) |
| `X-Content-Type-Options` | `nosniff` |

Nome do arquivo: `relatorio-rotina-diabetica_2026-10-01_a_2026-10-13.pdf`; só
com início, `..._2026-10-01_a_hoje.pdf`; só com fim, `..._inicio_a_2026-10-13.pdf`;
sem datas, `..._completo.pdf`.

**Conteúdo:** título, nome do usuário, período, data de geração, resumo
(quantidade, média, mínimo e máximo das glicemias, contagem por status e total
de insulina) e a tabela de registros, do mais recente para o mais antigo. Datas
e horas no fuso do processo da API ([`date-range.md`](date-range.md#fuso-horário)).

**Sem registros no período:** 200 com um PDF válido que diz "Nenhum registro
encontrado no período selecionado".

### Download e compartilhamento no app

Como o arquivo vem direto na resposta, não existe link público nem URL
previsível: só quem tem o token consegue baixar, e só o próprio relatório.

No React Native:

1. Baixar enviando `Authorization: Bearer <token>` e salvar em cache ou
   documentos do aparelho (ex.: `expo-file-system` com `downloadAsync` e
   `headers`, ou `react-native-blob-util`).
2. Abrir o compartilhamento nativo com o caminho local do arquivo (ex.:
   `expo-sharing`).
3. Usar o nome de `Content-Disposition` como nome do arquivo salvo.

Para clientes web (ex.: Expo Web), a API libera a leitura de
`Content-Disposition` via CORS (`exposedHeaders` em `src/app.setup.ts`).

### Erros

Sempre em JSON no formato padrão ([`errors.md`](errors.md)), nunca como
arquivo: 400 (período inválido ou parâmetro desconhecido), 401 (token), 500
(falha ao gerar).

### Identificação no PDF

A task pede identificação do usuário "apenas se aprovada". **Aprovado pela
liderança (nov/2026):** o PDF traz só o **nome**, para o médico saber de quem é
o relatório. Nenhum outro dado pessoal (e-mail, data de nascimento) entra no
arquivo.
