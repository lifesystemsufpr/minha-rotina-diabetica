import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Perfil } from './entities/perfil.entity';
import { ContatoEmergenciaBackup } from './entities/contato-emergencia-backup.entity';
import { InsulinaTipoBackup } from '../insulin/entities/insulina-tipo-backup.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Perfil,
      ContatoEmergenciaBackup,
      InsulinaTipoBackup,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
