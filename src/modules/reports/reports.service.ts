import { Injectable } from '@nestjs/common';
import { DateRangeQueryDto } from '../../common/dto/date-range-query.dto';
import { GlycemiaService } from '../glycemia/glycemia.service';
import { InsulinService } from '../insulin/insulin.service';
import { RecordType, ReportRecordDto } from './dto/report-record.dto';
import { UsersService } from '../users/users.service';
import { buildReportFileName } from './pdf/report-file-name';
import { ReportPdfService } from './pdf/report-pdf.service';

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
    private readonly usersService: UsersService,
    private readonly pdfService: ReportPdfService,
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
    // PDF do período. Os registros vêm de findRecords(userId, ...), que já
  // filtra por dono e período, então o arquivo só tem dados deste usuário.
  async generatePdf(
    userId: string,
    filtros: DateRangeQueryDto,
  ): Promise<{ fileName: string; content: Buffer }> {
    const records = await this.findRecords(userId, filtros);

    // Identificação (só o nome) depende de aprovação: desligada por padrão.
    // Para habilitar: REPORT_PDF_INCLUDE_USER_NAME=true no .env.
    const incluirNome = process.env.REPORT_PDF_INCLUDE_USER_NAME === 'true';
    const userName = incluirNome
      ? (await this.usersService.findById(userId))?.nome
      : undefined;

    const content = await this.pdfService.generate({
      userName,
      startDate: filtros.startDate,
      endDate: filtros.endDate,
      generatedAt: new Date(),
      records,
    });
    return {
      fileName: buildReportFileName(filtros.startDate, filtros.endDate),
      content,
    };
  }
}