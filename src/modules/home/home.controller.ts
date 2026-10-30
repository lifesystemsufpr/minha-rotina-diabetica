import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HomeService } from './home.service';

@ApiTags('home')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('home')
export class HomeController {
  constructor(private readonly service: HomeService) {}

  @Get('summary') // GET responde 200 por padrão
  @ApiResponse({
    status: 200,
    description: 'Resumo da Home. Sem dados: null e array vazio',
    schema: {
      example: {
        nome: 'Maria',
        ultimaGlicemia: {
          id: 'abc',
          valor: 110,
          momento: 'jejum',
          dataHora: '2026-10-12T08:30:00.000Z',
        },

        ultimaInsulina: {
          id: 'def',
          tipo: 'rapida',
          doseUi: 8,
          localAplicacao: 'abdomen',
          dataHora: '2026-10-11T20:00:00.000Z',
        },

        proximoLembrete: {
          id: 'ghi',
          titulo: 'Insulina da noite',
          dataHora: '2026-10-12T21:00:00.000Z',
        },

        resumoDiario: { glicemiaRegistrada: true, insulinaRegistrada: false },
        glicemiaUltimos7Dias: [
          { dataHora: '2026-10-10T08:00:00.000Z', valor: 200 },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  getSummary(@Req() req: { user: { id: string } }) {
    return this.service.getSummary(req.user.id); // usuário vem do token
  }
}
