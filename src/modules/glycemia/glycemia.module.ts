import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Glicemia } from './entities/glicemia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Glicemia])],
})
export class GlycemiaModule {}
