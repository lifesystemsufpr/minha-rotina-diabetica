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
