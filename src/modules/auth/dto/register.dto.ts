import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome!: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  email!: string;

  // Regra do protótipo (manual da Sprint 2, §18): 8+ caracteres com letras e números.
  @ApiProperty({
    example: 'senhaForte123',
    minLength: 8,
    description: 'Mínimo de 8 caracteres, com letras e números',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'senha deve conter letras e números',
  })
  senha!: string;
}
