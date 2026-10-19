import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Perfil } from '../entities/perfil.entity';
import { User } from '../entities/user.entity';
import { TipoDiabetes } from '../enums/tipo-diabetes.enum';

export class ContatoEmergenciaResponseDto {
  @ApiProperty({ example: 'João Silva' }) nome!: string;
  @ApiProperty({ example: 'Pai' }) relacao!: string;
  @ApiProperty({ example: '(41) 99999-9999' }) telefone!: string;
}

export class PerfilResponseDto {
  @ApiProperty({ example: '1995-04-12' }) dataNascimento!: string;
  @ApiProperty({ enum: TipoDiabetes }) tipoDiabetes!: TipoDiabetes;
  @ApiProperty({ example: 170.5 }) alturaCm!: number;
  @ApiProperty({ example: 68.3 }) pesoKg!: number;
  @ApiProperty({ type: ContatoEmergenciaResponseDto })
  contatoEmergencia!: ContatoEmergenciaResponseDto;
}

export class UserResponseDto {
  @ApiProperty({ example: '3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f' })
  id!: string;

  @ApiProperty({ example: 'Maria Silva' })
  nome!: string;

  @ApiProperty({ example: 'maria@example.com' })
  email!: string;

  @ApiProperty({ example: '2026-10-03T12:00:00.000Z' })
  createdAt!: Date;

  @ApiPropertyOptional({ type: PerfilResponseDto })
  perfil?: PerfilResponseDto;
}

export function toPerfilResponse(perfil: Perfil): PerfilResponseDto {
  return {
    dataNascimento: perfil.dataNascimento,
    tipoDiabetes: perfil.tipoDiabetes,
    alturaCm: Number(perfil.alturaCm),
    pesoKg: Number(perfil.pesoKg),
    contatoEmergencia: {
      nome: perfil.contatoEmergenciaNome,
      relacao: perfil.contatoEmergenciaRelacao,
      telefone: perfil.contatoEmergenciaTelefone,
    },
  };
}

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    createdAt: user.createdAt,
    ...(user.perfil ? { perfil: toPerfilResponse(user.perfil) } : {}),
  };
}
