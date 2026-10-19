export interface PasswordResetMailData {
  to: string;
  nome: string;
  /** Token em texto puro: só existe aqui e no e-mail; no banco fica o hash. */
  token: string;
  expiresAt: Date;
}

// Contrato do envio de e-mail de recuperação. É uma classe abstrata para
// servir de token de injeção do Nest. O provedor real (SES, SendGrid, SMTP...)
// fica para outra task: basta criar uma implementação e trocar o `useClass`
// em AuthModule.
export abstract class PasswordResetMailer {
  abstract sendPasswordReset(data: PasswordResetMailData): Promise<void>;
}
