import { ApiProperty } from '@nestjs/swagger';
import { TipoDiabetes } from '../../users/enums/tipo-diabetes.enum';

// Campos do perfil são opcionais no banco, então podem vir nulos.
export class ProfileResponseDto {
  @ApiProperty({ example: 'Maria Silva' })
  nome!: string;

  @ApiProperty({
    example: 31,
    nullable: true,
    type: Number,
    description: 'Calculada a partir da data de nascimento',
  })
  idade!: number | null;

  @ApiProperty({ example: 165.5, nullable: true, type: Number })
  alturaCm!: number | null;

  @ApiProperty({ example: 62.3, nullable: true, type: Number })
  pesoKg!: number | null;

  @ApiProperty({ enum: TipoDiabetes, nullable: true })
  tipoDiabetes!: TipoDiabetes | null;

  @ApiProperty({ example: 'João Silva', nullable: true, type: String })
  contatoEmergenciaNome!: string | null;

  @ApiProperty({ example: 'Irmão', nullable: true, type: String })
  contatoEmergenciaRelacao!: string | null;

  @ApiProperty({ example: '+5541999998888', nullable: true, type: String })
  contatoEmergenciaTelefone!: string | null;
}
