import { Injectable, Logger } from '@nestjs/common';
import {
  PasswordResetMailData,
  PasswordResetMailer,
} from './password-reset-mailer';

// Modo desabilitado para desenvolvimento/testes. Não imprime destinatário ou token.
@Injectable()
export class LoggerPasswordResetMailer extends PasswordResetMailer {
  private readonly logger = new Logger(LoggerPasswordResetMailer.name);

  sendPasswordReset(_data: PasswordResetMailData): Promise<void> {
    this.logger.warn('Envio de recuperação desabilitado neste ambiente.');
    return Promise.resolve();
  }
}
