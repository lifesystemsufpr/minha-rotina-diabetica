import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// tipos definidos localmente — não dependem de nenhum módulo externo
interface FieldValidationErrorDto {
  field?: string;
  message: string;
}

interface ErrorResponseDto {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  method: string;
  details?: FieldValidationErrorDto[];
}
/**
 * Filtro global de exceptions.
 *
 * Captura QUALQUER coisa lançada em qualquer controller/service/pipe/guard
 * (`@Catch()` sem argumento = captura tudo, não só HttpException) e
 * transforma em uma resposta JSON no formato único `ErrorResponseDto`.
 *
 * Isso garante o critério de aceite:
 *   "Todos os endpoints conseguem retornar erros no mesmo formato."
 *
 * Registrado globalmente em `main.ts` via `app.useGlobalFilters(...)`.
 */

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsHandler');

  // Mapa simples de status HTTP -> nome curto, para quando a exception
  // não fornecer esse valor explicitamente.
  private static readonly STATUS_NAMES: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
  };

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message, details } =
      this.resolveExceptionInfo(exception);

    // Nunca vazar stack trace, mensagens de erro de SQL/driver ou qualquer
    // detalhe interno para o cliente. Isso é logado no servidor, mas a
    // resposta ao cliente é sempre uma mensagem genérica e segura.
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logUnexpectedError(exception, request);
    }

    const body: ErrorResponseDto = {
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(details ? { details } : {}),
    };

    response.status(statusCode).json(body);
  }

  private resolveExceptionInfo(exception: unknown): {
    statusCode: number;
    error: string;
    message: string;
    details?: FieldValidationErrorDto[];
  } {
    // Caso 1: qualquer HttpException do Nest (as nativas: BadRequestException,
    // UnauthorizedException, ForbiddenException, NotFoundException,
    // ConflictException, etc. e também as customizadas em domain-exceptions.ts)
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      // resposta simples: throw new NotFoundException('mensagem')
      if (typeof response === 'string') {
        return {
          statusCode,
          error: AllExceptionsFilter.STATUS_NAMES[statusCode] ?? 'Error',
          message: response,
        };
      }

      // resposta em objeto: throw new BadRequestException({ message, error, details })
      // (inclui o formato usado pelo exceptionFactory do ValidationPipe)
      if (typeof response === 'object' && response !== null) {
        const body = response as Record<string, unknown>;

        const rawMessage = body.message ?? exception.message;
        const message = Array.isArray(rawMessage)
          ? (rawMessage as string[]).join(', ')
          : String(rawMessage);

        const error =
          (body.error as string | undefined) ??
          AllExceptionsFilter.STATUS_NAMES[statusCode] ??
          'Error';

        const details = Array.isArray(body.details)
          ? (body.details as FieldValidationErrorDto[])
          : undefined;

        return { statusCode, error, message, details };
      }

      return {
        statusCode,
        error: AllExceptionsFilter.STATUS_NAMES[statusCode] ?? 'Error',
        message: exception.message,
      };
    }

    // Caso 2: qualquer outro erro não previsto 
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Erro interno do servidor. Tente novamente mais tarde.',
    };
  }

  private logUnexpectedError(exception: unknown, request: Request): void {
    const context = `${request.method} ${request.url}`;
    if (exception instanceof Error) {
      this.logger.error(`[${context}] ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`[${context}] Exceção não tratada: ${String(exception)}`);
    }
  }
}