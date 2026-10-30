import { Test } from '@nestjs/testing';
import { GlycemiaResponseDto } from '../glycemia/dto/glycemia-response.dto';
import { MomentoGlicemia } from '../glycemia/enums/momento-glicemia.enum';
import { StatusGlicemia } from '../glycemia/enums/status-glicemia.enum';
import { GlycemiaService } from '../glycemia/glycemia.service';
import { InsulinResponseDto } from '../insulin/dto/insulin-response.dto';
import { InsulinService } from '../insulin/insulin.service';
import { RecordType } from './dto/report-record.dto';
import { ReportsService } from './reports.service';
import { UsersService } from '../users/users.service';
import { ReportPdfService } from './pdf/report-pdf.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const glycemiaService = { findAll: jest.fn() };
  const insulinService = { findAll: jest.fn() };
  const usersService = { findById: jest.fn() };
  const pdfService = { generate: jest.fn() };
  const glicemia = (id: string, dataHora: string): GlycemiaResponseDto => ({
    id,
    valor: 110,
    momento: Object.values(MomentoGlicemia)[0],
    status: Object.values(StatusGlicemia)[0],
    dataHora: new Date(dataHora),
    observacao: null,
  });

  const insulina = (id: string, dataHora: string): InsulinResponseDto => ({
    id,
    tipo: 'Rápida',
    doseUi: 10,
    localAplicacao: null,
    dataHora: new Date(dataHora),
    observacao: null,
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: GlycemiaService, useValue: glycemiaService },
        { provide: InsulinService, useValue: insulinService },
        { provide: UsersService, useValue: usersService },
        { provide: ReportPdfService, useValue: pdfService },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  it('junta glicemias e insulinas na mesma lista, normalizadas', async () => {
    glycemiaService.findAll.mockResolvedValue([
      glicemia('g1', '2026-10-12T11:30:00.000Z'),
    ]);
    insulinService.findAll.mockResolvedValue([
      insulina('i1', '2026-10-12T11:00:00.000Z'),
    ]);

    const result = await service.findRecords('user-1', {});

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      type: RecordType.GLYCEMIA,
      id: 'g1',
      glycemia: { valor: 110 },
      insulin: null,
    });
    expect(result[1]).toMatchObject({
      type: RecordType.INSULIN,
      id: 'i1',
      glycemia: null,
      insulin: { tipo: 'Rápida', doseUi: 10 },
    });
  });

  it('ordena os dois tipos juntos, do mais recente para o mais antigo', async () => {
    glycemiaService.findAll.mockResolvedValue([
      glicemia('g1', '2026-10-12T10:00:00.000Z'),
      glicemia('g2', '2026-10-12T08:00:00.000Z'),
    ]);
    insulinService.findAll.mockResolvedValue([
      insulina('i2', '2026-10-12T11:00:00.000Z'),
      insulina('i1', '2026-10-12T09:00:00.000Z'),
    ]);

    const result = await service.findRecords('user-1', {});

    expect(result.map((r) => r.id)).toEqual(['i2', 'g1', 'i1', 'g2']);
  });

  it('desempata registros no mesmo instante de forma previsível', async () => {
    glycemiaService.findAll.mockResolvedValue([
      glicemia('b', '2026-10-12T10:00:00.000Z'),
    ]);
    insulinService.findAll.mockResolvedValue([
      insulina('a', '2026-10-12T10:00:00.000Z'),
    ]);

    const result = await service.findRecords('user-1', {});

    expect(result.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('repassa o usuário e o período para os dois services', async () => {
    glycemiaService.findAll.mockResolvedValue([]);
    insulinService.findAll.mockResolvedValue([]);
    const filtros = { startDate: '2026-10-01', endDate: '2026-10-13' };

    await service.findRecords('user-1', filtros);

    expect(glycemiaService.findAll).toHaveBeenCalledWith('user-1', filtros);
    expect(insulinService.findAll).toHaveBeenCalledWith('user-1', filtros);
  });

  it('retorna lista vazia quando não há registros', async () => {
    glycemiaService.findAll.mockResolvedValue([]);
    insulinService.findAll.mockResolvedValue([]);

    expect(await service.findRecords('user-1', {})).toEqual([]);
  });

    describe('generatePdf', () => {
    const filtros = { startDate: '2026-10-01', endDate: '2026-10-13' };

    beforeEach(() => {
      delete process.env.REPORT_PDF_INCLUDE_USER_NAME;
      glycemiaService.findAll.mockResolvedValue([
        glicemia('g1', '2026-10-12T11:30:00.000Z'),
      ]);
      insulinService.findAll.mockResolvedValue([]);
      pdfService.generate.mockResolvedValue(Buffer.from('%PDF-fake'));
    });

    it('busca só os dados do usuário, no período, e devolve nome previsível', async () => {
      const result = await service.generatePdf('user-1', filtros);

      expect(glycemiaService.findAll).toHaveBeenCalledWith('user-1', filtros);
      expect(insulinService.findAll).toHaveBeenCalledWith('user-1', filtros);
      expect(pdfService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2026-10-01',
          endDate: '2026-10-13',
          records: [expect.objectContaining({ id: 'g1' })],
        }),
      );
      expect(result.fileName).toBe(
        'relatorio-rotina-diabetica_2026-10-01_a_2026-10-13.pdf',
      );
      expect(result.content.toString()).toBe('%PDF-fake');
    });

    afterAll(() => {
      delete process.env.REPORT_PDF_INCLUDE_USER_NAME;
    });

    it('não inclui o nome por padrão', async () => {
      await service.generatePdf('user-1', filtros);

      expect(usersService.findById).not.toHaveBeenCalled();
      expect(pdfService.generate).toHaveBeenCalledWith(
        expect.objectContaining({ userName: undefined }),
      );
    });

    it('inclui o nome quando REPORT_PDF_INCLUDE_USER_NAME=true', async () => {
      process.env.REPORT_PDF_INCLUDE_USER_NAME = 'true';
      usersService.findById.mockResolvedValue({ nome: 'Maria Silva' });

      await service.generatePdf('user-1', filtros);

      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(pdfService.generate).toHaveBeenCalledWith(
        expect.objectContaining({ userName: 'Maria Silva' }),
      );
    });

    it('gera PDF mesmo sem registros', async () => {
      glycemiaService.findAll.mockResolvedValue([]);

      await service.generatePdf('user-1', filtros);

      expect(pdfService.generate).toHaveBeenCalledWith(
        expect.objectContaining({ records: [] }),
      );
    });

    it('propaga a falha do gerador (vira erro 500 no padrão da API)', async () => {
      pdfService.generate.mockRejectedValue(new Error('falha'));

      await expect(service.generatePdf('user-1', filtros)).rejects.toThrow(
        'falha',
      );
    });
  });
});