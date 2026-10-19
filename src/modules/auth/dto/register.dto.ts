import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsNotFutureDate } from '../../../common/decorators/is-not-future-date.decorator';
import { MatchesProperty } from '../../../common/decorators/matches-property.decorator';
import {
  raw,
  toNumber,
  trim,
  trimLowercase,
} from '../../../common/transformers/string.transformers';
import { TipoDiabetes } from '../../users/enums/tipo-diabetes.enum';
import { PASSWORD_PATTERN, PASSWORD_PATTERN_MESSAGE } from '../password-policy';
import { ContatoEmergenciaDto } from './contato-emergencia.dto';
export class RegisterDto {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome!: string;

  @ApiProperty()
  @Transform(trimLowercase)
  @IsEmail()
  @MaxLength(100)
  email!: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    description: 'De 8 a 72 caracteres, com letras e números',
  })
  @Transform(raw)
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_PATTERN_MESSAGE })
  senha!: string;

  @ApiPropertyOptional()
  @Transform(raw)
  @IsOptional()
  @IsString()
  @MatchesProperty('senha', {
    message: 'confirmarSenha deve ser igual a senha',
  })
  confirmarSenha?: string;

  @ApiProperty({
    example: '1995-04-12',
    description: 'AAAA-MM-DD; não pode ser futura',
  })
  @IsNotFutureDate()
  dataNascimento!: string;

  @ApiProperty({ enum: TipoDiabetes, example: TipoDiabetes.TIPO_1 })
  @IsEnum(TipoDiabetes)
  tipoDiabetes!: TipoDiabetes;

  @ApiProperty({ example: 170.5, description: 'Em centímetros (30 a 272)' })
  @Transform(toNumber)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(30)
  @Max(272)
  alturaCm!: number;

  @ApiProperty({ example: 68.3, description: 'Em quilos (1 a 500)' })
  @Transform(toNumber)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(1)
  @Max(500)
  pesoKg!: number;

  @ApiProperty({ type: ContatoEmergenciaDto })
  @ValidateNested()
  @Type(() => ContatoEmergenciaDto)
  contatoEmergencia!: ContatoEmergenciaDto;
}
