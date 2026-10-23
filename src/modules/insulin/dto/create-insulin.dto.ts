import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { trim } from '../../../common/transformers/string.transformers';
import { LocalAplicacao } from '../enums/local-aplicacao.enum';

export class CreateInsulinDto {
  // A lista de tipos ainda não foi fechada (task "[BACK][INSULINA] Criar
  // entidade e DTOs"): texto livre até existir um conjunto aprovado.
  @ApiProperty({ example: 'Rápida', maxLength: 50 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tipo!: string;

  // decimal(6,2) no banco: até 9999,99
  @ApiProperty({ example: 10, description: 'Dose em UI (maior que zero)' })
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(9999.99)
  doseUi!: number;

  @ApiProperty({ enum: LocalAplicacao, example: LocalAplicacao.ABDOMEN })
  @IsEnum(LocalAplicacao)
  localAplicacao!: LocalAplicacao;

  @ApiProperty({
    example: '2026-10-12T08:30:00-03:00',
    description: 'Data e hora da aplicação em ISO 8601',
  })
  @IsDateString({ strict: true })
  dataHora!: string;

  @ApiPropertyOptional({ example: 'Antes do almoço', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacao?: string;
}
