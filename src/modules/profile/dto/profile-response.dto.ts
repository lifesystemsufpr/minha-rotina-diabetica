import { ApiProperty } from '@nestjs/swagger';
import { TipoDiabetes } from '../../users/enums/tipo-diabetes.enum';

export class ProfileResponseDto {
  @ApiProperty()
  nome!: string;

  @ApiProperty()
  idade!: number;

  @ApiProperty()
  alturaCm!: number;

  @ApiProperty()
  pesoKg!: number;

  @ApiProperty({ enum: TipoDiabetes })
  tipoDiabetes!: TipoDiabetes;

  @ApiProperty()
  contatoEmergenciaNome!: string;

  @ApiProperty()
  contatoEmergenciaRelacao!: string;

  @ApiProperty()
  contatoEmergenciaTelefone!: string;
}
