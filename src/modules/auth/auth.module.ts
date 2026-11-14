import { Module } from '@nestjs/common';
import { AuthRateBucket } from './entities/auth-rate-bucket.entity';
import { AUTH_RATE_POLICY, authRatePolicy } from './auth-rate-policy';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { createPasswordResetMailer } from './mail/smtp-password-reset-mailer';
import { PasswordResetMailer } from './mail/password-reset-mailer';
import { PasswordResetService } from './password-reset.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([PasswordResetToken, AuthRateBucket]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: config.getOrThrow<string>(
            'JWT_EXPIRATION',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: AUTH_RATE_POLICY,
      inject: [ConfigService],
      useFactory: authRatePolicy,
    },
    AuthRateLimitService,
    AuthRateLimitGuard,
    JwtStrategy,
    PasswordResetService,
    {
      provide: PasswordResetMailer,
      inject: [ConfigService],
      useFactory: createPasswordResetMailer,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
