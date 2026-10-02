import { INestApplication, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { DatabaseModule } from '../../src/database/database.module';
import { TestDatabaseModule } from './test-database.module';

// Sobe a API com a mesma configuração do main.ts (prefixo /api, validação e
// filtro de erros), trocando o MySQL por SQLite em memória.
export async function createTestApp(
  extraControllers: Type[] = [],
): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
    controllers: extraControllers,
  })
    .overrideModule(DatabaseModule)
    .useModule(TestDatabaseModule)
    .compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}
