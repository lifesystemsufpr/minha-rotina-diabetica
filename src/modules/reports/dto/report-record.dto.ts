import { ApiProperty } from '@nestjs/swagger';
import { MomentoGlicemia } from '../../glycemia/enums/momento-glicemia.enum';
import { StatusGlicemia } from '../../glycemia/enums/status-glicemia.enum';
import { LocalAplicacao } from '../../insulin/enums/local-aplicacao.enum';

export enum RecordType {
  GLYCEMIA = 'GLYCEMIA',
  INSULIN = 'INSULIN',
}

export class GlycemiaSummaryDto {
  @ApiProperty({ example: 110, description: 'mg/dL' })
  valor!: number;

  @ApiProperty({ enum: MomentoGlicemia })
  momento!: MomentoGlicemia;

  @ApiProperty({ enum: StatusGlicemia })
  status!: StatusGlicemia;
}

export class InsulinSummaryDto {
  @ApiProperty({ example: 'Rápida' })
  tipo!: string;

  @ApiProperty({ example: 10, description: 'UI (unidades internacionais)' })
  doseUi!: number;

  @ApiProperty({ enum: LocalAplicacao, nullable: true })
  localAplicacao!: LocalAplicacao | null;
}

export class ReportRecordDto {
  @ApiProperty({ enum: RecordType })
  type!: RecordType;

  @ApiProperty({ example: '3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f' })
  id!: string;

  @ApiProperty({
    example: '2026-10-12T11:30:00.000Z',
    description:
      'Data e hora do registro (ISO 8601). Use para agrupar por dia.',
  })
  dateTime!: Date;

  @ApiProperty({
    type: GlycemiaSummaryDto,
    nullable: true,
    description: 'Preenchido quando type = GLYCEMIA; caso contrário, null',
  })
  glycemia!: GlycemiaSummaryDto | null;

  @ApiProperty({
    type: InsulinSummaryDto,
    nullable: true,
    description: 'Preenchido quando type = INSULIN; caso contrário, null',
  })
  insulin!: InsulinSummaryDto | null;
}
