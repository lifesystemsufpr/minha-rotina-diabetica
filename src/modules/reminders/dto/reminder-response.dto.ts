import { ApiProperty } from '@nestjs/swagger';
import { StatusLembrete } from '../enums/status-lembrete.enum';

export class ReminderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  titulo!: string;

  @ApiProperty({ example: '2026-10-10T08:00:00.000Z' })
  dataHora!: Date;

  @ApiProperty({ enum: StatusLembrete })
  status!: StatusLembrete;
}
