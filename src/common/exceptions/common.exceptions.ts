import { HttpStatus } from '@nestjs/common';
import { ApiErrorException, ApiErrorDetails } from './api-error.exception';

export class BadRequestException extends ApiErrorException {
  constructor(message = 'Requisição inválida', details?: ApiErrorDetails[]) {
    super(message, HttpStatus.BAD_REQUEST, details);
  }
}

export class UnauthorizedException extends ApiErrorException {
  constructor(message = 'Não autorizado') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends ApiErrorException {
  constructor(message = 'Acesso negado') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class NotFoundException extends ApiErrorException {
  constructor(message = 'Recurso não encontrado') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class ConflictException extends ApiErrorException {
  constructor(message = 'Conflito com recurso existente', details?: ApiErrorDetails[]) {
    super(message, HttpStatus.CONFLICT, details);
  }
}