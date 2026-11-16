import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MatchesProperty } from '../../../common/decorators/matches-property.decorator';
import {
  raw,
  trim,
  trimLowercase,
} from '../../../common/transformers/string.transformers';
import { ProfileFieldsDto } from '../../profile/dto/profile-fields.dto';
import { PASSWORD_PATTERN, PASSWORD_PATTERN_MESSAGE } from '../password-policy';
// Cadastro em duas etapas (nov/2026):
// 1. POST /auth/register só exige nome, e-mail e senha.
// 2. PATCH /profile completa os dados de saúde. Até lá, a conta só acessa
//    Home, perfil e conta (as outras rotas respondem 403 PERFIL_INCOMPLETO).
// Os dados de saúde ainda podem vir no cadastro (opcionais, mesmas regras do
// PATCH /profile): se vierem os quatro, o perfil já nasce completo.
export class RegisterDto extends PartialType(ProfileFieldsDto) {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome!: string;

  @ApiProperty()
  @Transform(trimLowercase)
  @IsEmail()
  @MaxLength(100)
  email!: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    description: 'De 8 a 72 caracteres, com letras e números',
  })
  @Transform(raw)
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_PATTERN_MESSAGE })
  senha!: string;

  @ApiPropertyOptional()
  @Transform(raw)
  @IsOptional()
  @IsString()
  @MatchesProperty('senha', {
    message: 'confirmarSenha deve ser igual a senha',
  })
  confirmarSenha?: string;
}
