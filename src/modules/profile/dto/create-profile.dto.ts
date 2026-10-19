import { PickType } from '@nestjs/swagger';
import { RegisterDto } from '../../auth/dto/register.dto';

// Campos do perfil com as MESMAS regras e o MESMO formato do cadastro
// (POST /auth/register): data AAAA-MM-DD não futura, altura 30 a 272 cm,
// peso 1 a 500 kg e contatoEmergencia { nome, relacao, telefone }.
// PickType copia as validações e a documentação do Swagger do RegisterDto.
export class CreateProfileDto extends PickType(RegisterDto, [
  'dataNascimento',
  'tipoDiabetes',
  'alturaCm',
  'pesoKg',
  'contatoEmergencia',
] as const) {}
