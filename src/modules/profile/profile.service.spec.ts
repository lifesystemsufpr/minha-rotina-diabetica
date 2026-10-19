import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Perfil } from '../users/entities/perfil.entity';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  const repo = {
    create: jest.fn((data: Partial<Perfil>) => ({ ...data })),
    save: jest.fn((perfil: Perfil) => Promise.resolve(perfil)),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getRepositoryToken(Perfil), useValue: repo },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getProfileData lança 404 quando o perfil não existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.getProfileData('uuid-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getProfileData devolve null (e não 0) para campos vazios', async () => {
    repo.findOne.mockResolvedValue({
      dataNascimento: null,
      alturaCm: null,
      pesoKg: '62.30',
      user: { nome: 'Maria Silva' },
    });

    const perfil = await service.getProfileData('uuid-1');

    expect(perfil.idade).toBeNull();
    expect(perfil.alturaCm).toBeNull();
    expect(perfil.pesoKg).toBe(62.3);
    expect(perfil.dataNascimento).toBeNull();
    expect(perfil.contatoEmergencia).toBeNull();
    expect(perfil).not.toHaveProperty('senhaHash');
  });
});
