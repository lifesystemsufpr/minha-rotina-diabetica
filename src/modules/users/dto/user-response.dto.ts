import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Perfil } from '../entities/perfil.entity';
import { User } from '../entities/user.entity';
import { TipoDiabetes } from '../enums/tipo-diabetes.enum';
import { isPerfilCompleto } from '../utils/perfil-completo';

// Os dados de saúde podem estar vazios até a 2ª etapa do cadastro.
export class PerfilResponseDto {
  @ApiProperty({ example: '1995-04-12', nullable: true, type: String })
  dataNascimento!: string | null;

  @ApiProperty({ enum: TipoDiabetes, nullable: true })
  tipoDiabetes!: TipoDiabetes | null;

  @ApiProperty({ example: 170.5, nullable: true, type: Number })
  alturaCm!: number | null;

  @ApiProperty({ example: 68.3, nullable: true, type: Number })
  pesoKg!: number | null;
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

  @ApiProperty({
    example: false,
    description:
      'true quando data de nascimento, tipo de diabetes, altura e peso estão preenchidos. Enquanto for false, só Home, perfil e conta ficam liberados.',
  })
  perfilCompleto!: boolean;

  @ApiPropertyOptional({ type: PerfilResponseDto })
  perfil?: PerfilResponseDto;
}

// decimal vem do MySQL como texto; null continua null (Number(null) seria 0).
function toNumberOrNull(value: number | string | null): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export function toPerfilResponse(perfil: Perfil): PerfilResponseDto {
  return {
    dataNascimento: perfil.dataNascimento ?? null,
    tipoDiabetes: perfil.tipoDiabetes ?? null,
    alturaCm: toNumberOrNull(perfil.alturaCm),
    pesoKg: toNumberOrNull(perfil.pesoKg),
  };
}

// Espera o usuário com a relação `perfil` carregada (cadastro e /users/me).
export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    createdAt: user.createdAt,
    perfilCompleto: isPerfilCompleto(user.perfil),
    ...(user.perfil ? { perfil: toPerfilResponse(user.perfil) } : {}),
  };
}
