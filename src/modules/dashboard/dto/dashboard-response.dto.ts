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

  @ApiProperty({ example: 2, description: 'Quantidade de aplicações no dia' })
  quantidade!: number;
}

export class FaixaLeiturasDto {
  @ApiProperty({ example: 3 })
  quantidade!: number;

  @ApiProperty({
    example: 12.5,
    nullable: true,
    type: Number,
    description:
      'Percentual das leituras do período (1 casa). null sem leituras.',
  })
  percentual!: number | null;
}

// Faixas do Consenso Internacional de Tempo no Alvo (Battelino et al., 2019),
// aplicadas às leituras de glicemia capilar. NÃO é "tempo no alvo": ver
// docs/revisao-graficos.md.
export class DistribuicaoLeiturasDto {
  @ApiProperty({ example: 24, description: 'Total de leituras no período' })
  total!: number;

  @ApiProperty({
    type: FaixaLeiturasDto,
    description: 'Abaixo de 54 mg/dL (hipoglicemia nível 2)',
  })
  muitoBaixa!: FaixaLeiturasDto;

  @ApiProperty({
    type: FaixaLeiturasDto,
    description: '54 a 69 mg/dL (hipoglicemia nível 1)',
  })
  baixa!: FaixaLeiturasDto;

  @ApiProperty({ type: FaixaLeiturasDto, description: '70 a 180 mg/dL' })
  noAlvo!: FaixaLeiturasDto;

  @ApiProperty({
    type: FaixaLeiturasDto,
    description: 'Acima de 180 até 250 mg/dL (hiperglicemia nível 1)',
  })
  alta!: FaixaLeiturasDto;

  @ApiProperty({
    type: FaixaLeiturasDto,
    description: 'Acima de 250 mg/dL (hiperglicemia nível 2)',
  })
  muitoAlta!: FaixaLeiturasDto;
}

export class MediaPorMomentoDto {
  @ApiProperty({ enum: MomentoGlicemia })
  momento!: MomentoGlicemia;

  @ApiProperty({ example: 132.5, description: 'mg/dL, 2 casas decimais' })
  media!: number;

  @ApiProperty({ example: 6, description: 'Leituras usadas na média' })
  quantidade!: number;
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

  @ApiProperty({
    type: DistribuicaoLeiturasDto,
    description:
      'Quantas leituras caíram em cada faixa do consenso de 2019 (percentual das leituras, não do tempo).',
  })
  distribuicaoLeituras!: DistribuicaoLeiturasDto;

  @ApiProperty({
    type: [MediaPorMomentoDto],
    description:
      'Média por momento do dia (perfil glicêmico), na ordem do dia: jejum, antes/após café, almoço e jantar. Só momentos com leitura aparecem.',
  })
  mediaPorMomento!: MediaPorMomentoDto[];
}
