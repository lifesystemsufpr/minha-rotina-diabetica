import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  FindOperator,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { dateRangeWhere } from '../../common/utils/date-range';
import { toGlycemiaResponse } from '../glycemia/dto/glycemia-response.dto';
import { Glicemia } from '../glycemia/entities/glicemia.entity';
import { toInsulinResponse } from '../insulin/dto/insulin-response.dto';
import { Insulina } from '../insulin/entities/insulina.entity';
import { Lembrete } from '../reminders/entities/lembrete.entity';
import { StatusLembrete } from '../reminders/enums/status-lembrete.enum';
import { UsersService } from '../users/users.service';
import { HomeSummaryResponseDto } from './dto/home-summary-response.dto';

// 'AAAA-MM-DD' do dia local (fuso do processo da API, como o filtro por
// período em docs/date-range.md).
function diaLocal(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(Glicemia)
    private readonly glicemias: Repository<Glicemia>,
    @InjectRepository(Insulina)
    private readonly insulinas: Repository<Insulina>,
    @InjectRepository(Lembrete)
    private readonly lembretes: Repository<Lembrete>,
    private readonly users: UsersService,
  ) {}

  // Todas as consultas filtram pelo usuário do token. `agora` é parâmetro
  // para os testes conseguirem fixar o relógio.
  async getSummary(
    userId: string,
    agora = new Date(),
  ): Promise<HomeSummaryResponseDto> {
    const doUsuario = { user: { id: userId } };
    const hoje = diaLocal(agora);
    const seisDiasAtras = new Date(agora);
    seisDiasAtras.setDate(seisDiasAtras.getDate() - 6);
    // Registros com data futura (a API aceita) não contam como "último",
    // "registrado hoje" nem entram no gráfico até a hora chegar.
    const jaAconteceu = LessThanOrEqual(agora);
    const ateAgora = (desde: string): FindOperator<Date> =>
      And(dateRangeWhere(desde) as FindOperator<Date>, jaAconteceu);

    const [
      usuario,
      ultimaGlicemia,
      ultimaInsulina,
      proximoLembrete,
      glicemiaHoje,
      insulinaHoje,
      grafico,
    ] = await Promise.all([
      this.users.findById(userId),
      this.glicemias.findOne({
        where: { ...doUsuario, dataHora: jaAconteceu },
        order: { dataHora: 'DESC', id: 'ASC' },
      }),
      this.insulinas.findOne({
        where: { ...doUsuario, dataHora: jaAconteceu },
        order: { dataHora: 'DESC', id: 'ASC' },
      }),
      this.lembretes.findOne({
        where: {
          ...doUsuario,
          status: StatusLembrete.ATIVO,
          dataHora: MoreThanOrEqual(agora),
        },
        order: { dataHora: 'ASC', id: 'ASC' },
      }),
      this.glicemias.exists({
        where: { ...doUsuario, dataHora: ateAgora(hoje) },
      }),
      this.insulinas.exists({
        where: { ...doUsuario, dataHora: ateAgora(hoje) },
      }),
      this.glicemias.find({
        where: {
          ...doUsuario,
          dataHora: ateAgora(diaLocal(seisDiasAtras)),
        },
        order: { dataHora: 'ASC', id: 'ASC' },
      }),
    ]);

    return {
      nome: usuario?.nome ?? null,
      ultimaGlicemia: ultimaGlicemia
        ? toGlycemiaResponse(ultimaGlicemia)
        : null,
      ultimaInsulina: ultimaInsulina ? toInsulinResponse(ultimaInsulina) : null,
      proximoLembrete: proximoLembrete
        ? {
            id: proximoLembrete.id,
            titulo: proximoLembrete.titulo,
            dataHora: proximoLembrete.dataHora,
            status: proximoLembrete.status,
          }
        : null,
      resumoDiario: {
        glicemiaRegistrada: glicemiaHoje,
        insulinaRegistrada: insulinaHoje,
      },
      glicemiaUltimos7Dias: grafico.map((g) => ({
        dataHora: g.dataHora,
        valor: g.valor,
      })),
    };
  }
}
