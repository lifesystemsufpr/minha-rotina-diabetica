
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { GlycemiaService } from './glycemia.service';

describe('GlycemiaService', () => {
  let service: GlycemiaService;
  let query: jest.Mock;

  beforeEach(() => {
    query = jest.fn();

    service = new GlycemiaService({
      query,
    } as unknown as DataSource);
  });

  it('deve consultar uma glicemia do próprio usuário', async () => {
    query.mockResolvedValue([
      { id: 'glicemia-1', valor: 110, momento: 'jejum' },
    ]);

    const resultado = await service.findOne('usuario-1', 'glicemia-1');

    expect(resultado.id).toBe('glicemia-1');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('usuario_id = ?'),
      ['glicemia-1', 'usuario-1'],
    );
  });

  it('deve retornar 404 para ID inexistente ou de outro usuário', async () => {
    query.mockResolvedValue([]);

    await expect(
      service.findOne('usuario-1', 'glicemia-inexistente'),
    ).rejects.toThrow(NotFoundException);
  });
});
