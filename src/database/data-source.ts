import 'dotenv/config';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'rotina_diabetica',
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false, 
});