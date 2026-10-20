import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateReminderDto } from './create-reminder.dto';
import { StatusLembrete } from '../enums/status-lembrete.enum';

export class UpdateReminderDto extends PartialType(CreateReminderDto) {
  @ApiPropertyOptional({ enum: StatusLembrete })
  @IsOptional()
  @IsEnum(StatusLembrete)
  status?: StatusLembrete;
}
