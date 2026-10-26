import { Module } from '@nestjs/common';
import { GlycemiaController } from './glycemia.controller';
import { GlycemiaService } from './glycemia.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Glicemia } from './entities/glicemia.entity';

@Module({
  controllers: [GlycemiaController],
  providers: [GlycemiaService],
  imports: [TypeOrmModule.forFeature([Glicemia])],
})
export class GlycemiaModule {}
