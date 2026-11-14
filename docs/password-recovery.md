# Recuperação de senha integrada ao mobile

## Configuração

O modo padrão `PASSWORD_RESET_MAIL_MODE=disabled` serve apenas para desenvolvimento e testes. Não envia mensagens e não imprime códigos ou destinatários. Produção exige `smtp`; configuração ausente/inválida interrompe a inicialização da API.

Defina no `.env` local (nunca no Git):

```dotenv
PASSWORD_RESET_MAIL_MODE=smtp
PASSWORD_RESET_URL=glicaremobile://reset-password
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_FROM=no-reply@example.com
SMTP_USER=
SMTP_PASSWORD=
```

Os valores acima são exemplos, não credenciais funcionais. Configure remetente autorizado e credenciais junto ao seu provedor. Para porta 465, use `SMTP_SECURE=true`. Produção exige TLS imediato ou STARTTLS obrigatório; certificados continuam sendo validados.

Para web, use uma URL HTTPS publicada terminando em `/reset-password`. HTTP é aceito somente fora de produção. Para development build/mobile com o scheme do projeto, use `glicaremobile://reset-password`. No Expo Go, o usuário pode copiar o código do e-mail e abrir **Já tenho o código** na tela de recuperação. O scheme exige um build que o registre.

O token é incluído no fragmento `#token=...`, que não é enviado em requisições HTTP para o servidor web. O mobile lê o fragmento e o remove do histórico web/cache inicial de links quando possível. A mensagem também contém o código para cópia manual. O envio usa texto simples e não carrega conteúdo de arquivos/URLs externos.

## Fluxo

1. Mobile chama `POST /api/auth/forgot-password` com `{ email }`.
2. A resposta permanece genérica, exista a conta ou não.
3. Para conta existente, a API armazena somente o hash do token temporário e chama o SMTP de forma assíncrona.
4. O usuário abre o link ou cola o código na tela pública `/reset-password`.
5. Mobile chama `POST /api/auth/reset-password` com `{ token, novaSenha }`.
6. O backend consome o token atomicamente e altera o hash da senha. O mobile limpa a sessão local e pede novo login.

O prazo permanece em `PASSWORD_RESET_TOKEN_TTL_MINUTES`. Código expirado, usado ou desconhecido retorna a mesma mensagem de erro. Falhas SMTP não revelam o e-mail ou o código nos logs, e a resposta pública de solicitação não muda conforme a existência da conta.

## Limites e homologação

- Nenhum e-mail real foi enviado durante o desenvolvimento. Testes capturam o transporte.
- Homologar SMTP e entregabilidade com uma conta sintética autorizada, além de links em Android/iOS/web.
- O envio é assíncrono, sem fila persistente ou retry automático. Reinício do processo pode interromper mensagens em andamento.
- A entrega de segurança posterior adiciona limitação persistente de tentativas e invalida os JWTs anteriores após redefinir a senha. Consulte [auth-security.md](auth-security.md) para a migration obrigatória e o procedimento de implantação.
- A etapa SMTP isolada não exige migration nova. Ao incluir a etapa de segurança, executar a migration aditiva correspondente antes de iniciar a nova versão do backend.

## Testes

```powershell
npm.cmd test -- --runInBand password-reset
npm.cmd run test:e2e -- --runInBand auth-password-reset
```

Os testes E2E forçam o envio desabilitado e usam SQLite em memória. O SMTP é validado com transporte injetado, sem conexão com provedores reais.

Referência de configuração: [documentação oficial do Nodemailer](https://nodemailer.com/smtp).
