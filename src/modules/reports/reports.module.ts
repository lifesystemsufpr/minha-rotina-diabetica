import { Module } from '@nestjs/common';
import { GlycemiaModule } from '../glycemia/glycemia.module';
import { InsulinModule } from '../insulin/insulin.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [GlycemiaModule, InsulinModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
