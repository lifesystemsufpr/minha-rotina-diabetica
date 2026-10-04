import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
} from 'class-validator';
import { TipoDiabetes } from '../../users/enums/tipo-diabetes.enum';

export class CreateProfileDto {
  @ApiProperty({ enum: TipoDiabetes })
  @IsEnum(TipoDiabetes)
  tipoDiabetes!: TipoDiabetes;

  @ApiProperty()
  @IsNumber()
  alturaCm!: number;

  @ApiProperty()
  @IsNumber()
  pesoKg!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contatoEmergenciaNome!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contatoEmergenciaRelacao!: string;

  @ApiProperty()
  @IsPhoneNumber('BR')
  contatoEmergenciaTelefone!: string;
}
