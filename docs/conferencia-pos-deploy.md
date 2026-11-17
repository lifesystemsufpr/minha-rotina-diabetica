# Conferência depois do deploy da API

Roteiro para quem publicou a API confirmar que a versão está no ar. Rode no
ambiente publicado, logo depois do `npm run start:prod`.

1. Rode `npm run migration:show` no servidor da API.
   Esperado: nenhuma migration aparece com `[ ]`.

2. Abra `https://ENDERECO-DA-API/api/docs` no navegador.
   Esperado: o Swagger abre.

3. Rode o script de conferência, de qualquer máquina com Node 22:

   ```bash
   npm run conferencia:pos-deploy -- https://ENDERECO-DA-API
   ```

   Esperado: todas as linhas terminam em `ok` e o comando sai com código 0.

   O script cria uma conta de teste (`conferencia+...@exemplo.invalid`),
   completa o perfil, grava duas glicemias e uma aplicação de insulina, lê o
   resumo da Home e exclui a conta. A exclusão roda mesmo quando um passo do
   meio falha. Se a própria exclusão falhar, o script mostra o e-mail da conta
   para ela ser apagada à mão. Como em toda exclusão de conta, fica no banco
   uma linha inativa e sem dados pessoais em `usuarios`.

   O script grava registros com a hora de agora, e a API recusa data no futuro
   (tolerância de 5 minutos). Se o relógio da sua máquina estiver adiantado, o
   passo da glicemia falha: acerte o relógio e rode de novo.

4. Teste o e-mail de recuperação de senha com uma conta sua: peça a
   recuperação pelo app ou pelo Swagger (`POST /api/auth/forgot-password`).
   Esperado: o e-mail chega e o código permite trocar a senha.
   Em produção, `PASSWORD_RESET_MAIL_MODE` precisa ser `smtp`, com as variáveis
   `SMTP_*` e `PASSWORD_RESET_URL` do `.env.example` preenchidas. O valor
   `disabled` só serve para desenvolvimento e testes.

5. Confira a variável `CORS_ORIGIN` no servidor.
   Esperado: ela lista os endereços que podem chamar a API, separados por
   vírgula. Vazia, a API aceita chamadas de qualquer site.

6. Se a API fica atrás de um proxy (Nginx, balanceador ou plataforma de
   hospedagem), teste o limite de tentativas de login a partir de duas redes
   diferentes.
   Esperado: quando uma rede é bloqueada (resposta 429), a outra continua
   conseguindo entrar.
   Hoje a API não tem configuração de `trust proxy`. Atrás de um proxy, todas
   as pessoas aparecem com o endereço do proxy e dividem o mesmo limite: uma
   pessoa errando a senha várias vezes bloqueia o login de todas por alguns
   minutos. Se isso acontecer, o `trust proxy` precisa ser configurado no
   código antes de liberar o acesso. Detalhes em
   [`auth-security.md`](auth-security.md).

Se um passo falhar, pare, anote o resultado e veja a seção
[Se precisar voltar](deploy-backup.md#se-precisar-voltar) do
`deploy-backup.md`.
