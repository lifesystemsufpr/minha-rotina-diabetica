import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { raw, trim } from '../../../common/transformers/string.transformers';
import { PASSWORD_PATTERN, PASSWORD_PATTERN_MESSAGE } from '../password-policy';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token recebido por e-mail (uso único, com expiração)',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    example: 'nova-senha-123',
    description:
      'Mesma regra do cadastro: 8 a 72 caracteres, com letras e números',
  })
  @Transform(raw)
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_PATTERN_MESSAGE })
  novaSenha!: string;
}
