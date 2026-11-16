import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { DateRangeQueryDto } from '../../../common/dto/date-range-query.dto';
import { trim } from '../../../common/transformers/string.transformers';
import { TipoInsulina } from '../enums/tipo-insulina.enum';

export class ListInsulinDto extends DateRangeQueryDto {
  @ApiPropertyOptional({
    enum: TipoInsulina,
    example: TipoInsulina.ULTRARRAPIDA,
  })
  @IsOptional()
  @Transform(trim)
  @IsEnum(TipoInsulina)
  tipo?: TipoInsulina;
}
