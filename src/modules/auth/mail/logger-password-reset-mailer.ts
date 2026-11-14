import { Injectable, Logger } from '@nestjs/common';
import { PasswordResetMailer } from './password-reset-mailer';

// Modo desabilitado para desenvolvimento/testes. Não imprime destinatário ou
// token: os dados do e-mail são ignorados de propósito.
@Injectable()
export class LoggerPasswordResetMailer extends PasswordResetMailer {
  private readonly logger = new Logger(LoggerPasswordResetMailer.name);

  sendPasswordReset(): Promise<void> {
    this.logger.warn('Envio de recuperação desabilitado neste ambiente.');
    return Promise.resolve();
  }
}
