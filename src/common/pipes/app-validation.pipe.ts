import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { FieldErrorDto } from '../dto/error-response.dto';

// Transforma os erros do class-validator em `details: [{ field, messages }]`,
// incluindo campos de objetos aninhados ("contato.telefone").
function toFieldErrors(
  errors: ValidationError[],
  parentPath = '',
): FieldErrorDto[] {
  return errors.flatMap((error) => {
    const field = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const own: FieldErrorDto[] = error.constraints
      ? [{ field, messages: Object.values(error.constraints) }]
      : [];
    return [...own, ...toFieldErrors(error.children ?? [], field)];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    // remove do payload qualquer propriedade que não esteja no DTO
    whitelist: true,
    // se vier propriedade extra não prevista no DTO, rejeita com 400
    // (em vez de silenciosamente ignorar)
    forbidNonWhitelisted: true,
    // converte tipos primitivos (string -> number, string -> Date, etc)
    // de acordo com o tipo declarado no DTO
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException({
        message: 'Erro de validação',
        details: toFieldErrors(errors),
      }),
  });
}
