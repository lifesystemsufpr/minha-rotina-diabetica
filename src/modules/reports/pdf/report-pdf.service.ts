import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { MomentoGlicemia } from '../../glycemia/enums/momento-glicemia.enum';
import { StatusGlicemia } from '../../glycemia/enums/status-glicemia.enum';
import { LocalAplicacao } from '../../insulin/enums/local-aplicacao.enum';
import {
  GlycemiaSummaryDto,
  InsulinSummaryDto,
  RecordType,
  ReportRecordDto,
} from '../dto/report-record.dto';

export interface ReportPdfData {
  // Só preenchido se a identificação no PDF estiver aprovada/habilitada.
  userName?: string;
  startDate?: string; // AAAA-MM-DD
  endDate?: string; // AAAA-MM-DD
  generatedAt: Date;
  records: ReportRecordDto[]; // já filtrados por usuário e período
}

const MOMENTO: Record<MomentoGlicemia, string> = {
  [MomentoGlicemia.JEJUM]: 'Jejum',
  [MomentoGlicemia.ANTES_CAFE]: 'Antes do café',
  [MomentoGlicemia.APOS_CAFE]: 'Após o café',
  [MomentoGlicemia.ANTES_ALMOCO]: 'Antes do almoço',
  [MomentoGlicemia.APOS_ALMOCO]: 'Após o almoço',
  [MomentoGlicemia.ANTES_JANTAR]: 'Antes do jantar',
  [MomentoGlicemia.APOS_JANTAR]: 'Após o jantar',
};

const STATUS: Record<StatusGlicemia, string> = {
  [StatusGlicemia.BAIXA]: 'Baixa',
  [StatusGlicemia.NORMAL]: 'Normal',
  [StatusGlicemia.ALTA]: 'Alta',
};

const LOCAL: Record<LocalAplicacao, string> = {
  [LocalAplicacao.ABDOMEN]: 'Abdômen',
  [LocalAplicacao.BRACO]: 'Braço',
  [LocalAplicacao.COXA]: 'Coxa',
  [LocalAplicacao.GLUTEO]: 'Glúteo',
};

const ROW_HEIGHT = 18;
const COL_X = { data: 40, tipo: 150, detalhe: 230 };

// 'AAAA-MM-DD' -> 'DD/MM/AAAA' sem passar por Date (evita problema de fuso).
function formatDateOnly(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

function formatPeriod(startDate?: string, endDate?: string): string {
  if (startDate && endDate) {
    return `${formatDateOnly(startDate)} a ${formatDateOnly(endDate)}`;
  }
  if (startDate) return `a partir de ${formatDateOnly(startDate)}`;
  if (endDate) return `até ${formatDateOnly(endDate)}`;
  return 'Todo o histórico';
}

// Mesmo fuso do filtro por período (horário do servidor).
function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function descreverRegistro(record: ReportRecordDto): {
  tipo: string;
  detalhe: string;
} {
  if (record.type === RecordType.GLYCEMIA && record.glycemia) {
    const g: GlycemiaSummaryDto = record.glycemia;
    return {
      tipo: 'Glicemia',
      detalhe: `${g.valor} mg/dL - ${MOMENTO[g.momento]} - ${STATUS[g.status]}`,
    };
  }
  const i = record.insulin as InsulinSummaryDto;
  const local = i.localAplicacao ? ` - ${LOCAL[i.localAplicacao]}` : '';
  return { tipo: 'Insulina', detalhe: `${i.tipo} - ${i.doseUi} UI${local}` };
}

// Serviço dedicado: recebe dados já prontos (não acessa banco) e devolve o
// PDF em memória. Assim a regra "só dados do usuário" fica no ReportsService
// e este serviço é testável sem banco.
@Injectable()
export class ReportPdfService {
  generate(data: ReportPdfData): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: { Title: 'Relatório de Glicemia e Insulina' },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.render(doc, data);
        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private render(doc: PDFKit.PDFDocument, data: ReportPdfData): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('Relatório de Glicemia e Insulina');
    doc.moveDown(0.5).font('Helvetica').fontSize(10);
    if (data.userName) doc.text(`Nome: ${data.userName}`);
    doc.text(`Período: ${formatPeriod(data.startDate, data.endDate)}`);
    doc.text(`Gerado em: ${formatDateTime(data.generatedAt)}`);
    doc.moveDown();

    // Sem dados: PDF válido com mensagem clara (o botão sempre gera arquivo).
    if (data.records.length === 0) {
      doc
        .fontSize(12)
        .text('Nenhum registro encontrado no período selecionado.');
      return;
    }

    this.renderSummary(doc, data.records);
    this.renderTable(doc, data.records);
  }

  private renderSummary(
    doc: PDFKit.PDFDocument,
    records: ReportRecordDto[],
  ): void {
    const glicemias = records.flatMap((r) => (r.glycemia ? [r.glycemia] : []));
    const insulinas = records.flatMap((r) => (r.insulin ? [r.insulin] : []));

    doc.font('Helvetica-Bold').fontSize(12).text('Resumo');
    doc.font('Helvetica').fontSize(10);

    if (glicemias.length > 0) {
      const valores = glicemias.map((g) => g.valor);
      const media = Math.round(
        valores.reduce((a, b) => a + b, 0) / valores.length,
      );
      const conta = (s: StatusGlicemia) =>
        glicemias.filter((g) => g.status === s).length;
      doc.text(
        `Glicemias: ${glicemias.length} registro(s) | média ${media} mg/dL | ` +
          `mín ${Math.min(...valores)} | máx ${Math.max(...valores)}`,
      );
      doc.text(
        `Baixa: ${conta(StatusGlicemia.BAIXA)} | Normal: ${conta(StatusGlicemia.NORMAL)} | ` +
          `Alta: ${conta(StatusGlicemia.ALTA)}`,
      );
    } else {
      doc.text('Glicemias: nenhum registro');
    }

    if (insulinas.length > 0) {
      const totalUi = round1(insulinas.reduce((acc, i) => acc + i.doseUi, 0));
      doc.text(
        `Insulina: ${insulinas.length} aplicação(ões) | total ${totalUi} UI`,
      );
    } else {
      doc.text('Insulina: nenhuma aplicação');
    }
    doc.moveDown();
  }

  private renderTable(
    doc: PDFKit.PDFDocument,
    records: ReportRecordDto[],
  ): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Registros (mais recente primeiro)');
    let y = doc.y + 6;

    const header = (): void => {
      this.row(doc, y, ['Data/hora', 'Tipo', 'Detalhes'], true);
      y += ROW_HEIGHT;
    };
    header();

    const limiteY = doc.page.height - doc.page.margins.bottom - ROW_HEIGHT;
    for (const record of records) {
      if (y > limiteY) {
        doc.addPage();
        y = doc.page.margins.top;
        header();
      }
      const { tipo, detalhe } = descreverRegistro(record);
      this.row(doc, y, [formatDateTime(record.dateTime), tipo, detalhe], false);
      y += ROW_HEIGHT;
    }
  }

  private row(
    doc: PDFKit.PDFDocument,
    y: number,
    [data, tipo, detalhe]: [string, string, string],
    bold: boolean,
  ): void {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
    doc.text(data, COL_X.data, y, { width: 105, lineBreak: false });
    doc.text(tipo, COL_X.tipo, y, { width: 75, lineBreak: false });
    doc.text(detalhe, COL_X.detalhe, y, { width: 315, lineBreak: false });
  }
}