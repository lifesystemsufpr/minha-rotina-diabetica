import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';
import { trimLowercase } from '../../../common/transformers/string.transformers';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'maria@example.com' })
  @Transform(trimLowercase)
  @IsEmail()
  @MaxLength(100)
  email!: string;
}