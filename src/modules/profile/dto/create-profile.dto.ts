import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';
import { IsNotFutureDate } from '../../../common/decorators/is-not-future-date.decorator';
import { TipoDiabetes } from '../../users/enums/tipo-diabetes.enum';

export class CreateProfileDto {
  @ApiProperty({
    example: '1995-04-12',
    description: 'Data de nascimento (AAAA-MM-DD), não pode ser futura',
  })
  @IsDateString()
  @IsNotFutureDate()
  dataNascimento!: string;

  @ApiProperty({ enum: TipoDiabetes, example: TipoDiabetes.TIPO_1 })
  @IsEnum(TipoDiabetes)
  tipoDiabetes!: TipoDiabetes;

  // decimal(5,2) no banco: até 999,99
  @ApiProperty({ example: 165.5, description: 'Altura em centímetros' })
  @IsNumber()
  @IsPositive()
  @Max(999.99)
  alturaCm!: number;

  @ApiProperty({ example: 62.3, description: 'Peso em quilos' })
  @IsNumber()
  @IsPositive()
  @Max(999.99)
  pesoKg!: number;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  contatoEmergenciaNome!: string;

  @ApiProperty({ example: 'Irmão' })
  @IsString()
  @IsNotEmpty()
  contatoEmergenciaRelacao!: string;

  @ApiProperty({ example: '+5541999998888' })
  @IsPhoneNumber('BR')
  contatoEmergenciaTelefone!: string;
}
