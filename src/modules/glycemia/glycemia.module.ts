import { Module } from '@nestjs/common';
import { GlycemiaController } from './glycemia.controller';
import { GlycemiaService } from './glycemia.service';

@Module({
  controllers: [GlycemiaController],
  providers: [GlycemiaService]
})
export class GlycemiaModule {}