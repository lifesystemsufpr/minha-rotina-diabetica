import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lembrete } from './entities/lembrete.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lembrete])],
  exports: [TypeOrmModule],
})
export class RemindersModule {}