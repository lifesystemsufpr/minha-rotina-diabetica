# Revisão dos indicadores e gráficos (dashboard, Home e PDF)

Revisão pedida pelo PM em nov/2026: os indicadores fazem sentido do ponto de
vista clínico? Este documento compara o que a API calcula com as referências
abaixo, diz o que foi ajustado e o que **precisa de validação de uma
profissional de saúde** antes de mudar.

> Este documento não é orientação médica. As metas variam por pessoa (idade,
> gestação, risco de hipoglicemia), e quem define a meta de cada paciente é a
> equipe de saúde.

## Referências usadas

1. **Consenso Internacional de Tempo no Alvo**: Battelino T. et al., *Clinical
   Targets for Continuous Glucose Monitoring Data Interpretation*, Diabetes Care
   2019;42(8):1593-1603. https://pmc.ncbi.nlm.nih.gov/articles/PMC6973648/
   - Faixas: abaixo de 54 (hipoglicemia nível 2), 54 a 69 (nível 1), 70 a 180
     (alvo), 181 a 250 (hiperglicemia nível 1) e acima de 250 mg/dL (nível 2).
   - Metas para a maioria dos adultos com DM1/DM2: mais de 70% do tempo entre
     70 e 180; menos de 4% abaixo de 70; menos de 1% abaixo de 54; menos de 25%
     acima de 180; menos de 5% acima de 250. Variabilidade (CV) até 36%.
   - Válido para **monitorização contínua (CGM)**, com pelo menos 14 dias de
     dados e o sensor ativo em 70% do tempo.
2. **ADA, Standards of Care in Diabetes 2026**, seção 6 (metas glicêmicas).
   https://pmc.ncbi.nlm.nih.gov/articles/PMC12690178
3. **Sociedade Brasileira de Diabetes (SBD)**: diretriz "Metas no tratamento do
   diabetes" (https://diretriz.diabetes.org.br/?p=3835) e posicionamento oficial
   de 2020 sobre glicemia capilar. Pelo posicionamento:
   - jejum e pré-prandial: ideal de 80 a 100 mg/dL, aceitável abaixo de 130;
   - pós-prandial (2 h): ideal abaixo de 160 mg/dL, aceitável abaixo de 180.

   **Conferir na versão mais recente da diretriz**: a página de metas não abriu
   durante a revisão.

## Ponto principal: o app registra glicemia capilar, não CGM

O app recebe medições de ponta de dedo, digitadas pela pessoa, poucas vezes por
dia. As métricas do consenso de 2019 (tempo no alvo, GMI e CV) foram definidas
para **sensor contínuo**, que mede a cada poucos minutos.

Com glicemia capilar:

- "Percentual de leituras entre 70 e 180" **não é** "tempo no alvo". Ele
  depende de quando a pessoa mede: quem mede mais quando se sente mal vai ter
  mais leituras fora do alvo.
- O **GMI** (estimativa da A1C) não deve ser calculado: exige CGM e 14 dias de
  dados.
- O **CV** calculado com poucas leituras é instável e não vale como meta.

Por isso a API **não** usa o nome "tempo no alvo" em lugar nenhum.

## Indicador por indicador

| Indicador | Situação | Avaliação |
| --- | --- | --- |
| Média das glicemias (`mediaGlicemia`) | Mantido | Correto como dado descritivo. Mostrar sempre junto com a quantidade de leituras (`distribuicaoLeituras.total`), porque uma média de 3 medições diz pouco |
| Maior e menor valor | Mantido | Correto. Ajudam a achar hipoglicemias e picos |
| "Glicemia ao longo do dia" (`glicemiaAoLongoDoDia`) | Mantido, mais o **novo** `mediaPorMomento` | A série bruta de vários dias não mostra "o dia". Para glicemia capilar, a forma consagrada é o **perfil glicêmico por momento** (jejum, antes e depois das refeições). A API agora entrega a média de cada momento. A série bruta continua disponível para o gráfico de linha |
| Faixas de leitura | **Novo** `distribuicaoLeituras` | Quantidade e percentual das leituras em cada faixa do consenso, incluindo **abaixo de 54 mg/dL**: é o dado de maior risco e antes não aparecia separado |
| Insulina total diária | Mantido | A dose diária total é um conceito usado na prática. Como `tipo` é texto livre, não dá para separar basal de bolus (ver pendências) |
| Gráfico de 7 dias da Home | Mantido | Pontos brutos dos últimos 7 dias: adequado para acompanhar a semana |
| Status de cada glicemia (`BAIXA`/`NORMAL`/`ALTA`) | Mantido, **com ressalva** | Ver pendência 1 |

## Pendências que precisam de profissional de saúde

1. **Status pelo momento da medição.** Hoje qualquer leitura entre 70 e
   180 mg/dL é `NORMAL`. Pelas metas de glicemia capilar (SBD e ADA), um **jejum
   de 150 mg/dL está acima da meta** (o aceitável é abaixo de 130), mas aparece
   como `NORMAL`.
   - Proposta: alvo de 80 a 130 em jejum e antes das refeições; abaixo de 180
     depois das refeições.
   - Isso muda a regra do `status` gravado e afeta os registros antigos. Só
     deve ser feito com validação clínica.
2. **Metas por perfil.** Idosos, gestantes e crianças têm metas diferentes
   (consenso de 2019, tabelas 3 e 4, e diretriz da SBD). O perfil já tem data
   de nascimento e tipo de diabetes; gestação não é registrada.
3. **Insulina basal e bolus.** Para mostrar essa proporção, útil para a equipe
   de saúde, o `tipo` precisaria virar uma lista fechada (ex.: `BASAL`,
   `RAPIDA`, `MISTA`). A task original pediu texto livre até a equipe fechar a
   lista.
4. **Avisos no app.** Exibir com destaque as leituras abaixo de 54 mg/dL, com
   orientação para procurar a equipe de saúde. O texto do aviso precisa ser
   validado.

## O que mudou na API

`GET /api/dashboard` ganhou dois campos. Eles não quebram o app atual.

- `distribuicaoLeituras`: `{ total, muitoBaixa, baixa, noAlvo, alta, muitoAlta }`.
  Cada faixa traz `{ quantidade, percentual }`; sem leituras, `percentual` é
  `null`.
- `mediaPorMomento`: `[{ momento, media, quantidade }]`, na ordem do dia.

Detalhes em [`dashboard.md`](dashboard.md).
