import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { buildDatabaseOptions } from './database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDatabaseOptions((key) => config.get<string>(key)),
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
