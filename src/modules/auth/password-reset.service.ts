import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { BCRYPT_ROUNDS } from './auth.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetMailer } from './mail/password-reset-mailer';

export const FORGOT_PASSWORD_MESSAGE =
  'Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir a senha.';
export const RESET_PASSWORD_MESSAGE = 'Senha redefinida com sucesso.';
export const INVALID_RESET_TOKEN = 'Token inválido ou expirado';

const DEFAULT_TTL_MINUTES = 30;

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly tokens: Repository<PasswordResetToken>,
    private readonly users: UsersService,
    private readonly mailer: PasswordResetMailer,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  // Sempre termina sem erro e sem diferença visível para quem chama,
  // exista a conta ou não (evita enumeração de e-mails).
  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user) return;

    const token = randomBytes(32).toString('base64url'); // 256 bits
    const expiresAt = new Date(Date.now() + this.ttlMinutes() * 60_000);

    // Só o token mais recente vale: remove os anteriores do usuário.
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(PasswordResetToken, { usuarioId: user.id });
      await manager.save(
        manager.create(PasswordResetToken, {
          usuarioId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt,
          usedAt: null,
        }),
      );
    });

    // Sem await: o tempo de resposta não depende do envio do e-mail.
    // Falha de envio é só logada (a resposta ao cliente continua genérica).
    void this.mailer
      .sendPasswordReset({ to: user.email, nome: user.nome, token, expiresAt })
      .catch((err: unknown) =>
        this.logger.error(
          'Falha ao enviar e-mail de recuperação',
          err instanceof Error ? err.stack : String(err),
        ),
      );
  }

  async resetPassword(token: string, novaSenha: string): Promise<void> {
    const tokenHash = hashResetToken(token);
    const record = await this.tokens.findOne({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      throw new BadRequestException(INVALID_RESET_TOKEN);
    }

    const senhaHash = await bcrypt.hash(novaSenha, BCRYPT_ROUNDS);

    await this.dataSource.transaction(async (manager) => {
      // Consumo atômico: o UPDATE condicional só afeta 1 linha para UMA
      // requisição, mesmo com duas chamadas simultâneas com o mesmo token.
      const consumed = await manager.update(
        PasswordResetToken,
        { id: record.id, usedAt: IsNull(), expiresAt: MoreThan(new Date()) },
        { usedAt: new Date() },
      );
      if (consumed.affected !== 1) {
        throw new BadRequestException(INVALID_RESET_TOKEN);
      }

      await this.users.updatePasswordHash(record.usuarioId, senhaHash, manager);
    });
  }

  private ttlMinutes(): number {
    const value = Number(
      this.config.get<string>('PASSWORD_RESET_TOKEN_TTL_MINUTES'),
    );
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_TTL_MINUTES;
  }
}
