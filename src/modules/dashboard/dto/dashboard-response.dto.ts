import { ApiProperty } from '@nestjs/swagger';
import { MomentoGlicemia } from '../../glycemia/enums/momento-glicemia.enum';

export class PontoGlicemiaDto {
  @ApiProperty({ example: 110, description: 'mg/dL' })
  valor!: number;

  @ApiProperty({ example: '2026-10-12T11:30:00.000Z' })
  dataHora!: Date;

  @ApiProperty({ enum: MomentoGlicemia })
  momento!: MomentoGlicemia;
}

export class TotalInsulinaDiarioDto {
  @ApiProperty({
    example: '2026-10-12',
    description: 'Dia (AAAA-MM-DD, no fuso do servidor)',
  })
  data!: string;

  @ApiProperty({ example: 24.5, description: 'Soma das doses do dia, em UI' })
  totalUi!: number;
}

export class DashboardResponseDto {
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 128.5,
    description:
      'Média das glicemias do período (mg/dL, 2 casas decimais). null se não houver registros.',
  })
  mediaGlicemia!: number | null;

  @ApiProperty({
    type: PontoGlicemiaDto,
    nullable: true,
    description:
      'Maior glicemia do período, com data e momento. Em caso de empate, o registro mais recente. null se não houver registros.',
  })
  maiorValor!: PontoGlicemiaDto | null;

  @ApiProperty({
    type: PontoGlicemiaDto,
    nullable: true,
    description:
      'Menor glicemia do período, com data e momento. Em caso de empate, o registro mais recente. null se não houver registros.',
  })
  menorValor!: PontoGlicemiaDto | null;

  @ApiProperty({
    type: [PontoGlicemiaDto],
    description:
      'Glicemias do período em ordem cronológica, prontas para gráfico. Vazio se não houver registros.',
  })
  glicemiaAoLongoDoDia!: PontoGlicemiaDto[];

  @ApiProperty({
    type: [TotalInsulinaDiarioDto],
    description:
      'Total de insulina por dia, em ordem cronológica. Dias sem aplicação não aparecem. Vazio se não houver registros.',
  })
  insulinaTotalDiaria!: TotalInsulinaDiarioDto[];
}
