import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Glicemia } from './entities/glicemia.entity';
import { GlycemiaController } from './glycemia.controller';
import { GlycemiaService } from './glycemia.service';

@Module({
  imports: [TypeOrmModule.forFeature([Glicemia])],
  controllers: [GlycemiaController],
  providers: [GlycemiaService],
  exports: [GlycemiaService],
})
export class GlycemiaModule {}
