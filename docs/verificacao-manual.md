# Verificação manual das mudanças da revisão técnica

Este documento lista **todas as mudanças e correções feitas na revisão técnica**
(Harrison, com apoio do Claude Code) entre out/2026 e nov/2026: o commit, o PR,
o que mudou, como conferir à mão e como desfazer.

Os testes automáticos (`npm run test:e2e`) já cobrem todos os itens. Este
roteiro serve para quem quiser ver o comportamento funcionando, no Swagger ou
no banco.

## Preparação (uma vez)

1. `npm ci`
2. Copie `.env.example` para `.env` e preencha o banco (`DATABASE_*`) e um
   `JWT_SECRET` qualquer para uso local.
3. Crie o banco vazio e rode `npm run migration:run`.
4. `npm run start:dev` e abra o Swagger em http://localhost:3000/api/docs.
5. Para rotas com cadeado: cadastre uma conta em `POST /api/auth/register`,
   faça `POST /api/auth/login`, clique em **Authorize** e cole o
   `accessToken`.
6. Para completar o perfil (exigido pelas rotas de registros desde o #45):
   `PATCH /api/profile` com

   ```json
   { "dataNascimento": "1990-05-10", "tipoDiabetes": "TIPO_1", "alturaCm": 165, "pesoKg": 60 }
   ```

Checagem automática completa, igual à do CI:

```bash
npm run lint:check && npm run build && npm test && npm run test:e2e
```

### Como desfazer uma mudança

- Commit comum: `git revert <commit>`, num PR.
- PR que entrou como merge: `git revert -m 1 <commit do merge>`.
- Mudança com migration: siga [`deploy-backup.md`](deploy-backup.md). Os
  dados apagados por migration só voltam pelo backup.

Os commits citados estão na `development`. Para ver um deles:
`git show <commit>`.

## Rodada de 02/10 (PRs #4 a #8)

| Mudança | Commit (PR) | Como conferir |
| --- | --- | --- |
| Dependências alinhadas ao Nest 11 (`@nestjs/swagger`, `@nestjs/typeorm`, `typeorm` 0.3); `sqlite3` só para testes | `76808b4` (#8) | `npm ci` termina sem erro de dependência. `npm ls @nestjs/swagger` mostra 11.x |
| Entidades ajustadas ao DER e às tasks: data de nascimento no Perfil, enums para tipo de diabetes, momento e status da glicemia, local de aplicação e status do lembrete; `usuario_id` obrigatório | `bd323a3` (#8) | No Swagger, em **Schemas**, os campos fechados aparecem como enum. No banco, `SHOW COLUMNS FROM perfis` tem `data_nascimento` |
| Uma configuração do banco para a API e para a CLI; log sem valores das queries; migration inicial | `a4c7d16` (#8) | `npm run migration:show` lista `InitialSchema`. O terminal da API não imprime as queries com valores |
| Swagger em `/api/docs`, com esquema Bearer padrão | `447ed02` (#8) | O Swagger abre e tem o botão **Authorize** |
| Testes e2e sem MySQL (SQLite em memória) | `6f25c73` (#8) | `npm run test:e2e` passa com o banco local desligado |
| README com Swagger, migrations e testes; `.env.example` sem segredos | `9e7fedc` (#8) | `.env.example` não tem senha nem segredo preenchido |
| Erro de validação com `details` por campo e um único formato de erro | `80b2f7a` (#6) | `POST /api/auth/register` com `{}` responde 400 com `details: [{ field, messages }]` |
| Configuração da app compartilhada entre `main.ts` e testes: prefixo `/api`, CORS (`CORS_ORIGIN`), validação e filtro de erros | `c3a05d8` (#6) | Toda rota começa com `/api`. Com `CORS_ORIGIN` definido, só aquela origem é aceita |
| Testes da configuração real: 500 genérico e JSON malformado no formato padrão | `48a2678` (#6) | Envie um corpo `{` malformado para `POST /api/auth/login` (pelo curl): 400 no formato de [`errors.md`](errors.md) |
| Documentação do formato de erro e da validação | `c3f90ee` (#6) | [`errors.md`](errors.md) e [`validation.md`](validation.md) |

## Rodada de 08/10 (PRs #14, #16 e #18)

| Mudança | Commit (PR) | Como conferir |
| --- | --- | --- |
| Lint e comentário do log do banco | `cb07a67` (#16) | `npm run lint:check` sem erros |
| Variáveis de teste para todas as suítes e2e | `8ab686b` (#18) | `npm run test:e2e` passa numa máquina sem `.env` |
| `GET /users/me` só com campos públicos; senha exige letras e números; tipos no Swagger | `c214400` (#18) | `GET /api/users/me` não traz `senhaHash`. Cadastro com senha `abcdefgh` responde 400 |
| Data de nascimento não pode ser futura; altura e peso dentro do limite da coluna | `81c2a08` (#14) | `PATCH /api/profile` com `dataNascimento` no futuro responde 400 |
| Idade sem erro de fuso; altura e peso vazios como `null` | `158a1d7` (#14) | Com nascimento amanhã há 30 anos, `GET /api/profile` mostra 29 anos |
| Conta excluída não entra e o token antigo é recusado | `0caadef` (#14) | Depois de `DELETE /api/users/me`, o mesmo token responde 401 e o login responde 401 |
| Testes e2e de perfil e exclusão; `account-deletion.md` | `1fe7bae` (#14) | Suítes `profile` e `account` do e2e |

## Rodada de 19/10 (PRs #9 a #12, #14, #16, #18 a #28)

| Mudança | Commit (PR) | Como conferir |
| --- | --- | --- |
| Perfil com o mesmo contrato e as mesmas regras do cadastro | `d00c62c` (#14) | Hoje as regras ficam em `ProfileFieldsDto` (ver #45): o mesmo valor inválido dá o mesmo 400 no cadastro e no `PATCH /api/profile` |
| Exclusão de conta conforme a LGPD: apaga perfil, glicemias, insulinas, lembretes e tokens de recuperação, e anonimiza a linha do usuário | `4e03b9e` (#14) | Crie uma glicemia, exclua a conta e confira no banco que `SELECT COUNT(*) FROM glicemias WHERE usuario_id = '<id>'` dá 0. O mesmo e-mail pode se cadastrar de novo |
| Glicemia e insulina: rotas de insulina registradas, entidades e enums das tasks, Auth do projeto, datas ISO 8601, status calculado (70 a 180 mg/dL), `:id` validado como UUID, `DELETE` com 204 | `d6bb940` (#27) | `GET /api/insulin-applications` existe. `GET /api/glycemias/abc` responde 400. Glicemia de 65 volta com `status: "BAIXA"` |

## Rodada de 23/10 (PRs #29 a #31)

| Mudança | Commit (PR) | Como conferir |
| --- | --- | --- |
| Lembretes no padrão do projeto: `@CurrentUser`, ISO 8601 estrita, `PATCH` vazio dá 400, status só pela rota `/status` | `a35465c` (#30) | Lembrete novo nasce `ATIVO`. `PATCH /api/reminders/:id` com `{}` responde 400. `PATCH /api/reminders/:id/status` alterna o status |
| Tempo limite dos testes e2e em 30 s | `aaae32f` (#31) | `test/jest-e2e.json` tem `testTimeout: 30000` |

## Rodada de 14/11 (PRs #32 a #46)

| Mudança | Commit (PR) | Como conferir |
| --- | --- | --- |
| Lint e documentação dos commits de SMTP e limites de tentativas; o log do SMTP registra só o código do erro | `880a621` (#43) | `npm run lint:check` sem erros. Com SMTP inválido, o log mostra só o código (ex.: `EAUTH`), sem o e-mail |
| Filtro por período documentado; período invertido dá 400 | `fd3dbaf` (#32) | `GET /api/glycemias?startDate=2026-10-10&endDate=2026-10-01` responde 400 com `details` em `endDate` |
| Histórico consolidado com testes e documentação | `bd854eb` (#33) | `GET /api/reports/records` mistura glicemias e insulinas em ordem. [`reports.md`](reports.md) |
| Dashboard com testes e documentação | `88ec8ee` (#34) | Conta sem registros: `GET /api/dashboard` dá 200 com `null` e listas vazias |
| Tokens dos testes com o campo `ver`; token antigo sem `ver` dá 401 | `b2e0456` (#35) | Suíte `authorization` do e2e |
| `GET /home/summary` reescrito sobre os módulos atuais, mantendo o contrato da Ari | `737b694` e `eeb9a07` (#36) | `GET /api/home/summary` traz nome, última glicemia, última insulina, próximo lembrete, resumo do dia e gráfico de 7 dias. [`home.md`](home.md) |
| Documentação do PDF no lugar certo | `735f373` (#41 e #42) | [`reports.md`](reports.md) tem a seção do PDF. `GET /api/reports/pdf` baixa o arquivo |
| #37, #38 e #40 entraram sem mudar código, para o contrato antigo de glicemia e insulina não voltar | merges `a1f4f61`, `6f7ad1f`, `9359657` | `git diff --stat <merge>^1 <merge>` não mostra nada para os três |
| CI no GitHub Actions; `lint:check`; fuso padrão `America/Sao_Paulo`; decisões registradas | `b92ae64` (#44) | Aba **Actions** do GitHub: o check "lint, build e testes" roda em todo PR. Glicemia às 22:30 de hoje (horário de Brasília) aparece em `GET /api/glycemias?startDate=<hoje>&endDate=<hoje>` |
| Faixas de leitura e média por momento no dashboard; revisão clínica | `e682788` (#46) | Leituras de 50, 65, 100, 200 e 300: `distribuicaoLeituras` dá 1 leitura (20%) em cada faixa. [`revisao-graficos.md`](revisao-graficos.md) |
| README: merge com CI verde é combinado do time (a branch não tem bloqueio) | `95d33dd` (#46) | Seção "Fluxo de trabalho" do README |
| Cadastro em duas etapas, bloqueio por perfil incompleto e fim do contato de emergência | `331bbdc` (#45) | Ver o roteiro abaixo |
| A migration que apaga as colunas de contato saiu da `development` até a confirmação. A API funciona igual com as colunas no banco | #48 | `npm run migration:show` lista 4 migrations. Um contato já gravado continua no banco depois de `migration:run` |
| Resumo da rota de exclusão de conta no Swagger | `35337d6` (#46) | `DELETE /api/users/me` tem título no Swagger |
| Home não conta registros com data futura | `70afd86` (#46) | Cadastre uma glicemia para daqui a 1 hora: `GET /api/home/summary` continua mostrando a anterior como última |
| Descrição da exclusão de conta no Swagger (dizia que os dados ficavam no banco, o que deixou de ser verdade em 19/10); roteiro de backup; este documento | #47 | `DELETE /api/users/me` no Swagger descreve o apagamento. [`deploy-backup.md`](deploy-backup.md) |

## Merges que resolveram conflitos

Alguns PRs da equipe partiam de versões antigas da `development`. Nos merges
abaixo, a resolução dos conflitos também é mudança da revisão. A mensagem de
cada commit (`git show <commit>`) explica a escolha. Para ver só o que a
resolução mudou: `git show --remerge-diff <commit>`.

| Commit | PR | O que a resolução fez |
| --- | --- | --- |
| `4441f15` | #6 e #8 | Swagger fica só em `src/config/swagger.config.ts`. `CreateUserDto` junta a documentação do #8 com a validação do #6 |
| `25b752c` | #12, #16 e #18 | `app.module.ts` com Auth e Profile. Em Users, `GET /users/me` (#18) e `DELETE /users/me` (#12) no mesmo controller e service |
| `ae310a6` | #18 e #19 | Fica a versão do #19, mais a regra de senha (`password-policy.ts`) e a data futura comparada com o dia local, não UTC (depois das 21h o dia seguinte era aceito) |
| `108fe8a` | #19 e #28 | A nova senha da recuperação segue a regra do cadastro. `PASSWORD_RESET_TOKEN_TTL_MINUTES` foi para o `.env.example` |
| `80d7da6` | #14 e #28 | O login recusa conta inativa com a mensagem genérica. Fica um só `IsNotFutureDate`. Os testes passam a cadastrar com o perfil completo |
| `04afa5e` | #27 | A cadeia de glicemia e insulina recebe a `development` atual. Os ajustes de glicemia e insulina estão no `d6bb940` |
| `8eb9a22` | #36 | Vale a versão da `development` para glicemia e insulina. As migrations `CriarGlicemias` e `CriarInsulinas` saíram, porque a `InitialSchema` já cria as tabelas e rodar as duas quebraria o `migration:run` |
| `6369cc7`, `d6627ca`, `1a6e7d2` | #37, #38 e #40 | O mesmo critério do `8eb9a22`. Por isso os três PRs entraram sem mudar a `development` |
| `4f3cc71` | #33 e #41 | Documentação do PDF do README para `reports.md`. Exemplo do README corrigido. O teste do PDF passou a usar `responseType('blob')` porque não compilava |
| `5536865` | #41 e #42 | Instruções de download e compartilhamento em `reports.md`, com os headers `Content-Length` e `X-Content-Type-Options` |

Como conferir: `npm run migration:show` lista só as 5 migrations oficiais.
Cadastro com data de nascimento de amanhã, feito depois das 21h, responde 400.
`npm run test:e2e` cobre o resto.

## Roteiro do #45 (cadastro em etapas)

1. `POST /api/auth/register` só com `nome`, `email`, `senha` e
   `confirmarSenha`: 201 com `perfilCompleto: false` e os dados de saúde
   `null`.
2. Faça login. A resposta traz `user.perfilCompleto: false`.
3. `GET /api/glycemias`: 403 com `code: "PERFIL_INCOMPLETO"`. O mesmo vale
   para insulina, lembretes, relatórios e dashboard.
4. `GET /api/home/summary`, `GET /api/profile` e `GET /api/users/me`: 200.
5. `PATCH /api/profile` com os quatro dados (Preparação, passo 6): a resposta
   traz `perfilCompleto: true`, e `GET /api/glycemias` passa a dar 200.
6. Envie `contatoEmergencia` no cadastro ou no `PATCH /api/profile`: é aceito
   e ignorado, e não aparece em nenhuma resposta.
7. No banco, as colunas `contato_emergencia_*` **continuam**: a remoção está
   adiada até confirmação (#48). Os contatos já gravados ficam intactos, e
   `npm run migration:show` não lista a `RemoveContatoEmergencia`.

Mais detalhes em [`cadastro-em-etapas.md`](cadastro-em-etapas.md).

## Verificações de 14/11 sem mudança de código

| Verificação | Resultado |
| --- | --- |
| API iniciada com o banco fora do ar | Tenta conectar 9 vezes e encerra com erro, sem subir pela metade. O log não mostra a senha |
| Banco cai com a API no ar | As rotas respondem 500 no formato padrão, sem SQL nem stack trace. Quando o banco volta, a API volta a responder sem precisar reiniciar |
| Swagger contra o código | 29 rotas. Todas as rotas bloqueadas pelo perfil documentam 403, `perfilCompleto` aparece no cadastro, login, `/users/me` e `/profile`, e `contatoEmergencia` está marcado como descontinuado |
| Segredos no repositório | Só o `.env.example` está versionado, sem valores |

Para repetir o teste do banco fora do ar: suba a API com `DATABASE_PORT`
apontando para uma porta sem banco e veja o processo encerrar. Depois, com a
API no ar, pare o banco e chame `GET /api/profile`.

## Backup e rollback

Ensaio do roteiro de [`deploy-backup.md`](deploy-backup.md) num banco local de
teste. A migration usada, `RemoveContatoEmergencia`, está fora da `development`
até a confirmação (#48). Para repetir o ensaio, traga o arquivo com o comando de
[`cadastro-em-etapas.md`](cadastro-em-etapas.md#contato-de-emergência), sem
fazer commit dele.

1. Crie um banco vazio, rode `npm run migration:run` e depois
   `npm run migration:revert`. O banco fica como na produção antes do #45.
2. Grave um usuário e um perfil com `contato_emergencia_nome` preenchido.
3. Faça o backup com o `mysqldump` do roteiro.
4. `npm run migration:run`: as colunas `contato_emergencia_*` saem.
5. Recrie o banco e restaure o backup: o contato volta, e
   `npm run migration:show` mostra `RemoveContatoEmergencia` como `[ ]`.

## App (GliCare): Home pelo resumo da API

A Home do app montava o resumo com `GET /glycemias`, `/insulin-applications`
e `/reminders`. Com o perfil incompleto essas rotas dão 403, e a Home quebraria
para quem acabou de se cadastrar. A correção troca as três consultas por
`GET /home/summary`, mantendo as mesmas telas e regras:

- última glicemia e última insulina;
- próximo lembrete, que some quando passa;
- resumo do dia pelo calendário do aparelho;
- gráfico com a última medição de cada dia;
- registro com data futura não conta.

O resumo é reconsultado em segundo plano quando muda o dia ou quando o
lembrete passa.

Arquivos: `src/features/home/services/home-model.ts`, `home-service.ts`,
`screens/HomeScreen.tsx` e `scripts/home.test.mjs`.

**Ordem de publicação:** a API com `GET /home/summary` (#36) precisa estar no
ar **antes** desta versão do app. Sem a rota, a Home quebra para todo mundo. O
filtro de data futura do lado da API (#46) é desejável, mas o app também
descarta registros futuros.

Como conferir:

- `npm run test:home` (20 testes) e `npm run typecheck`;
- rode o app com `EXPO_PUBLIC_API_URL` apontando para a API local e entre com
  uma conta de perfil incompleto. A Home abre sem erro, e a aba de rede mostra
  só `GET /api/home/summary`, sem 403;
- complete o perfil, cadastre uma glicemia e uma insulina com horário futuro e
  toque em **Atualizar resumo**. A glicemia aparece como última e no gráfico de
  hoje, e a insulina futura não aparece.

Esses passos foram feitos em 14/11 no Expo web, contra a API e o MariaDB
locais.

PR no repositório do app: lifesystemsufpr/GliCare#8.

## App (GliCare): correções de layout

Verificação do app em celular (375 × 812) e tablet (1024 × 768), em 15 e
16/11. PR: lifesystemsufpr/GliCare#9.

| Mudança | Como conferir |
| --- | --- |
| Rótulos das abas em 10 px (eram 9 px e saíam cortados) | Os seis nomes aparecem inteiros na barra de abas |
| Nome longo na Home é cortado com reticências | Com um nome de mais de 30 letras, o sino continua visível e abre os Lembretes |
| Conteúdo com largura máxima de 560 px (`contentWidth` em `src/shared/theme/spacing.ts`) | Em tablet ou na web, campos, botões e cartões ficam centralizados e não ocupam a tela toda. Vale também para login e cadastro |
| Abas respeitam a área segura do topo (`sceneStyle` em `src/app/(main)/_layout.tsx`) | Num celular com recorte na tela, o título de cada aba fica abaixo da barra de status. **Ainda não conferido em aparelho**: no navegador não dá para ver |
| Lembretes: "Adicionar lembrete" antes de "Atualizar lista", com espaço entre os botões | Tela de Lembretes, no fim da lista |
| Perfil: nome centralizado no cartão | Aba Perfil |

Checagem automática: `npm run typecheck` e os testes do app.

## App (GliCare): correções autorizadas pela PO em 16/11

Cada item é um PR no repositório do app. Os PRs estão empilhados: cada um usa o
anterior como base. **Ordem de merge:** #9 → #10 → #11 → #12 → #13 → #8 →
#14 → #15. Nenhum conflita com o #8.

O app não tem CI. Em todos os PRs rodaram `npm run typecheck` e todos os
`test:*`, e as telas foram conferidas no Expo web em 375 × 812 contra a API e o
MariaDB locais.

| PR | Mudança | Como conferir |
| --- | --- | --- |
| lifesystemsufpr/GliCare#10 | Excluir conta no Perfil, com confirmação. Saem Tema escuro, Notificações e Privacidade, que não faziam nada. Data de nascimento passa para dentro do cartão do Perfil | Perfil → "Excluir minha conta" → confirmar. O app volta ao login, e o login com a mesma conta responde 401. No banco, a conta fica inativa e anonimizada |
| lifesystemsufpr/GliCare#11 | Formatação pt-BR (vírgula decimal, datas sem segundos), saudação pelo horário, status "Alta" em vez de "ALTA", botão secundário com contraste 6:1, chave azul nos lembretes, atalho de período marcado em Relatórios e indicadores no topo do Dashboard | Home mostra "4,5 UI" e datas sem segundos. Antes do meio-dia, a saudação é "Bom dia"; à tarde, "Boa tarde" |
| lifesystemsufpr/GliCare#12 | Remove as sobras do modelo do Expo (rota `explore`, componentes de exemplo e script de reset), tira do cadastro o aviso de Termos e Privacidade (os textos não existem) e reescreve o README do app | `/explore` não existe mais. O README explica como rodar em Android, iOS e web |
| lifesystemsufpr/GliCare#13 | Dashboard e Relatórios leem a API: `GET /dashboard` e `GET /reports/records`. Depende do #49 da API | Dashboard mostra as cinco faixas (abaixo de 54 em vermelho), a média por momento e a insulina por dia. Relatórios mostram as observações |
| lifesystemsufpr/GliCare#14 | Cadastro em duas etapas, aviso de perfil incompleto e fim do contato de emergência no app. Inclui o #8 | Cadastre uma conta só com nome, e-mail e senha. A Home mostra "Complete seu perfil" e as outras abas pedem o perfil. Depois de completar o perfil, as abas liberam sem novo login |
| lifesystemsufpr/GliCare#15 | As cores das telas passam para tokens em `src/shared/theme/colors.ts` (181 trocas), sem mudar nenhum valor | Screenshots antes e depois em 12 telas, idênticos pixel a pixel. O tema escuro não foi implementado |

API: #49 acrescenta `observacao` em `/reports/records` e `quantidade` em
`/dashboard` (`insulinaTotalDiaria`). É só acréscimo, então o app atual
continua funcionando. Para conferir:

- `GET /api/reports/records`: cada glicemia e cada insulina traz `observacao`
  (`null` quando não há);
- `GET /api/dashboard`: cada dia de `insulinaTotalDiaria` traz `quantidade`.

**Ordem de publicação:** a API com #45, #46 e #49 no ar antes do app com #13
e #14.

**Não testado em aparelho:**

- área segura do topo (#9);
- cancelamento dos alertas locais depois de excluir a conta (#10);
- geração e compartilhamento do PDF no Android e no iOS (#13).

**Fora da autorização:**

- remover do banco as colunas do contato de emergência (depende de
  confirmação, #48);
- textos de Termos de Uso e Política de Privacidade;
- lista fechada de tipos de insulina;
- regras clínicas;
- recusar datas futuras na API;
- envio real de e-mail (SMTP);
- configurações de produção (`CORS_ORIGIN` e proxy);
- ClickUp.

## O que não foi alterado

- **ClickUp:** só leitura. Os status desatualizados estão no relatório da
  rodada para o PM ajustar.
- **Proteção da branch `development`:** decidimos não usar bloqueio. O fluxo
  por PR com CI verde é combinado do time.
