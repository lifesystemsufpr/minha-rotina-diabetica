import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';
import { AuthRateAction } from '../auth-rate-policy';
import { AuthRateLimitService } from '../auth-rate-limit.service';

const RATE_ACTION = 'auth-rate-action';
export const AUTH_RATE_MESSAGE =
  'Muitas tentativas. Aguarde o tempo indicado e tente novamente.';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly limiter: AuthRateLimitService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.get<AuthRateAction>(
      RATE_ACTION,
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const body: unknown = request.body;
    const rawEmail =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>).email
        : undefined;
    const email =
      typeof rawEmail === 'string' && rawEmail.length <= 320
        ? rawEmail
        : undefined;
    // Express não confia em X-Forwarded-For por padrão; não ler esse header aqui.
    const wait = await this.limiter.consume(
      action,
      request.ip ?? request.socket.remoteAddress ?? 'unknown',
      email,
    );
    if (wait) {
      response.setHeader('Retry-After', String(wait));
      throw new HttpException(
        {
          statusCode: 429,
          error: 'Too Many Requests',
          message: `${AUTH_RATE_MESSAGE} Tente em ${wait} segundo(s).`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}

export function AuthRateLimit(action: AuthRateAction) {
  return applyDecorators(
    SetMetadata(RATE_ACTION, action),
    UseGuards(AuthRateLimitGuard),
    ApiResponse({
      status: 429,
      description:
        'Limite temporário de tentativas. Retry-After informa os segundos de espera.',
      type: ErrorResponseDto,
      headers: {
        'Retry-After': {
          schema: { type: 'integer' },
          description: 'Segundos até nova tentativa',
        },
      },
    }),
  );
}
