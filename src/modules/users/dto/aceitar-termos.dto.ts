import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Equals, IsString } from 'class-validator';
import { trim } from '../../../common/transformers/string.transformers';
import { VERSAO_ATUAL_TERMOS } from '../../auth/terms-policy';

export class AceitarTermosDto {
  @ApiProperty({
    example: VERSAO_ATUAL_TERMOS,
    description:
      'Versão vigente dos Termos de Uso e da Política de Privacidade',
  })
  @Transform(trim)
  @IsString()
  @Equals(VERSAO_ATUAL_TERMOS, {
    message: `versaoTermos deve ser igual a ${VERSAO_ATUAL_TERMOS}`,
  })
  versaoTermos!: string;
}
