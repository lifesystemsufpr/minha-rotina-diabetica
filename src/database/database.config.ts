import { DataSourceOptions } from 'typeorm';

type EnvReader = (key: string) => string | undefined;

// Configuração única do banco, usada pela API (DatabaseModule) e pela CLI de
// migrations (data-source.ts), para as duas nunca apontarem para bancos diferentes.
export function buildDatabaseOptions(env: EnvReader): DataSourceOptions {
  return {
    type: 'mysql',
    host: env('DATABASE_HOST') || 'localhost',
    port: Number(env('DATABASE_PORT') || 3306),
    username: env('DATABASE_USER') || 'root',
    password: env('DATABASE_PASSWORD'),
    database: env('DATABASE_NAME') || 'rotina_diabetica',
    // O schema só muda por migration.
    synchronize: false,
    // Só avisos. O log de queries (inclusive o de queries com erro) imprime
    // os parâmetros, como e-mail e hash de senha. Erros continuam chegando
    // ao filtro global, que loga qualquer 5xx sem os parâmetros.
    logging: ['warn'],
  };
}
