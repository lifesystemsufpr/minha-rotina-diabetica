import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Glicemia } from '../glycemia/entities/glicemia.entity';
import { Insulina } from '../insulin/entities/insulina.entity';
import { Lembrete } from '../reminders/entities/lembrete.entity';
import { UsersModule } from '../users/users.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Glicemia, Insulina, Lembrete]),
    UsersModule,
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
