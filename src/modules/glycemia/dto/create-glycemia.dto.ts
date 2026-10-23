import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { MomentoGlicemia } from '../enums/momento-glicemia.enum';

// O status (NORMAL/ALTA/BAIXA) não faz parte da entrada: é calculado pela API.
export class CreateGlycemiaDto {
  // decimal(5,2) no banco: até 999,99
  @ApiProperty({ example: 110, description: 'Valor em mg/dL' })
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(999.99)
  valor!: number;

  @ApiProperty({ enum: MomentoGlicemia, example: MomentoGlicemia.JEJUM })
  @IsEnum(MomentoGlicemia)
  momento!: MomentoGlicemia;

  @ApiProperty({
    example: '2026-10-12T08:30:00-03:00',
    description:
      'Data e hora da medição em ISO 8601 (o app junta os campos data e hora)',
  })
  @IsDateString({ strict: true })
  dataHora!: string;

  @ApiPropertyOptional({ example: 'Depois de caminhar', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacao?: string;
}
