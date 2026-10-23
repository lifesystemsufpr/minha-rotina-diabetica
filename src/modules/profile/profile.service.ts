import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from '../users/entities/perfil.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { calcularIdade } from './utils/calcular-idade';

// decimal vem do MySQL como texto; null continua null (Number(null) seria 0).
function toNumberOrNull(value: number | string | null): number | null {
  return value === null || value === undefined ? null : Number(value);
}

// Converte o DTO (contato aninhado) para as colunas da entidade Perfil.
// Só inclui os campos enviados, para o PATCH alterar apenas eles.
function toPerfilColumns(dto: UpdateProfileDto): Partial<Perfil> {
  const { contatoEmergencia, ...rest } = dto;
  return {
    ...rest,
    ...(contatoEmergencia
      ? {
          contatoEmergenciaNome: contatoEmergencia.nome,
          contatoEmergenciaRelacao: contatoEmergencia.relacao,
          contatoEmergenciaTelefone: contatoEmergencia.telefone,
        }
      : {}),
  };
}

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
      ...toPerfilColumns(createProfileDto),
      user: { id: usuarioId },
    });

    return await this.perfilRepository.save(perfil);
  }

  async findByUsuarioId(usuarioId: string): Promise<Perfil | null> {
    return await this.perfilRepository.findOne({
      where: { user: { id: usuarioId } },
    });
  }

  async getProfileData(usuarioId: string): Promise<ProfileResponseDto> {
    const perfil = await this.perfilRepository.findOne({
      where: { user: { id: usuarioId } },
      relations: ['user'],
    });

    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado para este usuário.');
    }

    return this.toResponseDto(perfil);
  }

  async update(
    usuarioId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const perfil = await this.perfilRepository.findOne({
      where: { user: { id: usuarioId } },
      relations: ['user'],
    });

    if (!perfil) {
      throw new NotFoundException('Perfil não encontrado para este usuário.');
    }

    Object.assign(perfil, toPerfilColumns(updateProfileDto));

    const perfilAtualizado = await this.perfilRepository.save(perfil);

    return this.toResponseDto(perfilAtualizado);
  }

  private toResponseDto(perfil: Perfil): ProfileResponseDto {
    return {
      nome: perfil.user.nome,
      dataNascimento: perfil.dataNascimento ?? null,
      idade: calcularIdade(perfil.dataNascimento),
      alturaCm: toNumberOrNull(perfil.alturaCm),
      pesoKg: toNumberOrNull(perfil.pesoKg),
      tipoDiabetes: perfil.tipoDiabetes ?? null,
      contatoEmergencia: perfil.contatoEmergenciaNome
        ? {
            nome: perfil.contatoEmergenciaNome,
            relacao: perfil.contatoEmergenciaRelacao,
            telefone: perfil.contatoEmergenciaTelefone,
          }
        : null,
    };
  }
}
