import { PartialType } from '@nestjs/swagger';
import { ContatoEmergenciaDescontinuado } from './contato-emergencia-descontinuado.decorator';
import { ProfileFieldsDto } from './profile-fields.dto';

// PATCH /profile: envie só o que mudou. É também a 2ª etapa do cadastro:
// quando os quatro campos estiverem preenchidos, o perfil fica completo.
export class UpdateProfileDto extends PartialType(ProfileFieldsDto) {
  @ContatoEmergenciaDescontinuado()
  contatoEmergencia?: unknown;
}
