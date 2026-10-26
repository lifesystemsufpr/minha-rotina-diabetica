import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';

const MOMENTOS = [
  'jejum',
  'antes_refeicao',
  'pos_refeicao',
  'ao_dormir',
  'outro',
];

export class ListGlycemiaDto {
  @ApiPropertyOptional({ example: '10-10-2026' })
  @IsOptional()
  @Matches(/^\d{2}-\d{2}-\d{4}$/)
  startDate?: string;

  @ApiPropertyOptional({ example: '13-10-2026' })
  @IsOptional()
  @Matches(/^\d{2}-\d{2}-\d{4}$/)
  endDate?: string;

  @ApiPropertyOptional({ enum: MOMENTOS, example: 'jejum' })
  @IsOptional()
  @IsIn(MOMENTOS)
  momento?: string;
}
