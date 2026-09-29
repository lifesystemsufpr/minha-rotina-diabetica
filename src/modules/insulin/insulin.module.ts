import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Insulina } from './entities/insulina.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Insulina])],
  exports: [TypeOrmModule],
})
export class InsulinModule {}