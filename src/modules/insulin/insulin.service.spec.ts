
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { InsulinService } from './insulin.service';

describe('InsulinService', () => {
  let service: InsulinService;
  let query: jest.Mock;

  beforeEach(() => {
    query = jest.fn();

    service = new InsulinService({
      query,
    } as unknown as DataSource);
  });

  it('deve consultar uma aplicação própria', async () => { query.mockResolvedValue([{ id: '1', tipo: 'rapida' }]);

    const resultado = await service.findOne('usuario-1', '1');

    expect(resultado.id).toBe('1');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('usuario_id = ?'), ['1', 'usuario-1']);
  });

  it('deve retornar erro para ID inexistente', async () => { query.mockResolvedValue([]);

    await expect(
      service.findOne('usuario-1', '999'),
    ).rejects.toThrow(NotFoundException);

  });

  it('não deve editar aplicação de outro usuário', async () => {query.mockResolvedValue([]);

    await expect(
      service.update('usuario-1', '2', { doseUi: 10 }),
    ).rejects.toThrow(NotFoundException);

    expect(query).toHaveBeenCalledTimes(1);
  });

  it('não deve excluir aplicação de outro usuário', async () => {query.mockResolvedValue([]);

    await expect(
      service.remove('usuario-1', '2'),
    ).rejects.toThrow(NotFoundException);

    expect(query).toHaveBeenCalledTimes(1);
  });
});
