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
    // Só erros e avisos: o log completo imprimiria os valores das queries
    // (e-mail, hash de senha) no console.
    logging: ['error', 'warn'],
  };
}
