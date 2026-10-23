import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trim } from '../../../common/transformers/string.transformers';

export class CreateReminderDto {
  @ApiProperty({ example: 'Tomar insulina', maxLength: 150 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo!: string;

  @ApiProperty({
    example: '2026-10-10T08:00:00-03:00',
    description: 'Data e hora do lembrete em ISO 8601',
  })
  @IsDateString({ strict: true })
  dataHora!: string;
}
