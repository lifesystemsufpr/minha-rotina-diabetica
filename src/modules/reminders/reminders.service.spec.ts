import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RemindersService } from './reminders.service';
import { Lembrete } from './entities/lembrete.entity';
import { StatusLembrete } from './enums/status-lembrete.enum';

describe('RemindersService', () => {
  let service: RemindersService;

  const repo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const lembreteBase = (): Lembrete =>
    ({
      id: 'rem-1',
      titulo: 'Tomar insulina',
      dataHora: new Date('2026-10-10T08:00:00.000Z'),
      status: StatusLembrete.ATIVO,
    }) as Lembrete;

  beforeEach(async () => {
    jest.resetAllMocks();
    repo.save.mockImplementation((l: Lembrete) => Promise.resolve(l));

    const module = await Test.createTestingModule({
      providers: [
        RemindersService,
        { provide: getRepositoryToken(Lembrete), useValue: repo },
      ],
    }).compile();

    service = module.get(RemindersService);
  });

  it('cria o lembrete sempre com status ATIVO e associado ao usuário', async () => {
    repo.create.mockImplementation((l: Lembrete) => ({ ...l, id: 'rem-1' }));

    const result = await service.create(
      { titulo: 'Tomar insulina', dataHora: '2026-10-10T08:00:00.000Z' },
      'user-1',
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: StatusLembrete.ATIVO,
        user: { id: 'user-1' },
      }),
    );
    expect(result.status).toBe(StatusLembrete.ATIVO);
  });

  it('lista apenas os lembretes do usuário, ordenados por data', async () => {
    repo.find.mockResolvedValue([lembreteBase()]);

    await service.findAll('user-1');

    expect(repo.find).toHaveBeenCalledWith({
      where: { user: { id: 'user-1' } },
      order: { dataHora: 'ASC' },
    });
  });

  it('não encontra lembrete de outro usuário (isolamento)', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.findOne('rem-1', 'user-2')).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'rem-1', user: { id: 'user-2' } },
    });
  });

  it('não permite editar nem excluir lembrete de outro usuário', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      service.update('rem-1', 'user-2', { titulo: 'Invadido' }),
    ).rejects.toThrow(NotFoundException);
    await expect(service.remove('rem-1', 'user-2')).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('alterna o status de ATIVO para INATIVO e de volta', async () => {
    const lembrete = lembreteBase();
    repo.findOne.mockResolvedValue(lembrete);

    const inativo = await service.updateStatus('rem-1', 'user-1', {
      status: StatusLembrete.INATIVO,
    });
    expect(inativo.status).toBe(StatusLembrete.INATIVO);

    const ativo = await service.updateStatus('rem-1', 'user-1', {
      status: StatusLembrete.ATIVO,
    });
    expect(ativo.status).toBe(StatusLembrete.ATIVO);
  });
});
