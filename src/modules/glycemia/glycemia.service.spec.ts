import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Glicemia } from './entities/glicemia.entity';
import { MomentoGlicemia } from './enums/momento-glicemia.enum';
import { StatusGlicemia } from './enums/status-glicemia.enum';
import { GlycemiaService } from './glycemia.service';

describe('GlycemiaService', () => {
  let service: GlycemiaService;
  const repo = {
    findOne: jest.fn(),
    save: jest.fn((g: Glicemia) => Promise.resolve(g)),
    create: jest.fn((data: Partial<Glicemia>) => ({ ...data })),
    find: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GlycemiaService,
        { provide: getRepositoryToken(Glicemia), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(GlycemiaService);
  });

  it('calcula o status no cadastro (o mobile não envia)', async () => {
    const criada = await service.create('usuario-1', {
      valor: 200,
      momento: MomentoGlicemia.APOS_ALMOCO,
      dataHora: '2026-10-12T13:00:00-03:00',
    });
    expect(criada.status).toBe(StatusGlicemia.ALTA);
  });

  it('busca sempre por id + dono do token; senão 404', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('usuario-1', 'g1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'g1', user: { id: 'usuario-1' } },
    });
  });

  it('recalcula o status quando o valor muda', async () => {
    repo.findOne.mockResolvedValue({
      id: 'g1',
      valor: 110,
      status: StatusGlicemia.NORMAL,
    });
    const atualizada = await service.update('usuario-1', 'g1', { valor: 60 });
    expect(atualizada.status).toBe(StatusGlicemia.BAIXA);
  });

  it('PATCH sem campos: 400', async () => {
    await expect(service.update('usuario-1', 'g1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
