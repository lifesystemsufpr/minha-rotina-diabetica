# Backup do banco e rollback no deploy

Roteiro para publicar uma versão que tem migration, com volta garantida se
algo der errado. Ele foi ensaiado em nov/2026 no MariaDB 10.4, com a migration
`RemoveContatoEmergencia`: backup, deploy, restauração e conferência dos dados.

O roteiro vale para qualquer migration que apague ou altere dados. No próximo
deploy rodam:

- `RemoveContatoEmergenciaComCopia`: tira o contato de emergência de `perfis` e
  guarda uma cópia na tabela `perfis_contato_emergencia_backup`;
- `RecalculaStatusGlicemiaPorMomento`: recalcula o `status` das glicemias
  gravadas conforme o `momento` (teto 130 antes da refeição/jejum e 180 após a
  refeição; o `down` volta à regra antiga 70/180 só pelo valor);
- `PadronizaTipoInsulinaComCopia`: guarda o `tipo` original de todas as linhas
  de `insulinas` em `insulinas_tipo_backup` e converte os rótulos antigos para
  os códigos de `TipoInsulina` (o `down` restaura a partir da cópia e apaga a
  tabela);
- `AddTermosAceiteToUsuarios`: adiciona `termos_versao` e `termos_aceitos_em`
  em `usuarios`.

Mesmo com as tabelas de cópia e o `down` reversível, faça o backup completo
antes do deploy.

Quem roda é quem tem acesso ao servidor do banco. O repositório não guarda
endereço nem senha de produção, e eles não devem ir para o Git.

O ensaio foi no MariaDB. Os comandos são os mesmos no MySQL. No MySQL 8.0.21
ou mais novo, com usuário sem permissão `PROCESS` (comum em banco gerenciado),
o `mysqldump` sem `--no-tablespaces` falha. Por isso a opção já está no
comando abaixo.

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
   mysqldump -h HOST -P PORTA -u USUARIO -p --single-transaction --no-tablespaces --routines --triggers --default-character-set=utf8mb4 BANCO > backup-AAAA-MM-DD.sql
   ```

5. Confira que o arquivo não está vazio e termina com `-- Dump completed`:

   ```bash
   tail -n 1 backup-AAAA-MM-DD.sql
   ```

6. Teste se o backup restaura, num banco à parte, antes de mexer no de
   produção. Os números das duas colunas devem ser iguais:

   ```bash
   mysql -h HOST -P PORTA -u USUARIO -p -e "CREATE DATABASE BANCO_teste_restore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -h HOST -P PORTA -u USUARIO -p --default-character-set=utf8mb4 BANCO_teste_restore < backup-AAAA-MM-DD.sql
   mysql -h HOST -P PORTA -u USUARIO -p -e "SELECT (SELECT COUNT(*) FROM BANCO.usuarios), (SELECT COUNT(*) FROM BANCO_teste_restore.usuarios), (SELECT COUNT(*) FROM BANCO.perfis), (SELECT COUNT(*) FROM BANCO_teste_restore.perfis), (SELECT COUNT(*) FROM BANCO.glicemias), (SELECT COUNT(*) FROM BANCO_teste_restore.glicemias);"
   mysql -h HOST -P PORTA -u USUARIO -p -e "DROP DATABASE BANCO_teste_restore;"
   ```

   Sem permissão para criar outro banco, restaure numa cópia local.

O arquivo tem dados de saúde (dados pessoais sensíveis, LGPD). Guarde-o fora
do repositório, com acesso restrito, e apague-o quando a versão estiver
confirmada.

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
2. Faça um backup do banco **como está agora**, com o mesmo `mysqldump`, num
   arquivo com outro nome. Ele guarda o que foi gravado depois do deploy, que
   se perde na restauração e pode precisar ser recuperado à mão.
3. Recrie o banco e restaure o backup de antes do deploy:

   ```bash
   mysql -h HOST -P PORTA -u USUARIO -p -e "DROP DATABASE BANCO; CREATE DATABASE BANCO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -h HOST -P PORTA -u USUARIO -p --default-character-set=utf8mb4 BANCO < backup-AAAA-MM-DD.sql
   ```

4. Volte o código para a versão anterior e suba a API de novo.
5. Confira com `npm run migration:show` que a migration nova aparece de novo
   como `[ ]` (não aplicada).

### 2. `migration:revert` (volta só a estrutura)

```bash
npm run migration:revert
```

Desfaz a última migration. No caso da `RemoveContatoEmergenciaComCopia`, as
colunas de contato voltam **com os dados**, copiados da tabela
`perfis_contato_emergencia_backup`, e a tabela é apagada. A migration antiga
`RemoveContatoEmergencia` (que não está mais no repositório) devolvia as
colunas vazias.

## Depois de confirmar a remoção do contato

A tabela `perfis_contato_emergencia_backup` guarda dados pessoais que o produto
não usa mais. Quando a versão estiver confirmada em produção e não houver mais
chance de voltar, apague a tabela:

```bash
mysql -h HOST -P PORTA -u USUARIO -p -e "DROP TABLE BANCO.perfis_contato_emergencia_backup;"
```

Até lá, a exclusão de conta apaga a linha de quem excluir a conta. Depois de
apagar a tabela, a exclusão de conta continua funcionando (ela confere se a
tabela existe) e o `migration:revert` dessa migration recria as colunas vazias.

Se a `RemoveContatoEmergenciaComCopia` parar no meio (queda de conexão, por
exemplo), basta rodar `npm run migration:run` de novo. Ela não copia de novo
quem já está na tabela de cópia e apaga só as colunas que sobraram. Isso foi
ensaiado no MariaDB com a cópia feita e nenhuma coluna apagada, e com a cópia
feita e uma coluna já apagada.

## Como o ensaio foi feito

Num banco local de teste:

1. Rodei as migrations até a anterior à nova e gravei um usuário com contato de
   emergência.
2. Fiz o backup com o `mysqldump` acima e o restaurei num banco à parte: as
   contagens de `usuarios`, `perfis` e `glicemias` bateram.
3. Rodei `migration:run`: as colunas de contato saíram.
4. Recriei o banco e restaurei o backup. O contato voltou igual, e
   `migration:show` mostrou a `RemoveContatoEmergencia` como não aplicada.

O passo a passo para repetir está em
[`verificacao-manual.md`](verificacao-manual.md#backup-e-rollback).
