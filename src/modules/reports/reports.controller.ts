import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DateRangeQueryDto } from '../../common/dto/date-range-query.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportRecordDto } from './dto/report-record.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Token ausente, inválido, expirado ou de conta excluída',
  type: ErrorResponseDto,
})
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('records')
  @ApiOperation({
    summary:
      'Lista única de glicemias e aplicações de insulina (mais recente primeiro)',
  })
  @ApiOkResponse({ type: [ReportRecordDto] })
  @ApiBadRequestResponse({
    description: 'Período inválido (formato ou startDate posterior a endDate)',
    type: ErrorResponseDto,
  })
  findRecords(
    @CurrentUser('id') userId: string,
    @Query() filtros: DateRangeQueryDto,
  ): Promise<ReportRecordDto[]> {
    return this.service.findRecords(userId, filtros);
  }
}
