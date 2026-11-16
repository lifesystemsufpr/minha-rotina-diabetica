import { ApiProperty } from '@nestjs/swagger';
import { GlycemiaResponseDto } from '../../glycemia/dto/glycemia-response.dto';
import { InsulinResponseDto } from '../../insulin/dto/insulin-response.dto';
import { ReminderResponseDto } from '../../reminders/dto/reminder-response.dto';

export class ResumoDiarioDto {
  @ApiProperty({
    example: true,
    description: 'Houve ao menos uma glicemia registrada hoje',
  })
  glicemiaRegistrada!: boolean;

  @ApiProperty({
    example: false,
    description: 'Houve ao menos uma aplicação de insulina registrada hoje',
  })
  insulinaRegistrada!: boolean;
}

export class PontoGlicemiaHomeDto {
  @ApiProperty({ example: '2026-10-10T11:00:00.000Z' })
  dataHora!: Date;

  @ApiProperty({ example: 110, description: 'mg/dL' })
  valor!: number;
}

export class HomeSummaryResponseDto {
  @ApiProperty({
    example: 'Maria',
    nullable: true,
    type: String,
    description: 'Nome para a saudação',
  })
  nome!: string | null;

  @ApiProperty({
    type: GlycemiaResponseDto,
    nullable: true,
    description:
      'Glicemia mais recente até agora (data futura não conta), incluindo status por momento e hipoglicemiaNivel2. null se não houver.',
  })
  ultimaGlicemia!: GlycemiaResponseDto | null;

  @ApiProperty({
    type: InsulinResponseDto,
    nullable: true,
    description:
      'Aplicação de insulina mais recente até agora (data futura não conta). null se não houver.',
  })
  ultimaInsulina!: InsulinResponseDto | null;

  @ApiProperty({
    type: ReminderResponseDto,
    nullable: true,
    description:
      'Próximo lembrete ATIVO com data/hora a partir de agora. null se não houver.',
  })
  proximoLembrete!: ReminderResponseDto | null;

  @ApiProperty({ type: ResumoDiarioDto })
  resumoDiario!: ResumoDiarioDto;

  @ApiProperty({
    type: [PontoGlicemiaHomeDto],
    description:
      'Glicemias de hoje e dos 6 dias anteriores, em ordem cronológica. Vazio se não houver.',
  })
  glicemiaUltimos7Dias!: PontoGlicemiaHomeDto[];
}
