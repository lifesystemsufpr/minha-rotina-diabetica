import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Exceptions de domínio/negócio.
 *
 * Cada uma já estende a exception nativa do Nest correspondente ao status
 * HTTP correto, então o `AllExceptionsFilter` global sabe automaticamente
 * como formatá-las na resposta padrão — não é preciso nenhum tratamento
 * especial no controller além de dar `throw`.
 */

export class EmailAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super({
      error: 'Conflict',
      message: `O e-mail "${email}" já está cadastrado.`,
    });
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: 'Not Found',
      message: `Usuário com id "${id}" não foi encontrado.`,
    });
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      error: 'Unauthorized',
      message: 'Credenciais inválidas ou ausentes.',
    });
  }
}

export class InsufficientPermissionsException extends ForbiddenException {
  constructor() {
    super({
      error: 'Forbidden',
      message: 'Você não tem permissão para executar esta ação.',
    });
  }
}

// Conta sem os dados de saúde (2ª etapa do cadastro). O app usa o `code` para
// levar a pessoa à tela de completar o perfil.
export const PERFIL_INCOMPLETO = 'PERFIL_INCOMPLETO';

export class PerfilIncompletoException extends ForbiddenException {
  constructor() {
    super({
      error: 'Forbidden',
      code: PERFIL_INCOMPLETO,
      message:
        'Complete seu perfil (data de nascimento, tipo de diabetes, altura e peso) para usar esta funcionalidade.',
    });
  }
}
