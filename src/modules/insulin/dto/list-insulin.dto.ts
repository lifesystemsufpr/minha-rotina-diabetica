import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { DateRangeQueryDto } from '../../../common/dto/date-range-query.dto';
import {
  normalizarTipoInsulina,
  TipoInsulina,
} from '../enums/tipo-insulina.enum';

export class ListInsulinDto extends DateRangeQueryDto {
  @ApiPropertyOptional({
    enum: TipoInsulina,
    example: TipoInsulina.ULTRARRAPIDA,
  })
  @IsOptional()
  // Aceita também os rótulos do app antigo (ex.: ?tipo=NPH), como na escrita.
  @Transform(normalizarTipoInsulina)
  @IsEnum(TipoInsulina)
  tipo?: TipoInsulina;
}
