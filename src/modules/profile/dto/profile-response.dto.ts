import { ApiProperty } from '@nestjs/swagger';
import { ContatoEmergenciaResponseDto } from '../../users/dto/user-response.dto';
import { TipoDiabetes } from '../../users/enums/tipo-diabetes.enum';

// Campos do perfil são opcionais no banco, então podem vir nulos.
export class ProfileResponseDto {
  @ApiProperty({ example: 'Maria Silva' })
  nome!: string;

  @ApiProperty({
    example: '1995-04-12',
    nullable: true,
    type: String,
    description: 'AAAA-MM-DD',
  })
  dataNascimento!: string | null;

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

  @ApiProperty({ type: ContatoEmergenciaResponseDto, nullable: true })
  contatoEmergencia!: ContatoEmergenciaResponseDto | null;
}
