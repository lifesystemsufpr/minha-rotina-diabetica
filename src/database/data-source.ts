import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from './database.config';

// Usado apenas pela CLI do TypeORM (npm run migration:*).
export const AppDataSource = new DataSource({
  ...buildDatabaseOptions((key) => process.env[key]),
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
