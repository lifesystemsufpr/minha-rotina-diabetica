import { IsNotFutureDateTime } from '../../../common/decorators/is-not-future-date-time.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { LocalAplicacao } from '../enums/local-aplicacao.enum';
import {
  normalizarTipoInsulina,
  TipoInsulina,
} from '../enums/tipo-insulina.enum';

export class CreateInsulinDto {
  @ApiProperty({
    enum: TipoInsulina,
    example: TipoInsulina.ULTRARRAPIDA,
    description:
      'Código do tipo de insulina. Rótulos antigos do app (Rápida, Regular, NPH, Longa duração) também são aceitos e convertidos para o código correspondente.',
  })
  @Transform(normalizarTipoInsulina)
  @IsEnum(TipoInsulina)
  tipo!: TipoInsulina;

  // decimal(6,2) no banco: até 9999,99
  @ApiProperty({ example: 10, description: 'Dose em UI (maior que zero)' })
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(9999.99)
  doseUi!: number;

  @ApiProperty({ enum: LocalAplicacao, example: LocalAplicacao.ABDOMEN })
  @IsEnum(LocalAplicacao)
  localAplicacao!: LocalAplicacao;

  @ApiProperty({
    example: '2026-10-12T08:30:00-03:00',
    description: 'Data e hora da aplicação em ISO 8601',
  })
  @IsDateString({ strict: true })
  @IsNotFutureDateTime()
  dataHora!: string;

  @ApiPropertyOptional({ example: 'Antes do almoço', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacao?: string;
}
