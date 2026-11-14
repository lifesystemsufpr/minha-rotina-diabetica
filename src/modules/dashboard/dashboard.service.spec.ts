import { Test } from '@nestjs/testing';
import { GlycemiaResponseDto } from '../glycemia/dto/glycemia-response.dto';
import { MomentoGlicemia } from '../glycemia/enums/momento-glicemia.enum';
import { GlycemiaService } from '../glycemia/glycemia.service';
import { InsulinResponseDto } from '../insulin/dto/insulin-response.dto';
import { InsulinService } from '../insulin/insulin.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const glycemiaService = { findAll: jest.fn() };
  const insulinService = { findAll: jest.fn() };
  const momento = Object.values(MomentoGlicemia)[0];

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: GlycemiaService, useValue: glycemiaService },
        { provide: InsulinService, useValue: insulinService },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('repassa usuário e período e monta os indicadores', async () => {
    glycemiaService.findAll.mockResolvedValue([
      { valor: 100, dataHora: new Date(2026, 9, 12, 8, 0), momento },
      { valor: 140, dataHora: new Date(2026, 9, 12, 20, 0), momento },
    ] as GlycemiaResponseDto[]);
    insulinService.findAll.mockResolvedValue([
      { doseUi: 10, dataHora: new Date(2026, 9, 12, 8, 0) },
    ] as InsulinResponseDto[]);
    const filtros = { startDate: '2026-10-01', endDate: '2026-10-13' };

    const result = await service.getDashboard('user-1', filtros);

    expect(glycemiaService.findAll).toHaveBeenCalledWith('user-1', filtros);
    expect(insulinService.findAll).toHaveBeenCalledWith('user-1', filtros);
    expect(result.mediaGlicemia).toBe(120);
    expect(result.maiorValor?.valor).toBe(140);
    expect(result.menorValor?.valor).toBe(100);
    expect(result.glicemiaAoLongoDoDia).toHaveLength(2);
    expect(result.insulinaTotalDiaria).toEqual([
      { data: '2026-10-12', totalUi: 10 },
    ]);
  });

  it('sem dados responde com valores vazios, sem erro', async () => {
    glycemiaService.findAll.mockResolvedValue([]);
    insulinService.findAll.mockResolvedValue([]);

    const result = await service.getDashboard('user-1', {});

    expect(result).toEqual({
      mediaGlicemia: null,
      maiorValor: null,
      menorValor: null,
      glicemiaAoLongoDoDia: [],
      insulinaTotalDiaria: [],
    });
  });
});
