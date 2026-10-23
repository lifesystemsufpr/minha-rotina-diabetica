import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  raw,
  trimLowercase,
} from '../../../common/transformers/string.transformers';
export class LoginDto {
  @ApiProperty()
  @Transform(trimLowercase)
  @IsEmail()
  email!: string;

  @ApiProperty()
  @Transform(raw)
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  senha!: string;
}
