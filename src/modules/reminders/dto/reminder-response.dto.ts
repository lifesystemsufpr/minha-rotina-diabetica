import { ApiProperty } from '@nestjs/swagger';
import { StatusLembrete } from '../enums/status-lembrete.enum';

export class ReminderResponseDto {
  @ApiProperty({ example: '3f2b8c1e-7a4d-4e9b-9d57-0a1b2c3d4e5f' })
  id!: string;

  @ApiProperty({ example: 'Tomar insulina' })
  titulo!: string;

  @ApiProperty({ example: '2026-10-10T11:00:00.000Z' })
  dataHora!: Date;

  @ApiProperty({ enum: StatusLembrete, example: StatusLembrete.ATIVO })
  status!: StatusLembrete;
}
