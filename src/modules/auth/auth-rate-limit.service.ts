import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac } from 'crypto';
import { LessThanOrEqual, Repository } from 'typeorm';
import { AuthRateBucket } from './entities/auth-rate-bucket.entity';
import {
  AUTH_RATE_POLICY,
  type AuthRateAction,
  type AuthRatePolicy,
} from './auth-rate-policy';

@Injectable()
export class AuthRateLimitService {
  private nextCleanup = 0;
  private readonly secret: string;
  constructor(
    @InjectRepository(AuthRateBucket)
    private readonly buckets: Repository<AuthRateBucket>,
    @Inject(AUTH_RATE_POLICY) private readonly policy: AuthRatePolicy,
    config: ConfigService,
  ) {
    this.secret = config.getOrThrow<string>('JWT_SECRET');
  }

  async consume(
    action: AuthRateAction,
    ip: string,
    email?: string,
  ): Promise<number> {
    const now = Date.now();
    const windowMs = this.policy.windowSeconds * 1000;
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const expiresAt = new Date(windowStart + windowMs);
    if (now >= this.nextCleanup) {
      this.nextCleanup = now + 60000;
      await this.buckets.delete({ expiresAt: LessThanOrEqual(new Date(now)) });
    }
    const limits: [string, string, number][] = [
      [
        action,
        `ip:${ip}`,
        action === 'login'
          ? this.policy.loginIp
          : action === 'forgot'
            ? this.policy.forgotIp
            : this.policy.resetIp,
      ],
    ];
    if (email && action !== 'reset')
      limits.push([
        action,
        `account:${email.trim().toLowerCase()}`,
        action === 'login'
          ? this.policy.loginAccount
          : this.policy.forgotAccount,
      ]);

    for (const [route, identity, limit] of limits) {
      // Nenhum e-mail, IP, senha ou token é persistido no contador.
      const key = createHmac('sha256', this.secret)
        .update(JSON.stringify([route, identity, windowStart]))
        .digest('hex');
      await this.buckets
        .createQueryBuilder()
        .insert()
        .values({ key, hits: 0, expiresAt })
        .orIgnore()
        .execute();
      // UPDATE condicional atômico: funciona entre requisições e réplicas.
      const result = await this.buckets
        .createQueryBuilder()
        .update()
        .set({ hits: () => 'hits + 1' })
        .where({ key })
        .andWhere('hits < :limit', { limit })
        .execute();
      if (result.affected !== 1)
        return Math.max(
          1,
          Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
        );
    }
    return 0;
  }
}
