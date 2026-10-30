import { Controller, Get, Query, UseGuards, Res, StreamableFile } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { DateRangeQueryDto } from '../../common/dto/date-range-query.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportRecordDto } from './dto/report-record.dto';
import { ReportsService } from './reports.service';
import type { Response } from 'express';

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

  @Get('pdf')
  @ApiOperation({
    summary: 'Gera o relatório em PDF (glicemias e insulina) do período',
    description:
      'Retorna o arquivo direto na resposta (application/pdf, attachment). ' +
      'Sem registros no período, devolve um PDF válido com aviso de "nenhum registro".',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Arquivo PDF, enviado direto no corpo da resposta',
    headers: {
      'Content-Disposition': {
        description:
          'attachment; filename="relatorio-rotina-diabetica_<inicio>_a_<fim>.pdf"',
        schema: { type: 'string' },
      },
      'Content-Length': {
        description: 'Tamanho do arquivo em bytes',
        schema: { type: 'integer' },
      },
      'Cache-Control': {
        description: 'no-store: o relatório não deve ser guardado em cache',
        schema: { type: 'string' },
      },
    },
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiBadRequestResponse({
    description: 'Período inválido (formato ou startDate posterior a endDate)',
    type: ErrorResponseDto,
  })
  async generatePdf(
    @CurrentUser('id') userId: string,
    @Query() filtros: DateRangeQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // O PDF é gerado por inteiro antes de qualquer header: se falhar, o erro
    // sai pelo filtro global no formato padrão da API (JSON), não como arquivo.
    const { fileName, content } = await this.service.generatePdf(
      userId,
      filtros,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(content.length),
      'Cache-Control': 'no-store', // dados de saúde: não guardar em cache
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(content);
  }
}