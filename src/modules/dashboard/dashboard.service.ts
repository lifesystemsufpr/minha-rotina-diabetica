import { Injectable } from '@nestjs/common';
import { DateRangeQueryDto } from '../../common/dto/date-range-query.dto';
import { GlycemiaService } from '../glycemia/glycemia.service';
import { InsulinService } from '../insulin/insulin.service';
import {
  calcularMedia,
  encontrarMaior,
  encontrarMenor,
  montarSerieGlicemia,
  totalizarInsulinaPorDia,
} from './dashboard.calculations';
import { DashboardResponseDto } from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly glycemiaService: GlycemiaService,
    private readonly insulinService: InsulinService,
  ) {}

  // Os services de Glicemia e Insulina já filtram por dono e por período.
  async getDashboard(
    userId: string,
    filtros: DateRangeQueryDto,
  ): Promise<DashboardResponseDto> {
    const [glicemias, insulinas] = await Promise.all([
      this.glycemiaService.findAll(userId, filtros),
      this.insulinService.findAll(userId, filtros),
    ]);

    return {
      mediaGlicemia: calcularMedia(glicemias),
      maiorValor: encontrarMaior(glicemias),
      menorValor: encontrarMenor(glicemias),
      glicemiaAoLongoDoDia: montarSerieGlicemia(glicemias),
      insulinaTotalDiaria: totalizarInsulinaPorDia(insulinas),
    };
  }
}
