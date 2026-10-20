import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReminderDto {
  @ApiProperty({ example: 'Tomar insulina', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo!: string;

  @ApiProperty({ example: '2026-10-10T08:00:00.000Z' })
  @IsDateString()
  dataHora!: string;
}
