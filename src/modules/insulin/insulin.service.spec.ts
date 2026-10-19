import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Insulina } from './entities/insulina.entity';
import { InsulinService } from './insulin.service';

describe('InsulinService', () => {
  let service: InsulinService;
  const repo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        InsulinService,
        { provide: getRepositoryToken(Insulina), useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(InsulinService);
  });

  it('busca sempre por id + dono do token', async () => {
    repo.findOne.mockResolvedValue({ id: 'i1', tipo: 'Rápida', doseUi: 10 });
    await service.findOne('usuario-1', 'i1');
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 'i1', user: { id: 'usuario-1' } },
    });
  });

  it('id inexistente ou de outro usuário: 404', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('usuario-1', 'x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('PATCH sem campos: 400', async () => {
    await expect(service.update('usuario-1', 'i1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repo.findOne).not.toHaveBeenCalled();
  });
});
