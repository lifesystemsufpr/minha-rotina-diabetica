import { ApiProperty } from '@nestjs/swagger';
import { Insulina } from '../entities/insulina.entity';
import { LocalAplicacao } from '../enums/local-aplicacao.enum';

export class InsulinResponseDto {
  @ApiProperty({ example: '3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f' })
  id!: string;

  @ApiProperty({ example: 'Rápida' })
  tipo!: string;

  @ApiProperty({ example: 10 })
  doseUi!: number;

  @ApiProperty({ enum: LocalAplicacao, nullable: true })
  localAplicacao!: LocalAplicacao | null;

  @ApiProperty({ example: '2026-10-12T11:30:00.000Z' })
  dataHora!: Date;

  @ApiProperty({ example: 'Antes do almoço', nullable: true, type: String })
  observacao!: string | null;
}

export function toInsulinResponse(insulina: Insulina): InsulinResponseDto {
  return {
    id: insulina.id,
    tipo: insulina.tipo,
    doseUi: insulina.doseUi,
    localAplicacao: insulina.localAplicacao ?? null,
    dataHora: insulina.dataHora,
    observacao: insulina.observacao ?? null,
  };
}
