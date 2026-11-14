import { ApiProperty } from '@nestjs/swagger';
import { Glicemia } from '../entities/glicemia.entity';
import { MomentoGlicemia } from '../enums/momento-glicemia.enum';
import { StatusGlicemia } from '../enums/status-glicemia.enum';

export class GlycemiaResponseDto {
  @ApiProperty({ example: '3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f' })
  id!: string;

  @ApiProperty({ example: 110, description: 'mg/dL' })
  valor!: number;

  @ApiProperty({ enum: MomentoGlicemia })
  momento!: MomentoGlicemia;

  @ApiProperty({
    enum: StatusGlicemia,
    description: 'Calculado: < 70 BAIXA, 70 a 180 NORMAL, > 180 ALTA',
  })
  status!: StatusGlicemia;

  @ApiProperty({ example: '2026-10-12T11:30:00.000Z' })
  dataHora!: Date;

  @ApiProperty({ example: 'Depois de caminhar', nullable: true, type: String })
  observacao!: string | null;
}

export function toGlycemiaResponse(glicemia: Glicemia): GlycemiaResponseDto {
  return {
    id: glicemia.id,
    valor: glicemia.valor,
    momento: glicemia.momento,
    status: glicemia.status,
    dataHora: glicemia.dataHora,
    observacao: glicemia.observacao ?? null,
  };
}
