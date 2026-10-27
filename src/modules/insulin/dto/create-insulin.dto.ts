import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {IsDateString,IsEnum,IsNumber,IsOptional,IsPositive,IsString,MaxLength} from 'class-validator';
import { ApplicationSite, InsulinType } from '../enums/insulin.enums';

export class CreateInsulinDto {
  // ---------- tipo da insulina ----------
  @ApiProperty({ enum: InsulinType, example: InsulinType.RAPIDA })
  @IsEnum(InsulinType, { message: 'tipo deve ser basal, rapida ou mista' })
  tipo!: InsulinType;

  // ---------- dose ----------
  @ApiProperty({ description: 'Dose em UI (maior que zero)', example: 10 })
  @IsNumber({}, { message: 'doseUi deve ser um número' })
  @IsPositive({ message: 'doseUi deve ser maior que zero' })
  doseUi!: number;

  // ---------- local da aplicação ----------
  @ApiProperty({ enum: ApplicationSite, example: ApplicationSite.ABDOMEN })
  @IsEnum(ApplicationSite, {
    message: 'localAplicacao deve ser abdomen, braco, coxa ou gluteo',
  })
  localAplicacao!: ApplicationSite;

  // ---------- data e hora ----------
  @ApiProperty({
    description: 'Data e hora da aplicação',
    example: '12-10-2026T08:30:00.000Z',
  })
  @IsDateString({}, { message: 'dataHora deve ser uma data válida' })
  dataHora!: string;

  // ---------- observação (opcional) ----------
  @ApiPropertyOptional({ example: 'Antes do almoço' })
  @IsOptional()
  @IsString({ message: 'observacao deve ser um texto' })
  @MaxLength(255, { message: 'observacao deve ter no máximo 255 caracteres' })
  observacao?: string;
}
