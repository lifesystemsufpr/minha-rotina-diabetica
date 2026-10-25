import { Injectable } from '@nestjs/common';
import { DateRangeQueryDto } from '../../common/dto/date-range-query.dto';
import { GlycemiaService } from '../glycemia/glycemia.service';
import { InsulinService } from '../insulin/insulin.service';
import { RecordType, ReportRecordDto } from './dto/report-record.dto';

// Mais recente primeiro; empate no mesmo instante desempata por id, para a
// ordem ser sempre a mesma (o mobile agrupa por dia a partir dessa lista).
function porDataDesc(a: ReportRecordDto, b: ReportRecordDto): number {
  const diferenca = b.dateTime.getTime() - a.dateTime.getTime();
  return diferenca !== 0 ? diferenca : a.id.localeCompare(b.id);
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly glycemiaService: GlycemiaService,
    private readonly insulinService: InsulinService,
  ) {}

  // Consulta agregada: reaproveita os services de Glicemia e Insulina, que já
  // filtram por dono e por período. Nada é duplicado em tabela nova.
  async findRecords(
    userId: string,
    filtros: DateRangeQueryDto,
  ): Promise<ReportRecordDto[]> {
    const [glicemias, insulinas] = await Promise.all([
      this.glycemiaService.findAll(userId, filtros),
      this.insulinService.findAll(userId, filtros),
    ]);

    const registros: ReportRecordDto[] = [
      ...glicemias.map(
        (g): ReportRecordDto => ({
          type: RecordType.GLYCEMIA,
          id: g.id,
          dateTime: g.dataHora,
          glycemia: { valor: g.valor, momento: g.momento, status: g.status },
          insulin: null,
        }),
      ),
      ...insulinas.map(
        (i): ReportRecordDto => ({
          type: RecordType.INSULIN,
          id: i.id,
          dateTime: i.dataHora,
          glycemia: null,
          insulin: {
            tipo: i.tipo,
            doseUi: i.doseUi,
            localAplicacao: i.localAplicacao,
          },
        }),
      ),
    ];

    return registros.sort(porDataDesc);
  }
}