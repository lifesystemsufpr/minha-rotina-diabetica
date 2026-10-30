import { MomentoGlicemia } from '../../glycemia/enums/momento-glicemia.enum';
import { StatusGlicemia } from '../../glycemia/enums/status-glicemia.enum';
import { LocalAplicacao } from '../../insulin/enums/local-aplicacao.enum';
import { RecordType, ReportRecordDto } from '../dto/report-record.dto';
import { ReportPdfService } from './report-pdf.service';

const glicemia = (i: number): ReportRecordDto => ({
  type: RecordType.GLYCEMIA,
  id: `g${i}`,
  dateTime: new Date(2026, 9, 12, 8, i % 60),
  glycemia: {
    valor: 100 + (i % 90),
    momento: MomentoGlicemia.JEJUM,
    status: StatusGlicemia.NORMAL,
  },
  insulin: null,
});

const insulina = (i: number): ReportRecordDto => ({
  type: RecordType.INSULIN,
  id: `i${i}`,
  dateTime: new Date(2026, 9, 12, 9, i % 60),
  glycemia: null,
  insulin: { tipo: 'Rápida', doseUi: 10, localAplicacao: LocalAplicacao.COXA },
});

// Um PDF válido começa com %PDF- e termina com %%EOF.
function expectValidPdf(buffer: Buffer): void {
  expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  expect(buffer.subarray(-16).toString('latin1')).toContain('%%EOF');
}

describe('ReportPdfService', () => {
  const service = new ReportPdfService();
  const base = { generatedAt: new Date(2026, 9, 13, 10, 0) };

  it('gera um PDF válido com registros e resumo', async () => {
    const pdf = await service.generate({
      ...base,
      startDate: '2026-10-01',
      endDate: '2026-10-13',
      records: [glicemia(1), insulina(1)],
    });
    expectValidPdf(pdf);
  });

  it('gera um PDF válido quando não há registros', async () => {
    const pdf = await service.generate({ ...base, records: [] });
    expectValidPdf(pdf);
  });

  it('aceita nome do usuário, período aberto e só um tipo de registro', async () => {
    const pdf = await service.generate({
      ...base,
      userName: 'Maria Silva',
      startDate: '2026-10-01',
      records: [glicemia(1)],
    });
    expectValidPdf(pdf);
  });

  it('pagina quando há muitos registros', async () => {
    const records = Array.from({ length: 150 }, (_, i) => glicemia(i));
    const pdf = await service.generate({ ...base, records });
    expectValidPdf(pdf);
    const um = await service.generate({ ...base, records: [glicemia(1)] });
    expect(pdf.length).toBeGreaterThan(um.length);
  });
});