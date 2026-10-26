import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const MOMENTOS = [
  'jejum',
  'antes_cafe',
  'apos_cafe',
  'antes_almoco',
  'apos_almoco',
  'antes_jantar',
  'apos_jantar',
];

export class CreateGlycemiaDto {
  @ApiProperty({ example: 110, description: 'Valor em mg/dL' })
  @IsNumber()
  @IsPositive()
  valor!: number;

  @ApiProperty({ enum: MOMENTOS, example: 'jejum' })
  @IsIn(MOMENTOS)
  momento!: string;

  @ApiProperty({ example: '15-09-2026', description: 'DD-MM-AAAA' })
  @Matches(/^\d{2}-\d{2}-\d{4}$/, {
    message: 'data deve estar no formato DD-MM-AAAA',
  })
  data!: string;

  @ApiProperty({ example: '08:30', description: 'HH:mm' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'hora deve estar no formato HH:mm',
  })
  hora!: string;

  @ApiPropertyOptional({ example: 'Antes do café' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacao?: string;
}
