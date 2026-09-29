import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(config.get('DATABASE_PORT', 3306)),
        username: config.get<string>('DATABASE_USER', 'root'),
        password: config.get<string>('DATABASE_PASSWORD'),
        database: config.get<string>('DATABASE_NAME'),
        autoLoadEntities: true, 
        synchronize: false,     
        logging: true,         
      }),
    }),
  ],
})
export class DatabaseModule {}