# Visão geral do projeto

O Minha Rotina Diabética ajuda pessoas com diabetes a registrar e acompanhar a
rotina: glicemia, aplicações de insulina, lembretes, painel e relatórios. O
aplicativo se chama GliCare.

## Os dois repositórios

- [minha-rotina-diabetica](https://github.com/lifesystemsufpr/minha-rotina-diabetica)
  (este): a API em NestJS. Cuida do cadastro, do login, das regras (por
  exemplo, se uma glicemia é baixa, normal ou alta) e do banco de dados.
- [GliCare](https://github.com/lifesystemsufpr/GliCare): o aplicativo em Expo
  (React Native). Mostra as telas e chama a API. Não repete as regras da API.

## Como o trabalho entra

- Na API, os PRs entram na branch `development`. Todo PR roda lint, build e
  testes sozinho (GitHub Actions). A `main` ainda não recebe a versão
  publicada.
- No app, os PRs entram na branch `dev`.
- Quando uma mudança mexe nos dois lados, a API é publicada antes do app. O
  app novo depende de campos que só a API nova devolve.

## O que não fica no repositório

Endereço, usuário e senha de produção, e o arquivo de backup do banco. Eles
ficam com quem cuida do servidor e não devem ir para o Git.

## Onde está cada assunto

Para rodar a API na sua máquina, comece pelo [`README.md`](../README.md).

Publicação:

- [`deploy-backup.md`](deploy-backup.md): backup antes do deploy, deploy e como
  voltar.
- [`conferencia-pos-deploy.md`](conferencia-pos-deploy.md): como confirmar que
  a versão publicada está funcionando.

Conta e segurança:

- [`cadastro-em-etapas.md`](cadastro-em-etapas.md): cadastro em duas etapas e
  perfil incompleto.
- [`auth-security.md`](auth-security.md): limite de tentativas e sessão.
- [`password-recovery.md`](password-recovery.md): recuperação de senha por
  e-mail.
- [`account-deletion.md`](account-deletion.md): o que a exclusão de conta
  apaga.

Registros e telas:

- [`glycemia-insulin.md`](glycemia-insulin.md): glicemias e aplicações de
  insulina.
- [`reminders.md`](reminders.md): lembretes.
- [`home.md`](home.md), [`dashboard.md`](dashboard.md) e
  [`reports.md`](reports.md): resumo da Home, painel e relatórios.
- [`revisao-graficos.md`](revisao-graficos.md): revisão clínica dos gráficos e
  das metas de glicemia.

Regras gerais da API:

- [`validation.md`](validation.md), [`errors.md`](errors.md) e
  [`date-range.md`](date-range.md): validação das entradas, formato dos erros
  e filtro por período.
- [`verificacao-manual.md`](verificacao-manual.md): como conferir cada mudança
  da revisão à mão.
