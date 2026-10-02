import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Banco SQLite em memória para os testes e2e: os testes rodam sem MySQL e
// cada execução começa com um banco limpo.
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
    }),
  ],
})
export class TestDatabaseModule {}
