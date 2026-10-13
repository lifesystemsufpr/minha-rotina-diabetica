import { Injectable, Logger } from '@nestjs/common';
import {
  PasswordResetMailData,
  PasswordResetMailer,
} from './password-reset-mailer';

// Implementação provisória (sem envio real). Em desenvolvimento imprime o
// token no log para o fluxo poder ser testado; em produção NÃO imprime o token.
@Injectable()
export class LoggerPasswordResetMailer extends PasswordResetMailer {
  private readonly logger = new Logger(LoggerPasswordResetMailer.name);

  sendPasswordReset(data: PasswordResetMailData): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      this.logger.error(
        'Nenhum provedor de e-mail configurado: e-mail de recuperação NÃO enviado.',
      );
      return Promise.resolve();
    }
    this.logger.warn(
      `[SIMULADO] Recuperação de senha para ${data.to} | token: ${data.token} | expira em ${data.expiresAt.toISOString()}`,
    );
    return Promise.resolve();
  }
}