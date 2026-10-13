import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { raw, trim } from '../../../common/transformers/string.transformers';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token recebido por e-mail (uso único, com expiração)',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'nova-senha-123' })
  @Transform(raw)
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  novaSenha!: string;
}