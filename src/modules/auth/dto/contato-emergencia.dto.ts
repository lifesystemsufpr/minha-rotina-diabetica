import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { trim } from '../../../common/transformers/string.transformers';

export class ContatoEmergenciaDto {
  @ApiProperty({ example: 'João Silva', maxLength: 100 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome!: string;

  @ApiProperty({ example: 'Pai', maxLength: 50 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  relacao!: string;

  @ApiProperty({
    example: '(41) 99999-9999',
    maxLength: 20,
    description:
      'Apenas dígitos e os símbolos + ( ) - e espaço (8 a 20 caracteres)',
  })
  @Transform(trim)
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+()\-\s]{8,20}$/, {
    message:
      'telefone deve conter apenas números, espaços e + ( ) - (8 a 20 caracteres)',
  })
  telefone!: string;
}
