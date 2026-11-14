# Limitação de tentativas e invalidação de sessões

Esta entrega protege login e recuperação sem dependências adicionais. O mobile já apresenta a mensagem HTTP retornada pela API e encerra a sessão quando recebe 401 do token corrente.

## Limites de tentativas

Contadores persistem em `auth_rate_buckets`, compartilhados por todas as instâncias que usam o mesmo banco e `JWT_SECRET`. Uma janela fixa padrão dura 900 segundos (15 minutos):

| Rota | Por IP | Por e-mail normalizado |
|---|---:|---:|
| POST /api/auth/login | 30 | 10 |
| POST /api/auth/forgot-password | 10 | 3 |
| POST /api/auth/reset-password | 20 | Não se aplica |

Cada requisição conta antes da validação de DTO e do processamento da senha. Tentativas bem-sucedidas também contam e não zeram a cota. A cota por e-mail só é aplicada quando há um campo string de até 320 caracteres; entradas ausentes ou malformadas continuam sujeitas ao limite de IP. São limites de requisições, não bloqueios permanentes de conta.

Ao esgotar qualquer cota, a API responde `429 Too Many Requests`, com o envelope de erro habitual, uma mensagem genérica com tempo de espera e o header `Retry-After` em segundos. Não informa se a conta existe nem qual limite foi atingido. A solicitação bloqueada não faz login, não gera token de recuperação e não envia e-mail. Login, solicitação e redefinição têm orçamentos distintos.

O banco só recebe a chave HMAC-SHA256 da rota, identidade e janela; não recebe e-mail, IP, senha ou código em texto nos contadores. O incremento condicional é atômico e limita chamadas concorrentes. Os registros expirados são limpos sob demanda, no máximo uma vez por minuto por processo; se não houver tráfego, permanecem até nova limpeza. Uma falha no banco impede a operação de autenticação, em vez de ignorar o limite.

As variáveis opcionais estão em `.env.example`: `AUTH_RATE_WINDOW_SECONDS`, `AUTH_LOGIN_IP_LIMIT`, `AUTH_LOGIN_ACCOUNT_LIMIT`, `AUTH_FORGOT_IP_LIMIT`, `AUTH_FORGOT_ACCOUNT_LIMIT`, `AUTH_RESET_IP_LIMIT`. Valores inválidos impedem a inicialização; não há chave para desativar a proteção. Todas as instâncias precisam da mesma política, segredo, relógios sincronizados e fusos dos processos alinhados para o armazenamento de expiração em datetime. Alterar a política ou o segredo durante uma janela pode alterar o orçamento disponível.

O aplicativo Express não confia em `X-Forwarded-For` por padrão. O guard usa `request.ip`, com fallback ao socket, sem ler diretamente headers enviados pelo cliente. Atrás de proxy, todos os clientes podem compartilhar a cota do endereço do proxy. Antes de publicar nessa topologia, configurar e testar a confiança apenas nos proxies conhecidos na infraestrutura; nunca confiar indiscriminadamente em headers da internet. Esta entrega não muda `trust proxy`.

Uma janela fixa admite uma nova cota na virada da janela; não é uma janela deslizante. Um atacante pode consumir a cota de um e-mail e impedir temporariamente seu login/recuperação. Ajustar as cotas ao tráfego real e complementar com proteção de borda conforme a infraestrutura. O cadastro não foi incluído neste escopo.

## Versão da sessão no JWT

`usuarios.token_version` inicia em zero. O login lê essa versão junto ao hash da senha e emite `{ sub, ver }` (mais os tempos JWT). A estratégia JWT verifica assinatura, expiração, formato do payload, conta ativa e igualdade da versão com o banco em cada requisição protegida. A versão não aparece nas respostas públicas de usuário.

Redefinir a senha atualiza o hash e incrementa `token_version` atomicamente, na mesma transação que consome o código de recuperação. Todos os JWTs anteriores dessa conta passam a retornar 401 na próxima requisição protegida, mesmo que ainda não tenham expirado. Outras contas continuam funcionando. Código inválido, expirado ou usado não altera a versão; falha na transação reverte senha, versão e consumo do código. Um novo login com a nova senha emite a versão atual.

**JWTs legados sem `ver` são recusados imediatamente após implantar esta versão. Todos os usuários com esses tokens precisarão entrar novamente.** Não há renovação automática. Requisições já autorizadas antes da redefinição não são revertidas. Alertas locais de outro aparelho só são cancelados quando esse aparelho executa o app e detecta a sessão inválida; a invalidação da API não cancela remotamente alertas do sistema operacional.

## Implantação e migration

1. Revisar o patch `11-seguranca-autenticacao-backend.patch`, configurar limites e realizar o backup habitual do banco.
2. Em janela controlada, pausar as instâncias antigas e aplicar as migrations pelo fluxo do projeto: `npm.cmd run migration:run`. Não colocar a versão antiga em paralelo com a nova: ela não valida `ver`.
3. A migration `1793664000000-AddAuthSecurity.ts` adiciona `token_version` com padrão zero e a tabela de contadores com índice de expiração. Ela não altera senhas ou registros clínicos existentes.
4. Iniciar a nova versão, conferir política uniforme em todas as instâncias e avisar sobre o novo login obrigatório. `synchronize` continua desabilitado.
5. Homologar 429, SMTP, nova senha, tokens antigos e isolamento entre contas com dados sintéticos.

**Nenhuma migration foi executada no MySQL durante o desenvolvimento desta entrega.** A migration foi exercitada em SQLite descartável. A execução e a concorrência no MySQL real ainda precisam de homologação.

Evitar rollback isolado da coluna de versão: reinstalar código antigo volta a aceitar tokens sem verificar revogação. A reversão `down` existe para o mecanismo de migrations, mas apaga os contadores e a versão; requer um plano operacional que invalide os tokens existentes. Nenhuma reversão foi executada em banco real.

## Testes

- Unitários: política padrão, configuração inválida e regressão de autenticação/usuários/recuperação.
- E2E com SQLite em memória: 429 por conta e IP, normalização de e-mail, headers forjados, concorrência, persistência entre instâncias do serviço, expiração das janelas, recuperação sem enumeração, invalidação de JWTs, outra conta preservada e rollback transacional.
- Migration: aplicação e reversão em banco SQLite isolado, preservando a senha sintética existente.
- As suítes funcionais antigas usam cotas altas somente no ambiente de testes; a suíte de proteção injeta cotas pequenas e exercita o mesmo guard e banco. O SMTP permanece simulado.

Comandos: `npm.cmd run build`, `npm.cmd test -- --runInBand`, `npm.cmd run test:e2e -- --runInBand`.
