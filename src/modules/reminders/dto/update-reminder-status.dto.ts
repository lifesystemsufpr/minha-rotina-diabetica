import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatusLembrete } from '../enums/status-lembrete.enum';

export class UpdateReminderStatusDto {
  @ApiProperty({ enum: StatusLembrete })
  @IsEnum(StatusLembrete)
  status!: StatusLembrete;
}
