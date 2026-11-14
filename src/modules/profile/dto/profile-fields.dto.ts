import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { IsNotFutureDate } from '../../../common/decorators/is-not-future-date.decorator';
import { toNumber } from '../../../common/transformers/string.transformers';
import { TipoDiabetes } from '../../users/enums/tipo-diabetes.enum';

// Os quatro dados de saúde do perfil, com as regras de validação.
// Fonte única: o cadastro (RegisterDto, opcionais) e o PATCH /profile
// (UpdateProfileDto, opcionais) herdam daqui. O perfil fica "completo" quando
// os quatro estão preenchidos (src/modules/users/utils/perfil-completo.ts).
export class ProfileFieldsDto {
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
}
