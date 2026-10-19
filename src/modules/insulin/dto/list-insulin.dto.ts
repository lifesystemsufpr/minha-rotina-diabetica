import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { DateRangeQueryDto } from '../../../common/dto/date-range-query.dto';
import { trim } from '../../../common/transformers/string.transformers';

export class ListInsulinDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ example: 'Rápida' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  tipo?: string;
}
