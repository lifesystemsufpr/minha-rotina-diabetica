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
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Token ausente, inválido, expirado ou de conta excluída',
  type: ErrorResponseDto,
})
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Indicadores da tela Dashboard',
    description:
      'Sem startDate/endDate, considera todo o histórico do usuário. Sem registros no período, responde 200 com média, maior e menor valor null e as séries vazias.',
  })
  @ApiOkResponse({ type: DashboardResponseDto })
  @ApiBadRequestResponse({
    description: 'Período inválido (formato ou startDate posterior a endDate)',
    type: ErrorResponseDto,
  })
  getDashboard(
    @CurrentUser('id') userId: string,
    @Query() filtros: DateRangeQueryDto,
  ): Promise<DashboardResponseDto> {
    return this.service.getDashboard(userId, filtros);
  }
}
