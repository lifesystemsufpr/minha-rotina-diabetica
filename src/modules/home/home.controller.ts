import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HomeSummaryResponseDto } from './dto/home-summary-response.dto';
import { HomeService } from './home.service';

@ApiTags('home')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiUnauthorizedResponse({
  description: 'Token ausente, inválido, expirado ou de conta excluída',
  type: ErrorResponseDto,
})
@Controller('home')
export class HomeController {
  constructor(private readonly service: HomeService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumo da Home em uma chamada',
    description:
      'Nome, última glicemia, última insulina, próximo lembrete ATIVO, resumo do dia e glicemias dos últimos 7 dias. Sem registros, os campos vêm null, false ou [] (nunca 500).',
  })
  @ApiOkResponse({ type: HomeSummaryResponseDto })
  getSummary(
    @CurrentUser('id') userId: string,
  ): Promise<HomeSummaryResponseDto> {
    return this.service.getSummary(userId);
  }
}
