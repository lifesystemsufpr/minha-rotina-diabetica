import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DateRangeQueryDto } from '../../../common/dto/date-range-query.dto';
import { MomentoGlicemia } from '../enums/momento-glicemia.enum';

export class ListGlycemiaDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ enum: MomentoGlicemia })
  @IsOptional()
  @IsEnum(MomentoGlicemia)
  momento?: MomentoGlicemia;
}
