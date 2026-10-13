import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { InsulinType } from '../enums/insulin.enums';

export class ListInsulinDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: InsulinType })
  @IsOptional()
  @IsEnum(InsulinType)
  tipo?: InsulinType;
}