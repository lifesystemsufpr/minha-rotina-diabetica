# Revisão dos indicadores e gráficos (dashboard, Home e PDF)

Revisão pedida pelo PM em nov/2026: os indicadores fazem sentido do ponto de
vista clínico? Este documento compara o que a API calcula com as referências
abaixo, diz o que foi ajustado e o que **precisa de validação de uma
profissional de saúde** antes de mudar.

> Este documento não é orientação médica. As metas variam por pessoa (idade,
> gestação, risco de hipoglicemia), e quem define a meta de cada paciente é a
> equipe de saúde.

## Referências usadas

1. **Consenso Internacional de Tempo no Alvo**: Battelino T. et al., _Clinical
   Targets for Continuous Glucose Monitoring Data Interpretation_, Diabetes Care
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
3. **Sociedade Brasileira de Diabetes (SBD)**: Diretriz SBD Ed. 2026, capítulo
   "Metas de controle glicêmico" (DOI `10.29327/5881296.2026-1`) e capítulo
   "Insulinoterapia no DM1" (tabela 1, página de insulinas revisada em
   25/01/2022), além do posicionamento oficial sobre glicemia capilar:
   - jejum e pré-prandial: meta de 80 a 130 mg/dL (abaixo de 70 é
     hipoglicemia; de 70 a 79 fica `NORMAL` por não ser hipoglicemia);
   - pós-prandial (2 h após a refeição): até 180 mg/dL.

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

| Indicador                                                                | Situação                                   | Avaliação                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Média das glicemias (`mediaGlicemia`)                                    | Mantido                                    | Correto como dado descritivo. Mostrar sempre junto com a quantidade de leituras (`distribuicaoLeituras.total`), porque uma média de 3 medições diz pouco                                                                                                                      |
| Maior e menor valor                                                      | Mantido                                    | Correto. Ajudam a achar hipoglicemias e picos                                                                                                                                                                                                                                 |
| "Glicemia ao longo do dia" (`glicemiaAoLongoDoDia`)                      | Mantido, mais o **novo** `mediaPorMomento` | A série bruta de vários dias não mostra "o dia". Para glicemia capilar, a forma consagrada é o **perfil glicêmico por momento** (jejum, antes e depois das refeições). A API agora entrega a média de cada momento. A série bruta continua disponível para o gráfico de linha |
| Faixas de leitura                                                        | **Novo** `distribuicaoLeituras`            | Quantidade e percentual das leituras em cada faixa do consenso, incluindo **abaixo de 54 mg/dL**: é o dado de maior risco e antes não aparecia separado                                                                                                                       |
| Insulina total diária                                                    | Mantido                                    | A dose diária total é um conceito usado na prática. O `tipo` agora usa lista fechada (Diretriz SBD Ed. 2026, "Insulinoterapia no DM1", tabela 1, revisada em 25/01/2022)                                                                                                      |
| Gráfico de 7 dias da Home                                                | Mantido                                    | Pontos brutos dos últimos 7 dias: adequado para acompanhar a semana                                                                                                                                                                                                           |
| Status de cada glicemia (`BAIXA`/`NORMAL`/`ALTA`) e `hipoglicemiaNivel2` | **Atualizado**                             | Calculado pelo momento da medição (teto 130 antes da refeição/jejum e 180 após a refeição), mais `hipoglicemiaNivel2` quando `valor < 54`                                                                                                                                     |

## O que foi fechado e o que continua pendente

1. **Status pelo momento da medição — feito.** O `status` passa a usar as metas
   da Diretriz SBD Ed. 2026 ("Metas de controle glicêmico", DOI
   `10.29327/5881296.2026-1`):
   - `BAIXA`: `valor < 70` mg/dL em qualquer momento;
   - `NORMAL`: de 70 até 130 mg/dL em `JEJUM`, `ANTES_CAFE`, `ANTES_ALMOCO` e
     `ANTES_JANTAR`, e de 70 até 180 mg/dL em `APOS_CAFE`, `APOS_ALMOCO` e
     `APOS_JANTAR` (ou outro momento futuro sem meta específica);
   - `ALTA`: acima do teto do momento.
   - A migration `RecalculaStatusGlicemiaPorMomento` recalcula os registros já
     gravados.
2. **Aviso de hipoglicemia nível 2 — feito.** A API devolve
   `hipoglicemiaNivel2: true` quando `valor < 54` mg/dL nas respostas de
   glicemia e na última glicemia do resumo da Home (`GET /api/home/summary`).
3. **Lista fechada de tipos de insulina — feito.** O campo `tipo` agora aceita
   os códigos `ULTRARRAPIDA`, `RAPIDA`, `INTERMEDIARIA`, `LONGA`, `ULTRALONGA`
   e `PRE_MISTURADA`, baseados na Diretriz SBD Ed. 2026 ("Insulinoterapia no
   DM1", tabela 1, página revisada em 25/01/2022), convertendo os rótulos
   antigos na escrita e na migration `PadronizaTipoInsulinaComCopia`.
4. **Continua pendente (depende de dados que o app não coleta ou de momento não
   cadastrado):**
   - metas específicas para **idoso comprometido / muito comprometido**;
   - metas específicas para **gestação** (DMG ou diabetes pré-gestacional na
     gravidez);
   - momento **ao deitar** (glicemia antes de dormir).

## O que mudou na API

`GET /api/dashboard` ganhou dois campos. Eles não quebram o app atual.

- `distribuicaoLeituras`: `{ total, muitoBaixa, baixa, noAlvo, alta, muitoAlta }`.
  Cada faixa traz `{ quantidade, percentual }`; sem leituras, `percentual` é
  `null`.
- `mediaPorMomento`: `[{ momento, media, quantidade }]`, na ordem do dia.

Detalhes em [`dashboard.md`](dashboard.md).
