import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from '../users/entities/perfil.entity';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
  ) {}

  async create(
    createProfileDto: CreateProfileDto,
    usuarioId: string,
  ): Promise<Perfil> {
    const perfil = this.perfilRepository.create({
      ...createProfileDto,
      user: { id: usuarioId },
    });

    return await this.perfilRepository.save(perfil);
  }

  async findByUsuarioId(usuarioId: string): Promise<Perfil | null> {
    return await this.perfilRepository.findOne({
      where: { user: { id: usuarioId } },
    });
  }
}
