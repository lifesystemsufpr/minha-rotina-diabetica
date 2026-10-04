import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { Perfil } from '../users/entities/perfil.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Perfil])],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
