import { ConfigService } from '@nestjs/config';
import { createTransport, type SendMailOptions } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { PasswordResetMailer, type PasswordResetMailData } from './password-reset-mailer';
import { LoggerPasswordResetMailer } from './logger-password-reset-mailer';

function flag(config: ConfigService, key: string, fallback: boolean): boolean {
  const value = config.get<string>(key);
  if (value === undefined || value === '') return fallback;
  if (!['true', 'false'].includes(value)) throw new Error(`${key} deve ser true ou false`);
  return value === 'true';
}
export function resetLink(base: string, token: string, production: boolean): string {
  const url = new URL(base);
  if (!['https:', 'glicaremobile:', ...(production ? [] : ['http:'])].includes(url.protocol) ||
      url.username || url.password || url.search || url.hash) {
    throw new Error('PASSWORD_RESET_URL deve usar HTTPS ou glicaremobile e não conter credenciais, query ou fragmento');
  }
  if (url.protocol === 'glicaremobile:' ? url.host !== 'reset-password' : !/\/reset-password\/?$/.test(url.pathname)) {
    throw new Error('PASSWORD_RESET_URL deve apontar para a rota reset-password');
  }
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
}
export function smtpConfiguration(config: ConfigService) {
  const production = (config.get<string>('NODE_ENV') ?? process.env.NODE_ENV) === 'production';
  const host = config.get<string>('SMTP_HOST')?.trim();
  const port = Number(config.get<string>('SMTP_PORT') || '587');
  const from = config.get<string>('SMTP_FROM')?.trim();
  const url = config.get<string>('PASSWORD_RESET_URL')?.trim();
  if (!host || /[\s/]/.test(host) || !Number.isInteger(port) || port < 1 || port > 65535 ||
      !from || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from) || !url) {
    throw new Error('Configure SMTP_HOST, SMTP_PORT, SMTP_FROM e PASSWORD_RESET_URL para a recuperação de senha');
  }
  resetLink(url, 'configuration-check', production);
  const secure = flag(config, 'SMTP_SECURE', port === 465);
  const requireTLS = flag(config, 'SMTP_REQUIRE_TLS', true);
  if ((port === 465 && !secure) || (production && !secure && !requireTLS)) {
    throw new Error('SMTP requer TLS: porta 465 com secure=true ou STARTTLS obrigatório em produção');
  }
  const user = config.get<string>('SMTP_USER');
  const pass = config.get<string>('SMTP_PASSWORD');
  if (Boolean(user) !== Boolean(pass)) throw new Error('Configure SMTP_USER e SMTP_PASSWORD juntos');
  const transport: SMTPTransport.Options = {
    host, port, secure, requireTLS,
    ...(user && pass ? { auth: { user, pass } } : {}),
    logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  };
  return { from, url, production, transport };
}
type MailTransport = { sendMail(options: SendMailOptions): Promise<{ accepted?: unknown[] }> };
export class SmtpPasswordResetMailer extends PasswordResetMailer {
  private readonly settings: ReturnType<typeof smtpConfiguration>;
  private readonly transport: MailTransport;
  constructor(config: ConfigService, transport?: MailTransport) {
    super();
    this.settings = smtpConfiguration(config);
    this.transport = transport ?? createTransport(this.settings.transport);
  }
  async sendPasswordReset(data: PasswordResetMailData): Promise<void> {
    const link = resetLink(this.settings.url, data.token, this.settings.production);
    const result = await this.transport.sendMail({
      from: { name: 'GliCare', address: this.settings.from }, to: data.to,
      subject: 'Redefinição de senha - GliCare',
      text: `Olá, ${data.nome}.\n\nAbra o link para redefinir sua senha:\n${link}\n\nSe o link não abrir, copie este código no aplicativo:\n${data.token}\n\nO código é de uso único e expira em ${data.expiresAt.toISOString()} (UTC).\nSe você não solicitou a alteração, ignore esta mensagem.`,
      disableFileAccess: true, disableUrlAccess: true,
    });
    if (!result.accepted?.length) throw new Error('Servidor SMTP não aceitou a mensagem de recuperação');
  }
}
export function createPasswordResetMailer(config: ConfigService): PasswordResetMailer {
  const mode = config.get<string>('PASSWORD_RESET_MAIL_MODE') || 'disabled';
  if (mode === 'smtp') return new SmtpPasswordResetMailer(config);
  if (mode !== 'disabled' || (config.get<string>('NODE_ENV') ?? process.env.NODE_ENV) === 'production') {
    throw new Error('Configure PASSWORD_RESET_MAIL_MODE=smtp e o envio de recuperação antes de iniciar em produção');
  }
  return new LoggerPasswordResetMailer();
}
