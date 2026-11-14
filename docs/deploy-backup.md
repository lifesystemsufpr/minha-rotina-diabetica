# Backup do banco e rollback no deploy

Roteiro para publicar uma versão que tem migration, com volta garantida se
algo der errado. Ele foi ensaiado em nov/2026 no MariaDB 10.4, com a migration
`RemoveContatoEmergencia`: backup, deploy, restauração e conferência dos dados.

Quem roda é quem tem acesso ao servidor do banco. O repositório não guarda
endereço nem senha de produção, e eles não devem ir para o Git.

## Antes do deploy

1. Avise quem usa o app sobre a janela de manutenção. Este deploy também
   desloga todo mundo (ver [`auth-security.md`](auth-security.md)).
2. Pare a API antiga ou bloqueie o acesso a ela. Assim nada é gravado entre o
   backup e a migration. Tudo o que entrar depois do backup se perde se for
   preciso restaurar.
3. Veja quais migrations vão rodar:

   ```bash
   npm run migration:show
   ```

   As marcadas com `[ ]` são as novas.
4. Faça o backup. Troque `USUARIO`, `HOST`, `PORTA` e `BANCO` pelos valores de
   produção. Com `-p` sem valor, a senha é pedida no terminal e não fica no
   histórico:

   ```bash
   mysqldump -h HOST -P PORTA -u USUARIO -p --single-transaction --routines --triggers --default-character-set=utf8mb4 BANCO > backup-AAAA-MM-DD.sql
   ```

5. Confira que o arquivo não está vazio e termina com `-- Dump completed`:

   ```bash
   tail -n 1 backup-AAAA-MM-DD.sql
   ```

   O arquivo tem dados de saúde (dados pessoais sensíveis, LGPD). Guarde-o
   fora do repositório, com acesso restrito, e apague-o quando a versão
   estiver confirmada.

## Deploy

```bash
npm ci
npm run build
npm run migration:run
npm run start:prod
```

Depois confira o Swagger (`/api/docs`), faça um login e um cadastro de teste.

## Se precisar voltar

Há dois caminhos. Use o primeiro sempre que os dados importarem.

### 1. Restaurar o backup (volta tudo, inclusive os dados apagados)

1. Pare a API.
2. Recrie o banco e restaure:

   ```bash
   mysql -h HOST -P PORTA -u USUARIO -p -e "DROP DATABASE BANCO; CREATE DATABASE BANCO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -h HOST -P PORTA -u USUARIO -p --default-character-set=utf8mb4 BANCO < backup-AAAA-MM-DD.sql
   ```

3. Volte o código para a versão anterior e suba a API de novo.
4. Confira com `npm run migration:show` que a migration nova aparece de novo
   como `[ ]` (não aplicada).

### 2. `migration:revert` (volta só a estrutura)

```bash
npm run migration:revert
```

Desfaz a última migration. No caso da `RemoveContatoEmergencia`, as colunas de
contato voltam **vazias**: o conteúdo apagado só volta pelo backup.

## Como o ensaio foi feito

Num banco local de teste:

1. Rodei as migrations até a anterior à nova e gravei um usuário com contato de
   emergência.
2. Fiz o backup com o `mysqldump` acima.
3. Rodei `migration:run`: as colunas de contato saíram.
4. Recriei o banco e restaurei o backup. O contato voltou igual, e
   `migration:show` mostrou a `RemoveContatoEmergencia` como não aplicada.

O passo a passo para repetir está em
[`verificacao-manual.md`](verificacao-manual.md#backup-e-rollback).
