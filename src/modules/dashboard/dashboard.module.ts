import { Module } from '@nestjs/common';
import { GlycemiaModule } from '../glycemia/glycemia.module';
import { InsulinModule } from '../insulin/insulin.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [GlycemiaModule, InsulinModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
