import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Perfil } from './entities/perfil.entity';

// O repositório de usuários não é exportado: outros módulos (como Auth)
// devem usar o UsersService quando ele existir, nunca a tabela direto.
@Module({
  imports: [TypeOrmModule.forFeature([User, Perfil])],
  controllers: [UsersController],
})
export class UsersModule {}
