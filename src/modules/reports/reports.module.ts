import { Module } from '@nestjs/common';
import { GlycemiaModule } from '../glycemia/glycemia.module';
import { InsulinModule } from '../insulin/insulin.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { UsersModule } from '../users/users.module';
import { ReportPdfService } from './pdf/report-pdf.service';

@Module({
  imports: [GlycemiaModule, InsulinModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportPdfService],
})
export class ReportsModule {}