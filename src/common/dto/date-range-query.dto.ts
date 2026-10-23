import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, Matches } from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_ONLY_MESSAGE = 'deve estar no formato AAAA-MM-DD';

// Filtro por período usado por glicemias e aplicações de insulina.
// Datas sem hora, no horário do servidor, com os dois extremos inclusivos:
// endDate=2026-10-13 inclui todo o dia 13.
export class DateRangeQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Início do período (AAAA-MM-DD, inclusivo)',
  })
  @IsOptional()
  @Matches(DATE_ONLY, { message: `startDate ${DATE_ONLY_MESSAGE}` })
  @IsDateString({ strict: true })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-13',
    description: 'Fim do período (AAAA-MM-DD, inclusivo: o dia todo)',
  })
  @IsOptional()
  @Matches(DATE_ONLY, { message: `endDate ${DATE_ONLY_MESSAGE}` })
  @IsDateString({ strict: true })
  endDate?: string;
}
