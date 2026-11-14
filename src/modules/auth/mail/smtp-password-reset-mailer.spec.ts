import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SmtpPasswordResetMailer, createPasswordResetMailer, resetLink, smtpConfiguration } from './smtp-password-reset-mailer';
import { LoggerPasswordResetMailer } from './logger-password-reset-mailer';
import type { SendMailOptions } from 'nodemailer';

jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
function config(overrides: Record<string, string | undefined> = {}): ConfigService {
  const values: Record<string, string | undefined> = {
    NODE_ENV: 'development', PASSWORD_RESET_MAIL_MODE: 'smtp', SMTP_HOST: 'smtp.example.test',
    SMTP_PORT: '587', SMTP_FROM: 'no-reply@example.test', PASSWORD_RESET_URL: 'https://app.example.test/reset-password',
    SMTP_USER: 'synthetic-user', SMTP_PASSWORD: 'synthetic-password', ...overrides,
  };
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}
describe('SMTP de recuperação', () => {
  it('usa STARTTLS obrigatório por padrão e desliga logs/conteúdo externo', () => {
    const options = smtpConfiguration(config()).transport;
    expect(options).toMatchObject({ port: 587, secure: false, requireTLS: true, debug: false, logger: false,
      disableFileAccess: true, disableUrlAccess: true });
  });
  it('porta 465 habilita TLS imediato', () => {
    expect(smtpConfiguration(config({ SMTP_PORT: '465' })).transport.secure).toBe(true);
  });
  it('produção não permite desabilitar toda criptografia', () => {
    expect(() => smtpConfiguration(config({ NODE_ENV: 'production', SMTP_REQUIRE_TLS: 'false' }))).toThrow(/TLS/);
    expect(() => smtpConfiguration(config({ NODE_ENV: 'production', SMTP_PORT: '465', SMTP_SECURE: 'false' }))).toThrow(/TLS/);
  });
  it.each(['SMTP_HOST', 'SMTP_FROM', 'PASSWORD_RESET_URL'])('exige %s', (key) => {
    expect(() => smtpConfiguration(config({ [key]: '' }))).toThrow();
  });
  it('valida porta, remetente, flags e par de credenciais', () => {
    for (const override of [{ SMTP_PORT: 'invalid' }, { SMTP_PORT: '70000' }, { SMTP_FROM: 'bad\r\nHeader: x' },
      { SMTP_SECURE: 'maybe' }, { SMTP_USER: undefined }, { SMTP_PASSWORD: undefined }]) {
      expect(() => smtpConfiguration(config(override))).toThrow();
    }
  });
  it('relay sem autenticação omite auth, sem inventar credenciais', () => {
    expect(smtpConfiguration(config({ SMTP_USER: undefined, SMTP_PASSWORD: undefined })).transport.auth).toBeUndefined();
  });
  it('token vai no fragmento, não na query, e mantém o valor após decodificação', () => {
    const url = new URL(resetLink('https://app.example.test/reset-password', 'abc+def/=', true));
    expect(url.search).toBe(''); expect(new URLSearchParams(url.hash.slice(1)).get('token')).toBe('abc+def/=');
  });
  it('aceita o scheme do app e HTTP apenas fora de produção', () => {
    expect(resetLink('glicaremobile://reset-password', 'token', true)).toContain('#token=token');
    expect(resetLink('http://localhost:8081/reset-password', 'token', false)).toContain('#token=token');
    expect(() => resetLink('http://app.example.test/reset-password', 'token', true)).toThrow();
  });
  it.each(['javascript:alert(1)', 'https://user:password@app.example.test/reset-password',
    'https://app.example.test/reset-password?token=x', 'https://app.example.test/reset-password#x',
    'https://app.example.test/other'])('rejeita URL inadequada: %s', (url) => {
    expect(() => resetLink(url, 'token', true)).toThrow();
  });
  it('monta mensagem de texto e envia pelo transporte injetado, sem rede real', async () => {
    const sendMail = jest.fn(async (_options: SendMailOptions) => ({ accepted: ['reset@example.test'] }));
    const mailer = new SmtpPasswordResetMailer(config(), { sendMail });
    await mailer.sendPasswordReset({ to: 'reset@example.test', nome: 'Pessoa sintética', token: 'synthetic-token', expiresAt: new Date('2026-11-03T14:00:00Z') });
    const message = sendMail.mock.calls[0][0];
    expect(message.to).toBe('reset@example.test');
    expect(message.text).toContain('https://app.example.test/reset-password#token=synthetic-token');
    expect(message.text).toContain('2026-11-03T14:00:00.000Z');
    expect(message.html).toBeUndefined(); expect(message.disableFileAccess).toBe(true);
  });
  it('SMTP sem destinatário aceito é uma falha', async () => {
    const mailer = new SmtpPasswordResetMailer(config(), { sendMail: async () => ({ accepted: [] }) });
    await expect(mailer.sendPasswordReset({ to: 'reset@example.test', nome: 'Teste', token: 'token', expiresAt: new Date() })).rejects.toThrow(/não aceitou/);
  });
  it('factory exige SMTP em produção e aceita modo desabilitado apenas em dev/teste', () => {
    expect(createPasswordResetMailer(config({ PASSWORD_RESET_MAIL_MODE: 'disabled' }))).toBeInstanceOf(LoggerPasswordResetMailer);
    expect(() => createPasswordResetMailer(config({ NODE_ENV: 'production', PASSWORD_RESET_MAIL_MODE: 'disabled' }))).toThrow();
    expect(() => createPasswordResetMailer(config({ PASSWORD_RESET_MAIL_MODE: 'unknown' }))).toThrow();
    expect(createPasswordResetMailer(config())).toBeInstanceOf(SmtpPasswordResetMailer);
  });
  it('modo desabilitado não escreve e-mail ou token no console', async () => {
    const spy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    try {
      await new LoggerPasswordResetMailer().sendPasswordReset({ to: 'private@example.test', nome: 'Privado', token: 'private-token', expiresAt: new Date() });
      const output = JSON.stringify(spy.mock.calls);
      expect(output).not.toContain('private@example.test'); expect(output).not.toContain('private-token');
    } finally { spy.mockRestore(); }
  });
});
